<script lang="ts">
	import { onMount } from 'svelte';
	import { createThreadModal, currentPage } from '../lib/stores';
	import { user, token, threads } from '../lib/stores';
	import CreateThread from '$lib/components/CreateThread.svelte';
	import TagManager from '$lib/components/TagManager.svelte';
	import { goto } from '$app/navigation';
	import { fade } from 'svelte/transition';
	import TagDisplay from '$lib/components/TagDisplay.svelte';

	let ready = false;
	let tagsChanged = false;

	onMount(async () => {
		$currentPage = 'home';
		await getThreads();
		ready = true;
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
			console.log($threads);
		} else {
			console.error('Failed to fetch threads');
		}
	};

	const handleClickThread = (thread: { id: any }) => {
		goto(`/comments/${thread.id}`);
	};
</script>

{#if $user && ready}
	<div transition:fade>
		<div class="toolbarContainer">
			<div class="toolbar">
				<button on:click={() => ($createThreadModal = true)}>Create Thread</button>
				<button>Filter</button>
			</div>
		</div>
		{#if $createThreadModal}
			<CreateThread />
		{/if}
			<div class="threads">
				{#each $threads as thread}
					<div class="thread-container">
						<a class="thread" on:click={() => handleClickThread(thread)} href={`/comments/${thread.id}`}>
							<h2>{thread.title}</h2>							<div class="info">
								<p class="creator">
									<img src={thread.avatar || '/question-mark.webp'} alt="thread creator avatar" />
									{thread.displayName}
								</p>
								<p>Replies: {thread.commentCount}</p>
							</div>
							<p>Created at: {new Date(thread.createdAt).toLocaleString()}</p>
							<p>Updated at: {new Date(thread.updatedAt).toLocaleString()}</p>
						</a>
						{#if $user && thread.userId === $user.id}
							<div class="tag-manager-container">
								<TagManager
									threadId={thread.id}
									existingTags={thread.tags || []}
									onTagsChanged={async () => {
										tagsChanged = true;
									}}
									tagsChanged={tagsChanged}
								/>
							</div>
						{:else}
							<div class="tag-manager-container">
								<TagDisplay tags={thread.tags || []} maxDisplay={3} />
							</div>
						{/if}
					</div>
				{/each}
			</div>
	</div>
{/if}

<style>
	.toolbarContainer {
		position: sticky;
		top: 61.5px;
		padding: 10px 0px;
		background: black;
	}
	.toolbar {
		border: 2px solid white;
		border-radius: 4px;
		padding: 8px;
		background: black;
	}
	.threads {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-bottom: 10px;
	}
	.thread-container {
		border: 2px solid white;
		border-radius: 4px;
		background: black;
	}
	.thread {
		border: none;
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
	.tag-manager-container {
		padding: 8px;
		border-top: 1px solid #333;
	}
	.info {
		display: flex;
		justify-content: space-between;
	}
</style>
