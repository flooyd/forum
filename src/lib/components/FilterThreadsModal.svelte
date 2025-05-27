<script lang="ts">
	import { filterThreadsModal, token, threads, originalThreads, activeFilters } from '$lib/stores';
	import { onMount } from 'svelte';

	let allTags: any[] = [];
	let filteredTags: any = [];

	const closeModal = () => {
		$filterThreadsModal = false;
	};

	const filterThreads = () => {
		const selectedTags = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
			.map((checkbox) => Number((checkbox as HTMLInputElement).value)); // Convert to numbers

		$activeFilters = selectedTags;
		
		if (selectedTags.length > 0) {
			// Filter from original threads, not current threads
			$threads = $originalThreads.filter((thread) =>
				thread.tags.some((tag: { id: number; }) => selectedTags.includes(tag.id))
			);
			console.log('Filtered threads:', $threads);
		} else {
			// If no filters, show all original threads
			$threads = [...$originalThreads];
		}
		
		closeModal();
	};

	const clearFilters = () => {
		// Uncheck all checkboxes
		const checkboxes = document.querySelectorAll('input[type="checkbox"]');
		checkboxes.forEach((checkbox) => {
			(checkbox as HTMLInputElement).checked = false;
		});
		
		// Reset stores
		$activeFilters = [];
		$threads = [...$originalThreads];
		
		closeModal();
	};

	onMount(() => {
		// Load all tags from the server
		fetch('/tags', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${$token}`
			}
		})
			.then((response) => response.json())
			.then((data) => {
				allTags = data;
				filteredTags = allTags; // Initially show all tags
				
				// Pre-check active filters
				setTimeout(() => {
					$activeFilters.forEach(tagId => {
						const checkbox = document.getElementById(tagId.toString()) as HTMLInputElement;
						if (checkbox) {
							checkbox.checked = true;
						}
					});
				}, 0);
			})
			.catch((error) => console.error('Error loading tags:', error));
	});
</script>

<div class="modalBackground">
	<div class="modal">
		<h2>Filter Threads</h2>		<form on:submit|preventDefault={filterThreads}>
			<label for="tagFilter">Filter by Tag:</label>
			<div class="tags">
				{#each filteredTags as tag}
					<div class="tagCheckbox">
						<input type="checkbox" id={tag.id} value={tag.id} />
						<label for={tag.id}>{tag.name}</label>
					</div>
				{/each}
			</div>
			<div class="buttons">
				<button type="submit">Apply Filters</button>
				<button type="button" on:click={clearFilters}>Clear Filters</button>
				<button type="button" on:click={closeModal}>Cancel</button>
			</div>
		</form>
	</div>
</div>

<style>
	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 10px;
	}
	.tagCheckbox {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		border: 2px solid white;
		border-radius: 4px;
		padding: 5px;
		gap: 5px;
	}

	.tagCheckbox label {
		margin: 0px;
	}

	input[type='checkbox'] {
		width: fit-content;
	}

	.buttons {
		margin-top: 10px;
		display: flex;
		align-items: center;
		gap: 8px;
	}
</style>
