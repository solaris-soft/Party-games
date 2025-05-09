<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fly, scale } from 'svelte/transition';
	import { page } from '$app/state';

	let ws: WebSocket | null = null;
	let playerName = '';
	let isConnected = $state(false);
	let isConnecting = $state(false);
	let players: { id: string; name: string; ready: boolean }[] = $state([]);
	let currentPlayer: { id: string; name: string } | null = $state(null);
	let questionAsker: { id: string; name: string } | null = $state(null);
	let coinFlipper: { id: string; name: string } | null = $state(null);
	let currentQuestion: string | null = $state(null);
	let currentAnswer: { id: string; name: string } | null = $state(null);
	let gameStatus: 'waiting' | 'answering' | 'flipping' | 'revealing' = $state('waiting');
	let error: string | null = $state(null);
	let playerId = crypto.randomUUID();
	let questionSent = $state(false);
	let hasSubmittedQuestion = $state(false);
	let coinFlipResult: boolean | null = $state(null);
	let showCoinResult = $state(false);
	let roundEndTimeout: number | null = $state(null);
	let copySuccess = $state(false);

	onMount(() => {
		const urlParams = new URLSearchParams(window.location.search);
		playerName = urlParams.get('name') || '';

		if (!playerName) {
			// Redirect to setup page with return URL
			const returnUrl = encodeURIComponent(`/paranoia/${page.params.id}`);
			window.location.href = `/paranoia/setup?returnTo=${returnUrl}`;
			return;
		}

		connectWebSocket();
	});

	onDestroy(() => {
		if (ws) {
			ws.close();
		}
		if (roundEndTimeout) {
			clearTimeout(roundEndTimeout);
		}
	});

	function getWebSocketUrl() {
		const isDev = import.meta.env.DEV;
		const baseUrl = isDev ? import.meta.env.VITE_WS_URL_DEV : 'https://party-app.flat-sound-6551.workers.dev/';
		return `${baseUrl}/ws/paranoia?roomId=${page.params.id}&playerId=${playerId}`;
	}

	function connectWebSocket() {
		if (isConnecting) return;
		isConnecting = true;

		const wsUrl = getWebSocketUrl();

		console.log('Connecting to WebSocket:', wsUrl);
		ws = new WebSocket(wsUrl);

		ws.onopen = () => {
			isConnected = true;
			isConnecting = false;
			error = null;
			ws?.send(
				JSON.stringify({
					type: 'join',
					name: playerName
				})
			);
		};

		ws.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);
				handleMessage(data);
			} catch (err) {
				console.error('Failed to parse WebSocket message:', err);
				console.error('Raw message:', event.data);
				error = 'Invalid message received from server';
			}
		};

		ws.onerror = (event) => {
			console.error('WebSocket error:', event);
			error = 'Failed to connect to game server. Please make sure the server is running.';
			isConnecting = false;
			setTimeout(() => {
				if (!isConnected) {
					connectWebSocket();
				}
			}, 3000);
		};

		ws.onclose = (event) => {
			console.log('WebSocket closed:', event.code, event.reason);
			isConnected = false;
			isConnecting = false;
			error = `Connection closed: ${event.reason || 'Unknown reason'}. Please refresh the page to try again.`;
		};
	}

	function handleMessage(data: any) {
		console.log('Received message:', data);
		switch (data.type) {
			case 'players_list':
				console.log('Received players list:', data.players);
				players = data.players;
				// Reset game state if we have less than 3 players
				if (players.length < 3) {
					gameStatus = 'waiting';
					currentQuestion = null;
					currentAnswer = null;
					coinFlipResult = null;
					showCoinResult = false;
					questionAsker = null;
					coinFlipper = null;
					currentPlayer = null;
					hasSubmittedQuestion = false;
				}
				break;
			case 'player_joined':
				console.log('Player joined:', data.player);
				if (!players.some((p) => p.id === data.player.id)) {
					players = [...players, data.player];
				}
				console.log('Updated players list:', players);
				break;
			case 'player_left':
				console.log('Player left:', data.playerId);
				players = players.filter((p) => p.id !== data.playerId);
				console.log('Updated players list:', players);
				// Reset game state if we have less than 3 players
				if (players.length < 3) {
					gameStatus = 'waiting';
					currentQuestion = null;
					currentAnswer = null;
					coinFlipResult = null;
					showCoinResult = false;
					questionAsker = null;
					coinFlipper = null;
					currentPlayer = null;
					hasSubmittedQuestion = false;
				}
				break;
			case 'player_ready':
				console.log('Player ready:', data.playerId);
				players = players.map((p) => (p.id === data.playerId ? { ...p, ready: true } : p));
				console.log('Updated players list:', players);
				break;
			case 'round_end':
				console.log('Round ended, resetting player states:', data.players);
				players = data.players;
				gameStatus = 'waiting';
				currentQuestion = null;
				currentAnswer = null;
				coinFlipResult = null;
				showCoinResult = false;
				break;
			case 'round_start':
				// Only start the round if we have at least 3 ready players
				const readyPlayers = players.filter(p => p.ready).length;
				if (readyPlayers < 3) {
					console.log('Not enough ready players to start round');
					return;
				}
				currentPlayer = data.currentPlayer;
				questionAsker = data.questionAsker;
				gameStatus = 'answering';
				hasSubmittedQuestion = false;
				currentQuestion = null;
				currentAnswer = null;
				coinFlipResult = null;
				showCoinResult = false;
				coinFlipper = null;
				players = players.map((p) => ({
					...p,
					ready: false
				}));
				break;
			case 'question_submitted':
				currentQuestion = data.question;
				gameStatus = 'answering';
				break;
			case 'answer_submitted':
				currentAnswer = data.answer;
				coinFlipper = data.coinFlipper;
				gameStatus = 'flipping';
				break;
			case 'coin_flip':
				if (roundEndTimeout) {
					clearTimeout(roundEndTimeout);
				}
				gameStatus = 'revealing';
				coinFlipResult = data.result;
				showCoinResult = true;
				if (data.result) {
					currentQuestion = data.question;
					currentAnswer = data.answer;
				} else {
					currentQuestion = null;
					currentAnswer = data.answer;
				}
				roundEndTimeout = window.setTimeout(() => {
					showCoinResult = false;
					gameStatus = 'waiting';
					currentQuestion = null;
					currentAnswer = null;
					coinFlipResult = null;
					questionAsker = null;
					coinFlipper = null;
					currentPlayer = null;
					hasSubmittedQuestion = false;
					players = players.map((p) => ({
						...p,
						ready: false
					}));
				}, 5000);
				break;
		}
	}

	function markReady() {
		ws?.send(
			JSON.stringify({
				type: 'ready'
			})
		);
	}

	function submitQuestion(question: string) {
		ws?.send(
			JSON.stringify({
				type: 'submit_question',
				question
			})
		);
		questionSent = true;
		hasSubmittedQuestion = true;
		currentQuestion = '';
		setTimeout(() => {
			questionSent = false;
		}, 2000);
	}

	function submitAnswer(answerId: string) {
		ws?.send(
			JSON.stringify({
				type: 'submit_answer',
				answer: answerId
			})
		);
	}

	function flipCoin() {
		ws?.send(
			JSON.stringify({
				type: 'flip_coin'
			})
		);
	}

	let isCurrentPlayer = $state(false);
	let isQuestionAsker = $state(false);
	let isCoinFlipper = $state(false);

	$effect(() => {
		isCurrentPlayer = currentPlayer?.id === playerId;
		isQuestionAsker = questionAsker?.id === playerId;
		isCoinFlipper = coinFlipper?.id === playerId;
	});

	function copyRoomId() {
		const url = new URL(window.location.href);
		url.searchParams.delete('name');
		navigator.clipboard.writeText(url.toString());
		copySuccess = true;
		setTimeout(() => {
			copySuccess = false;
		}, 2000);
	}
