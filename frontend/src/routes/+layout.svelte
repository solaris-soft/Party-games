<script>
  let { children } = $props();
  import "./global.css";
</script>

<svelte:head>
    <title>Party App</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
    <link href="https://fonts.googleapis.com/css2?family=VT323&display=swap" rel="stylesheet">
</svelte:head>

<main>
    {@render children()}
</main>