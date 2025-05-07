<script lang="ts">
    let { data } = $props();
</script>

<div class="max-w-4xl mx-auto bg-black/80 border-2 border-green-500/30 rounded-lg p-12 shadow-[0_0_20px_rgba(0,255,0,0.2)] backdrop-blur-sm relative overflow-hidden">
    <h1 class="text-5xl text-green-400 mb-8 uppercase tracking-widest">Paranoia</h1>
    
    {#if data.error}
        <p class="text-red-500">{data.error}</p>
    {:else if data.hello}
        <p class="text-green-400 text-xl">{data.hello}</p>
    {:else}
        <p class="text-yellow-500">Loading...</p>
    {/if}
</div>
