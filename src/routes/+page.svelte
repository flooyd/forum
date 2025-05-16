<script lang="ts">
	import { onMount } from 'svelte';
	import { createThreadModal, currentPage } from '../lib/stores';
	import { user, token, threads } from '../lib/stores';
	import CreateThread from '$lib/components/CreateThread.svelte';
	import { goto } from '$app/navigation';

	let ready = false;

	onMount(() => {
		ready = true;
		$currentPage = 'home';
		getThreads();
	});

	const getThreads = async () => {
		if (!$user) return;
		const response = await fetch('/threads', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${$token}`
			}
		});
		if (response.ok) {
			const data = await response.json();
			$threads = data.threads;
			$threads = $threads.map((thread) => {
				return {
					...thread,
					createdAt: new Date(thread.createdAt).toLocaleString(),
					updatedAt: new Date(thread.updatedAt).toLocaleString()
				};
			});
		} else {
			console.error('Failed to fetch threads');
		}
	};

	const handleClickThread = (thread: { id: any }) => {
		goto(`/comments/${thread.id}`);
	};
</script>

This is the forum site xD.
{#if $user && ready}
	<div class="toolbar">
		<button on:click={() => ($createThreadModal = true)}>Create Thread</button>
		<button>Filter</button>
	</div>
	{#if $createThreadModal}
		<CreateThread />
	{/if}
	{#if $threads.length > 0}
		<div class="threads">
			{#each $threads as thread}
				<button class="thread" on:click={() => handleClickThread(thread)}>
					<h2>{thread.title}</h2>
					<div class="info">
						<p class="creator"><img src={thread.avatar} alt="thread creator avatar"/> {thread.displayName}</p>
						<p>Replies: {thread.commentCount}</p>
					</div>
					<p>Created at: {thread.createdAt}</p>
					<p>Updated at: {thread.updatedAt}</p>
				</button>
			{/each}
		</div>
	{:else}
		<p>No threads available.</p>
	{/if}
{/if}

<style>
	.toolbar {
		border: 2px solid white;
		border-radius: 4px;
		padding: 8px;
		background: black;
		margin: 10px 0px;
	}
	.threads {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-bottom: 10px;
	}
	.thread {
		border: 2px solid white;
		border-radius: 4px;
		padding: 8px;
		background: black;
		color: white;
		display: block;
		width: 100%;
		text-align: left;
	}
	.thread:hover {
		background: #333;
	}
	.info {
		display: flex;
		justify-content: space-between;
	}

	button {
		background: white;
		color: black;
		border: 2px solid lightblue;
	}
</style>
