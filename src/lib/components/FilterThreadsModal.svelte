<script lang="ts">
	import { filterThreadsModal, token, threads, originalThreads, activeFilters } from '$lib/stores';
	import { onMount } from 'svelte';
	import Tag from './Tag.svelte';
	import Icon from './Icon.svelte';

	let allTags: any[] = [];
	let selected: number[] = [...$activeFilters];

	const closeModal = () => ($filterThreadsModal = false);

	const toggle = (id: number) =>
		(selected = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

	const filterThreads = () => {
		$activeFilters = selected;
		if (selected.length > 0) {
			const filteredResults = $originalThreads.filter((thread) =>
				(thread.tags || []).some((tag: any) => selected.includes(Number(tag.id)))
			);
			$threads = JSON.parse(JSON.stringify(filteredResults));
		} else {
			$threads = JSON.parse(JSON.stringify($originalThreads));
		}
		closeModal();
	};

	const clearFilters = () => {
		selected = [];
		$activeFilters = [];
		$threads = JSON.parse(JSON.stringify($originalThreads));
		closeModal();
	};

	onMount(() => {
		fetch('/tags', {
			method: 'GET',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${$token}` }
		})
			.then((r) => r.json())
			.then((data) => (allTags = data))
			.catch((e) => console.error('Error loading tags:', e));
	});

	const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeModal();
</script>

<svelte:window on:keydown={onKey} />

<div class="scrim" on:mousedown={(e) => e.target === e.currentTarget && closeModal()}>
	<div class="modal modal--md" role="dialog" aria-modal="true">
		<div class="modal__head">
			<div>
				<h2 class="modal__title">Filter threads</h2>
				<p class="modal__sub">Show only threads with these tags.</p>
			</div>
			<button class="modal__close" on:click={closeModal} type="button"><Icon name="x" size={18} stroke={2.1} /></button>
		</div>

		<div class="modal__body">
			<div class="tag-pick tag-pick--lg">
				{#each allTags as tag}
					<Tag {tag} active={selected.includes(tag.id)} interactive onClick={() => toggle(tag.id)} />
				{/each}
				{#if allTags.length === 0}<span class="muted">No tags yet.</span>{/if}
			</div>
		</div>

		<div class="modal__foot">
			<button type="button" class="btn btn--ghost" on:click={clearFilters}>Clear all</button>
			<span class="toolbar-spacer"></span>
			<button type="button" class="btn btn--ghost" on:click={closeModal}>Cancel</button>
			<button type="button" class="btn btn--primary" on:click={filterThreads}>
				<Icon name="filter" size={16} stroke={2.1} /><span>Apply{selected.length ? ` (${selected.length})` : ''}</span>
			</button>
		</div>
	</div>
</div>
