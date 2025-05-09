<script lang="ts">
    import { onMount } from 'svelte';
	import type { PageData } from './$types';

    let {data}: { data: PageData } = $props();

    let ws: WebSocket | null = null;
    let playerName = $state(data.playerName);
    let roomId = $state(data.roomId);

    onMount(() => {
        ws = new WebSocket(`ws://localhost:8080/ws/murder?roomId=${roomId}&playerName=${playerName}`);

        ws.onmessage = (event) => {
            console.log(event.data);
        };
        
        
    });
</script>

