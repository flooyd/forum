<script lang="ts">
	import { users, token } from '$lib/stores';
	import { onMount } from 'svelte';
	import Avatar from './Avatar.svelte';
	import Icon from './Icon.svelte';

	const fetchUsers = async () => {
		try {
			const response = await fetch('/users', {
				method: 'GET',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${$token}` }
			});
			if (response.ok) {
				const data = await response.json();
				$users = data.users;
			}
		} catch (error) {
			console.error('Error fetching users:', error);
		}
	};

	onMount(fetchUsers);
</script>

<div class="utable">
	<div class="utable__head">
		<span>Member</span><span>Email</span><span class="utable__c">Role</span><span class="utable__c">ID</span>
	</div>
	{#each $users as user}
		<div class="utable__row">
			<span class="utable__user">
				<Avatar user={{ displayName: user.displayName, avatar: user.avatar, id: user.id }} size={32} />
				<span><strong>{user.displayName}</strong></span>
			</span>
			<span class="utable__email">{user.email}</span>
			<span class="utable__c">
				{#if user.isAdmin}
					<span class="badge badge--admin"><Icon name="shield" size={11} stroke={2.2} />Admin</span>
				{:else}
					<span class="badge">Member</span>
				{/if}
			</span>
			<span class="utable__c"><span class="muted-mono">#{user.id}</span></span>
		</div>
	{/each}
</div>
