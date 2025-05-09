<script lang="ts">
  import { fly, fade, scale } from 'svelte/transition';
  import { onMount } from 'svelte';
  
  const { onNext } = $props();
  
  let showContent = $state(false);
  let playerName = $state('');
  let riddleText = $state('');
  const riddles = [
    'what is your name, challenger?',
    'who dares to play the game?',
    'enter your name if you dare...',
    'the riddles await...',
    'your fate begins with a name...'
  ];
  let riddleInterval: ReturnType<typeof setInterval>;
  
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

  function handleSubmit(e: Event) {
    e.preventDefault();
    if (playerName.trim()) {
      onNext(playerName.trim());
    }
  }
</script>

{#if showContent}
  <div 
    class="bg-black/90 backdrop-blur-sm border-2 border-green-900/50 rounded-xl p-8 shadow-[0_0_30px_rgba(0,255,0,0.1)] riddler-card relative overflow-hidden"
    in:scale={{ duration: 800, delay: 400 }}
  >
    <!-- Casino-style corner decorations -->
    <div class="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-green-500/30"></div>
    <div class="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-green-500/30"></div>
    <div class="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-green-500/30"></div>
    <div class="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-green-500/30"></div>

    <!-- Card suit decorations -->
    <div class="absolute top-4 left-4 text-green-500/20 text-4xl rotate-12">♠</div>
    <div class="absolute top-4 right-4 text-green-500/20 text-4xl -rotate-12">♥</div>
    <div class="absolute bottom-4 left-4 text-green-500/20 text-4xl -rotate-12">♣</div>
    <div class="absolute bottom-4 right-4 text-green-500/20 text-4xl rotate-12">♦</div>

    <!-- Riddle text -->
    <div class="text-center mb-8 relative">
      <div class="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/5 to-transparent animate-shimmer"></div>
      <p class="text-green-400/70 text-lg font-['Rusty+Attack'] italic riddler-text relative z-10" transition:fade>
        {riddleText}
      </p>
    </div>

    <h2 
      class="text-3xl md:text-4xl font-['Jester'] text-center text-green-500 mb-8 relative"
      in:fly={{ y: 20, duration: 800, delay: 600 }}
    >
      <span class="relative inline-block">
        Enter Your Name
        <div class="absolute -inset-1 bg-green-500/10 blur-sm"></div>
      </span>
    </h2>

    <form 
      onsubmit={handleSubmit}
      class="space-y-6 relative z-10"
      in:fly={{ y: 20, duration: 800, delay: 800 }}
    >
      <div class="relative">
        <div class="absolute -inset-0.5 bg-gradient-to-r from-green-500/50 to-green-700/50 rounded-lg blur opacity-30"></div>
        <input
          type="text"
          bind:value={playerName}
          placeholder="Your name..."
          class="relative w-full bg-black/80 border-2 border-green-900/50 rounded-lg px-4 py-3 text-green-300 font-['Black+Jack'] placeholder-green-900/50 focus:outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700 transition-all duration-300"
          required
        />
        <div class="absolute inset-0 pointer-events-none rounded-lg riddler-input-glow"></div>
      </div>

      <button 
        type="submit"
        class="relative w-full md:w-auto md:px-12 py-4 text-2xl font-['Black+Jack'] text-white bg-gradient-to-r from-green-900/90 to-green-800/90 hover:from-green-800/90 hover:to-green-700/90 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,0,0.3)] flex items-center justify-center gap-3 group riddler-button overflow-hidden"
      >
        <div class="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/20 to-transparent animate-shimmer"></div>
        <span class="relative z-10">Join the Game</span>
        <span class="relative z-10 group-hover:opacity-50 transition-opacity">🎲</span>
      </button>
    </form>
  </div>
{/if}

<style>
  .riddler-card {
    position: relative;
    animation: subtle-pulse 4s infinite;
  }

  .riddler-text {
    animation: fade-in-out 3s infinite;
  }

  .riddler-button {
    position: relative;
    overflow: hidden;
  }

  .riddler-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(0, 255, 0, 0.1),
      transparent
    );
    animation: riddler-scan 3s linear infinite;
  }

  .riddler-input-glow {
    box-shadow: 0 0 15px rgba(0, 255, 0, 0.1);
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

  @keyframes riddler-scan {
    0% { left: -100%; }
    100% { left: 100%; }
  }

  @keyframes input-pulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }

  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }

  .animate-shimmer {
    animation: shimmer 2s infinite;
  }
</style> 