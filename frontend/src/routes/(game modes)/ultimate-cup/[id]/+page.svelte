<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import type { Card as CardType, Effect } from '$lib/types/game';
	import CardComponent from '$lib/components/Card.svelte';
	import UltimateCupComponent from '$lib/components/UltimateCup.svelte';
	import PlayerCard from '$lib/components/PlayerCard.svelte';
	import { page } from '$app/state';

	let { data }: { data: { roomID: string; playerName: string } } = $props();

	let ws: WebSocket | null = null;
	let isConnected = $state(false);
	let error: string | null = $state(null);
	let players: { id: string; name: string; ready: boolean; isEliminated?: boolean; powerCards: string[]; currentEffects: Effect[]; disconnected?: boolean }[] = $state([]);
	let currentPlayer: { id: string; name: string } | null = $state(null);
	let gamePhase: 'waiting' | 'playing' | 'minigame' | 'challenge' | 'ended' | 'ultimate_cup' = $state('waiting');
	let currentCard: CardType | null = $state(null);
	let powerCards: string[] = $state([]);
	let currentEffects: Effect[] = $state([]);
	let ultimateCup = {
		drinks: 0,
		isActive: false
	};
	let eliminatedPlayers: { id: string; name: string }[] = $state([]);
	let winner: { id: string; name: string } | null = $state(null);
	let cardsRemaining: number = $state(0);

	function connectWebSocket() {
		if (!browser) return;

		const isDev = import.meta.env.DEV;
		const baseUrl = isDev 
			? import.meta.env.VITE_WS_URL_DEV
			: 'https://party-app.flat-sound-6551.workers.dev';
		const wsUrl = `${baseUrl}/ws/ultimate-cup?roomId=${data.roomID}&playerId=${data.playerName}`;
		
		ws = new WebSocket(wsUrl);

		ws.onopen = () => {
			isConnected = true;
			error = null;
			// Send join message
			ws?.send(JSON.stringify({
				type: 'join',
				name: data.playerName
			}));
		};

		ws.onclose = () => {
			isConnected = false;
			error = 'Disconnected from server';
		};

		ws.onerror = (e) => {
			error = 'Connection error';
			console.error('WebSocket error:', e);
		};

		ws.onmessage = (event) => {
			const message = JSON.parse(event.data);
			handleGameMessage(message);
		};
	}

	function handleGameMessage(message: any) {
		console.log('Received game message:', message);
		switch (message.type) {
			case 'players_list':
				players = message.players;
				break;
			case 'player_ready':
				players = players.map(p => p.id === message.playerId ? { ...p, ready: true } : p);
				break;
			case 'game_start':
				gamePhase = 'playing';
				currentPlayer = message.currentPlayer;
				cardsRemaining = message.cardsRemaining || 0;
				break;
			case 'card_drawn':
				currentCard = message.card;
				cardsRemaining = message.cardsRemaining || 0;
				break;
			case 'power_card_received':
				const player = players.find(p => p.id === message.playerId);
				if (player) {
					player.powerCards = [...player.powerCards, message.power.name];
				}
				// Update local player's power cards if it's for the current player
				if (message.playerId === data.playerName) {
					powerCards = [...powerCards, message.power.name];
				}
				break;
			case 'challenge_started':
				gamePhase = 'challenge';
				currentCard = message.challenge;
				break;
			case 'minigame_started':
				gamePhase = 'minigame';
				currentCard = message.minigame;
				break;
			case 'challenge_completed':
				gamePhase = message.phase;
				currentCard = null;
				break;
			case 'minigame_completed':
				gamePhase = 'playing';
				currentCard = null;
				break;
			case 'turn_changed':
				currentPlayer = message.currentPlayer;
				break;
			case 'ultimate_cup_activated':
				gamePhase = 'ultimate_cup';
				ultimateCup.drinks = message.drinks;
				ultimateCup.isActive = true;
				break;
			case 'game_end':
				gamePhase = 'ended';
				winner = message.winner;
				eliminatedPlayers = message.eliminatedPlayers;
				break;
			case 'player_left':
				const leftPlayer = players.find(p => p.id === message.playerId);
				if (leftPlayer) {
					leftPlayer.disconnected = true;
				}
				break;
			case 'player_reconnected':
				const reconnectedPlayer = players.find(p => p.id === message.playerId);
				if (reconnectedPlayer) {
					reconnectedPlayer.disconnected = false;
				}
				break;
			case 'game_state':
				// Handle full game state update for reconnecting players
				console.log('Full game state:', message.game);
				players = message.players;
				gamePhase = message.game.phase;
				currentPlayer = message.game.currentPlayer;
				currentCard = message.game.currentCard;
				ultimateCup.drinks = message.game.ultimateCup.drinks;
				ultimateCup.isActive = message.game.ultimateCup.isActive;
				cardsRemaining = message.game.cardsRemaining || 0;
				
				// Handle card based on game phase
				if (message.game.currentCard) {
					if (message.game.phase === 'challenge') {
						currentCard = {
							type: 'challenge',
							content: message.game.currentCard.content,
							effect: message.game.currentCard.effect
						};
					} else if (message.game.phase === 'minigame') {
						currentCard = {
							type: 'minigame',
							content: message.game.currentCard.content,
							effect: message.game.currentCard.effect
						};
					} else {
						currentCard = message.game.currentCard;
					}
				}
				console.log('Set current card to:', currentCard);
				break;
			case 'error':
				error = message.error;
				break;
		}
	}

	function handleReady() {
		ws?.send(JSON.stringify({ type: 'ready' }));
	}

	function handleDrawCard() {
		ws?.send(JSON.stringify({ type: 'draw_card' }));
	}

	function handleUsePower(powerCard: string) {
		ws?.send(JSON.stringify({
			type: 'use_power',
			powerCard
		}));
	}

	function handleCompleteChallenge(success: boolean) {
		ws?.send(JSON.stringify({
			type: 'complete_challenge',
			success
		}));
	}

	function handleFinishMinigame(results: any) {
		ws?.send(JSON.stringify({
			type: 'finish_minigame',
			results
		}));
	}

	onMount(() => {
		connectWebSocket();
	});

	onDestroy(() => {
		ws?.close();
	});
