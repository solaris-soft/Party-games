<script lang="ts">
    export let drinks: number;
    export let isActive: boolean;
</script>

<div class="relative w-32 h-32">
    <!-- Cup -->
    <div class="absolute bottom-0 w-full h-full bg-gradient-to-b from-gray-700 to-gray-900 rounded-b-full border-4 border-gray-600 overflow-hidden">
        <!-- Liquid -->
        <div
            class="absolute bottom-0 w-full bg-gradient-to-b from-red-600 to-red-800 transition-all duration-500"
            style="height: {Math.min(drinks * 10, 100)}%"
        >
            <!-- Bubbles -->
            {#each Array(Math.floor(drinks)) as _, i}
                <div
                    class="absolute w-2 h-2 bg-white/30 rounded-full animate-bubble"
                    style="
                        left: {Math.random() * 80 + 10}%;
                        bottom: {Math.random() * 80 + 10}%;
                        animation-delay: {Math.random() * 2}s;
                    "
                ></div>
            {/each}
        </div>
    </div>

    <!-- Glow effect when active -->
    {#if isActive}
        <div class="absolute inset-0 animate-pulse">
            <div class="absolute inset-0 bg-red-500/20 rounded-full blur-xl"></div>
        </div>
    {/if}
</div>

<style>
    @keyframes bubble {
        0% {
            transform: translateY(0) scale(1);
            opacity: 0.3;
        }
        50% {
            transform: translateY(-20px) scale(1.2);
            opacity: 0.6;
        }
        100% {
            transform: translateY(-40px) scale(0);
            opacity: 0;
        }
    }

    .animate-bubble {
        animation: bubble 2s infinite;
    }
</style> 