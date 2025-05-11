<script lang="ts">
	import { fly, fade, scale } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let { onNext, playerName } = $props();

	let showContent = $state(false);
	let riddleText = $state('');
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

	const handleReturnToMenu = () => {
		goto('/');
	};

	onMount(() => {
		showContent = true;

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
</script>

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

		<div class="space-y-6 sm:space-y-8">
			<h3
				class="text-xl sm:text-2xl font-['Crimson+Text'] text-green-400/80 mb-4 sm:mb-6 tracking-wider text-center"
				in:fly={{ y: 20, duration: 800, delay: 800 }}
			>
				How well do you know each other?
			</h3>

			<ul
				class="space-y-4 sm:space-y-6 font-['IBM+Plex+Mono'] text-xs sm:text-sm tracking-wide max-w-2xl mx-auto"
			>
				{#each [{ icon: '📝', text: 'Each player enters 5 secret things about themselves' }, { icon: '🎯', text: 'Each round consists of one secret being revealed' }, { icon: '👥', text: 'Players vote on who they think the secret belongs to' }, { icon: '✅', text: 'If the majority guesses correctly, the person who the secret belongs to drinks' }, { icon: '❌', text: 'If the majority guesses wrong, everyone drinks and the real answer remains hidden' }, { icon: '🎲', text: 'The game continues until all secrets are revealed' }, { icon: '🏆', text: 'The player who survives the most drinks wins' }, { icon: '⚠️', text: 'Remember: honesty is key - no lying about your secrets!' }] as rule, i}
					<li
						class="flex items-start gap-3 sm:gap-4 text-green-300/90 riddler-text group relative pl-3 sm:pl-4"
						in:fly={{ y: 20, duration: 800, delay: 1000 + i * 100 }}
					>
						<div
							class="absolute left-0 top-2 w-1.5 sm:w-2 h-1.5 sm:h-2 bg-green-800/30 rounded-full"
						></div>
						<span class="text-lg sm:text-xl group-hover:scale-110 transition-transform"
							>{rule.icon}</span
						>
						<span class="pt-0.5 sm:pt-1">{rule.text}</span>
					</li>
				{/each}
			</ul>
		</div>

		<div class="flex flex-col sm:flex-row gap-4 justify-center mt-12 sm:mt-16">
			<!-- Start button with riddler effect -->
			<button
				onclick={onNext}
				class="w-full sm:w-auto px-8 sm:px-16 py-3 sm:py-4 text-lg sm:text-xl font-['Black+Jack'] text-white/90 bg-green-900/40 hover:bg-green-800/50 rounded-sm transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-3 sm:gap-4 group riddler-button border border-green-800/30 relative"
				in:fly={{ y: 20, duration: 800, delay: 2000 }}
			>
				<span class="absolute -left-2 top-1/2 transform -translate-y-1/2 text-green-800/30">[</span>
				Vibe check
				<span class="absolute -right-2 top-1/2 transform -translate-y-1/2 text-green-800/30">]</span
				>
				<span class="group-hover:opacity-50 transition-opacity text-sm">🎲</span>
			</button>

			<!-- Return to menu button -->
			<button
				onclick={handleReturnToMenu}
				class="w-full sm:w-auto px-8 sm:px-16 py-3 sm:py-4 text-lg sm:text-xl font-['Black+Jack'] text-white/90 bg-red-900/40 hover:bg-red-800/50 rounded-sm transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-3 sm:gap-4 group riddler-button border border-red-800/30 relative"
				in:fly={{ y: 20, duration: 800, delay: 2200 }}
			>
				<span class="absolute -left-2 top-1/2 transform -translate-y-1/2 text-red-800/30">[</span>
				Main Menu
				<span class="absolute -right-2 top-1/2 transform -translate-y-1/2 text-red-800/30">]</span>
				<span class="group-hover:opacity-50 transition-opacity text-sm">🏠</span>
			</button>
		</div>
	</div>
{/if}

<style>
	.riddler-card {
		position: relative;
		animation: subtle-pulse 4s infinite;
	}

	.riddler-text {
		position: relative;
		transition: all 0.3s ease;
		letter-spacing: 0.1em;
	}

	.riddler-text:hover {
		text-shadow: 0 0 8px rgba(0, 255, 0, 0.2);
		transform: translateX(2px);
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

	/* Add detective-style paper texture */
	.riddler-card::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%2300ff00' fill-opacity='0.02' fill-rule='evenodd'/%3E%3C/svg%3E");
		pointer-events: none;
	}
</style>
