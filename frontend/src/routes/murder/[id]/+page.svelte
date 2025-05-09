<script lang="ts">
    import { onMount } from 'svelte';
	import type { PageData } from './$types';

    let {data}: { data: PageData & { playerId: string } } = $props();

    let ws: WebSocket | null = null;
    let playerName = $state(data.playerName);
    let roomId = $state(data.roomId);
    let players = $state<any[]>([]);
    let gamePhase = $state<'waiting' | 'voting' | 'murder' | 'revealing'>('waiting');
    let currentRound = $state(1);
    let isMurderer = $state(false);
    let isReady = $state(false);
    let selectedPlayer = $state<string | null>(null);
    let error = $state<string | null>(null);
    let isConnected = $state(false);
    let isConnecting = $state(false);
    let eliminationResult = $state<{ eliminatedPlayer: string, wasMurderer: boolean } | null>(null);
    let copySuccess = $state(false);

    function getWebSocketUrl() {
        const isDev = import.meta.env.DEV;
        const baseUrl = isDev ? import.meta.env.VITE_WS_URL_DEV : 'https://party-app-frontend.flat-sound-6551.workers.dev/';
        return `${baseUrl}/ws/murder?roomId=${roomId}&playerId=${data.playerName}`;
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
                console.log('Received message:', data);
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
                players = [...data.players];
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
                break;
            case 'player_ready':
                console.log('Player ready:', data.playerId);
                players = players.map((p) => (p.id === data.playerId ? { ...p, ready: true } : p));
                console.log('Updated players list:', players);
                break;
            case 'game_start':
                gamePhase = data.phase;
                currentRound = data.round;
                break;
            case 'you_are_murderer':
                isMurderer = true;
                break;
            case 'phase_change':
                gamePhase = data.phase;
                selectedPlayer = null;
                break;
            case 'player_eliminated':
                const eliminatedPlayer = players.find(p => p.id === data.playerId);
                if (eliminatedPlayer) {
                    eliminatedPlayer.isAlive = false;
                    eliminationResult = {
                        eliminatedPlayer: eliminatedPlayer.name,
                        wasMurderer: data.wasMurderer
                    };
                    // Clear the result after 5 seconds
                    setTimeout(() => {
                        eliminationResult = null;
                    }, 5000);
                }
                players = [...players];
                break;
            case 'game_end':
                gamePhase = 'waiting';
                isMurderer = false;
                isReady = false;
                selectedPlayer = null;
                break;
            case 'error':
                if (data.error === 'name_exists') {
                    error = 'This name is already taken. Please choose a different name.';
                    setTimeout(() => {
                        window.location.href = `/murder?roomId=${roomId}`;
                    }, 2000);
                } else {
                    error = data.error;
                }
                break;
        }
    }

    onMount(() => {
        connectWebSocket();
    });

    function handleReady() {
        isReady = true;
        ws?.send(
            JSON.stringify({
                type: 'ready'
            })
        );
    }

    function handleVote(playerId: string) {
        if (gamePhase === 'voting' && playerId !== data.playerId) {
            selectedPlayer = playerId;
            ws?.send(
                JSON.stringify({
                    type: 'vote',
                    votedPlayerId: playerId
                })
            );
        }
    }

    function handleMurder(playerId: string) {
        if (gamePhase === 'murder' && isMurderer) {
            ws?.send(
                JSON.stringify({
                    type: 'murder',
                    targetPlayerId: playerId
                })
            );
        }
    }

    function copyToClipboard() {
        // Get just the base URL with the room ID
        const baseUrl = window.location.origin;
        const roomId = window.location.pathname.split('/').filter(Boolean).pop();
        const cleanUrl = `${baseUrl}/murder/${roomId}`;
        
        navigator.clipboard.writeText(cleanUrl).then(() => {
            copySuccess = true;
            setTimeout(() => {
                copySuccess = false;
            }, 2000);
        }).catch(err => {
            error = 'Failed to copy URL to clipboard';
            console.error('Failed to copy:', err);
        });
    }
</script>

