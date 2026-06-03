<script lang="ts">
	import UsersTable from '$lib/components/UsersTable.svelte';
	import { user, token, currentPage, isAdmin } from '$lib/stores';
	import { onMount } from 'svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import Icon from '$lib/components/Icon.svelte';

	let adminStats: any = null;
	let saved = false;

	onMount(async () => {
		$currentPage = 'profile';
		const response = await fetch('/admin?action=stats', {
			method: 'GET',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${$token}` }
		});
		if (response.ok) {
			adminStats = await response.json();
		}
	});

	const updateUser = async () => {
		const response = await fetch('/profile', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${$token}` },
			body: JSON.stringify({ displayName: $user.displayName, avatar: $user.avatar })
		});
		if (response.ok) {
			const data = await response.json();
			$user.displayName = data.user.displayName;
			$user.avatar = data.user.avatar;
			localStorage.setItem('user', JSON.stringify($user));
			saved = true;
			setTimeout(() => (saved = false), 1800);
		}
	};
</script>

<div class="profile">
	<div class="profile__head">
		<Avatar user={$user} size={108} ring />
		<div class="profile__id">
			<h1 class="profile__name">{$user.displayName || 'Your name'}</h1>
			<div class="profile__handle">
				@{$user.username || 'you'}
				{#if $isAdmin}<span class="badge badge--admin"><Icon name="shield" size={12} stroke={2.2} />Admin</span>{/if}
			</div>
		</div>
	</div>

	<div class="profile__grid">
		<section class="panel">
			<div class="panel__head">
				<h2 class="panel__title">Edit profile</h2>
				<span class="panel__hint">Previews live above</span>
			</div>
			<form class="panel__body" on:submit|preventDefault={updateUser}>
				<label class="field field--block">
					<span class="field__label">Display name</span>
					<input type="text" bind:value={$user.displayName} />
				</label>
				<label class="field field--block">
					<span class="field__label">Avatar URL</span>
					<input type="text" bind:value={$user.avatar} placeholder="https://…  (leave blank for initials)" />
				</label>
				<div class="panel__actions">
					<button class="btn btn--primary" type="submit">
						{#if saved}<Icon name="check" size={17} stroke={2.1} />{/if}<span>{saved ? 'Saved' : 'Update profile'}</span>
					</button>
				</div>
			</form>
		</section>

		<section class="panel">
			<div class="panel__head"><h2 class="panel__title">Your avatar</h2></div>
			<div class="panel__body" style="align-items:center;gap:14px">
				<Avatar user={$user} size={132} />
				<p class="muted" style="text-align:center;font-size:0.86rem">
					This is how you appear across threads and replies.
				</p>
			</div>
		</section>
	</div>

	{#if $isAdmin && adminStats}
		<section class="admin">
			<div class="admin__head">
				<h2 class="panel__title">Admin</h2>
				<span class="badge badge--admin"><Icon name="shield" size={12} stroke={2.2} />Restricted</span>
			</div>

			<div class="admin__cards">
				<div class="astat">
					<div class="astat__n">{adminStats.stats.totalUsers.toLocaleString()}</div>
					<div class="astat__l">Total Users</div>
				</div>
				<div class="astat">
					<div class="astat__n">{adminStats.stats.totalThreads.toLocaleString()}</div>
					<div class="astat__l">Total Threads</div>
				</div>
				<div class="astat">
					<div class="astat__n">{adminStats.stats.totalComments.toLocaleString()}</div>
					<div class="astat__l">Total Comments</div>
				</div>
			</div>

			<div class="panel">
				<div class="panel__head"><h2 class="panel__title">Members</h2></div>
				<UsersTable />
			</div>
		</section>
	{/if}
</div>
