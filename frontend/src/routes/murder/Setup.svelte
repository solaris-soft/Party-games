<script lang="ts">
  import { fly, fade, scale } from 'svelte/transition';
  import { onMount } from 'svelte';
  
  const { onNext } = $props();
  
  let showContent = $state(false);
  let playerName = $state('');
  let whisperText = $state('');
  const whispers = [
    'what is your name, stranger?',
    'who dares to play?',
    'enter if you dare...',
    'the game awaits...',
    'your fate begins here...'
  ];
  let whisperInterval: ReturnType<typeof setInterval>;
  
  onMount(() => {
    showContent = true;
    
    // Create subtle whisper effect
    let whisperIndex = 0;
    whisperInterval = setInterval(() => {
      whisperText = whispers[whisperIndex];
      whisperIndex = (whisperIndex + 1) % whispers.length;
    }, 3000);

    return () => {
      clearInterval(whisperInterval);
    };
  });

  function handleSubmit(e: Event) {
    e.preventDefault();
    if (playerName.trim()) {
      onNext(playerName.trim());
    }
  }
</script>

{#if showContent}
  <div 
    class="bg-black/90 backdrop-blur-sm border border-red-900/50 rounded-xl p-8 shadow-[0_0_30px_rgba(255,0,0,0.1)] psychological-card"
    in:scale={{ duration: 800, delay: 400 }}
  >
    <!-- Whisper text -->
    <div class="text-center mb-8">
      <p class="text-red-400/70 text-lg font-['Special+Elite'] italic psychological-whisper" transition:fade>
        {whisperText}
      </p>
    </div>

    <h2 
      class="text-3xl md:text-4xl font-['Creepster'] text-center text-red-500 mb-8"
      in:fly={{ y: 20, duration: 800, delay: 600 }}
    >
      Enter Your Name
    </h2>

    <form 
      onsubmit={handleSubmit}
      class="space-y-6"
      in:fly={{ y: 20, duration: 800, delay: 800 }}
    >
      <div class="relative">
        <input
          type="text"
          bind:value={playerName}
          placeholder="Your name..."
          class="w-full bg-black/50 border border-red-900/50 rounded-lg px-4 py-3 text-red-300 font-['Special+Elite'] placeholder-red-900/50 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 transition-all duration-300"
          required
        />
        <div class="absolute inset-0 pointer-events-none rounded-lg psychological-input-glow"></div>
      </div>

      <button 
        type="submit"
        class="w-full md:w-auto md:px-12 py-4 text-2xl font-['Special+Elite'] text-white bg-red-900/80 hover:bg-red-800/90 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,0,0,0.3)] flex items-center justify-center gap-3 group psychological-button"
      >
        Join the Game
        <span class="group-hover:opacity-50 transition-opacity">🎭</span>
      </button>
    </form>
  </div>
{/if}

<style>
  .psychological-card {
    position: relative;
    animation: subtle-pulse 4s infinite;
  }

  .psychological-whisper {
    animation: fade-in-out 3s infinite;
  }

  .psychological-button {
    position: relative;
    overflow: hidden;
  }

  .psychological-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 0, 0, 0.1),
      transparent
    );
    animation: psychological-scan 3s linear infinite;
  }

  .psychological-input-glow {
    box-shadow: 0 0 15px rgba(255, 0, 0, 0.1);
    animation: input-pulse 2s infinite;
  }

  @keyframes subtle-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.95; }
  }

  @keyframes fade-in-out {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 0.7; }
  }

  @keyframes psychological-scan {
    0% { left: -100%; }
    100% { left: 100%; }
  }

  @keyframes input-pulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }
</style>
