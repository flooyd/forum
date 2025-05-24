<script lang="ts">
	import { onMount } from 'svelte';
	import { currentPage, user, token } from '../lib/stores';
	import { fade } from 'svelte/transition';

	let ready = false;

	onMount(() => {
		ready = true;
		$user = localStorage.getItem('user')
			? JSON.parse(localStorage.getItem('user') as string)
			: null;
		$token = localStorage.getItem('token');
		console.log($token);
	});

	$: if (ready) {
		$currentPage = 'home';
	}
</script>

{#if ready}
	<nav transition:fade>
		<h1><a class={$currentPage === 'home' ? 'currentPage' : ''} href="/">The Forum</a></h1>
		<div>
			{#if $user}
				<a class={$currentPage === 'profile' ? 'currentPage' : ''} href="/profile"
					>{$user.displayName}</a
				>
			{/if}
			{#if !$user}
				<a class={$currentPage === 'login' ? 'currentPage' : 'login'} href="/login">Login</a>
			{:else}
				<a class={$currentPage === 'logout' ? 'currentPage' : 'login'} href="/logout">Logout</a>
			{/if}
		</div>
	</nav>

	<main>
		<slot />
	</main>
{/if}

<style>
	h1 {
		margin: 0px;
	}
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: Arial, sans-serif;
		background-color: #f4f4f4;
		min-height: 100vh;
		padding: 0px 20px;
		box-sizing: border-box;
		background: black;
		color: white;
		font-size: 13px;
	}

	:global(nav) {
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 4px solid white;
		position: sticky;
		top: 0px;
		padding: 10px 0px;
		background: black;
	}

	:global(a) {
		text-decoration: none;
		color: white;
	}

	:global(a:hover) {
		text-decoration: underline;
		color: yellow;
	}

	:global(a.currentPage) {
		font-weight: bold;
		color: yellow;
		cursor: default;
	}

	:global(a.currentPage:hover) {
		text-decoration: none;
	}

	:global(h1) {
		color: white;
		font-size: 25px;
		margin-bottom: 10px;
	}

	:global(h1 a) {
		cursor: pointer;
	}

	:global(h2) {
		font-size: 16px;
		margin-bottom: 10px;
		font-weight: bold;
	}

	:global(h1, h2, h3, h4, h5, h6) {
		font-family: 'Times New Roman', Times, 'serif';
	}

	.login {
		margin-left: 10px;
	}

	:global(form) {
		border: 2px solid white;
		padding: 5px;
		border-radius: 4px;
		box-shadow: inset;
		max-width: calc(100vw - 40px);
		margin-bottom: 20px;
		background: #333;
		display: flex;
		gap: 5px;
		flex-direction: column;
	}

	:global(input) {
		display: block;
		padding: 5px;
		width: 100%;
		max-width: 250px;
		background: black;
		border: 2px solid white;
		border-radius: 4px;
		color: white;
	}

	:global(button) {
		padding: 5px;
		border-radius: 4px;
		background-color: white;
		color: black;
		border: 2px solid lightblue;
		cursor: pointer;
	}

	:global(button:hover) {
		background: #444;
		color: white;
	}

	:global(.error) {
		color: red;
	}

	:global(.success) {
		color: white;
	}
	:global(label) {
		color: white;
		font-weight: bold;
		margin-bottom: 5px;
	}

	:global(.creator) {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	:global(.creator img) {
		width: 42px;
		height: 42px;
		border-radius: 50%;
	}

	:global(.modalBackground) {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
	}

	:global(.modal) {
		background-color: black;
		padding: 20px;
		border-radius: 5px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        border: 2px solid white;
        width: calc(100vw - 40px);
        height: calc(100vh - 40px);
	}
</style>
