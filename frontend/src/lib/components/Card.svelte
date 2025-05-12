<script lang="ts">
    import type { Card } from '$lib/types/game';

    export let card: Card | null = null;
    export let interactive = false;
    export let onClick: (() => void) | undefined = undefined;

    const cardColors = {
        king: 'bg-yellow-600',
        power: 'bg-purple-600',
        challenge: 'bg-red-600',
        minigame: 'bg-blue-600'
    };

    const cardIcons = {
        king: '👑',
        power: '⚡',
        challenge: '🎯',
        minigame: '🎮'
    };

    $: cardType = card?.type || 'power';
    $: cardColor = cardColors[cardType];
    $: cardIcon = cardIcons[cardType];
</script>

{#if card}
    <button
        class="relative w-64 h-96 perspective-1000"
        class:interactive={interactive}
        class:cursor-pointer={interactive}
        onclick={() => interactive && onClick?.()}
    >
        <div class="relative w-full h-full transition-transform duration-500 transform-style-3d hover:rotate-y-180">
            <!-- Front of card -->
            <div class="absolute inset-0 backface-hidden rounded-lg shadow-lg {cardColor} p-6 flex flex-col justify-between">
                <div class="text-4xl text-center">{cardIcon}</div>
                <div class="text-center">
                    <h3 class="text-xl font-bold mb-2">{cardType.toUpperCase()}</h3>
                    <p class="text-lg">{card.content}</p>
                </div>
                {#if card.effect}
                    <div class="text-center">
                        <p class="text-sm opacity-75">{card.effect.description}</p>
                    </div>
                {/if}
            </div>

            <!-- Back of card -->
            <div class="absolute inset-0 backface-hidden rounded-lg shadow-lg bg-gradient-to-br from-gray-800 to-gray-900 p-6 flex items-center justify-center rotate-y-180">
                <div class="text-4xl">🎴</div>
            </div>
        </div>
    </button>
{:else}
    <div class="w-64 h-96 rounded-lg shadow-lg bg-gray-800 flex items-center justify-center">
        <p class="text-gray-400">No card</p>
    </div>
{/if}

<style>
    .perspective-1000 {
        perspective: 1000px;
    }

    .transform-style-3d {
        transform-style: preserve-3d;
    }

    .backface-hidden {
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
    }

    .rotate-y-180 {
        transform: rotateY(180deg);
    }

    .interactive {
        transition: transform 0.2s;
    }

    .interactive:hover {
        transform: scale(1.05);
    }

    /* Ensure the card stays within its container */
    button {
        transform-style: preserve-3d;
        transform: translateZ(0);
    }
</style> 