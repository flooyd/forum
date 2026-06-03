<script lang="ts">
	import { onMount } from 'svelte';
	import { token, createThreadModal, threads, originalThreads, user } from '../../lib/stores';
	import ImageUpload from './ImageUpload.svelte';
	import Icon from './Icon.svelte';
	import Tag from './Tag.svelte';

	let title = '';
	let initialComment = '';
	let uploadedImages: any[] = [];
	let showImageUpload = false;
	let allTags: any[] = [];
	let selectedTagIds: number[] = [];

	onMount(async () => {
		try {
			const response = await fetch('/tags', {
				method: 'GET',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${$token}` }
			});
			if (response.ok) allTags = await response.json();
		} catch (error) {
			console.error('Failed to load tags:', error);
		}
	});

	const toggleTag = (id: number) =>
		(selectedTagIds = selectedTagIds.includes(id)
			? selectedTagIds.filter((x) => x !== id)
			: [...selectedTagIds, id]);

	const createThread = async () => {
		const response = await fetch('/threads', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${$token}` },
			body: JSON.stringify({ title })
		});
		if (response.ok) {
			const data = await response.json();
			const newThread = data.thread[0];
			newThread.avatar = $user.avatar;
			newThread.displayName = $user.displayName;
			newThread.tags = await applyTags(newThread.id);
			$threads = [newThread, ...$threads];
			$originalThreads = [JSON.parse(JSON.stringify(newThread)), ...JSON.parse(JSON.stringify($originalThreads))];
			if (initialComment.trim()) await addInitialComment(newThread.id);
			closeModal();
		}
	};

	const applyTags = async (threadId: number) => {
		const applied: any[] = [];
		for (const tagId of selectedTagIds) {
			try {
				const response = await fetch(`/thread-tags/${threadId}`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${$token}` },
					body: JSON.stringify({ tagId })
				});
				if (response.ok) {
					const data = await response.json();
					if (data.tag) applied.push(data.tag);
				}
			} catch (error) {
				console.error('Failed to add tag to thread:', error);
			}
		}
		return applied;
	};

	const addInitialComment = async (threadId: number) => {
		try {
			const response = await fetch(`/comments/${threadId}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${$token}` },
				body: JSON.stringify({ content: initialComment })
			});
			if (response.ok && uploadedImages.length > 0) {
				const commentData = await response.json();
				const commentId = commentData.comment[0].id;
				for (const image of uploadedImages) {
					await fetch(`/images`, {
						method: 'PUT',
						headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${$token}` },
						body: JSON.stringify({ imageId: image.id, commentId })
					});
				}
			}
		} catch (error) {
			console.error('Error adding initial comment:', error);
		}
	};

	const closeModal = () => {
		$createThreadModal = false;
		title = '';
		initialComment = '';
		uploadedImages = [];
		showImageUpload = false;
		selectedTagIds = [];
	};

	const handleImageUploaded = (image: any) => (uploadedImages = [...uploadedImages, image]);
	const handleImageRemoved = (data: { imageId: number }) =>
		(uploadedImages = uploadedImages.filter((img) => img.id !== data.imageId));
	const handleImageInserted = (data: { markdown: string }) => {
		const { markdown } = data;
		const textarea = document.getElementById('initialComment') as HTMLTextAreaElement;
		if (textarea) {
			const cursorPos = textarea.selectionStart;
			const textBefore = initialComment.substring(0, cursorPos);
			const textAfter = initialComment.substring(textarea.selectionEnd);
			initialComment = textBefore + markdown + '\n' + textAfter;
			setTimeout(() => {
				const newPos = cursorPos + markdown.length + 1;
				textarea.setSelectionRange(newPos, newPos);
				textarea.focus();
			}, 0);
		} else {
			initialComment += (initialComment ? '\n' : '') + markdown;
		}
	};

	const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeModal();
</script>

<svelte:window on:keydown={onKey} />

<div class="scrim" on:mousedown={(e) => e.target === e.currentTarget && closeModal()}>
	<div class="modal modal--lg" role="dialog" aria-modal="true">
		<div class="modal__head">
			<div>
				<h2 class="modal__title">Start a new thread</h2>
				<p class="modal__sub">Give it a clear title — future readers will thank you.</p>
			</div>
			<button class="modal__close" on:click={closeModal} type="button"><Icon name="x" size={18} stroke={2.1} /></button>
		</div>

		<form on:submit|preventDefault={createThread}>
			<div class="modal__body">
				<label class="field field--block">
					<span class="field__label">Title</span>
					<input class="field__big" type="text" id="title" bind:value={title} placeholder="What do you want to discuss?" required />
				</label>

				<label class="field field--block">
					<span class="field__label">Opening post <span class="field__opt">optional</span></span>
					<textarea id="initialComment" rows="5" bind:value={initialComment} placeholder="Set the context. What's your take, your question, the thing you built?"></textarea>
				</label>

				{#if allTags.length}
					<div class="field field--block">
						<span class="field__label">Tags <span class="field__opt">optional</span></span>
						<div class="tag-pick">
							{#each allTags as tag}
								<Tag {tag} active={selectedTagIds.includes(tag.id)} interactive onClick={() => toggleTag(tag.id)} />
							{/each}
						</div>
					</div>
				{/if}

				{#if showImageUpload}
					<div>
						<ImageUpload
							threadId={null}
							commentId={null}
							onImageUploaded={handleImageUploaded}
							onImageRemoved={handleImageRemoved}
							onImageInserted={handleImageInserted}
						/>
					</div>
				{/if}
			</div>

			<div class="modal__foot">
				<button type="button" class="composer__tool" class:is-on={showImageUpload} on:click={() => (showImageUpload = !showImageUpload)}>
					<Icon name="image" size={16} stroke={2} /> Add images
				</button>
				<span class="toolbar-spacer"></span>
				<button type="button" class="btn btn--ghost" on:click={closeModal}>Cancel</button>
				<button type="submit" class="btn btn--primary" disabled={!title.trim()}><Icon name="plus" size={16} stroke={2.1} /><span>Create thread</span></button>
			</div>
		</form>
	</div>
</div>

<style>
	.modal__body textarea {
		resize: vertical;
		min-height: 96px;
		line-height: 1.6;
	}
</style>
