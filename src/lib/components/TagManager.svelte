<script lang="ts">
	import { onMount } from 'svelte';
	import { token, tagManagerOpen } from '../../lib/stores';
	import Tag from './Tag.svelte';
	import Icon from './Icon.svelte';

	export let threadId: number;
	export let existingTags: any[] = [];
	export let onTagsChanged: () => void = () => {};
	export let tagsChanged: boolean = false;

	let allTags: any[] = [];
	let selectedTags: any[] = [...existingTags];
	let filteredTags: any[] = [];
	let isManaging = false;
	let newTagName = '';
	let newTagColor = '#5b6cf0';
	let isCreatingTag = false;

	const SWATCHES = ['#5b6cf0', '#0ea5a3', '#d97706', '#db2777', '#7c3aed', '#0891b2', '#65a30d', '#64748b'];

	onMount(async () => {
		await loadAllTags();
		filteredTags = getAvailableTags();
	});

	const loadAllTags = async () => {
		try {
			const response = await fetch('/tags', { method: 'GET', headers: { Authorization: `Bearer ${$token}` } });
			if (response.ok) allTags = await response.json();
		} catch (error) {
			console.error('Failed to load tags:', error);
		}
	};

	const addTagToThread = async (tagId: number) => {
		try {
			const response = await fetch(`/thread-tags/${threadId}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${$token}` },
				body: JSON.stringify({ tagId })
			});
			if (response.ok) {
				const data = await response.json();
				selectedTags = [...selectedTags, data.tag];
				filteredTags = getAvailableTags();
				onTagsChanged();
			}
		} catch (error) {
			console.error('Failed to add tag to thread:', error);
		}
	};

	const removeTagFromThread = async (tagId: number) => {
		try {
			const response = await fetch(`/thread-tags/${threadId}`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${$token}` },
				body: JSON.stringify({ tagId })
			});
			if (response.ok) {
				selectedTags = selectedTags.filter((tag) => tag.id !== tagId);
				filteredTags = getAvailableTags();
				onTagsChanged();
			}
		} catch (error) {
			console.error('Failed to remove tag from thread:', error);
		}
	};

	const createNewTag = async () => {
		if (!newTagName.trim()) return;
		try {
			const response = await fetch('/tags', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${$token}` },
				body: JSON.stringify({ name: newTagName.trim(), color: newTagColor })
			});
			if (response.ok) {
				const newTag = await response.json();
				allTags = [...allTags, newTag];
				filteredTags = getAvailableTags();
				newTagName = '';
				newTagColor = '#5b6cf0';
				isCreatingTag = false;
			}
		} catch (error) {
			console.error('Failed to create tag:', error);
		}
	};

	const getAvailableTags = () => allTags.filter((tag) => !selectedTags.some((s) => s.id === tag.id));

	const deleteTagGlobally = async (tagId: number) => {
		if (!confirm('Are you sure you want to delete this tag globally? This will remove it from all threads.')) return;
		try {
			const response = await fetch('/tags', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${$token}` },
				body: JSON.stringify({ id: tagId })
			});
			if (response.ok) {
				allTags = allTags.filter((tag) => tag.id !== tagId);
				selectedTags = selectedTags.filter((tag) => tag.id !== tagId);
				filteredTags = getAvailableTags();
			} else {
				const error = await response.json();
				alert(`Failed to delete tag: ${error.error || 'Unknown error'}`);
			}
		} catch (error) {
			alert('Failed to delete tag. Please try again.');
		}
	};

	const changedTags = async () => {
		await loadAllTags();
		filteredTags = getAvailableTags();
		tagsChanged = false;
	};

	$: if ($tagManagerOpen === Number(threadId)) {
		changedTags();
	} else {
		isManaging = false;
	}
</script>

<div class="tagman" on:click|stopPropagation>
	<div class="tagman__current">
		{#each selectedTags as tag}
			<span class="tagman__chip">
				<Tag {tag} />
				{#if isManaging}
					<button class="tagman__x" on:click={() => removeTagFromThread(tag.id)} title="Remove from thread" type="button">
						<Icon name="x" size={12} stroke={2.4} />
					</button>
				{/if}
			</span>
		{/each}
		{#if selectedTags.length === 0}<span class="muted" style="font-size:0.8rem">No tags</span>{/if}

		<button class="tagman__manage" on:click={() => { isManaging = !isManaging; $tagManagerOpen = isManaging ? Number(threadId) : null; }} type="button">
			{isManaging ? 'Done' : 'Manage tags'}
		</button>
	</div>

	{#if isManaging}
		<div class="tagman__panel">
			{#if filteredTags.length}
				<div class="tagman__avail">
					{#each filteredTags as tag}
						<span class="tagman__chip">
							<Tag {tag} interactive onClick={() => addTagToThread(tag.id)} />
							<button class="tagman__del" on:click={() => deleteTagGlobally(tag.id)} title="Delete tag globally" type="button">
								<Icon name="trash" size={12} stroke={2.2} />
							</button>
						</span>
					{/each}
				</div>
			{:else}
				<p class="muted" style="font-size:0.8rem;margin:4px 0">All tags applied.</p>
			{/if}

			{#if !isCreatingTag}
				<button class="tagman__create" on:click={() => (isCreatingTag = true)} type="button">
					<Icon name="plus" size={14} stroke={2.2} /> New tag
				</button>
			{:else}
				<div class="tagman__form">
					<input type="text" placeholder="Tag name" bind:value={newTagName} maxlength="50" />
					<div class="tagman__swatches">
						{#each SWATCHES as c}
							<button class="tagman__swatch" class:on={newTagColor === c} style="background:{c}" on:click={() => (newTagColor = c)} type="button" aria-label="color"></button>
						{/each}
					</div>
					<button class="btn btn--primary btn--sm" on:click={createNewTag} type="button">Create</button>
					<button class="btn btn--ghost btn--sm" on:click={() => { isCreatingTag = false; newTagName = ''; }} type="button">Cancel</button>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.tagman__current {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 6px;
	}
	.tagman__chip {
		display: inline-flex;
		align-items: center;
		gap: 2px;
	}
	.tagman__x,
	.tagman__del {
		display: grid;
		place-items: center;
		width: 18px;
		height: 18px;
		border-radius: 5px;
		color: var(--text-3);
		transition: background 0.14s, color 0.14s;
	}
	.tagman__x:hover { background: var(--hover); color: var(--text); }
	.tagman__del:hover { background: oklch(0.95 0.05 25); color: oklch(0.55 0.2 25); }
	.tagman__manage {
		font-size: 0.76rem;
		font-weight: 600;
		color: var(--accent-strong);
		padding: 4px 8px;
		border-radius: 7px;
		border: 1px solid var(--accent-line);
		background: var(--accent-soft);
		transition: filter 0.15s;
	}
	.tagman__manage:hover { filter: brightness(0.97); }
	.tagman__panel {
		margin-top: 10px;
		padding: 12px;
		border: 1px solid var(--border);
		border-radius: var(--r-sm);
		background: var(--surface-2);
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.tagman__avail {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.tagman__create {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		align-self: flex-start;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-2);
		padding: 6px 10px;
		border-radius: 8px;
		border: 1px dashed var(--border-strong);
	}
	.tagman__create:hover { border-color: var(--accent); color: var(--accent-strong); }
	.tagman__form {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}
	.tagman__form input { width: auto; flex: 1; min-width: 120px; }
	.tagman__swatches { display: flex; gap: 4px; }
	.tagman__swatch {
		width: 20px;
		height: 20px;
		border-radius: 6px;
		border: 2px solid transparent;
		transition: transform 0.12s;
	}
	.tagman__swatch.on { border-color: var(--text); transform: scale(1.1); }
</style>