<div class="min-h-screen bg-black relative overflow-hidden">
  <!-- Psychological overlay -->
  <div class="absolute inset-0 pointer-events-none">
    <div class="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent"></div>
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.8)_100%)]"></div>
  </div>

  <!-- Main content -->
  <div class="relative z-10 px-4 py-8 max-w-4xl mx-auto">
    {#if error}
      <div class="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
        {error}
      </div>
    {/if}

    {#if eliminationResult}
        <div class="bg-black/80 border-2 {eliminationResult.wasMurderer ? 'border-green-500' : 'border-red-500'} text-white px-6 py-4 rounded-lg mb-4 text-center font-['Creepster'] text-2xl animate-fade-in">
            {eliminationResult.eliminatedPlayer} was {eliminationResult.wasMurderer ? 'the murderer!' : 'not the murderer...'}
        </div>
    {/if}

    <div class="mb-8">
      <h1 class="text-5xl md:text-6xl font-['Creepster'] text-center text-red-600 mb-4 drop-shadow-[0_0_15px_rgba(255,0,0,0.3)] psychological-title">
        Murder Game
      </h1>
      {#if isMurderer}
        <div class="bg-red-900/50 border-2 border-red-500 text-red-200 px-6 py-3 rounded-lg mb-4 text-center font-['Creepster'] text-2xl animate-pulse">
          You are the Murderer! Eliminate others without getting caught...
        </div>
      {/if}
      <p class="text-gray-400 text-center">Room {roomId} - Round {currentRound}</p>
      
      <!-- Enhanced Phase Indicator -->
      <div class="my-6 text-center">
        <div class="inline-block bg-black/70 border-2 border-red-500 rounded-lg px-8 py-3 transform hover:scale-105 transition-transform duration-200">
          <p class="text-gray-400 text-sm mb-1">Current Phase</p>
          <p class="font-['Creepster'] text-3xl text-red-500 drop-shadow-[0_0_10px_rgba(255,0,0,0.3)] phase-text">
            {gamePhase.charAt(0).toUpperCase() + gamePhase.slice(1)}
          </p>
        </div>
      </div>
    </div>

    <!-- Players Section -->
    <div class="mb-8">
      <h2 class="text-2xl font-['Creepster'] text-red-500 mb-6 text-center drop-shadow-[0_0_10px_rgba(255,0,0,0.2)]">
        Players in Room ({players.length})
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each players as player}
          <div class="border border-red-900/50 rounded-lg p-4 bg-black/50 backdrop-blur-sm transition-all duration-200 {!player.isAlive ? 'opacity-50' : 'hover:border-red-500/50 hover:shadow-[0_0_15px_rgba(255,0,0,0.1)]'}">
            <div class="flex justify-between items-start mb-2">
              <h3 class="font-['Creepster'] text-xl text-red-400">{player.name}</h3>
              {#if player.ready}
                <span class="bg-green-900/50 text-green-300 text-xs px-2 py-1 rounded-full">Ready</span>
              {/if}
            </div>
            <p class="text-sm text-gray-400 mb-3">
              Status: <span class={player.isAlive ? 'text-green-400' : 'text-red-400'}>
                {player.isAlive ? 'Alive' : 'Eliminated'}
              </span>
            </p>
            
            {#if gamePhase === 'voting' && player.isAlive && player.name !== data.playerName}
              <button 
                class="w-full mt-2 bg-red-900/50 text-red-200 px-3 py-1 rounded hover:bg-red-800/50 transition-colors duration-200 border border-red-900"
                onclick={() => handleVote(player.id)}
                class:bg-red-800={selectedPlayer === player.id}
              >
                {selectedPlayer === player.id ? 'Voted' : 'Vote'}
              </button>
            {/if}

            {#if gamePhase === 'murder' && isMurderer && player.isAlive && player.id !== data.playerId}
              <button 
                class="w-full mt-2 bg-red-900/50 text-red-200 px-3 py-1 rounded hover:bg-red-800/50 transition-colors duration-200 border border-red-900"
                onclick={() => handleMurder(player.id)}
              >
                Eliminate
              </button>
            {/if}
          </div>
        {/each}
      </div>
    </div>

    {#if gamePhase === 'waiting'}
      <div class="text-center space-y-4">
        {#if !isReady}
          <button 
            class="bg-red-900/50 text-red-200 px-6 py-2 rounded hover:bg-red-800/50 transition-colors duration-200 border border-red-900 font-['Creepster'] text-xl"
            onclick={handleReady}
          >
            Ready to Start
          </button>
        {/if}
        <div>
          <button 
            class="bg-red-900/50 text-red-200 px-6 py-2 rounded hover:bg-red-800/50 transition-colors duration-200 border border-red-900 font-['Creepster'] text-xl"
            onclick={copyToClipboard}
          >
            {copySuccess ? 'Copied!' : 'Invite Others'}
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  /* Psychological effects */
  .psychological-title {
    position: relative;
    animation: subtle-distort 8s infinite;
  }

  .phase-text {
    position: relative;
    animation: phase-pulse 2s infinite;
  }

  @keyframes phase-pulse {
    0%, 100% { text-shadow: 0 0 10px rgba(255,0,0,0.3); }
    50% { text-shadow: 0 0 20px rgba(255,0,0,0.5); }
  }

  @keyframes subtle-distort {
    0%, 100% { transform: skew(0deg); }
    25% { transform: skew(-0.5deg); }
    75% { transform: skew(0.5deg); }
  }

  @keyframes fade-in {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .animate-fade-in {
    animation: fade-in 0.3s ease-out;
  }
</style>

