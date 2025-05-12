<script lang="ts">
	import { fly } from 'svelte/transition';
	import { onMount } from 'svelte';
	import Instructions from './Instructions.svelte';
	import Setup from './Setup.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	let showContent = false;
	let titleText = 'MURDER';
	let currentStep: 'instructions' | 'setup' = 'instructions';
	let playerName = '';
	let targetRoomId = page.url.searchParams.get('roomId');

	onMount(() => {
		showContent = true;
		// If we have a roomId, skip instructions and go straight to setup
		if (targetRoomId) {
			currentStep = 'setup';
		}
	});

	function handleInstructionsNext() {
		currentStep = 'setup';
	}

	function handleSetupNext(name: string) {
		playerName = name;
		const roomId = targetRoomId || crypto.randomUUID();
		goto(`/murder/${roomId}?name=${playerName}`);
	}
</script>

<div class="min-h-screen bg-black relative overflow-hidden">
	<!-- Psychological overlay -->
	<div class="absolute inset-0 pointer-events-none">
		<div class="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent"></div>
		<div
			class="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.8)_100%)]"
		></div>
	</div>

	<!-- Main content -->
	<div class="relative z-10 px-4 py-8 max-w-4xl mx-auto">
		<!-- Title with subtle distortion -->
		<h1
			class="text-7xl md:text-8xl font-['Creepster'] text-center text-red-600 mb-12 drop-shadow-[0_0_15px_rgba(255,0,0,0.3)] psychological-title"
			in:fly={{ y: -50, duration: 1000, delay: 200 }}
		>
			{titleText}
		</h1>

		{#if showContent}
			{#if currentStep === 'instructions'}
				<Instructions onNext={handleInstructionsNext} />
			{:else}
				<Setup onNext={handleSetupNext} />
			{/if}
		{/if}
	</div>
</div>

<style>
	/* Psychological effects */
	.psychological-title {
		position: relative;
		animation: subtle-distort 8s infinite;
	}

	@keyframes subtle-distort {
		0%,
		100% {
			transform: skew(0deg);
		}
		25% {
			transform: skew(-0.5deg);
		}
		75% {
			transform: skew(0.5deg);
		}
	}
</style>
