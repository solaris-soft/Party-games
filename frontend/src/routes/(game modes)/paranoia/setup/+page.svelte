<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';

	let name = $state('');
	let error = $state('');
	let glitchActive = $state(false);
	let returnTo = $state('');

	onMount(() => {
		// Get return URL if it exists
		const urlParams = new URLSearchParams(window.location.search);
		returnTo = urlParams.get('returnTo') || '';

		// Random glitch effect
		setInterval(() => {
			if (Math.random() > 0.95) {
				glitchActive = true;
				setTimeout(() => {
					glitchActive = false;
				}, 200);
			}
		}, 3000);
	});

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (!name.trim()) {
			error = 'Please enter your name';
			return;
		}

		if (returnTo) {
			// If we have a return URL, use it and append the name
			const separator = returnTo.includes('?') ? '&' : '?';
			goto(`${returnTo}${separator}name=${encodeURIComponent(name.trim())}`);
		} else {
			// Generate a unique room ID if no return URL
			const roomId = crypto.randomUUID();
			goto(`/paranoia/${roomId}?name=${encodeURIComponent(name.trim())}`);
		}
	}
</script>

<div class="container" in:fly={{ y: 20, duration: 1000, delay: 200 }}>
	<h1
		class="text-6xl font-bold text-red-400 tracking-widest uppercase relative {glitchActive
			? 'animate-glitch'
			: ''} drop-shadow-[0_0_10px_rgba(255,0,0,0.5)]"
	>
		Enter Your Identity
	</h1>
	<form onsubmit={handleSubmit} class="form">
		<div class="form-group">
			<label for="name" class="text-2xl text-red-500/70 tracking-wider"
				>What's your name, citizen?</label
			>
			<input
				type="text"
				id="name"
				bind:value={name}
				placeholder="Enter your name"
				class="input bg-black/50 border-red-500/50 text-red-400 placeholder-red-500/30"
			/>
			{#if error}
				<p class="error text-red-500">{error}</p>
			{/if}
		</div>
		<button
			type="submit"
			class="button bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400"
		>
			Initialize Identity
		</button>
	</form>
</div>

<style>
	.container {
		max-width: 600px;
		margin: 2rem auto;
		padding: 2rem;
		text-align: center;
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		margin-top: 3rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.input {
		padding: 1rem;
		font-size: 1.2rem;
		border: 2px solid;
		border-radius: 4px;
		transition: all 0.3s ease;
		font-family: 'VT323', monospace;
	}

	.input:focus {
		outline: none;
		border-color: #dc2626;
		box-shadow: 0 0 10px rgba(220, 38, 38, 0.3);
	}

	.button {
		padding: 1rem 2rem;
		font-size: 1.2rem;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.3s ease;
		font-family: 'VT323', monospace;
		text-transform: uppercase;
		letter-spacing: 2px;
	}

	.button:hover {
		transform: translateY(-2px);
		box-shadow: 0 0 15px rgba(220, 38, 38, 0.4);
	}

	.error {
		font-size: 1rem;
		margin: 0;
		text-align: left;
		font-family: 'VT323', monospace;
	}

	@keyframes glitch {
		0% {
			transform: translate(0);
			filter: brightness(1);
		}
		20% {
			transform: translate(-2px, 2px);
			filter: brightness(1.2);
		}
		40% {
			transform: translate(-2px, -2px);
			filter: brightness(0.8);
		}
		60% {
			transform: translate(2px, 2px);
			filter: brightness(1.2);
		}
		80% {
			transform: translate(2px, -2px);
			filter: brightness(0.8);
		}
		100% {
			transform: translate(0);
			filter: brightness(1);
		}
	}
</style>
