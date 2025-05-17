<script>
	import { user, token, currentPage } from '$lib/stores';
	import { onMount } from 'svelte';

	onMount(() => {
		$currentPage = 'profile';
	})
	
	const updateUser = async () => {
		const response = await fetch('/profile', {
			method:'PUT',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${$token}`
			},
			body: JSON.stringify({
				displayName: $user.displayName,
				avatar: $user.avatar
			})
		});

		if (response.ok) {
			const data = await response.json();
			$user.displayName = data.user.displayName;
			$user.avatar = data.user.avatar;
			localStorage.setItem('user', JSON.stringify($user));
		}
	}
</script>

<h2>Profile</h2>

<form on:submit|preventDefault={updateUser}>
	<label>
		Display Name:
		<input type="text" bind:value={$user.displayName} />
	</label>
	<label>
		Avatar URL:
		<input type="text" bind:value={$user.avatar} />
	</label>
	<button type="submit">Update Profile</button>
</form>
<img src="{$user.avatar}" alt="User Avatar" />

<style>
	h2 {
		color: yellow;
	}
</style>
