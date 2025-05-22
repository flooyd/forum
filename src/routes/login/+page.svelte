<script lang="ts">
	import { onMount } from 'svelte';
	import { currentPage, token, user } from '../../lib/stores';
	import { goto } from '$app/navigation';

	type LoginForm = {
		username: string;
		password: string;
	};

	type RegisterForm = {
		username: string;
		displayName: string;
		password: string;
		email: string;
	};

	let loginForm: LoginForm = {
		username: '',
		password: ''
	};

	let registerForm: RegisterForm = {
		username: '',
		displayName: '',
		password: '',
		email: ''
	};

	let success: string | null = null;
	let error: string | null = null;

	onMount(() => {
		$currentPage = 'login';
	});

	async function loginOrRegister(loginOrRegister: string) {
		try {
			success = null;
			error = null;
			const body = loginOrRegister === 'login' ? loginForm : registerForm;
			const response = await fetch('/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ ...body, loginOrRegister })
			});

			if (!response.ok) {
				throw new Error('Failed to register user');
			}

			const result = await response.json();
			if (result.success) {
				if (loginOrRegister === 'register') {
					success = 'You have successfully registered!';
				} else {
					$token = result.token;
					$user = result.user;
					localStorage.setItem('user', JSON.stringify(result.user));
					localStorage.setItem('token', result.token);
					goto('/');
				}
			} else {
				error = result.message;
			}
		} catch (err) {
			error = 'An error occurred. Please try again.';
		}
	}
</script>

<h2>Register User</h2>
<form class="registerForm" on:submit|preventDefault={() => loginOrRegister('register')}>
	<input type="text" bind:value={registerForm.username} placeholder="Username" required />
	<input type="text" bind:value={registerForm.displayName} placeholder="Display Name" required />
	<input type="email" bind:value={registerForm.email} placeholder="Email" required />
	<input type="password" bind:value={registerForm.password} placeholder="Password" required />
	<button type="submit">Register</button>
</form>
<h2 class="loginh2">Login User</h2>
<form on:submit|preventDefault={() => loginOrRegister('login')}>
	<input type="text" bind:value={loginForm.username} placeholder="Username" required />
	<input type="password" bind:value={loginForm.password} placeholder="Password" required />
	<button type="submit">Login</button>
</form>
{#if error}
	<p>{error}</p>
{/if}
{#if success}
	<p class="success">{success}</p>
{/if}

<style>
	h2 {
		margin: 10px 0px;
	}

	.registerForm {
		margin-bottom: 10px;
	}
</style>
