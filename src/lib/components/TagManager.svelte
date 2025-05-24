<script lang="ts">
	import { onMount } from 'svelte';
	import { token } from '../../lib/stores';

	export let threadId: number;
	export let existingTags: any[] = [];
	export let onTagsChanged: () => void = () => {};

	let allTags: any[] = [];
	let selectedTags: any[] = [...existingTags];
	let isManaging = false;
	let newTagName = '';
	let newTagColor = 'lightblue';
	let isCreatingTag = false;

	onMount(async () => {
		await loadAllTags();
	});

	const loadAllTags = async () => {
		try {
			const response = await fetch('/tags', {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${$token}`
				}
			});
			if (response.ok) {
				const data = await response.json();
				allTags = data;
			}
		} catch (error) {
			console.error('Failed to load tags:', error);
		}
	};

	const addTagToThread = async (tagId: number) => {
		try {
			const response = await fetch(`/thread-tags/${threadId}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${$token}`
				},
				body: JSON.stringify({ tagId })
			});

			if (response.ok) {
				const data = await response.json();
				selectedTags = [...selectedTags, data.tag];
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
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${$token}`
				},
				body: JSON.stringify({ tagId })
			});

			if (response.ok) {
				selectedTags = selectedTags.filter((tag) => tag.id !== tagId);
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
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${$token}`
				},
				body: JSON.stringify({
					name: newTagName.trim(),
					color: newTagColor
				})
			});

			if (response.ok) {
				const newTag = await response.json();
				allTags = [...allTags, newTag];
				newTagName = '';
				newTagColor = 'lightblue';
				isCreatingTag = false;
			}
		} catch (error) {
			console.error('Failed to create tag:', error);
		}
	};

	const getAvailableTags = () => {
		return allTags.filter((tag) => !selectedTags.some((selected) => selected.id === tag.id));
	};
</script>

<div class="tag-management">
	<div class="current-tags">
		{#each selectedTags as tag}
			<span class="tag" style="background-color: {tag.color || 'lightblue'}">
				{tag.name}
				{#if isManaging}
					<button class="remove-tag" on:click={() => removeTagFromThread(tag.id)}>×</button>
				{/if}
			</span>
		{/each}
		{#if selectedTags.length === 0}
			<span class="no-tags">No tags</span>
		{/if}
	</div>

	<button class="manage-button" on:click={() => (isManaging = !isManaging)}>
		{isManaging ? 'Done' : 'Manage Tags'}
	</button>

	{#if isManaging}
		<div class="tag-selector">
			<h4>Available Tags:</h4>
			{#each getAvailableTags() as tag}
				<button class="available-tag" on:click={() => addTagToThread(tag.id)}>
					<span class="tag" style="background-color: {tag.color || 'lightblue'}">
						{tag.name}
					</span>
				</button>
			{/each}

			{#if getAvailableTags().length === 0}
				<p class="no-available">All available tags are already applied</p>
			{/if}

			<div class="create-tag-section">
				{#if !isCreatingTag}
					<button class="create-tag-button" on:click={() => (isCreatingTag = true)}>
						+ Create New Tag
					</button>
				{:else}
					<div class="create-tag-form">
						<input type="text" placeholder="Tag name" bind:value={newTagName} maxlength="50" />
						<button on:click={createNewTag}>Create</button>
						<button
							on:click={() => {
								isCreatingTag = false;
								newTagName = '';
							}}>Cancel</button
						>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.tag-management {
		margin: 5px 0;
	}

	.current-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 5px;
		margin-bottom: 5px;
		min-height: 20px;
	}

	.tag {
		display: inline-flex;
		align-items: center;
		padding: 3px;
		border-radius: 4px;
		color: black;
		font-weight: bold;
		white-space: nowrap;
	}

	.remove-tag {
		background: none;
		border: none;
		color: black;
		margin-left: 4px;
		padding: 0;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		font-size: 10px;
	}

	.remove-tag:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	.no-tags {
		color: #888;
		font-style: italic;
		font-size: 0.8em;
	}

	.manage-button {
		margin-top: 5px;
	}

	.tag-selector {
		margin-top: 8px;
		padding: 8px;
		border: 1px solid #555;
		border-radius: 4px;
		background: #222;
	}

	.tag-selector h4 {
		margin: 0 0 8px 0;
		color: white;
		font-size: 0.85em;
	}

	.available-tag {
		background: none;
		border: none;
		padding: 2px;
		margin: 2px;
		cursor: pointer;
		border-radius: 4px;
	}

	.available-tag:hover {
		background: #333;
	}

	.no-available {
		color: #888;
		font-style: italic;
		margin: 8px 0;
		font-size: 0.8em;
	}

	.create-tag-section {
		margin-top: 8px;
		padding-top: 8px;
		border-top: 1px solid #555;
	}
	.create-tag-button {
		background: lightblue;
		color: black;
		border: none;
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 0.75em;
		cursor: pointer;
	}

	.create-tag-button:hover {
		background: #add8e6;
	}

	.create-tag-form {
		display: flex;
		gap: 4px;
		align-items: center;
		flex-wrap: wrap;
	}
</style>