</script>

<div class="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-4">
	{#if !isConnected}
		<div class="flex items-center justify-center h-screen">
			<div class="text-center">
				<div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
				<p class="text-xl text-gray-300">Connecting to game server...</p>
			</div>
		</div>
	{:else if error}
		<div class="flex items-center justify-center h-screen">
			<div class="bg-red-500/10 border border-red-500 rounded-lg p-6 text-center">
				<p class="text-xl text-red-400">{error}</p>
			</div>
		</div>
	{:else}
		<div class="max-w-7xl mx-auto space-y-8">
			<!-- Game Header -->
			<div class="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-700">
				<h1 class="text-4xl font-bold text-center mb-6 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">Ultimate Cup</h1>
				<div class="flex flex-col md:flex-row justify-between items-center gap-4">
					<div class="space-y-2">
						<p class="text-gray-300">Room ID: <span class="text-white font-mono">{page.params.id}</span></p>
						<p class="text-gray-300">Your Name: <span class="text-white">{data.playerName}</span></p>
					</div>
					{#if gamePhase === 'waiting'}
						<button
							class="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg"
							onclick={handleReady}
						>
							Ready
						</button>
					{/if}
				</div>
			</div>

			<!-- Players List -->
			<div class="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-700">
				<h2 class="text-2xl font-bold mb-6 text-gray-200">Players</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{#each players as player}
						<PlayerCard
							{player}
							isCurrentPlayer={currentPlayer?.id === player.id}
						/>
					{/each}
				</div>
			</div>

			<!-- Game Area -->
			{#if gamePhase !== 'waiting' && gamePhase !== 'ended'}
				<div class="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-700">
					<h2 class="text-2xl font-bold mb-6 text-gray-200">Game Status</h2>
					<div class="space-y-6">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-3">
								<span class="px-3 py-1 rounded-full text-sm font-medium bg-gray-700 text-gray-200">
									{gamePhase.replace('_', ' ').toUpperCase()}
								</span>
								<span class="px-3 py-1 rounded-full text-sm font-medium bg-blue-600 text-white">
									{cardsRemaining} Cards Left
								</span>
							</div>
							<div class="flex items-center gap-4">
								<UltimateCupComponent drinks={ultimateCup.drinks} isActive={ultimateCup.isActive} />
								{#if ultimateCup.isActive}
									<div class="text-center">
										<p class="text-lg font-bold text-red-400">Ultimate Cup Active!</p>
										<p class="text-gray-300">Drinks: {ultimateCup.drinks}</p>
									</div>
								{/if}
							</div>
						</div>
					</div>
				</div>

				<!-- Current Card -->
				{#if currentCard}
					<div class="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-700">
						<h2 class="text-2xl font-bold mb-6 text-gray-200">Current Card</h2>
						<div class="flex justify-center items-center min-h-[400px]">
							<div class="w-64">
								<CardComponent card={currentCard} />
							</div>
						</div>
					</div>
				{/if}

				<!-- Power Cards -->
				{#if powerCards.length > 0}
					<div class="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-700">
						<h2 class="text-2xl font-bold mb-6 text-gray-200">Your Power Cards</h2>
						<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
							{#each powerCards as power}
								<div class="w-64">
									<CardComponent
										card={{
											type: 'power',
											content: power,
											effect: {
												name: power,
												description: `Use ${power} power card`
											}
										}}
										interactive={true}
										onClick={() => handleUsePower(power)}
									/>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Game Actions -->
				{#if currentPlayer?.id === data.playerName}
					<div class="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-700">
						<h2 class="text-2xl font-bold mb-6 text-gray-200">Your Turn</h2>
						<div class="flex flex-wrap gap-4 justify-center">
							{#if gamePhase === 'playing'}
								<button
									class="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg"
									onclick={handleDrawCard}
								>
									Draw Card
								</button>
							{/if}
							{#if gamePhase === 'challenge'}
								<div class="flex gap-4">
									<button
										class="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg"
										onclick={() => handleCompleteChallenge(true)}
									>
										Complete Challenge
									</button>
									<button
										class="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg"
										onclick={() => handleCompleteChallenge(false)}
									>
										Fail Challenge
									</button>
								</div>
							{/if}
							{#if gamePhase === 'minigame'}
								<button
									class="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg"
									onclick={() => handleFinishMinigame({ success: true })}
								>
									Complete Minigame
								</button>
							{/if}
						</div>
					</div>
				{/if}
			{/if}

			<!-- Game End -->
			{#if gamePhase === 'ended'}
				<div class="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-gray-700 text-center">
					<h2 class="text-4xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">Game Over!</h2>
					{#if winner}
						<p class="text-3xl text-yellow-400 mb-6">Winner: {winner.name}</p>
					{:else}
						<p class="text-3xl text-red-400 mb-6">No Winner - All Players Eliminated</p>
					{/if}
					<div class="space-y-4">
						<p class="text-xl text-gray-300">Eliminated Players:</p>
						<ul class="space-y-2">
							{#each eliminatedPlayers as player}
								<li class="text-gray-400">{player.name}</li>
							{/each}
						</ul>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>