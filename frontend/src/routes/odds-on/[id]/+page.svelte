<script lang="ts">
	import type { PageProps } from './$types';
	import { onMount, onDestroy } from 'svelte';
	import { fly, scale } from 'svelte/transition';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	let { data }: PageProps = $props();
	let { playerName, id } = data;

	let ws: WebSocket | null = null;
	let isConnected = $state(false);
	let isConnecting = $state(false);
	let players: { id: string; name: string; ready: boolean }[] = $state([]);
	let currentPlayer: { id: string; name: string } | null = $state(null);
	let currentSecret: string | null = $state(null);
	let gameStatus: 'waiting' | 'voting' | 'answer' | 'results' = $state('waiting');
	let error: string | null = $state(null);
	let playerId = crypto.randomUUID();
	let currentRound = $state(0);
	let showContent = $state(false);
	let riddleText = $state('');
	let hasSubmittedSecret = $state(false);
	let secretInput = $state('');
	let submittedSecrets: string[] = $state([]);
	let votingResults: { mostVotedPlayer: { id: string; name: string } | null; isCorrect: boolean } | null = $state(null);
	let roundEndTimeout: number | null = $state(null);

	const riddles = [
		'what are the odds?',
		'can you solve the puzzle?',
		'do you dare to play?',
		'the game of chance awaits...',
		'are you ready to gamble?',
		"joker's wild...",
		'place your bets...',
		'the house always wins...'
	];
	let riddleInterval: ReturnType<typeof setInterval>;

	onMount(() => {
		showContent = true;
		connectWebSocket();

		// Create subtle riddle effect
		let riddleIndex = 0;
		riddleInterval = setInterval(() => {
			riddleText = riddles[riddleIndex];
			riddleIndex = (riddleIndex + 1) % riddles.length;
		}, 3000);

		return () => {
			clearInterval(riddleInterval);
		};
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
		const baseUrl = isDev
			? import.meta.env.VITE_WS_URL_DEV
			: 'https://party-app.flat-sound-6551.workers.dev';
		return `${baseUrl}/ws/odds-on?roomId=${id}&playerId=${playerId}`;
	}

	function connectWebSocket() {
		if (isConnecting) return;
		isConnecting = true;

		ws = new WebSocket(getWebSocketUrl());

		ws.addEventListener('open', () => {
			console.log('WebSocket connected');
			isConnected = true;
			isConnecting = false;
			// Send join message
			ws?.send(
				JSON.stringify({
					type: 'join',
					name: playerName
				})
			);
		});

		ws.addEventListener('close', () => {
			console.log('WebSocket disconnected');
			isConnected = false;
			isConnecting = false;
			// Try to reconnect after a delay
			setTimeout(connectWebSocket, 3000);
		});

		ws.addEventListener('error', (error) => {
			console.error('WebSocket error:', error);
			isConnected = false;
			isConnecting = false;
		});

		ws.addEventListener('message', (event) => {
			try {
				const data = JSON.parse(event.data);
				handleMessage(data);
			} catch (error) {
				console.error('Error parsing message:', error);
			}
		});
	}

	function handleMessage(data: any) {
		console.log('Received message:', data);
		switch (data.type) {
			case 'players_list':
				players = data.players;
				break;
			case 'player_ready':
				players = players.map((p) => (p.id === data.playerId ? { ...p, ready: true } : p));
				break;
			case 'round_start':
				currentRound = data.round;
				currentSecret = data.secret;
				gameStatus = data.phase;
				votingResults = null;
				break;
			case 'voting_results':
				votingResults = {
					mostVotedPlayer: data.mostVotedPlayer,
					isCorrect: data.isCorrect
				};
				gameStatus = 'results';
				// Wait 5 seconds before moving to next phase
				if (roundEndTimeout) {
					clearTimeout(roundEndTimeout);
				}
				roundEndTimeout = window.setTimeout(() => {
					gameStatus = 'answer';
					votingResults = null;
				}, 5000);
				break;
			case 'error':
				error = data.error;
				break;
		}
	}

	function submitSecret() {
		if (!secretInput.trim()) return;
		if (submittedSecrets.length >= 10) return;
		
		submittedSecrets = [...submittedSecrets, secretInput.trim()];
		secretInput = '';
	}

	function markReady() {
		if (submittedSecrets.length === 0) return;
		
		// Send all secrets to the server
		submittedSecrets.forEach(secret => {
			ws?.send(
				JSON.stringify({
					type: 'submit_secret',
					secret: secret
				})
			);
		});

		// Then mark as ready
		ws?.send(
			JSON.stringify({
				type: 'ready'
			})
		);
		hasSubmittedSecret = true;
	}

	function voteForPlayer(playerId: string) {
		ws?.send(
			JSON.stringify({
				type: 'vote',
				votedPlayerId: playerId
			})
		);
	}

	function handleReturnToMenu() {
		goto('/');
	}
</script>

<div class="min-h-screen bg-black flex items-center justify-center p-4">
	{#if showContent}
		<div
			class="bg-black/95 backdrop-blur-sm border border-green-800/30 rounded-sm p-4 sm:p-8 shadow-[0_0_15px_rgba(0,255,0,0.05)] riddler-card relative max-w-[95vw] sm:max-w-2xl mx-auto"
			in:scale={{ duration: 800, delay: 400 }}
		>
			<!-- Decorative corners -->
			<div
				class="absolute top-0 left-0 w-4 sm:w-8 h-4 sm:h-8 border-t-2 border-l-2 border-green-800/30"
			></div>
			<div
				class="absolute top-0 right-0 w-4 sm:w-8 h-4 sm:h-8 border-t-2 border-r-2 border-green-800/30"
			></div>
			<div
				class="absolute bottom-0 left-0 w-4 sm:w-8 h-4 sm:h-8 border-b-2 border-l-2 border-green-800/30"
			></div>
			<div
				class="absolute bottom-0 right-0 w-4 sm:w-8 h-4 sm:h-8 border-b-2 border-r-2 border-green-800/30"
			></div>

			<!-- Decorative lines -->
			<div
				class="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-green-800/30 via-transparent to-green-800/30"
			></div>
			<div
				class="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-green-800/30 via-transparent to-green-800/30"
			></div>

			<h2
				class="text-3xl sm:text-4xl md:text-5xl font-['Black+Jack'] text-center text-green-500/90 mb-8 sm:mb-12 relative tracking-wider"
				in:fly={{ y: 20, duration: 800, delay: 600 }}
			>
				<span
					class="absolute -left-4 sm:-left-6 top-1/2 transform -translate-y-1/2 text-lg sm:text-xl opacity-50"
					>♠️</span
				>
				ODDS ON
				<span
					class="absolute -right-4 sm:-right-6 top-1/2 transform -translate-y-1/2 text-lg sm:text-xl opacity-50"
					>♣️</span
				>
			</h2>

			{#if !isConnected}
				<div class="text-center text-green-400/70">
					<p>Connecting to game server...</p>
				</div>
			{:else if error}
				<div class="text-center text-red-400/70">
					<p>{error}</p>
				</div>
			{:else}
				{#if gameStatus === 'waiting'}
					<div class="space-y-6">
						<p class="text-green-400/70 text-center font-['IBM+Plex+Mono']">{riddleText}</p>
						
						{#if !hasSubmittedSecret}
							<div class="space-y-4">
								<h3 class="text-xl font-['Crimson+Text'] text-green-400/80 text-center">
									Enter your secrets ({submittedSecrets.length}/10)
								</h3>
								
								{#if submittedSecrets.length > 0}
									<div class="bg-green-900/20 p-4 rounded-sm border border-green-800/30 space-y-2">
										<h4 class="text-sm font-['IBM+Plex+Mono'] text-green-400/70">Your secrets:</h4>
										<ul class="space-y-1">
											{#each submittedSecrets as secret, i}
												<li class="text-green-300/90 text-sm flex items-center gap-2">
													<span class="text-green-500/50">[{i + 1}]</span>
													<span>{secret}</span>
												</li>
											{/each}
										</ul>
									</div>
								{/if}

								<div class="relative">
									<input
										type="text"
										bind:value={secretInput}
										placeholder="Type your secret..."
										class="w-full bg-black/80 border-2 border-green-900/50 rounded-lg px-4 py-3 text-green-300 font-['IBM+Plex+Mono'] placeholder-green-900/50 focus:outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700 transition-all duration-300"
										disabled={submittedSecrets.length >= 10}
									/>
								</div>
								<div class="flex gap-3">
									<button
										on:click={submitSecret}
										class="flex-1 px-8 py-3 text-lg font-['Black+Jack'] text-white/90 bg-green-900/40 hover:bg-green-800/50 rounded-sm transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-3 group riddler-button border border-green-800/30 relative disabled:opacity-50 disabled:cursor-not-allowed"
										disabled={submittedSecrets.length >= 10 || !secretInput.trim()}
									>
										<span class="absolute -left-2 top-1/2 transform -translate-y-1/2 text-green-800/30">[</span>
										Add Secret
										<span class="absolute -right-2 top-1/2 transform -translate-y-1/2 text-green-800/30">]</span>
									</button>
									<button
										on:click={markReady}
										class="flex-1 px-8 py-3 text-lg font-['Black+Jack'] text-white/90 bg-green-900/40 hover:bg-green-800/50 rounded-sm transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-3 group riddler-button border border-green-800/30 relative disabled:opacity-50 disabled:cursor-not-allowed"
										disabled={submittedSecrets.length === 0}
									>
										<span class="absolute -left-2 top-1/2 transform -translate-y-1/2 text-green-800/30">[</span>
										Ready
										<span class="absolute -right-2 top-1/2 transform -translate-y-1/2 text-green-800/30">]</span>
									</button>
								</div>
							</div>
						{:else}
							<div class="space-y-4">
								<h3 class="text-xl font-['Crimson+Text'] text-green-400/80 text-center">Waiting for other players...</h3>
								<ul class="space-y-2">
									{#each players as player}
										<li class="flex items-center justify-between text-green-300/90">
											<span>{player.name}</span>
											{#if player.ready}
												<span class="text-green-500">✓</span>
											{/if}
										</li>
									{/each}
								</ul>
							</div>
						{/if}
					</div>
				{:else if gameStatus === 'voting'}
					<div class="space-y-6">
						<h3 class="text-xl font-['Crimson+Text'] text-green-400/80 text-center">Round {currentRound}</h3>
						<div class="bg-green-900/20 p-4 rounded-sm border border-green-800/30">
							<p class="text-green-300/90 text-center font-['IBM+Plex+Mono']">{currentSecret}</p>
						</div>
						<div class="space-y-4">
							<h4 class="text-lg font-['Crimson+Text'] text-green-400/80 text-center">Who do you think this belongs to?</h4>
							<div class="grid gap-3">
								{#each players as player}
									<button
										on:click={() => voteForPlayer(player.id)}
										class="w-full px-4 py-2 text-green-300/90 bg-green-900/20 hover:bg-green-800/30 rounded-sm transition-all duration-300 hover:scale-[1.02] border border-green-800/30"
									>
										{player.name}
									</button>
								{/each}
							</div>
						</div>
					</div>
				{:else if gameStatus === 'results'}
					<div class="space-y-6">
						<h3 class="text-xl font-['Crimson+Text'] text-green-400/80 text-center">Results</h3>
						{#if votingResults}
							<div class="bg-green-900/20 p-4 rounded-sm border border-green-800/30">
								<p class="text-green-300/90 text-center">
									{#if votingResults.isCorrect}
										The majority guessed correctly! {votingResults.mostVotedPlayer?.name} drinks!
									{:else}
										The majority guessed wrong! Everyone drinks!
									{/if}
								</p>
							</div>
						{/if}
					</div>
				{:else if gameStatus === 'answer'}
					<div class="space-y-6">
						<h3 class="text-xl font-['Crimson+Text'] text-green-400/80 text-center">Waiting for next round...</h3>
						<button
							on:click={markReady}
							class="w-full px-8 py-3 text-lg font-['Black+Jack'] text-white/90 bg-green-900/40 hover:bg-green-800/50 rounded-sm transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-3 group riddler-button border border-green-800/30 relative"
						>
							<span class="absolute -left-2 top-1/2 transform -translate-y-1/2 text-green-800/30">[</span>
							Ready for Next Round
							<span class="absolute -right-2 top-1/2 transform -translate-y-1/2 text-green-800/30">]</span>
						</button>
					</div>
				{/if}

				<button
					on:click={handleReturnToMenu}
					class="mt-8 w-full px-8 py-3 text-lg font-['Black+Jack'] text-white/90 bg-red-900/40 hover:bg-red-800/50 rounded-sm transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-3 group riddler-button border border-red-800/30 relative"
				>
					<span class="absolute -left-2 top-1/2 transform -translate-y-1/2 text-red-800/30">[</span>
					Main Menu
					<span class="absolute -right-2 top-1/2 transform -translate-y-1/2 text-red-800/30">]</span>
				</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.riddler-card {
		position: relative;
		animation: subtle-pulse 4s infinite;
	}

	.riddler-button {
		position: relative;
		overflow: hidden;
		letter-spacing: 0.1em;
	}

	.riddler-button::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(0, 255, 0, 0.05), transparent);
		animation: riddler-scan 3s linear infinite;
	}

	@keyframes subtle-pulse {
		0%,
		100% {
			opacity: 1;
			transform: scale(1);
		}
		50% {
			opacity: 0.98;
			transform: scale(0.998);
		}
	}

	@keyframes riddler-scan {
		0% {
			left: -100%;
		}
		100% {
			left: 100%;
		}
	}
</style>
