<script lang="ts">
  import { goto } from '$app/navigation';
  import { fly, fade, scale } from 'svelte/transition';
  import { onMount } from 'svelte';
  
  let showContent = false;
  let titleText = 'MURDER';
  let whisperText = '';
  const whispers = [
    'trust no one...',
    'someone is watching...',
    'who can you trust?',
    'the killer is among us...',
    'everyone is a suspect...'
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
  
  function navigateToSetup() {
    goto('/murder/setup');
  }
</script>

<div class="min-h-screen bg-black relative overflow-hidden">
  <!-- Psychological overlay -->
  <div class="absolute inset-0 pointer-events-none">
    <div class="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent"></div>
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.8)_100%)]"></div>
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
      <!-- Game description card -->
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
          The Game of Deception and Survival
        </h2>
        
        <div class="space-y-6">
          <h3 
            class="text-2xl font-['Special+Elite'] text-red-400 mb-4"
            in:fly={{ y: 20, duration: 800, delay: 800 }}
          >
            How to Play:
          </h3>
          
          <ul class="space-y-4 font-['Special+Elite']">
            {#each [
              { icon: '👁️', text: 'One player is secretly chosen as the murderer' },
              { icon: '⏳', text: 'Each round consists of two phases:' },
              { icon: '🗳️', text: 'Voting Phase: All players vote on who they suspect is the murderer', indent: true },
              { icon: '🔪', text: 'Murder Phase: The murderer secretly selects their next victim', indent: true },
              { icon: '💉', text: 'If players vote incorrectly, they all drink and the accused player is eliminated' },
              { icon: '💀', text: 'The murderer\'s victim must drink and is eliminated from the game' },
              { icon: '👑', text: 'The murderer wins by eliminating all other players' },
              { icon: '🎯', text: 'The players win by correctly identifying and voting out the murderer' }
            ] as rule, i}
              <li 
                class="flex items-start gap-3 text-red-300/90 {rule.indent ? 'ml-6' : ''} psychological-text"
                in:fly={{ y: 20, duration: 800, delay: 1000 + (i * 100) }}
              >
                <span class="text-2xl">{rule.icon}</span>
                <span>{rule.text}</span>
              </li>
            {/each}
          </ul>
        </div>

        <!-- Start button with psychological effect -->
        <button 
          on:click={navigateToSetup}
          class="mt-12 w-full md:w-auto md:px-12 py-4 text-2xl font-['Special+Elite'] text-white bg-red-900/80 hover:bg-red-800/90 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,0,0,0.3)] flex items-center justify-center gap-3 group psychological-button"
          in:fly={{ y: 20, duration: 800, delay: 2000 }}
        >
          Begin the Hunt
          <span class="group-hover:opacity-50 transition-opacity">🔪</span>
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  /* Psychological effects */
  .psychological-title {
    position: relative;
    animation: subtle-distort 8s infinite;
  }

  .psychological-card {
    position: relative;
    animation: subtle-pulse 4s infinite;
  }

  .psychological-text {
    position: relative;
    transition: all 0.3s ease;
  }

  .psychological-text:hover {
    text-shadow: 0 0 8px rgba(255, 0, 0, 0.3);
    transform: translateX(4px);
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

  @keyframes subtle-distort {
    0%, 100% { transform: skew(0deg); }
    25% { transform: skew(-0.5deg); }
    75% { transform: skew(0.5deg); }
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
</style>
