<script lang="ts">
    import type { Player } from '$lib/types/game';

    export let player: Player;
    export let isCurrentPlayer: boolean;
</script>

<div class="bg-gray-800 p-4 rounded-lg transition-all duration-300 {player.isEliminated ? 'opacity-50' : ''}">
    <div class="flex items-center justify-between mb-2">
        <h3 class="text-lg font-semibold">{player.name}</h3>
        <div class="flex gap-2">
            {#if player.ready}
                <span class="text-green-500" title="Ready">✓</span>
            {/if}
            {#if player.isEliminated}
                <span class="text-red-500" title="Eliminated">✕</span>
            {/if}
            {#if isCurrentPlayer}
                <span class="text-yellow-500" title="Current Turn">→</span>
            {/if}
        </div>
    </div>

    {#if player.powerCards.length > 0}
        <div class="mt-2">
            <p class="text-sm text-purple-400">Power Cards:</p>
            <div class="flex flex-wrap gap-1 mt-1">
                {#each player.powerCards as power}
                    <span class="text-xs bg-purple-900/50 px-2 py-1 rounded">{power}</span>
                {/each}
            </div>
        </div>
    {/if}

    {#if player.currentEffects.length > 0}
        <div class="mt-2">
            <p class="text-sm text-blue-400">Active Effects:</p>
            <div class="flex flex-wrap gap-1 mt-1">
                {#each player.currentEffects as effect}
                    <span class="text-xs bg-blue-900/50 px-2 py-1 rounded" title={effect.description}>
                        {effect.name}
                    </span>
                {/each}
            </div>
        </div>
    {/if}
</div> 