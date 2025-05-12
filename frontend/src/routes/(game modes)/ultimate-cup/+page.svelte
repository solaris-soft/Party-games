<script lang="ts">
	import { goto } from '$app/navigation';
	import Instructions from './Instructions.svelte';
	import Setup from './Setup.svelte';

	let currentStep = $state('instructions');

	const handleNext = () => {currentStep = 'setup';};

	const handleStart = (playerName: string) => {
		if (playerName) {
			let roomId = crypto.randomUUID();
			goto(`/ultimate-cup/${roomId}?playerName=${playerName}`);
		}
		currentStep = 'setup';
	};
</script>

<div class="min-h-screen w-full bg-black relative overflow-hidden">
	<!-- Experimental background -->
	<div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,215,0,0.03),transparent_70%)]"></div>
	<div class="absolute inset-0 bg-[conic-gradient(from_45deg_at_50%_50%,rgba(255,215,0,0.02),rgba(255,0,255,0.02),rgba(0,255,255,0.02),rgba(255,215,0,0.02))] animate-spin-slow"></div>
	
	<!-- Diagonal sections -->
	<div class="absolute inset-0 overflow-hidden">
		<div class="absolute -left-[50%] top-0 w-[200%] h-[200%] bg-gradient-to-br from-purple-900/5 via-transparent to-transparent transform rotate-12"></div>
		<div class="absolute -right-[50%] bottom-0 w-[200%] h-[200%] bg-gradient-to-tl from-blue-900/5 via-transparent to-transparent transform -rotate-12"></div>
	</div>

	<!-- Floating particles -->
	<div class="absolute inset-0">
		{#each Array(20) as _, i}
			<div 
				class="absolute w-1 h-1 bg-yellow-500/20 rounded-full"
				style="
					left: {Math.random() * 100}%;
					top: {Math.random() * 100}%;
					animation: float {5 + Math.random() * 10}s infinite;
					animation-delay: {Math.random() * 5}s;
				"
			></div>
		{/each}
	</div>

	<!-- Content container with experimental layout -->
	<div class="relative min-h-screen w-full flex items-center justify-center p-4">
		<div class="w-full max-w-[95vw] sm:max-w-3xl mx-auto transform hover:scale-[1.01] transition-transform duration-700">
			{#if currentStep === 'instructions'}
				<Instructions onNext={handleNext} />
			{:else if currentStep === 'setup'}
				<Setup onNext={handleStart} />
			{/if}
		</div>
	</div>
</div>

<style>
	@keyframes spin-slow {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	@keyframes float {
		0%, 100% {
			transform: translateY(0) translateX(0);
		}
		25% {
			transform: translateY(-20px) translateX(10px);
		}
		50% {
			transform: translateY(-10px) translateX(-10px);
		}
		75% {
			transform: translateY(-30px) translateX(5px);
		}
	}

	.animate-spin-slow {
		animation: spin-slow 60s linear infinite;
	}
</style> 