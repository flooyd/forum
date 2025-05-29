<script lang="ts">
	import { users, token } from '$lib/stores';
	import { onMount } from 'svelte';

	const fetchUsers = async () => {
		try {
			const response = await fetch('/users', {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${$token}`
				}
			});
			if (response.ok) {
				const data = await response.json();
				$users = data.users;
				console.log('users');
			} else {
				console.error('Failed to fetch users');
			}
		} catch (error) {
			console.error('Error fetching users:', error);
		}
	};

	onMount(() => {
		fetchUsers();
	});
</script>

<table>
	<thead>
		<tr>
			<th>ID</th>
			<th>Avatar</th>
			<th>Display Name</th>
			<th>Email</th>
			<th>Admin</th>
		</tr>
	</thead>
	<tbody>
		{#each $users as user}
			<tr>
				<td>{user.id}</td>
				<td><img src={user.avatar} alt="User Avatar" width="42" height="42" /></td>

				<td>{user.displayName}</td>
				<td>{user.email}</td>
				<td>{user.isAdmin ? 'Yes' : 'No'}</td>
			</tr>
		{/each}
	</tbody>
</table>

<style>
    table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
    }

    th, td {
        border: 1px solid white;
        padding: 5px;
        text-align: left;
    }

    img {
        border-radius: 50%;
    }
</style>
