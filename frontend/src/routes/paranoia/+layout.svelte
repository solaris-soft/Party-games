<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { goto } from '$app/navigation';

  let { children } = $props();
  
  let glitchActive: boolean = $state(false);
  let staticNoise: boolean = $state(false);
  
  onMount(() => {

    // Random glitch effect
    setInterval(() => {
      if (Math.random() > 0.95) {
        glitchActive = true;
        setTimeout(() => {
          glitchActive = false;
        }, 200);
      }
    }, 3000);

    // Random static noise
    setInterval(() => {
      if (Math.random() > 0.98) {
        staticNoise = true;
        setTimeout(() => {
          staticNoise = false;
        }, 100);
      }
    }, 2000);
  });
</script>

<div class="min-h-screen bg-black text-red-400 font-['VT323'] relative overflow-hidden">
  <!-- CRT Screen Effect -->
  <div class="fixed inset-0 bg-gradient-to-b from-transparent via-black/20 to-transparent opacity-50 pointer-events-none"></div>
  <div class="fixed inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)] pointer-events-none"></div>
  
  <!-- Scanlines -->
  <div class="fixed inset-0 bg-[linear-gradient(to_bottom,_transparent_50%,_rgba(255,0,0,0.05)_50%)] bg-[length:100%_4px] pointer-events-none"></div>
  
  <!-- Static Noise -->
  <div class="fixed inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E')] opacity-10 pointer-events-none mix-blend-overlay {staticNoise ? 'animate-pulse' : ''}"></div>
  
  <!-- Vignette Effect -->
  <div class="fixed inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.8)_100%)] pointer-events-none"></div>

  <!-- Main Content -->
  <div class="relative z-10 p-8">
    <!-- Title Section -->
    <div class="text-center mb-16" in:fly={{ y: -20, duration: 1000, delay: 200 }}>
      <h1 class="text-8xl font-bold text-red-400 tracking-widest uppercase relative {glitchActive ? 'animate-glitch' : ''} drop-shadow-[0_0_10px_rgba(255,0,0,0.5)]">
        {#each 'PARANOIA'.split('') as letter, i}
          <span class="inline-block animate-float" style="animation-delay: {i * 0.1}s; text-shadow: 0 0 5px #ff0000;">{letter}</span>
        {/each}
      </h1>
      <p class="text-2xl text-red-500/70 mt-4 italic tracking-wider">where secrets and anxiety collide</p>
    </div>
    {@render children()}
</div>
</div>

<style>
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  @keyframes glitch {
    0% { transform: translate(0); filter: brightness(1); }
    20% { transform: translate(-2px, 2px); filter: brightness(1.2); }
    40% { transform: translate(-2px, -2px); filter: brightness(0.8); }
    60% { transform: translate(2px, 2px); filter: brightness(1.2); }
    80% { transform: translate(2px, -2px); filter: brightness(0.8); }
    100% { transform: translate(0); filter: brightness(1); }
  }

  @keyframes scan {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100%); }
  }

</style>

