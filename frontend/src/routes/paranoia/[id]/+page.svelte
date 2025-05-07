<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';

	export let data;

	let ws: WebSocket | null = null;
	let playerName = '';
	let isConnected = false;
	let isConnecting = false;
	let players: { id: string; name: string; ready: boolean }[] = [];
	let currentPlayer: { id: string; name: string } | null = null;
	let coinFlipper: { id: string; name: string } | null = null;
	let currentQuestion: string | null = null;
	let currentAnswer: { id: string; name: string } | null = null;
	let gameStatus: 'waiting' | 'answering' | 'flipping' | 'revealing' = 'waiting';
	let error: string | null = null;
	let playerId = crypto.randomUUID();

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
	});

	function connectWebSocket() {
		if (isConnecting) return;
		isConnecting = true;
		
		const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
		const wsUrl = `${protocol}//localhost:8787/ws?roomId=${$page.params.id}&playerId=${playerId}`;
		
		console.log('Connecting to WebSocket:', wsUrl);
		ws = new WebSocket(wsUrl);

		ws.onopen = () => {
			console.log('WebSocket connection established');
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
			console.log('Raw message received:', event.data);
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
				// Handle initial players list when joining
				console.log('Received players list:', data.players);
				players = data.players;
				break;
			case 'player_joined':
				console.log('Player joined:', data.player);
				// Check if player already exists to avoid duplicates
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
			case 'round_start':
				currentPlayer = data.currentPlayer;
				coinFlipper = data.coinFlipper;
				gameStatus = 'answering';
				break;
			case 'question_submitted':
				currentQuestion = data.question;
				gameStatus = 'flipping';
				break;
			case 'answer_submitted':
				currentAnswer = data.answer;
				break;
			case 'coin_flip':
				gameStatus = 'revealing';
				if (data.result) {
					// Show question and answer
					currentQuestion = data.question;
					currentAnswer = data.answer;
				} else {
					// Hide question, show only answer
					currentQuestion = null;
					currentAnswer = data.answer;
				}
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

	$: isCurrentPlayer = currentPlayer?.id === playerId;
	$: isCoinFlipper = coinFlipper?.id === playerId;
</script>

<div class="container">
	{#if !isConnected}
		<div class="status">
			<p>Connecting to server...</p>
		</div>
	{:else}
		<div class="game-container">
			<div class="players-list">
				<h2>Players</h2>
				{#each players as player}
					<div class="player">
						<span>{player.name}</span>
						{#if player.ready}
							<span class="ready">✓</span>
						{/if}
					</div>
				{/each}
			</div>

			<div class="game-status">
				{#if gameStatus === 'waiting'}
					{#if !players.find(p => p.id === playerId)?.ready}
						<button on:click={markReady}>I'm Ready</button>
					{:else}
						<p>Waiting for other players...</p>
					{/if}
				{:else if gameStatus === 'answering'}
					{#if isCurrentPlayer}
						<div class="question-section">
							<h3>You are the current player!</h3>
							<p>Wait for someone to send you a question...</p>
						</div>
					{:else}
						<div class="question-section">
							<h3>Send a question to {currentPlayer?.name}</h3>
							<input
								type="text"
								placeholder="Enter your question"
								on:keydown={(e) => e.key === 'Enter' && submitQuestion(e.currentTarget.value)}
							/>
						</div>
					{/if}
				{:else if gameStatus === 'flipping'}
					{#if isCoinFlipper}
						<button on:click={flipCoin}>Flip Coin</button>
					{:else}
						<p>Waiting for {coinFlipper?.name} to flip the coin...</p>
					{/if}
				{:else if gameStatus === 'revealing'}
					<div class="reveal-section">
						{#if currentQuestion}
							<h3>Question: {currentQuestion}</h3>
						{/if}
						{#if currentAnswer}
							<h3>Answer: {currentAnswer.name}</h3>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	{/if}

	{#if error}
		<div class="error">
			{error}
		</div>
	{/if}
</div>

<style>
	.container {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
	}

	.status {
		text-align: center;
		padding: 2rem;
		color: #666;
	}

	.game-container {
		display: grid;
		grid-template-columns: 1fr 2fr;
		gap: 2rem;
	}

	.players-list {
		background-color: #f5f5f5;
		padding: 1rem;
		border-radius: 4px;
	}

	.player {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem;
		border-bottom: 1px solid #ddd;
	}

	.ready {
		color: #4CAF50;
	}

	.game-status {
		padding: 1rem;
		background-color: #f5f5f5;
		border-radius: 4px;
		text-align: center;
	}

	.question-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.reveal-section {
		text-align: center;
	}

	.error {
		background-color: #ffebee;
		color: #c62828;
		padding: 1rem;
		border-radius: 4px;
		margin-top: 1rem;
	}

	button {
		padding: 0.5rem 1rem;
		font-size: 1rem;
		background-color: #4CAF50;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	button:hover {
		background-color: #45a049;
	}

	input {
		padding: 0.5rem;
		font-size: 1rem;
		width: 100%;
		max-width: 300px;
	}
</style>
