<script lang="ts">
	import type { PageProps } from "./$types";

    let { data }: PageProps = $props();  
    let { playerName, id } = data;
</script>

<div>
    <h1>Odds On</h1>
    <p>Player Name: {playerName} {id}</p>
</div>
