<script lang='ts'>
	import UsersTable from '$lib/components/UsersTable.svelte';
	import { user, token, currentPage } from '$lib/stores';
	import { onMount } from 'svelte';

	let isAdmin = false;
	let adminStats: any = null;

	onMount(async () => {
		$currentPage = 'profile';

		const response = await fetch('/admin?action=stats', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${$token}`
			}
		});

		if (response.ok) {
			const data = await response.json();
			console.log('Admin stats:', data);
			adminStats = data;
			isAdmin = true;
		} else {
			console.error('Failed to fetch admin stats');
		}

	});
	
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
	</label>	<button type="submit">Update Profile</button>
</form>
<img src="{$user.avatar || '/question-mark.webp'}" alt="User Avatar" />
{#if isAdmin}
	<h2>Admin Stats</h2>
	{#if adminStats}
		<p>Total Users: {adminStats.stats.totalUsers}</p>
		<p>Total Threads: {adminStats.stats.totalThreads}</p>
		<p>Total Comments: {adminStats.stats.totalComments}</p>
		<UsersTable />
	{/if}
{/if}

<style>
	h2 {
		color: yellow;
		margin: 10px 0px;
	}

	button {
		margin-top: 5px;
	}
</style>
