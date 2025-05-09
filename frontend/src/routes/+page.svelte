<script lang="ts">
	import { goto } from '$app/navigation';
	import { fade, fly, scale } from 'svelte/transition';
	import { elasticOut } from 'svelte/easing';
	let gameMode = $state('paranoia');

	function handleNavigation() {
		switch (gameMode) {
			case 'paranoia':
				goto('/paranoia');
				break;
			case '20-questions':
				goto('/20-questions');
				break;
			case 'truth-or-drink':
				goto('/truth-or-drink');
				break;
			case 'murder':
				goto('/murder');
				break;
			case 'odds-on':
				goto('/odds-on');
				break;
		}
	}
</script>

<div class="min-h-screen bg-gray-900 text-white p-8 font-['Press_Start_2P']">
	<div class="max-w-2xl mx-auto space-y-12">
		<div class="text-center" in:fly={{ y: -100, duration: 1000, delay: 200, easing: elasticOut }}>
			<h1
				class="text-4xl mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 animate-bounce-subtle"
			>
				Party App
			</h1>
			<p class="text-lg text-cyan-400 animate-float">Welcome to the Party App</p>
		</div>

		<div
			class="bg-gray-800 p-8 rounded-lg border-2 border-purple-500 shadow-lg shadow-purple-500/20"
			in:scale={{ duration: 800, delay: 400, start: 0.5, easing: elasticOut }}
		>
			<h2 class="text-2xl mb-6 text-center text-yellow-400 animate-slide-in">Choose a game mode</h2>

			<select
				bind:value={gameMode}
				class="w-full p-4 bg-gray-700 border-2 border-cyan-400 rounded-lg text-cyan-400 focus:outline-none focus:border-pink-500 transition-all duration-300 cursor-pointer hover:border-pink-500 animate-pop-in"
			>
				<option value="paranoia" class="bg-gray-700">Paranoia</option>
                <option value="murder" class="bg-gray-700">Murder</option>
				<option value="odds-on" class="bg-gray-700">Odds On</option>
				<option value="20-questions" class="bg-gray-700">20 Questions</option>
				<option value="truth-or-drink" class="bg-gray-700">Truth or Drink</option>
			</select>

			<button
				onclick={handleNavigation}
				class="w-full mt-6 p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-bold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
			>
				Start Game
			</button>

			<div class="mt-10 text-center text-sm text-gray-400" in:fade={{ duration: 1000, delay: 800 }}>
				<p class="animate-pulse">Choose your game mode!</p>
			</div>
		</div>
	</div>
</div>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

	select {
		-webkit-appearance: none;
		-moz-appearance: none;
		appearance: none;
		background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23fff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
		background-repeat: no-repeat;
		background-position: right 1rem center;
		background-size: 1em;
	}

	@keyframes bounce-subtle {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-10px); }
	}

	@keyframes float {
		0%, 100% { transform: translateY(0) rotate(-2deg); }
		50% { transform: translateY(-5px) rotate(2deg); }
	}

	@keyframes pop-in {
		0% { transform: scale(0.8); opacity: 0; }
		70% { transform: scale(1.1); }
		100% { transform: scale(1); opacity: 1; }
	}

	@keyframes glow {
		0%, 100% { box-shadow: 0 0 5px rgba(147, 51, 234, 0.5), 0 0 10px rgba(236, 72, 153, 0.5); }
		50% { box-shadow: 0 0 20px rgba(147, 51, 234, 0.8), 0 0 30px rgba(236, 72, 153, 0.8); }
	}

	@keyframes slide-in {
		0% { transform: translateX(-50px) rotate(-5deg); opacity: 0; }
		100% { transform: translateX(0) rotate(0); opacity: 1; }
	}

	.animate-bounce-subtle {
		animation: bounce-subtle 2s ease-in-out infinite;
	}

	.animate-float {
		animation: float 3s ease-in-out infinite;
	}

	.animate-pop-in {
		animation: pop-in 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
	}

	.animate-glow {
		animation: glow 2s ease-in-out infinite;
	}

	.animate-slide-in {
		animation: slide-in 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
	}
</style>
