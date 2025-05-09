<script lang="ts">
  import Setup from './Setup.svelte';
  import Instructions from './Instructions.svelte';
  
  let currentStep: 'setup' | 'instructions' = $state('setup');
  let playerName = $state('');
  
  function handleSetupComplete(name: string) {
    playerName = name;
    currentStep = 'instructions';
  }
  
  function handleInstructionsComplete() {
    // TODO: Navigate to the game or next step
    console.log('Starting game for player:', playerName);
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