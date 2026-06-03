<script lang="ts">
	import { token, editCommentModal } from '../../lib/stores';
	import ImageUpload from './ImageUpload.svelte';
	import Icon from './Icon.svelte';

	export let comment: any = {};
	let showImageUpload = false;

	const editComment = async () => {
		const response = await fetch(`/comments/${comment.id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${$token}` },
			body: JSON.stringify({ content: comment.content, commentId: comment.id })
		});
		if (response.ok) $editCommentModal = false;
	};

	const closeModal = () => ($editCommentModal = false);

	const handleImageUploaded = (image: any) => {};
	const handleInsertImage = (data: { markdown: string }) => {
		const { markdown } = data;
		comment.content = comment.content ? comment.content + '\n' + markdown : markdown;
		setTimeout(() => {
			const textarea = document.querySelector('#editContent') as HTMLTextAreaElement;
			if (textarea) {
				textarea.focus();
				textarea.setSelectionRange(comment.content.length, comment.content.length);
			}
		}, 0);
	};

	const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeModal();
</script>

<svelte:window on:keydown={onKey} />

<div class="scrim" on:mousedown={(e) => e.target === e.currentTarget && closeModal()}>
	<div class="modal modal--md" role="dialog" aria-modal="true">
		<div class="modal__head">
			<div>
				<h2 class="modal__title">Edit reply</h2>
				<p class="modal__sub">Fix a typo, sharpen a point.</p>
			</div>
			<button class="modal__close" on:click={closeModal} type="button"><Icon name="x" size={18} stroke={2.1} /></button>
		</div>

		<form on:submit|preventDefault={editComment}>
			<div class="modal__body">
				<label class="field field--block">
					<span class="field__label">Content</span>
					<textarea id="editContent" rows="7" bind:value={comment.content} required></textarea>
				</label>
				{#if showImageUpload}
					<ImageUpload
						commentId={comment.id}
						onImageUploaded={handleImageUploaded}
						onImageInserted={handleInsertImage}
						multiple={true}
						buttonText="Upload Images"
					/>
				{/if}
			</div>

			<div class="modal__foot">
				<button type="button" class="composer__tool" class:is-on={showImageUpload} on:click={() => (showImageUpload = !showImageUpload)}>
					<Icon name="image" size={16} stroke={2} /> Add images
				</button>
				<span class="toolbar-spacer"></span>
				<button type="button" class="btn btn--ghost" on:click={closeModal}>Cancel</button>
				<button type="submit" class="btn btn--primary" disabled={!comment.content?.trim()}><Icon name="check" size={16} stroke={2.1} /><span>Save changes</span></button>
			</div>
		</form>
	</div>
</div>

<style>
	.modal__body textarea {
		resize: vertical;
		min-height: 120px;
		line-height: 1.6;
	}
</style>
