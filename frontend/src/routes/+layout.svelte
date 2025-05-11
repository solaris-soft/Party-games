<script>
	let { children } = $props();
	import './global.css';
</script>

<svelte:head>
	<title>Party App</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=IBM+Plex+Mono:wght@400;500&family=Libre+Baskerville:wght@400;700&family=Cormorant+Garamond:wght@400;500;600&family=Crimson+Text:wght@400;600&family=Special+Elite&family=Bangers&family=Creepster&family=Righteous&family=Rubik+Vinyl&family=Rubik+Glitch&display=swap"
		rel="stylesheet"
	/>
	<link href="https://fonts.cdnfonts.com/css/black-jack" rel="stylesheet" />
	<link href="https://fonts.cdnfonts.com/css/rusty-attack" rel="stylesheet" />
	<link href="https://fonts.cdnfonts.com/css/creepster" rel="stylesheet" />
</svelte:head>

<main>
	{@render children()}
</main>
