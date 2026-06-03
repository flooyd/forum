<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { beforeNavigate } from '$app/navigation';
	import { createThreadModal, filterThreadsModal, currentPage } from '../lib/stores';
	import { user, token, threads, originalThreads, activeFilters } from '../lib/stores';
	import CreateThread from '$lib/components/CreateThread.svelte';
	import FilterThreadsModal from '$lib/components/FilterThreadsModal.svelte';
	import TagManager from '$lib/components/TagManager.svelte';
	import TagDisplay from '$lib/components/TagDisplay.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import Tag from '$lib/components/Tag.svelte';
	import { rel } from '$lib/util';
	import { goto } from '$app/navigation';
	import { fade } from 'svelte/transition';

	let ready = false;
	let tagsChanged = false;
	let editingId: number | string | null = null;
	let editTitle = '';

	const SCROLL_KEY = 'threadsScrollY';

	// Remember where the user was scrolled to before navigating away (e.g. into a thread).
	beforeNavigate(() => {
		sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
	});

	onMount(async () => {
		$currentPage = 'home';
		await getThreads();
		ready = true;

		// Restore the saved scroll position once the thread rows have rendered.
		const saved = sessionStorage.getItem(SCROLL_KEY);
		if (saved !== null) {
			await tick();
			requestAnimationFrame(() => window.scrollTo(0, Number(saved)));
		}
	});

	const getThreads = async () => {
		if (!$user) return;
		const response = await fetch('/threads', {
			method: 'GET',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${$token}` }
		});
		if (response.ok) {
			const data = await response.json();
			$threads = data.threads;
			$originalThreads = JSON.parse(JSON.stringify(data.threads));
		} else {
			console.error('Failed to fetch threads');
		}
	};

	const handleClickThread = (thread: { id: any }) => {
		goto(`/comments/${thread.id}`);
	};

	const deleteThread = async (threadId: string) => {
		const confirmed = confirm(
			'Are you sure you want to delete this thread? This action cannot be undone and will delete all comments in the thread.'
		);
		if (!confirmed) return;

		const response = await fetch('/threads', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${$token}` },
			body: JSON.stringify({ threadId })
		});
		if (response.ok) {
			$threads = $threads.filter((thread) => thread.id !== threadId);
			$originalThreads = JSON.parse(
				JSON.stringify($originalThreads.filter((thread) => thread.id !== threadId))
			);
		} else {
			alert('Failed to delete thread. Please try again.');
		}
	};

	const startEdit = (thread: { id: number | string; title: string }) => {
		editingId = thread.id;
		editTitle = thread.title;
	};

	const cancelEdit = () => {
		editingId = null;
		editTitle = '';
	};

	const saveEdit = async (threadId: number | string) => {
		const title = editTitle.trim();
		if (!title) return;

		const response = await fetch('/threads', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${$token}` },
			body: JSON.stringify({ threadId, title })
		});
		if (response.ok) {
			const data = await response.json();
			const updatedAt = data.thread?.updatedAt;
			const apply = (list: any[]) =>
				list.map((t) =>
					t.id === threadId ? { ...t, title, updatedAt: updatedAt ?? t.updatedAt } : t
				);
			$threads = apply($threads);
			$originalThreads = apply($originalThreads);
			cancelEdit();
		} else {
			alert('Failed to update thread. Please try again.');
		}
	};

	const clearFilters = () => {
		$activeFilters = [];
		$threads = JSON.parse(JSON.stringify($originalThreads));
	};
</script>

{#if $user && ready}
	<div class="board" transition:fade>
		<div class="board__toolbar">
			<button class="btn btn--primary" on:click={() => ($createThreadModal = true)} type="button">
				<Icon name="plus" size={16} stroke={2.1} /><span>Create Thread</span>
			</button>
			<button
				class="ghost-pill"
				class:ghost-pill--clear={$activeFilters.length > 0}
				on:click={() => ($filterThreadsModal = true)}
				type="button"
			>
				<Icon name="filter" size={15} stroke={2} /> Filter{$activeFilters.length > 0 ? ` (${$activeFilters.length})` : ''}
			</button>
			{#if $activeFilters.length > 0}
				<button class="ghost-pill ghost-pill--clear" on:click={clearFilters} type="button">
					<Icon name="x" size={14} stroke={2.2} /> Clear Filters
				</button>
			{/if}
		</div>

		{#if $createThreadModal}<CreateThread />{/if}
		{#if $filterThreadsModal}<FilterThreadsModal />{/if}

		{#if $threads.length === 0}
			<div class="empty">
				<div class="empty__art"><Icon name="chat" size={30} stroke={1.6} /></div>
				<div class="empty__title">No threads yet</div>
				<div class="empty__sub">
					{$activeFilters.length ? 'No threads match the selected tags.' : 'Start the first discussion.'}
				</div>
				<button class="btn btn--primary" on:click={() => ($createThreadModal = true)} type="button">
					<Icon name="plus" size={16} stroke={2.1} /><span>Create Thread</span>
				</button>
			</div>
		{:else}
			<div class="rows">
				{#each $threads as thread, i (thread.id)}
					<article class="row" style="animation-delay:{Math.min(i, 12) * 45}ms">
						<div class="row__accent"></div>
						{#if editingId === thread.id}
							<div class="row__main">
								{#if thread.tags?.length}
									<div class="row__top"><div class="row__tags">{#each thread.tags as t}<Tag tag={t} />{/each}</div></div>
								{/if}
								<form
									class="title-edit"
									on:submit|preventDefault={() => saveEdit(thread.id)}
								>
									<!-- svelte-ignore a11y-autofocus -->
									<input
										class="field__big"
										type="text"
										bind:value={editTitle}
										on:keydown={(e) => e.key === 'Escape' && cancelEdit()}
										autofocus
										required
									/>
									<div class="title-edit__actions">
										<button class="btn btn--primary btn--sm" type="submit" disabled={!editTitle.trim()}>
											<Icon name="check" size={14} stroke={2.1} /> Save
										</button>
										<button class="btn btn--ghost btn--sm" type="button" on:click={cancelEdit}>Cancel</button>
									</div>
								</form>
								<div class="row__meta">
									<span class="byline">
										<Avatar user={{ displayName: thread.displayName, avatar: thread.avatar, id: thread.userId }} size={22} />
										<span class="byline__name">{thread.displayName}</span>
									</span>
									<span class="dot-sep">·</span>
									<span class="muted-mono">Created {rel(thread.createdAt)}</span>
									<span class="dot-sep">·</span>
									<span class="muted-mono">Updated {rel(thread.updatedAt)}</span>
								</div>
							</div>
						{:else}
						<a
							class="row__main"
							href={`/comments/${thread.id}`}
							on:click|preventDefault={() => handleClickThread(thread)}
						>
							{#if thread.tags?.length}
								<div class="row__top"><div class="row__tags">{#each thread.tags as t}<Tag tag={t} />{/each}</div></div>
							{/if}
							<h3 class="row__title">{thread.title}</h3>
							<div class="row__meta">
								<span class="byline">
									<Avatar user={{ displayName: thread.displayName, avatar: thread.avatar, id: thread.userId }} size={22} />
									<span class="byline__name">{thread.displayName}</span>
								</span>
								<span class="dot-sep">·</span>
								<span class="muted-mono">Created {rel(thread.createdAt)}</span>
								<span class="dot-sep">·</span>
								<span class="muted-mono">Updated {rel(thread.updatedAt)}</span>
							</div>
						</a>
						{/if}
						<div class="row__stats">
							<div class="bigstat">
								<span class="bigstat__n">{thread.commentCount ?? 0}</span>
								<span class="bigstat__l">replies</span>
							</div>
						</div>
						<div class="row__footer">
							{#if $user && thread.userId === $user.id}
								<TagManager
									threadId={thread.id}
									existingTags={thread.tags || []}
									onTagsChanged={async () => { tagsChanged = true; await getThreads(); }}
									{tagsChanged}
								/>
								<div class="row__actions">
									{#if editingId !== thread.id}
										<button class="cact" on:click={() => startEdit(thread)} type="button">
											<Icon name="edit" size={15} stroke={2} /> Edit
										</button>
									{/if}
									<button class="cact cact--danger" on:click={() => deleteThread(thread.id)} type="button">
										<Icon name="trash" size={15} stroke={2} /> Delete
									</button>
								</div>
							{:else}
								<TagDisplay tags={thread.tags || []} maxDisplay={4} />
							{/if}
						</div>
					</article>
				{/each}
			</div>
		{/if}
	</div>
{/if}

<style>
	.board {
		max-width: 860px;
		margin: 0 auto;
		padding: 26px 24px 80px;
	}
	.board__toolbar {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 18px;
		flex-wrap: wrap;
	}
	.row {
		grid-template-columns: minmax(0, 1fr) auto;
		grid-template-areas: 'main stats' 'footer footer';
	}
	.row__main {
		grid-area: main;
		display: block;
		color: inherit;
		text-decoration: none;
	}
	.row__main:hover {
		text-decoration: none;
	}
	.row__stats {
		grid-area: stats;
	}
	.row__footer {
		grid-area: footer;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		margin-top: 14px;
		padding-top: 14px;
		border-top: 1px solid var(--border);
		flex-wrap: wrap;
	}
	.row__actions {
		display: flex;
		align-items: center;
		gap: 4px;
	}
	.title-edit {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin: 4px 0 10px;
	}
	.title-edit__actions {
		display: flex;
		gap: 8px;
	}
</style>
