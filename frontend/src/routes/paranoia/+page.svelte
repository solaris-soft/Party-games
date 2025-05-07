<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { goto } from '$app/navigation';
</script>

<div class="max-w-4xl mx-auto bg-black/80 border-2 border-green-500/30 rounded-lg p-12 shadow-[0_0_20px_rgba(0,255,0,0.2)] backdrop-blur-sm relative overflow-hidden" in:fade={{ duration: 1000, delay: 500 }}>
  <!-- CRT Scan Effect -->
      <div class="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/5 to-transparent animate-scan"></div>
      
      <div class="relative">
        <h2 class="text-5xl text-green-400 mb-8 uppercase tracking-widest relative inline-block">
          How to Play
          <div class="absolute -bottom-2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>
        </h2>
        
        <p class="text-xl text-green-500/80 italic mb-12 leading-relaxed">
          In the shadows of uncertainty, truth and mystery dance...
        </p>
        
        <div class="space-y-8">
          {#each [
            'One player sends a question to a random member of the group',
            'The chosen player must answer the question out loud',
            'A virtual coin toss determines if the question is revealed',
            'If the coin toss is lost, the question remains a mystery forever'
          ] as step, i}
            <div class="flex items-center gap-6 group" in:fly={{ x: -20, duration: 800, delay: 800 + i * 200 }}>
              <span class="w-12 h-12 rounded-full bg-green-500/20 border-2 border-green-500/50 text-green-400 flex items-center justify-center text-2xl font-bold group-hover:bg-green-500/30 transition-colors duration-300">
                {i + 1}
              </span>
              <p class="text-xl text-green-400/90 group-hover:text-green-400 transition-colors duration-300">{step}</p>
            </div>
          {/each}
        </div>

        <div class="flex gap-8 justify-center mt-16" in:fade={{ duration: 800, delay: 1600 }}>
          <button 
            class="px-10 py-5 rounded-lg text-xl font-semibold cursor-pointer transition-all duration-300 relative overflow-hidden uppercase tracking-wider bg-green-500/10 text-green-400 border-2 border-green-500/30 hover:bg-green-500/20 hover:border-green-500/50 hover:-translate-y-0.5 group" 
            onclick={() => goto('/')}
          >
            <span class="relative z-10 group-hover:text-green-300 transition-colors duration-300">Return to Menu</span>
            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
          
          <button 
            class="px-10 py-5 rounded-lg text-xl font-semibold cursor-pointer transition-all duration-300 relative overflow-hidden uppercase tracking-wider bg-green-500/20 text-green-300 border-2 border-green-500/50 hover:bg-green-500/30 hover:-translate-y-0.5 group" 
            onclick={() => goto('/paranoia/setup')}
          >
            <span class="relative z-10 group-hover:text-green-200 transition-colors duration-300">Start Game</span>
            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>
      </div>
    </div>


<style>
    .container {
        padding: 2rem;
        max-width: 800px;
        margin: 0 auto;
    }

    .error {
        color: red;
    }

    .message {
        color: green;
        font-size: 1.2rem;
    }
</style>