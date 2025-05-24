<script lang="ts">
	import { onMount } from 'svelte';
	import { token } from '../../lib/stores';

	export let threadId: number;
	export let existingTags: any[] = [];
	export let onTagsChanged: () => void = () => {};
	export let tagsChanged: boolean = false;

	let allTags: any[] = [];
	let selectedTags: any[] = [...existingTags];
	let filteredTags: any[] = [];
	let isManaging = false;
	let newTagName = '';
	let newTagColor = 'lightblue';
	let isCreatingTag = false;

	onMount(async () => {
		await loadAllTags();
		filteredTags = getAvailableTags();
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
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${$token}`
				},
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
				filteredTags = getAvailableTags();
				onTagsChanged();
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

	const deleteTagGlobally = async (tagId: number) => {
		if (
			!confirm(
				'Are you sure you want to delete this tag globally? This will remove it from all threads.'
			)
		) {
			return;
		}
		onTagsChanged();

		try {
			const response = await fetch('/tags', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${$token}`
				},
				body: JSON.stringify({ id: tagId })
			});

			if (response.ok) {
				// Remove from allTags list
				allTags = allTags.filter((tag) => tag.id !== tagId);
				// Remove from selectedTags if it was selected
				selectedTags = selectedTags.filter((tag) => tag.id !== tagId);
				onTagsChanged();
			} else {
				const error = await response.json();
				alert(`Failed to delete tag: ${error.error || 'Unknown error'}`);
			}
		} catch (error) {
			console.error('Failed to delete tag globally:', error);
			alert('Failed to delete tag. Please try again.');
		}
	};

	const changedTags = async () => {
		await loadAllTags();
		filteredTags = getAvailableTags();
		tagsChanged = false;
	};

	$: if (tagsChanged && isManaging) {
		changedTags();
		console.log('hi');
	}
</script>

<div class="tag-management">
	<div class="current-tags">
		{#each selectedTags as tag}
			<div class="selected-tag-item">
				<span class="tag" style="background-color: {tag.color || 'lightblue'}">
					{tag.name}
					{#if isManaging}
						<button
							class="remove-tag"
							on:click={() => removeTagFromThread(tag.id)}
							title="Remove from thread">×</button
						>
					{/if}
				</span>
				{#if isManaging}
					<button
						class="delete-tag-button"
						on:click={() => deleteTagGlobally(tag.id)}
						title="Delete tag globally"
					>
						🗑️
					</button>
				{/if}
			</div>
		{/each}
		{#if selectedTags.length === 0}
			<span class="no-tags">No tags</span>
		{/if}
	</div>

	<button class="manage-button" on:click={() => (isManaging = !isManaging)}>
		{isManaging ? 'Done' : 'Manage Tags'}
	</button>

	{#if isManaging}
		<div class="tagSelector">
			<h4>Available Tags:</h4>
			{#each filteredTags as tag}
				<div class="available-tag-item">
					<button class="available-tag" on:click={() => addTagToThread(tag.id)}>
						<span class="tag" style="background-color: {tag.color || 'lightblue'}">
							{tag.name}
						</span>
					</button>
					<button
						class="delete-tag-button"
						on:click={() => deleteTagGlobally(tag.id)}
						title="Delete tag globally"
					>
						🗑️
					</button>
				</div>
			{/each}

			{#if getAvailableTags().length === 0}
				<p class="no-available">All available tags are already applied</p>
			{/if}
		</div>
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

	.selected-tag-item {
		display: flex;
		align-items: center;
		gap: 3px;
	}

	.available-tag-item {
		display: flex;
		align-items: center;
		gap: 3px;
		margin: 2px;
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
		margin-left: 5px;
		padding: 0;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
	}

	.remove-tag:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	.no-tags {
		color: #888;
		font-style: italic;
	}

	.manage-button {
		margin-top: 5px;
	}

	.tagSelector {
		margin: 5px 0px;
		padding: 5px;
		border: 1px solid #555;
		border-radius: 4px;
		background: #222;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 5px;
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
	}

	.create-tag-form {
		display: flex;
		gap: 5px;
		align-items: center;
		flex-wrap: wrap;
	}

	.delete-tag-button {
		background: none;
		border: none;
		color: #ff6b6b;
		padding: 2px;
		cursor: pointer;
		border-radius: 2px;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
	}

	.delete-tag-button:hover {
		background: rgba(255, 107, 107, 0.2);
		color: #ff4444;
	}
</style>
