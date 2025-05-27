<script lang="ts">
	import { onMount } from 'svelte';
	import { createThreadModal, filterThreadsModal, currentPage } from '../lib/stores';
	import { user, token, threads, originalThreads, activeFilters } from '../lib/stores';
	import CreateThread from '$lib/components/CreateThread.svelte';
	import FilterThreadsModal from '$lib/components/FilterThreadsModal.svelte';
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
			$originalThreads = JSON.parse(JSON.stringify(data.threads)); // Deep copy to avoid reference issues
			console.log($threads);
		} else {
			console.error('Failed to fetch threads');
		}
	};
	const handleClickThread = (thread: { id: any }) => {
		goto(`/comments/${thread.id}`);
	};

	const deleteThread = async (threadId: string) => {
		// Show confirmation dialog
		const confirmed = confirm(
			'Are you sure you want to delete this thread? This action cannot be undone and will delete all comments in the thread.'
		);

		if (!confirmed) {
			return; // User cancelled, don't delete
		}

		const response = await fetch('/threads', {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${$token}`
			},
			body: JSON.stringify({ threadId })
		});
		if (response.ok) {
			// Remove the thread from both current and original thread stores
			$threads = $threads.filter((thread) => thread.id !== threadId);
			$originalThreads = JSON.parse(
				JSON.stringify($originalThreads.filter((thread) => thread.id !== threadId))
			);
		} else {
			console.error('Failed to delete thread');
			alert('Failed to delete thread. Please try again.');
		}
	};
</script>

{#if $user && ready}
	<div transition:fade>
		<div class="toolbarContainer">
			<div class="toolbar">
				<button on:click={() => ($createThreadModal = true)}>Create Thread</button>
				<button
					on:click={() => ($filterThreadsModal = true)}
					class:active={$activeFilters.length > 0}
				>
					Filter {$activeFilters.length > 0 ? `(${$activeFilters.length})` : ''}
				</button>
				{#if $activeFilters.length > 0}
					<button
						on:click={() => {
							$activeFilters = [];
							$threads = JSON.parse(JSON.stringify($originalThreads)); // Deep copy
						}}
						class="clear-filters"
					>
						Clear Filters
					</button>
				{/if}
			</div>
		</div>
		{#if $createThreadModal}
			<CreateThread />
		{/if}
		{#if $filterThreadsModal}
			<FilterThreadsModal />
		{/if}
		<div class="threads">
			{#each $threads as thread}
				<div class="thread-container">
					<a
						class="thread"
						on:click={() => handleClickThread(thread)}
						href={`/comments/${thread.id}`}
					>
						<h2>{thread.title}</h2>
						<div class="info">
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
									// Refresh thread data to get updated tags
									await getThreads();
								}}
								{tagsChanged}
							/>
							<button
								class="delete-thread-btn"
								on:click={() => deleteThread(thread.id)}
								title="Delete thread"
							>
								Delete Thread 🗑️
							</button>
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
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px;
		border-top: 1px solid #333;
	}
	.info {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.toolbar button.active {
		background: #4caf50;
		border-color: #4caf50;
	}

	.clear-filters {
		background: #f44336 !important;
		border-color: #f44336 !important;
	}

	.clear-filters:hover {
		background: #d32f2f !important;
	}
</style>
