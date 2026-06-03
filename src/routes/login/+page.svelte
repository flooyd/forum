<script lang="ts">
	import { onMount } from 'svelte';
	import { currentPage, token, user } from '../../lib/stores';
	import { goto } from '$app/navigation';
	import Icon from '$lib/components/Icon.svelte';

	type LoginForm = { username: string; password: string };
	type RegisterForm = { username: string; displayName: string; password: string; email: string };

	let mode: 'login' | 'register' = 'login';
	let loginForm: LoginForm = { username: '', password: '' };
	let registerForm: RegisterForm = { username: '', displayName: '', password: '', email: '' };

	let success: string | null = null;
	let error: string | null = null;

	onMount(() => {
		$currentPage = 'login';
	});

	async function loginOrRegister(which: 'login' | 'register') {
		try {
			success = null;
			error = null;
			const body = which === 'login' ? loginForm : registerForm;
			const response = await fetch('/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...body, loginOrRegister: which })
			});
			if (!response.ok) throw new Error('Failed to register user');

			const result = await response.json();
			if (result.success) {
				if (which === 'register') {
					success = 'Account created — you can sign in now.';
					mode = 'login';
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

<div class="auth">
	<div class="auth__brand">
		<a class="brand brand--lg" href="/">
			<span class="brand__mark">¶</span>
			<span class="brand__name">The Forum</span>
		</a>
		<h1 class="auth__headline">A quieter place to <em>think out loud</em>, together.</h1>
		<p class="auth__lede">
			Long-form discussion for people who still like to read. No infinite scroll,
			no outrage machine — just threads, replies, and the occasional good argument.
		</p>
	</div>

	<div class="auth__panel">
		<div class="auth__card">
			<div class="auth__tabs">
				<button class="auth__tab" class:is-on={mode === 'login'} on:click={() => (mode = 'login')} type="button">Sign in</button>
				<button class="auth__tab" class:is-on={mode === 'register'} on:click={() => (mode = 'register')} type="button">Create account</button>
				<span class="auth__tab-ind" style="transform:translateX({mode === 'register' ? '100%' : '0'})"></span>
			</div>

			{#if mode === 'login'}
				<form class="auth__form" on:submit|preventDefault={() => loginOrRegister('login')}>
					<label class="field">
						<span class="field__label">Username</span>
						<span class="field__wrap"><Icon name="user" size={16} stroke={1.9} /><input type="text" bind:value={loginForm.username} placeholder="elised" required /></span>
					</label>
					<label class="field">
						<span class="field__label">Password</span>
						<span class="field__wrap"><Icon name="shield" size={16} stroke={1.9} /><input type="password" bind:value={loginForm.password} placeholder="••••••••" required /></span>
					</label>
					<button class="btn btn--primary btn--lg btn--full" type="submit"><span>Sign in</span><Icon name="arrow" size={17} stroke={2.1} /></button>
				</form>
			{:else}
				<form class="auth__form" on:submit|preventDefault={() => loginOrRegister('register')}>
					<label class="field">
						<span class="field__label">Username</span>
						<span class="field__wrap"><Icon name="user" size={16} stroke={1.9} /><input type="text" bind:value={registerForm.username} placeholder="elised" required /></span>
					</label>
					<label class="field">
						<span class="field__label">Display name</span>
						<span class="field__wrap"><Icon name="user" size={16} stroke={1.9} /><input type="text" bind:value={registerForm.displayName} placeholder="Elise Danforth" required /></span>
					</label>
					<label class="field">
						<span class="field__label">Email</span>
						<span class="field__wrap"><Icon name="bell" size={16} stroke={1.9} /><input type="email" bind:value={registerForm.email} placeholder="you@forum.dev" required /></span>
					</label>
					<label class="field">
						<span class="field__label">Password</span>
						<span class="field__wrap"><Icon name="shield" size={16} stroke={1.9} /><input type="password" bind:value={registerForm.password} placeholder="••••••••" required /></span>
					</label>
					<button class="btn btn--primary btn--lg btn--full" type="submit"><span>Create account</span><Icon name="arrow" size={17} stroke={2.1} /></button>
				</form>
			{/if}

			{#if error}<p class="error" style="margin-top:14px">{error}</p>{/if}
			{#if success}<p class="success" style="margin-top:14px">{success}</p>{/if}
		</div>
		<p class="auth__fine">By continuing you agree to be thoughtful. That's the whole policy.</p>
	</div>
</div>
