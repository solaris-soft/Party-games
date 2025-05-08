<script lang="ts">
	import { goto } from '$app/navigation';
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
		}
	}
</script>

<div class="min-h-screen bg-gray-900 text-white p-8 font-['Press_Start_2P']">
	<div class="max-w-2xl mx-auto space-y-12">
		<div class="text-center">
			<h1
				class="text-4xl mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 animate-pulse"
			>
				Party App
			</h1>
			<p class="text-lg text-cyan-400">Welcome to the Party App</p>
		</div>

		<div
			class="bg-gray-800 p-8 rounded-lg border-2 border-purple-500 shadow-lg shadow-purple-500/20"
		>
			<h2 class="text-2xl mb-6 text-center text-yellow-400">Choose a game mode</h2>

			<select
				bind:value={gameMode}
				class="w-full p-4 bg-gray-700 border-2 border-cyan-400 rounded-lg text-cyan-400 focus:outline-none focus:border-pink-500 transition-all duration-300 cursor-pointer hover:border-pink-500"
			>
				<option value="paranoia" class="bg-gray-700">Paranoia</option>
                <option value="murder" class="bg-gray-700">Murder</option>
				<option value="20-questions" class="bg-gray-700">20 Questions</option>
				<option value="truth-or-drink" class="bg-gray-700">Truth or Drink</option>
			</select>

			<button
				onclick={handleNavigation}
				class="w-full mt-6 p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-bold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
			>
				Start Game
			</button>

			<div class="mt-4 text-center text-sm text-gray-400">
				<p class="animate-pulse">Select your destiny...</p>
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
</style>