</script>

<div class="relative z-10 p-4 sm:p-8">
	{#if !isConnected}
		<div class="flex flex-col items-center justify-center min-h-[80vh]">
			<div
				class="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"
			></div>
			<p class="text-xl sm:text-2xl text-red-400 font-['VT323'] tracking-wider text-center px-4">ESTABLISHING CONNECTION...</p>
		</div>
	{:else}
		<div class="space-y-4 sm:space-y-8">
			<!-- Room Info -->
			<div class="text-center" in:fly={{ y: -20, duration: 1000, delay: 200 }}>
				<div class="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
					<p class="text-xl sm:text-2xl text-red-500/70 tracking-widest uppercase">Room: {page.params.id}</p>
					<button
						class="w-full sm:w-auto px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition-all duration-300 hover:border-red-500 font-['VT323'] tracking-wider"
						onclick={copyRoomId}
					>
						{copySuccess ? '[ COPIED ]' : '[ COPY ]'}
					</button>
				</div>
			</div>

			<!-- Game Container -->
			<div class="grid grid-cols-1 lg:grid-cols-[300px,1fr] gap-4 sm:gap-8">
				<!-- Players List -->
				<div
					class="bg-black/50 border border-red-500/30 p-4 sm:p-6 rounded-none"
					in:fly={{ x: -20, duration: 800, delay: 200 }}
				>
					<h2 class="text-xl sm:text-2xl font-['VT323'] text-red-400 mb-4 sm:mb-6 tracking-wider uppercase">
						Players
					</h2>
					<div class="space-y-2 sm:space-y-3">
						{#each players as player, i}
							<div
								class="bg-black/50 border border-red-500/30 p-3 sm:p-4 transition-all duration-300 hover:bg-red-500/10 {player.id ===
								currentPlayer?.id
									? 'border-red-500'
									: ''}"
								in:fly={{ y: 20, duration: 400, delay: i * 100 }}
							>
								<div class="flex justify-between items-center">
									<span class="font-['VT323'] text-red-400 tracking-wider text-sm sm:text-base">{player.name}</span>
									{#if player.ready}
										<span class="text-red-500" in:scale={{ duration: 300 }}>✓</span>
									{/if}
								</div>
								{#if player.id === questionAsker?.id}
									<span
										class="inline-block mt-2 px-2 sm:px-3 py-1 text-xs sm:text-sm bg-red-500/20 text-red-400 border border-red-500/30 font-['VT323'] tracking-wider"
									>
										INTERROGATING
									</span>
								{:else if player.id === coinFlipper?.id}
									<span
										class="inline-block mt-2 px-2 sm:px-3 py-1 text-xs sm:text-sm bg-red-500/20 text-red-400 border border-red-500/30 font-['VT323'] tracking-wider"
									>
										FLIPPING
									</span>
								{/if}
							</div>
						{/each}
					</div>
				</div>

				<!-- Game Status -->
				<div
					class="bg-black/50 border border-red-500/30 p-4 sm:p-8 rounded-none"
					in:fly={{ x: 20, duration: 800, delay: 400 }}
				>
					{#if gameStatus === 'waiting'}
						<div class="flex flex-col items-center justify-center min-h-[300px] sm:min-h-[400px]">
							{#if players.length < 3}
								<div class="text-center space-y-4">
									<p class="text-lg sm:text-xl font-['VT323'] text-red-500/70 tracking-wider">
										WAITING FOR MORE PLAYERS...
									</p>
									<p class="text-base sm:text-lg font-['VT323'] text-red-500/50 tracking-wider">
										{3 - players.length} MORE PLAYER{3 - players.length === 1 ? '' : 'S'} NEEDED
									</p>
								</div>
							{:else if !players.find((p) => p.id === playerId)?.ready}
								<button
									class="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition-all duration-300 hover:border-red-500 font-['VT323'] text-lg sm:text-xl tracking-wider uppercase"
									onclick={markReady}
									in:scale={{ duration: 300 }}
								>
									<span class="mr-2">[ READY ]</span>
								</button>
							{:else}
								<div class="flex flex-col items-center gap-4 text-red-500/70">
									<div
										class="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin"
									></div>
									<p class="font-['VT323'] text-lg sm:text-xl tracking-wider">AWAITING SUBJECTS...</p>
								</div>
							{/if}
						</div>
					{:else if gameStatus === 'answering'}
						{#if isCurrentPlayer}
							<div class="space-y-4 sm:space-y-6">
								<h3
									class="text-xl sm:text-2xl font-['VT323'] text-center text-red-400 tracking-wider uppercase"
								>
									You are being interrogated
								</h3>
								{#if currentQuestion}
									<div
										class="bg-black/50 border border-red-500/30 p-4 sm:p-8"
										in:scale={{ duration: 400 }}
									>
										<p class="text-lg sm:text-xl font-['VT323'] text-red-400 mb-6 tracking-wider">
											{currentQuestion}
										</p>
										<div class="space-y-4">
											<h4 class="text-base sm:text-lg text-red-500/70 font-['VT323'] tracking-wider">
												Select your target:
											</h4>
											<div class="grid grid-cols-1 gap-3 sm:gap-4">
												{#each players.filter((p) => p.id !== playerId) as player, i}
													<button
														onclick={() => submitAnswer(player.id)}
														class="w-full p-3 sm:p-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition-all duration-300 hover:border-red-500 font-['VT323'] tracking-wider"
														in:fly={{ y: 20, duration: 300, delay: i * 100 }}
													>
														{player.name}
													</button>
												{/each}
											</div>
										</div>
									</div>
								{:else}
									<div class="flex flex-col items-center gap-4 text-red-500/70">
										<div
											class="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin"
										></div>
										<p class="font-['VT323'] text-lg sm:text-xl tracking-wider">AWAITING QUESTION...</p>
									</div>
								{/if}
							</div>
						{:else if isQuestionAsker}
							<div class="space-y-4 sm:space-y-6">
								<h3
									class="text-xl sm:text-2xl font-['VT323'] text-center text-red-400 tracking-wider uppercase"
								>
									Interrogate {currentPlayer?.name}
								</h3>
								{#if !hasSubmittedQuestion}
									<div
										class="flex flex-col gap-3 sm:gap-4 items-center justify-center"
										in:fly={{ y: 20, duration: 400 }}
									>
										<input
											type="text"
											placeholder="Enter your question"
											bind:value={currentQuestion}
											onkeydown={(e) => e.key === 'Enter' && submitQuestion(e.currentTarget.value)}
											class="w-full p-3 sm:p-4 bg-black/50 border border-red-500/30 text-red-400 placeholder-red-500/50 font-['VT323'] tracking-wider focus:outline-none focus:border-red-500"
										/>
										<button
											class="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition-all duration-300 hover:border-red-500 font-['VT323'] text-lg sm:text-xl tracking-wider uppercase disabled:opacity-50 disabled:cursor-not-allowed"
											onclick={() => submitQuestion(currentQuestion || '')}
											disabled={!currentQuestion?.trim()}
										>
											[ SEND ]
										</button>
									</div>
									{#if questionSent}
										<p
											class="text-red-500 text-center font-['VT323'] tracking-wider"
											in:scale={{ duration: 300 }}
										>
											QUESTION TRANSMITTED
										</p>
									{/if}
								{:else}
									<div class="flex flex-col items-center gap-4 text-red-500/70">
										<div
											class="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin"
										></div>
										<p class="font-['VT323'] text-lg sm:text-xl tracking-wider">AWAITING RESPONSE...</p>
									</div>
								{/if}
							</div>
						{:else}
							<div class="flex flex-col items-center gap-4 text-red-500/70">
								<div
									class="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin"
								></div>
								{#if currentQuestion}
									<p class="font-['VT323'] text-lg sm:text-xl tracking-wider">AWAITING TARGET SELECTION...</p>
								{:else}
									<p class="font-['VT323'] text-lg sm:text-xl tracking-wider">
										AWAITING QUESTION TRANSMISSION...
									</p>
								{/if}
							</div>
						{/if}
					{:else if gameStatus === 'flipping'}
						{#if isCoinFlipper}
							<div class="flex flex-col items-center gap-4 sm:gap-6">
								<h3
									class="text-xl sm:text-2xl font-['VT323'] text-center text-red-400 tracking-wider uppercase"
								>
									You are the arbiter
								</h3>
								<div
									class="bg-black/50 border border-red-500/30 p-4 sm:p-8 text-center w-full"
									in:scale={{ duration: 400 }}
								>
									<p class="text-red-500/70 mb-2 font-['VT323'] tracking-wider">Target:</p>
									<p class="text-xl sm:text-2xl font-['VT323'] text-red-400 mb-6 tracking-wider">
										{currentAnswer?.name}
									</p>
									<button
										class="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition-all duration-300 hover:border-red-500 font-['VT323'] text-lg sm:text-xl tracking-wider uppercase flex items-center justify-center gap-2"
										onclick={flipCoin}
									>
										<span class="mr-2">[ FLIP ]</span>
									</button>
								</div>
							</div>
						{:else}
							<div class="flex flex-col items-center gap-4 text-red-500/70">
								<div
									class="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin"
								></div>
								<p class="font-['VT323'] text-lg sm:text-xl tracking-wider">AWAITING COIN FLIP...</p>
							</div>
						{/if}
					{:else if gameStatus === 'revealing'}
						<div class="text-center">
							{#if showCoinResult}
								<div class="mb-6 sm:mb-8" in:fly={{ y: 20, duration: 400 }}>
									<h3 class="text-xl sm:text-2xl font-['VT323'] text-red-400 tracking-wider">
										Result:
										<span class="text-red-500">{coinFlipResult ? 'HEADS' : 'TAILS'}</span>
									</h3>
								</div>
								<div class="bg-black/50 border border-red-500/30 p-4 sm:p-8" in:scale={{ duration: 400 }}>
									{#if coinFlipResult}
										<div class="space-y-3 sm:space-y-4">
											<h3 class="text-lg sm:text-xl font-['VT323'] text-red-400 tracking-wider">
												Question: {currentQuestion}
											</h3>
											<h3 class="text-lg sm:text-xl font-['VT323'] text-red-400 tracking-wider">
												Target: {currentAnswer?.name}
											</h3>
										</div>
									{:else}
										<div class="space-y-3 sm:space-y-4">
											<h3 class="text-lg sm:text-xl font-['VT323'] text-red-400 tracking-wider">
												Target: {currentAnswer?.name}
											</h3>
											<p class="text-red-500/70 font-['VT323'] tracking-wider italic">
												Question remains classified
											</p>
										</div>
									{/if}
								</div>
							{:else}
								<div class="flex flex-col items-center gap-4 text-red-500/70">
									<div
										class="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin"
									></div>
									<p class="font-['VT323'] text-lg sm:text-xl tracking-wider">PREPARING NEXT ROUND...</p>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	{#if error}
		<div
			class="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-500/20 text-red-400 px-4 sm:px-6 py-3 sm:py-4 border border-red-500/30 font-['VT323'] tracking-wider text-sm sm:text-base max-w-[90%] sm:max-w-none"
			in:fly={{ y: 20, duration: 400 }}
		>
			<span class="mr-2">[ ERROR ]</span>
			{error}
		</div>
	{/if}
</div>

<style>
	@keyframes glitch {
		0% {
			transform: translate(0);
			filter: brightness(1);
		}
		20% {
			transform: translate(-2px, 2px);
			filter: brightness(1.2);
		}
		40% {
			transform: translate(-2px, -2px);
			filter: brightness(0.8);
		}
		60% {
			transform: translate(2px, 2px);
			filter: brightness(1.2);
		}
		80% {
			transform: translate(2px, -2px);
			filter: brightness(0.8);
		}
		100% {
			transform: translate(0);
			filter: brightness(1);
		}
	}

</style>
