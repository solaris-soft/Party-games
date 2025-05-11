<script lang="ts">
	import { goto } from '$app/navigation';

	function goHome() {
		goto('/');
	}
</script>

<div class="min-h-screen bg-gray-900 text-white p-8 font-['Press_Start_2P']">
	<div class="max-w-2xl mx-auto space-y-12">
		<div class="text-center">
			<h1 class="text-6xl mb-4 text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-600 animate-pulse">
				404
			</h1>
			<p class="text-2xl text-cyan-400 mb-8">Game Over!</p>
		</div>

		<div class="bg-gray-800 p-8 rounded-lg border-2 border-red-500 shadow-lg shadow-red-500/20">
			<h2 class="text-2xl mb-6 text-center text-yellow-400">Page Not Found</h2>
			
			<p class="text-gray-400 mb-8 text-center">
				Looks like you've wandered into uncharted territory. 
				The page you're looking for doesn't exist (or maybe it's not implemented yet).
			</p>

			<button
				on:click={goHome}
				class="w-full p-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg font-bold hover:from-red-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
			>
				Return to Main Menu
			</button>  
		</div>
	</div>
</div>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
</style>
