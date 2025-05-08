<script>
  import { goto } from '$app/navigation';
  
  function navigateToSetup() {
    goto('/murder/setup');
  }
</script>

<div class="min-h-screen bg-black relative overflow-hidden">
  <!-- Blood splatter overlay -->
  <div class="absolute inset-0 pointer-events-none">
    <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-red-900/10 rounded-full blur-3xl"></div>
    <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-900/10 rounded-full blur-3xl"></div>
    <div class="absolute top-1/2 left-1/2 w-96 h-96 bg-red-900/10 rounded-full blur-3xl"></div>
  </div>

  <!-- Main content -->
  <div class="relative z-10 px-4 py-8 max-w-4xl mx-auto">
    <!-- Title with glow effect -->
    <h1 class="text-7xl md:text-8xl font-['Creepster'] text-center text-red-600 mb-12 animate-pulse drop-shadow-[0_0_15px_rgba(255,0,0,0.5)]">
      MURDER
    </h1>

    <!-- Game description card -->
    <div class="bg-black/80 backdrop-blur-sm border-2 border-red-800 rounded-xl p-8 shadow-[0_0_30px_rgba(255,0,0,0.2)]">
      <h2 class="text-3xl md:text-4xl font-['Creepster'] text-center text-red-500 mb-8">
        The Game of Deception and Survival
      </h2>
      
      <div class="space-y-6">
        <h3 class="text-2xl font-['Creepster'] text-red-400 mb-4">
          How to Play:
        </h3>
        
        <ul class="space-y-4">
          <li class="flex items-start gap-3 text-red-300">
            <span class="text-2xl">🩸</span>
            <span>One player is secretly chosen as the murderer</span>
          </li>
          <li class="flex items-start gap-3 text-red-300">
            <span class="text-2xl">🩸</span>
            <span>Each round consists of two phases:</span>
          </li>
          <li class="flex items-start gap-3 text-red-400 ml-6">
            <span class="text-xl">⚰️</span>
            <span>Voting Phase: All players vote on who they suspect is the murderer</span>
          </li>
          <li class="flex items-start gap-3 text-red-400 ml-6">
            <span class="text-xl">🔪</span>
            <span>Murder Phase: The murderer secretly selects their next victim</span>
          </li>
          <li class="flex items-start gap-3 text-red-300">
            <span class="text-2xl">🩸</span>
            <span>If players vote incorrectly, they all drink and the accused player is eliminated</span>
          </li>
          <li class="flex items-start gap-3 text-red-300">
            <span class="text-2xl">🩸</span>
            <span>The murderer's victim must drink and is eliminated from the game</span>
          </li>
          <li class="flex items-start gap-3 text-red-300">
            <span class="text-2xl">🩸</span>
            <span>The murderer wins by eliminating all other players</span>
          </li>
          <li class="flex items-start gap-3 text-red-300">
            <span class="text-2xl">🩸</span>
            <span>The players win by correctly identifying and voting out the murderer</span>
          </li>
        </ul>
      </div>

      <!-- Start button with hover effects -->
      <button 
        on:click={navigateToSetup}
        class="mt-12 w-full md:w-auto md:px-12 py-4 text-2xl font-['Creepster'] text-white bg-red-800 hover:bg-red-700 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,0,0,0.5)] flex items-center justify-center gap-3 group"
      >
        Begin the Hunt
        <span class="group-hover:animate-bounce">🔪</span>
      </button>
    </div>
  </div>

  <!-- Floating blood drops -->
  <div class="absolute top-0 left-0 w-full h-full pointer-events-none">
    <div class="absolute top-1/4 left-1/4 animate-float-slow">🩸</div>
    <div class="absolute top-1/3 right-1/4 animate-float-slower">🩸</div>
    <div class="absolute bottom-1/4 left-1/3 animate-float">🩸</div>
  </div>
</div>

<style>
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-20px); }
  }
  @keyframes float-slow {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-15px); }
  }
  @keyframes float-slower {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
  .animate-float-slow {
    animation: float-slow 4s ease-in-out infinite;
  }
  .animate-float-slower {
    animation: float-slower 5s ease-in-out infinite;
  }
</style>
