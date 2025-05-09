<script lang="ts">
  import Setup from './Setup.svelte';
  import Instructions from './Instructions.svelte';
  
  let currentStep: 'setup' | 'instructions' = $state('setup');
  let playerName = $state('');
  let returnTo = $state('');
  
  $effect(() => {
    // Get return URL if it exists
    const urlParams = new URLSearchParams(window.location.search);
    returnTo = urlParams.get('returnTo') || '';
  });
  
  function handleSetupComplete(name: string) {
    playerName = name;
    if (returnTo) {
      // If we have a return URL, use it and append the name
      const separator = returnTo.includes('?') ? '&' : '?';
      window.location.href = `${returnTo}${separator}playerName=${encodeURIComponent(name)}`;
    } else {
      currentStep = 'instructions';
    }
  }
  
  function handleInstructionsComplete() {
    // Generate a unique room ID if no return URL
    const roomId = crypto.randomUUID();
    window.location.href = `/odds-on/${roomId}?playerName=${encodeURIComponent(playerName)}`;
  }
</script>

<div class="min-h-screen bg-black flex items-center justify-center p-4">
  {#if currentStep === 'setup'}
    <Setup onNext={handleSetupComplete} />
  {:else}
    <Instructions onNext={handleInstructionsComplete} playerName={playerName} />
  {/if}
</div>

<style>
  :global(body) {
    background-color: black;
    color: white;
  }
</style>