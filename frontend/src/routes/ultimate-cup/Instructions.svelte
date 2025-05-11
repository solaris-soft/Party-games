<script lang="ts">
	import { fly, fade, scale } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let { onNext } = $props();

	let showContent = $state(false);
	let partyText = $state('');
	const partyPhrases = [
		'let the games begin!',
		'time to party!',
		'who will be the ultimate champion?',
		'the cup awaits...',
		'are you ready to play?',
		'let the drinking games begin!',
		'who will be crowned?',
		'the ultimate challenge begins...'
	];
	let partyInterval: ReturnType<typeof setInterval>;

	const handleReturnToMenu = () => {
		goto('/');
	};

	onMount(() => {
		showContent = true;

		// Create subtle party effect
		let phraseIndex = 0;
		partyInterval = setInterval(() => {
			partyText = partyPhrases[phraseIndex];
			phraseIndex = (phraseIndex + 1) % partyPhrases.length;
		}, 3000);

		return () => {
			clearInterval(partyInterval);
		};
	});
</script>

{#if showContent}
	<div
		class="bg-black/40 backdrop-blur-md border border-yellow-500/20 rounded-none p-2 sm:p-6 shadow-[0_0_50px_rgba(255,215,0,0.1)] party-card relative w-full overflow-hidden transform -skew-x-3 hover:skew-x-0 transition-transform duration-500"
		in:scale={{ duration: 800, delay: 400 }}
	>
		<!-- Animated background effects -->
		<div class="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5"></div>
		<div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,215,0,0.05),transparent_50%)]"></div>

		<!-- Decorative elements -->
		<div class="absolute inset-0 pointer-events-none">
			<div class="absolute top-0 left-0 w-full h-[1px] sm:h-[2px] bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent"></div>
			<div class="absolute bottom-0 left-0 w-full h-[1px] sm:h-[2px] bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent"></div>
			<div class="absolute top-0 left-0 w-[1px] sm:w-[2px] h-full bg-gradient-to-b from-transparent via-yellow-500/30 to-transparent"></div>
			<div class="absolute top-0 right-0 w-[1px] sm:w-[2px] h-full bg-gradient-to-b from-transparent via-yellow-500/30 to-transparent"></div>
		</div>

		<!-- Content with experimental layout -->
		<div class="transform skew-x-3">
			<!-- Header section with diagonal split -->
			<div class="relative mb-4 sm:mb-12">
				<div class="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-transparent transform -skew-y-6"></div>
				<div class="relative">
					<!-- Party text -->
					<div class="text-center mb-2 sm:mb-6">
						<p
							class="text-yellow-300/80 text-base sm:text-xl font-['Rubik+Vinyl'] italic party-whisper"
							transition:fade
						>
							{partyText}
						</p>
					</div>

					<h2
						class="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-['Rubik+Glitch'] text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-300 mb-2 sm:mb-8 relative tracking-wider transform hover:scale-105 transition-transform duration-500"
						in:fly={{ y: 20, duration: 800, delay: 600 }}
					>
						<span
							class="absolute -left-4 sm:-left-8 md:-left-12 top-1/2 transform -translate-y-1/2 text-xl sm:text-3xl md:text-4xl opacity-70 animate-float"
							>🏆</span
						>
						ULTIMATE CUP
						<span
							class="absolute -right-4 sm:-right-8 md:-right-12 top-1/2 transform -translate-y-1/2 text-xl sm:text-3xl md:text-4xl opacity-70 animate-float-delayed"
							>🎉</span
						>
					</h2>

					<h3
						class="text-xl sm:text-3xl md:text-4xl font-['Righteous'] text-yellow-300/90 tracking-wider text-center transform hover:translate-x-2 transition-transform duration-300"
						in:fly={{ y: 20, duration: 800, delay: 800 }}
					>
						The Ultimate Party Game Experience
					</h3>
				</div>
			</div>

			<!-- Rules section with dynamic grid -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-8 relative">
				<!-- Left column -->
				<div class="space-y-2 sm:space-y-8">
					{#each [
						{ icon: '🎴', text: 'Each player takes turns drawing cards from the deck' },
						{ icon: '👑', text: 'Kings add drinks to the Ultimate Cup - when the last King is drawn, the cup must be finished' },
						{ icon: '⚡', text: 'Power cards grant special abilities that last one turn' },
						{ icon: '🎯', text: 'Challenge cards require players to complete tasks or drink' }
					] as rule, i}
						<div
							class="group relative transform hover:translate-x-4 transition-transform duration-300"
							in:fly={{ y: 20, duration: 800, delay: 1000 + i * 100 }}
						>
							<div class="absolute inset-0 bg-gradient-to-r from-purple-900/10 to-transparent transform -skew-x-6"></div>
							<div class="relative flex items-start gap-2 sm:gap-4 p-2 sm:p-4">
								<span class="text-xl sm:text-3xl md:text-4xl group-hover:scale-110 transition-transform duration-300"
									>{rule.icon}</span
								>
								<span class="text-yellow-200/90 font-['Righteous'] text-xs sm:text-base md:text-lg tracking-wide pt-1 sm:pt-2">{rule.text}</span>
							</div>
						</div>
					{/each}
				</div>

				<!-- Right column -->
				<div class="space-y-2 sm:space-y-8">
					{#each [
						{ icon: '🎮', text: 'Mini-game cards trigger special party games between players' },
						{ icon: '🔄', text: 'Players can use their powers to change the game rules temporarily' },
						{ icon: '🏆', text: 'The last player standing is crowned the Ultimate Champion' },
						{ icon: '⚠️', text: 'Remember: Drink responsibly and know your limits!' }
					] as rule, i}
						<div
							class="group relative transform hover:translate-x-4 transition-transform duration-300"
							in:fly={{ y: 20, duration: 800, delay: 1000 + (i + 4) * 100 }}
						>
							<div class="absolute inset-0 bg-gradient-to-r from-blue-900/10 to-transparent transform -skew-x-6"></div>
							<div class="relative flex items-start gap-2 sm:gap-4 p-2 sm:p-4">
								<span class="text-xl sm:text-3xl md:text-4xl group-hover:scale-110 transition-transform duration-300"
									>{rule.icon}</span
								>
								<span class="text-yellow-200/90 font-['Righteous'] text-xs sm:text-base md:text-lg tracking-wide pt-1 sm:pt-2">{rule.text}</span>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Buttons section with diagonal accent -->
			<div class="relative mt-4 sm:mt-16">
				<div class="absolute inset-0 bg-gradient-to-br from-yellow-900/10 to-transparent transform -skew-y-6"></div>
				<div class="relative flex flex-col sm:flex-row gap-2 sm:gap-8 justify-center">
					<!-- Start button with party effect -->
					<button
						onclick={onNext}
						class="w-full sm:w-auto px-4 sm:px-12 md:px-24 py-3 sm:py-5 md:py-6 text-lg sm:text-2xl md:text-3xl font-['Rubik+Glitch'] text-white/90 bg-gradient-to-r from-purple-600/60 via-yellow-600/60 to-blue-600/60 hover:from-purple-600/80 hover:via-yellow-600/80 hover:to-blue-600/80 rounded-none transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 sm:gap-6 md:gap-8 group party-button relative transform hover:skew-x-3"
						in:fly={{ y: 20, duration: 800, delay: 2000 }}
					>
						<span class="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-yellow-500/20 to-blue-500/20"></span>
						<span class="relative">Let's Party</span>
						<span class="group-hover:opacity-50 transition-opacity text-lg sm:text-2xl">🎉</span>
					</button>

					<!-- Return to menu button -->
					<button
						onclick={handleReturnToMenu}
						class="w-full sm:w-auto px-4 sm:px-12 md:px-24 py-3 sm:py-5 md:py-6 text-lg sm:text-2xl md:text-3xl font-['Rubik+Glitch'] text-white/90 bg-gradient-to-r from-red-600/60 via-red-500/60 to-red-600/60 hover:from-red-600/80 hover:via-red-500/80 hover:to-red-600/80 rounded-none transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 sm:gap-6 md:gap-8 group party-button relative transform hover:skew-x-3"
						in:fly={{ y: 20, duration: 800, delay: 2200 }}
					>
						<span class="absolute inset-0 bg-gradient-to-r from-red-500/20 via-red-400/20 to-red-500/20"></span>
						<span class="relative">Main Menu</span>
						<span class="group-hover:opacity-50 transition-opacity text-lg sm:text-2xl">🏠</span>
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.party-card {
		position: relative;
		animation: subtle-pulse 4s infinite;
	}

	.party-text {
		position: relative;
		transition: all 0.3s ease;
		letter-spacing: 0.1em;
	}

	.party-text:hover {
		text-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
		transform: translateX(6px);
	}

	.party-whisper {
		animation: fade-in-out 3s infinite;
		text-shadow: 0 0 10px rgba(255, 215, 0, 0.2);
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

	@keyframes fade-in-out {
		0%,
		100% {
			opacity: 0.4;
		}
		50% {
			opacity: 0.8;
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
