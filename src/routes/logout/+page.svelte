<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { user, token, isAdmin } from '../../lib/stores';

	onMount(() => {
		// Clear session and return to the login screen.
		user.set(null);
		token.set(null);
		isAdmin.set(false);
		localStorage.removeItem('user');
		localStorage.removeItem('token');
		goto('/login');
	});
</script>

<div class="logout">
	<div class="logout__mark">¶</div>
	<p class="muted">Signing you out…</p>
</div>

<style>
	.logout {
		min-height: 70vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 14px;
	}
	.logout__mark {
		width: 56px;
		height: 56px;
		border-radius: 14px;
		display: grid;
		place-items: center;
		background: var(--accent);
		color: var(--accent-ink);
		font-family: var(--font-head);
		font-size: 34px;
		animation: pulse 1.1s ease-in-out infinite;
	}
	@keyframes pulse {
		0%, 100% { transform: scale(1); opacity: 1; }
		50% { transform: scale(0.92); opacity: 0.6; }
	}
</style>
