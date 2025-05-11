<script lang="ts">
	import { fly, fade, scale } from 'svelte/transition';
	import { onMount } from 'svelte';

	let { onNext } = $props();

	let showContent = $state(false);
	let players = $state<string[]>(['']);
	let error = $state('');

	const addPlayer = () => {
		if (players.length < 10) {
			players = [...players, ''];
		}
	};

	const removePlayer = (index: number) => {
		if (players.length > 1) {
			players = players.filter((_, i) => i !== index);
		}
	};

	const updatePlayer = (index: number, value: string) => {
		players[index] = value;
	};

	const handleStart = () => {
		// Validate players
		if (players.length < 3) {
			error = 'Need at least 3 players to start';
			return;
		}

		if (players.some(name => !name.trim())) {
			error = 'All players must have names';
			return;
		}

		if (new Set(players.map(p => p.toLowerCase())).size !== players.length) {
			error = 'Player names must be unique';
			return;
		}

		// Start game with players
		onNext(players);
	};

	onMount(() => {
		showContent = true;
	});
</script>

{#if showContent}
	<div
		class="bg-black/40 backdrop-blur-md border border-yellow-500/20 rounded-none p-4 sm:p-6 shadow-[0_0_50px_rgba(255,215,0,0.1)] party-card relative w-full overflow-hidden transform -skew-x-3 hover:skew-x-0 transition-transform duration-500"
		in:scale={{ duration: 800, delay: 400 }}
	>
		<!-- Animated background effects -->
		<div class="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5"></div>
		<div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,215,0,0.05),transparent_50%)]"></div>

		<!-- Decorative elements -->
		<div class="absolute inset-0 pointer-events-none">
			<div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent"></div>
			<div class="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent"></div>
			<div class="absolute top-0 left-0 w-[2px] h-full bg-gradient-to-b from-transparent via-yellow-500/30 to-transparent"></div>
			<div class="absolute top-0 right-0 w-[2px] h-full bg-gradient-to-b from-transparent via-yellow-500/30 to-transparent"></div>
		</div>

		<!-- Content with experimental layout -->
		<div class="transform skew-x-3">
			<h2
				class="text-5xl sm:text-6xl md:text-7xl font-['Black+Jack'] text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-300 mb-16 relative tracking-wider transform hover:scale-105 transition-transform duration-500"
				in:fly={{ y: 20, duration: 800, delay: 600 }}
			>
				<span
					class="absolute -left-8 sm:-left-12 top-1/2 transform -translate-y-1/2 text-3xl sm:text-4xl opacity-70 animate-float"
					>👥</span
				>
				Player Setup
				<span
					class="absolute -right-8 sm:-right-12 top-1/2 transform -translate-y-1/2 text-3xl sm:text-4xl opacity-70 animate-float-delayed"
					>🎮</span
				>
			</h2>

			<div class="space-y-10">
				{#each players as _, i}
					<div
						class="flex items-center gap-6 group transform hover:translate-x-4 transition-transform duration-300"
						in:fly={{ y: 20, duration: 800, delay: 800 + i * 100 }}
					>
						<input
							type="text"
							bind:value={players[i]}
							placeholder="Enter player name"
							class="flex-1 bg-black/50 border-2 border-yellow-500/20 text-yellow-200/90 px-8 py-4 rounded-none focus:outline-none focus:border-yellow-500/50 transition-all duration-300 placeholder-yellow-500/30 font-['IBM+Plex+Mono'] text-lg hover:bg-black/60 focus:bg-black/60"
						/>
						{#if players.length > 1}
							<button
								on:click={() => removePlayer(i)}
								class="text-red-500/70 hover:text-red-400 transition-colors duration-300 text-3xl hover:scale-110"
							>
								❌
							</button>
						{/if}
					</div>
				{/each}

				{#if players.length < 10}
					<button
						on:click={addPlayer}
						class="w-full py-5 text-yellow-300/80 hover:text-yellow-200 border-2 border-yellow-500/20 hover:border-yellow-500/50 rounded-none transition-all duration-300 font-['IBM+Plex+Mono'] text-lg hover:bg-yellow-500/5 transform hover:skew-x-3"
						in:fly={{ y: 20, duration: 800, delay: 800 + players.length * 100 }}
					>
						+ Add Player
					</button>
				{/if}

				{#if error}
					<p class="text-red-400/90 text-center font-['IBM+Plex+Mono'] text-lg" in:fade>{{ error }}</p>
				{/if}
			</div>

			<div class="flex flex-col sm:flex-row gap-8 justify-center mt-20">
				<button
					on:click={handleStart}
					class="w-full sm:w-auto px-12 sm:px-24 py-5 sm:py-6 text-2xl sm:text-3xl font-['Black+Jack'] text-white/90 bg-gradient-to-r from-purple-600/60 via-yellow-600/60 to-blue-600/60 hover:from-purple-600/80 hover:via-yellow-600/80 hover:to-blue-600/80 rounded-none transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-6 sm:gap-8 group party-button relative transform hover:skew-x-3"
					in:fly={{ y: 20, duration: 800, delay: 2000 }}
				>
					<span class="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-yellow-500/20 to-blue-500/20"></span>
					<span class="relative">Start Game</span>
					<span class="group-hover:opacity-50 transition-opacity text-2xl">🎮</span>
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.party-card {
		position: relative;
		animation: subtle-pulse 4s infinite;
	}

	.party-button {
		position: relative;
		overflow: hidden;
		letter-spacing: 0.1em;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}

	.party-button::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
		animation: party-scan 3s linear infinite;
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

	@keyframes party-scan {
		0% {
			left: -100%;
		}
		100% {
			left: 100%;
		}
	}

	@keyframes float {
		0%,
		100% {
			transform: translateY(0) rotate(-5deg);
		}
		50% {
			transform: translateY(-15px) rotate(5deg);
		}
	}

	@keyframes float-delayed {
		0%,
		100% {
			transform: translateY(0) rotate(5deg);
		}
		50% {
			transform: translateY(-15px) rotate(-5deg);
		}
	}

	@keyframes gradient-shift {
		0% {
			background-position: 0% 0%;
		}
		50% {
			background-position: 100% 100%;
		}
		100% {
			background-position: 0% 0%;
		}
	}

	.animate-float {
		animation: float 4s ease-in-out infinite;
	}

	.animate-float-delayed {
		animation: float 4s ease-in-out infinite;
		animation-delay: 2s;
	}

	.animate-gradient-shift {
		animation: gradient-shift 15s ease infinite;
		background-size: 200% 200%;
	}

	.border-gradient {
		border-image: linear-gradient(45deg, #ffd700, #ffa500, #ffd700) 1;
	}
</style> 