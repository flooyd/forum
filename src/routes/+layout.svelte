<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { currentPage, user, token, isAdmin } from '../lib/stores';
	import { fade } from 'svelte/transition';
	import Icon from '$lib/components/Icon.svelte';
	import Avatar from '$lib/components/Avatar.svelte';

	let ready = false;
	let theme: 'light' | 'dark' = 'light';
	let menuOpen = false;

	onMount(async () => {
		ready = true;
		$user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') as string) : null;
		$token = localStorage.getItem('token');

		// restore theme preference
		theme = (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
		document.documentElement.setAttribute('data-theme', theme);
		document.documentElement.setAttribute('data-motion', 'on');

		const response = await fetch('/admin?action=stats', {
			method: 'GET',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${$token}` }
		});
		if (response.ok) $isAdmin = true;
	});

	const toggleTheme = () => {
		theme = theme === 'light' ? 'dark' : 'light';
		document.documentElement.setAttribute('data-theme', theme);
		localStorage.setItem('theme', theme);
	};

	const closeMenu = () => (menuOpen = false);

	$: path = $page.url.pathname;
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400..600;1,6..72,400..600&family=Hanken+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<svelte:window on:click={() => menuOpen && closeMenu()} />

{#if ready}
	<header class="topbar" transition:fade>
		<div class="topbar__inner">
			<a class="brand" href="/">
				<span class="brand__mark">¶</span>
				<span class="brand__name">The Forum</span>
			</a>

			<span class="toolbar-spacer"></span>

			<div class="topbar__right">
				<button class="themetoggle" on:click={toggleTheme} title="Toggle theme" type="button">
					<Icon name={theme === 'light' ? 'moon' : 'sun'} size={19} stroke={1.9} />
				</button>

				{#if $user}
					<div class="usermenu" on:click|stopPropagation>
						<button
							class="avatar-btn"
							class:is-open={menuOpen}
							on:click={() => (menuOpen = !menuOpen)}
							title="Account"
							type="button"
						>
							<Avatar user={$user} size={34} ring />
						</button>
						{#if menuOpen}
							<div class="menu">
								<div class="menu__head">
									<Avatar user={$user} size={38} />
									<div class="menu__id">
										<strong>{$user.displayName}</strong>
										<em>@{$user.username || 'you'}</em>
									</div>
								</div>
								<a class="menu__item" href="/profile" on:click={closeMenu}>
									<Icon name="user" size={16} stroke={1.9} /> Your profile
								</a>
								<div class="menu__sep"></div>
								<a class="menu__item menu__item--danger" href="/logout" on:click={closeMenu}>
									<Icon name="logout" size={16} stroke={1.9} /> Log out
								</a>
							</div>
						{/if}
					</div>
				{:else}
					<a class="btn btn--primary" href="/login">Sign in</a>
				{/if}
			</div>
		</div>
	</header>

	<main>
		<slot />
	</main>
{/if}

<style>
	main {
		display: block;
	}
	.usermenu {
		position: relative;
	}
</style>
