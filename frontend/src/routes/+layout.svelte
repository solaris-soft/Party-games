<script>
  let { children } = $props();
  import "./global.css";
</script>

<head>
    <title>Party App</title>
</head>

<main>
    {@render children()}
</main>