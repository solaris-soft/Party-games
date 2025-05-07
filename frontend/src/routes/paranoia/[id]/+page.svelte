<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fly, scale } from 'svelte/transition';
	import { page } from '$app/stores';

	let {data} = $props();
	let pageStore = $state(page);

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

	onMount(() => {
		// Get player name from URL parameters
		const urlParams = new URLSearchParams(window.location.search);
		playerName = urlParams.get('name') || '';
		
		if (!playerName) {
			error = 'No player name provided';
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

	function connectWebSocket() {
		if (isConnecting) return;
		isConnecting = true;
		
		const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
		const wsUrl = `${protocol}//localhost:8787/ws?roomId=${$page.params.id}&playerId=${playerId}`;
		
		console.log('Connecting to WebSocket:', wsUrl);
		ws = new WebSocket(wsUrl);

		ws.onopen = () => {
			isConnected = true;
			isConnecting = false;
			error = null;
			// Automatically join the game with the player name
			ws?.send(JSON.stringify({
				type: 'join',
				name: playerName
			}));
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
			// Try to reconnect after a delay
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
				break;
			case 'player_joined':
				console.log('Player joined:', data.player);
				if (!players.some(p => p.id === data.player.id)) {
					players = [...players, data.player];
				}
				console.log('Updated players list:', players);
				break;
			case 'player_left':
				console.log('Player left:', data.playerId);
				players = players.filter(p => p.id !== data.playerId);
				console.log('Updated players list:', players);
				break;
			case 'player_ready':
				console.log('Player ready:', data.playerId);
				players = players.map(p => 
					p.id === data.playerId ? { ...p, ready: true } : p
				);
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
				currentPlayer = data.currentPlayer;
				questionAsker = data.questionAsker;
				gameStatus = 'answering';
				hasSubmittedQuestion = false;
				currentQuestion = null;
				currentAnswer = null;
				coinFlipResult = null;
				showCoinResult = false;
				coinFlipper = null;
				players = players.map(p => ({
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
					// Show question and answer
					currentQuestion = data.question;
					currentAnswer = data.answer;
				} else {
					// Hide question, show only answer
					currentQuestion = null;
					currentAnswer = data.answer;
				}
				// Set a timeout to clear the round after showing the result
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
					players = players.map(p => ({
						...p,
						ready: false
					}));
				}, 5000); // Show result for 5 seconds
				break;
		}
	}

	function markReady() {
		ws?.send(JSON.stringify({
			type: 'ready'
		}));
	}

	function submitQuestion(question: string) {
		ws?.send(JSON.stringify({
			type: 'submit_question',
			question
		}));
		questionSent = true;
		hasSubmittedQuestion = true;
		currentQuestion = '';
		setTimeout(() => {
			questionSent = false;
		}, 2000);
	}

	function submitAnswer(answerId: string) {
		ws?.send(JSON.stringify({
			type: 'submit_answer',
			answer: answerId
		}));
	}

	function flipCoin() {
		ws?.send(JSON.stringify({
			type: 'flip_coin'
		}));
	}

	let isCurrentPlayer = $state(false);
	let isQuestionAsker = $state(false);
	let isCoinFlipper = $state(false);

	$effect(() => {
		isCurrentPlayer = currentPlayer?.id === playerId;
		isQuestionAsker = questionAsker?.id === playerId;
		isCoinFlipper = coinFlipper?.id === playerId;
	});
</script>

<div class="container">
	{#if !isConnected}
		<div class="status">
			<div class="loading-spinner"></div>
			<p>Connecting to server...</p>
		</div>
	{:else}
		<div class="game-header" in:fly={{ y: -20, duration: 800 }}>
			<h1>Paranoia</h1>
			<p class="room-id">Room: {$page.params.id}</p>
		</div>
		<div class="game-container">
			<div class="players-list" in:fly={{ x: -20, duration: 800, delay: 200 }}>
				<h2>Players</h2>
				<div class="players-grid">
					{#each players as player, i}
						<div 
							class="player-card" 
							class:current-player={player.id === currentPlayer?.id}
							in:fly={{ y: 20, duration: 400, delay: i * 100 }}
						>
							<div class="player-info">
								<span class="player-name">{player.name}</span>
								{#if player.ready}
									<span class="ready-indicator" in:scale={{ duration: 300 }}>✓</span>
								{/if}
							</div>
							{#if player.id === questionAsker?.id}
								<span class="role-badge question-asker" in:fly={{ y: 10, duration: 300 }}>Asking</span>
							{:else if player.id === coinFlipper?.id}
								<span class="role-badge coin-flipper" in:fly={{ y: 10, duration: 300 }}>Flipping</span>
							{/if}
						</div>
					{/each}
				</div>
			</div>

			<div class="game-status" in:fly={{ x: 20, duration: 800, delay: 400 }}>
				{#if gameStatus === 'waiting'}
					<div class="waiting-screen">
						{#if !players.find(p => p.id === playerId)?.ready}
							<button class="primary-button" onclick={markReady} in:scale={{ duration: 300 }}>
								<span class="button-icon">🎮</span>
								I'm Ready
							</button>
						{:else}
							<div class="waiting-message">
								<div class="loading-spinner small"></div>
								<p>Waiting for other players...</p>
							</div>
						{/if}
					</div>
				{:else if gameStatus === 'answering'}
					{#if isCurrentPlayer}
						<div class="question-section">
							<h3 class="section-title">You are being asked!</h3>
							{#if currentQuestion}
								<div class="question-card" in:scale={{ duration: 400 }}>
									<p class="question">{currentQuestion}</p>
									<div class="answer-section">
										<h4>Select who you think the answer is:</h4>
										<div class="player-buttons">
											{#each players.filter(p => p.id !== playerId) as player, i}
												<button 
													onclick={() => submitAnswer(player.id)}
													class="player-button"
													in:fly={{ y: 20, duration: 300, delay: i * 100 }}
												>
													{player.name}
												</button>
											{/each}
										</div>
									</div>
								</div>
							{:else}
								<div class="waiting-message">
									<div class="loading-spinner small"></div>
									<p>Waiting for {questionAsker?.name} to send you a question...</p>
								</div>
							{/if}
						</div>
					{:else if isQuestionAsker}
						<div class="question-section">
							<h3 class="section-title">Send a question to {currentPlayer?.name}</h3>
							{#if !hasSubmittedQuestion}
								<div class="input-group" in:fly={{ y: 20, duration: 400 }}>
									<input
										type="text"
										placeholder="Enter your question"
										bind:value={currentQuestion}
										onkeydown={(e) => e.key === 'Enter' && submitQuestion(e.currentTarget.value)}
									/>
									<button 
										class="primary-button"
										onclick={() => submitQuestion(currentQuestion || '')}
										disabled={!currentQuestion?.trim()}
									>
										Send Question
									</button>
								</div>
								{#if questionSent}
									<p class="success-message" in:scale={{ duration: 300 }}>Question sent!</p>
								{/if}
							{:else}
								<div class="waiting-message">
									<div class="loading-spinner small"></div>
									<p>Waiting for {currentPlayer?.name} to answer...</p>
								</div>
							{/if}
						</div>
					{:else}
						<div class="question-section">
							{#if currentQuestion}
								<div class="waiting-message">
									<div class="loading-spinner small"></div>
									<p>Waiting for {currentPlayer?.name} to select an answer...</p>
								</div>
							{:else}
								<div class="waiting-message">
									<div class="loading-spinner small"></div>
									<p>Waiting for {questionAsker?.name} to send a question to {currentPlayer?.name}...</p>
								</div>
							{/if}
						</div>
					{/if}
				{:else if gameStatus === 'flipping'}
					{#if isCoinFlipper}
						<div class="flip-section">
							<h3 class="section-title">You are the coin flipper!</h3>
							<div class="coin-flip-card" in:scale={{ duration: 400 }}>
								<p class="answer-label">Answer:</p>
								<p class="answer-name">{currentAnswer?.name}</p>
								<button class="primary-button flip-button" onclick={flipCoin}>
									<span class="button-icon">🪙</span>
									Flip Coin
								</button>
							</div>
						</div>
					{:else}
						<div class="waiting-message">
							<div class="loading-spinner small"></div>
							<p>Waiting for {coinFlipper?.name} to flip the coin...</p>
						</div>
					{/if}
				{:else if gameStatus === 'revealing'}
					<div class="reveal-section">
						{#if showCoinResult}
							<div class="coin-result" in:fly={{ y: 20, duration: 400 }}>
								<h3>Coin Flip Result: <span class="result-text">{coinFlipResult ? 'Heads' : 'Tails'}</span></h3>
							</div>
							<div class="reveal-content">
								{#if coinFlipResult}
									<div class="reveal-card" in:scale={{ duration: 400 }}>
										<h3>Question: {currentQuestion}</h3>
										<h3>Answer: {currentAnswer?.name}</h3>
									</div>
								{:else}
									<div class="reveal-card" in:scale={{ duration: 400 }}>
										<h3>Answer: {currentAnswer?.name}</h3>
										<p class="tails-message">The question remains hidden!</p>
									</div>
								{/if}
							</div>
						{:else}
							<div class="waiting-message">
								<div class="loading-spinner small"></div>
								<p>Waiting for next round...</p>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	{/if}

	{#if error}
		<div class="error" in:fly={{ y: 20, duration: 400 }}>
			<span class="error-icon">⚠️</span>
			{error}
		</div>
	{/if}
</div>

<style>
	:global(body) {
		background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
		color: #fff;
		min-height: 100vh;
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.game-header {
		text-align: center;
		margin-bottom: 3rem;
		padding: 2rem;
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(10px);
		border-radius: 16px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
	}

	.game-header h1 {
		font-size: 3.5rem;
		color: #fff;
		margin: 0;
		text-transform: uppercase;
		letter-spacing: 2px;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		background: linear-gradient(45deg, #fff, #a0a0a0);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.room-id {
		color: #a0a0a0;
		font-size: 1.1rem;
		margin-top: 0.5rem;
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.status {
		text-align: center;
		padding: 3rem;
		color: #fff;
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(10px);
		border-radius: 16px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		margin: auto;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
	}

	.game-container {
		display: grid;
		grid-template-columns: 300px 1fr;
		gap: 2rem;
		flex: 1;
	}

	.players-list {
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(10px);
		padding: 1.5rem;
		border-radius: 16px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		height: fit-content;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
	}

	.players-list h2 {
		margin-top: 0;
		color: #fff;
		font-size: 1.5rem;
		margin-bottom: 1.5rem;
		text-transform: uppercase;
		letter-spacing: 1px;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.players-grid {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.player-card {
		background: rgba(255, 255, 255, 0.05);
		padding: 1rem;
		border-radius: 12px;
		transition: all 0.3s ease;
		border: 1px solid rgba(255, 255, 255, 0.1);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
	}

	.player-card:hover {
		background: rgba(255, 255, 255, 0.1);
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
	}

	.player-card.current-player {
		background: rgba(76, 175, 80, 0.2);
		border: 1px solid rgba(76, 175, 80, 0.3);
		box-shadow: 0 0 20px rgba(76, 175, 80, 0.2);
	}

	.player-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.player-name {
		font-weight: 500;
		color: #fff;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
	}

	.ready-indicator {
		color: #4CAF50;
		font-weight: bold;
		text-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
	}

	.role-badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-size: 0.8rem;
		margin-top: 0.5rem;
		font-weight: 500;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
	}

	.question-asker {
		background: rgba(25, 118, 210, 0.2);
		color: #64b5f6;
		border: 1px solid rgba(25, 118, 210, 0.3);
		box-shadow: 0 0 15px rgba(25, 118, 210, 0.2);
	}

	.coin-flipper {
		background: rgba(245, 124, 0, 0.2);
		color: #ffb74d;
		border: 1px solid rgba(245, 124, 0, 0.3);
		box-shadow: 0 0 15px rgba(245, 124, 0, 0.2);
	}

	.game-status {
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(10px);
		padding: 2rem;
		border-radius: 16px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
	}

	.section-title {
		font-size: 1.8rem;
		color: #fff;
		margin-bottom: 1.5rem;
		text-align: center;
		text-transform: uppercase;
		letter-spacing: 1px;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.question-section {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.question-card {
		background: rgba(255, 255, 255, 0.05);
		padding: 2rem;
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
	}

	.question {
		font-size: 1.4rem;
		font-weight: 600;
		color: #fff;
		margin: 1rem 0;
		line-height: 1.4;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
	}

	.answer-section {
		margin-top: 2rem;
	}

	.player-buttons {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 1rem;
		margin-top: 1rem;
	}

	.player-button {
		padding: 1rem;
		background: rgba(76, 175, 80, 0.2);
		color: #fff;
		border: 1px solid rgba(76, 175, 80, 0.3);
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.3s ease;
		font-weight: 500;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
	}

	.player-button:hover {
		background: rgba(76, 175, 80, 0.3);
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
	}

	.primary-button {
		padding: 1rem 2rem;
		font-size: 1.1rem;
		background: rgba(76, 175, 80, 0.2);
		color: #fff;
		border: 1px solid rgba(76, 175, 80, 0.3);
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 500;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
	}

	.primary-button:hover {
		background: rgba(76, 175, 80, 0.3);
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
	}

	.primary-button:disabled {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.1);
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}

	.button-icon {
		font-size: 1.2rem;
	}

	.input-group {
		display: flex;
		gap: 1rem;
		align-items: center;
		justify-content: center;
		margin: 1.5rem 0;
	}

	.input-group input {
		padding: 1rem;
		font-size: 1.1rem;
		width: 100%;
		max-width: 500px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		color: #fff;
		transition: all 0.3s ease;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
	}

	.input-group input::placeholder {
		color: rgba(255, 255, 255, 0.5);
	}

	.input-group input:focus {
		outline: none;
		border-color: rgba(76, 175, 80, 0.3);
		background: rgba(255, 255, 255, 0.1);
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
	}

	.waiting-message {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		color: #a0a0a0;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 4px solid rgba(255, 255, 255, 0.1);
		border-top: 4px solid #4CAF50;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		box-shadow: 0 0 20px rgba(76, 175, 80, 0.2);
	}

	.loading-spinner.small {
		width: 24px;
		height: 24px;
		border-width: 3px;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.error {
		background: rgba(198, 40, 40, 0.2);
		color: #ff8a80;
		padding: 1rem 1.5rem;
		border-radius: 12px;
		margin-top: 1rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		border: 1px solid rgba(198, 40, 40, 0.3);
		box-shadow: 0 4px 16px rgba(198, 40, 40, 0.2);
	}

	.error-icon {
		font-size: 1.2rem;
	}

	.success-message {
		color: #4CAF50;
		margin-top: 1rem;
		animation: fadeOut 2s forwards;
		font-weight: 500;
		text-shadow: 0 0 10px rgba(76, 175, 80, 0.3);
	}

	.reveal-section {
		text-align: center;
	}

	.coin-result {
		margin-bottom: 2rem;
	}

	.result-text {
		color: #4CAF50;
		font-weight: 600;
		text-shadow: 0 0 10px rgba(76, 175, 80, 0.3);
	}

	.reveal-card {
		background: rgba(255, 255, 255, 0.05);
		padding: 2rem;
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		margin: 1.5rem 0;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
	}

	.tails-message {
		color: #a0a0a0;
		font-style: italic;
		margin-top: 1rem;
	}

	.flip-section {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		align-items: center;
	}

	.coin-flip-card {
		background: rgba(255, 255, 255, 0.05);
		padding: 2rem;
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		text-align: center;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
	}

	.answer-label {
		color: #a0a0a0;
		margin-bottom: 0.5rem;
	}

	.answer-name {
		font-size: 1.4rem;
		font-weight: 600;
		color: #fff;
		margin: 1rem 0;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
	}

	.flip-button {
		margin-top: 1rem;
	}

	@keyframes fadeOut {
		from { opacity: 1; }
		to { opacity: 0; }
	}

	@media (max-width: 768px) {
		.game-container {
			grid-template-columns: 1fr;
		}

		.container {
			padding: 1rem;
		}

		.game-header h1 {
			font-size: 2.5rem;
		}

		.player-buttons {
			grid-template-columns: 1fr;
		}

		.input-group {
			flex-direction: column;
		}

		.input-group input {
			max-width: 100%;
		}

		.section-title {
			font-size: 1.5rem;
		}
	}
</style>
