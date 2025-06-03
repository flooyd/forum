<script lang="ts">
	import { token, editCommentModal } from '../../lib/stores';
	import ImageUpload from './ImageUpload.svelte';
	let title = '';
	export let comment: any = {};
	let showImageUpload = false;

	const editComment = async () => {
		const response = await fetch(`/comments/${comment.id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${$token}`
			},
			body: JSON.stringify({ content: comment.content, commentId: comment.id })
		});

		if (response.ok) {
			$editCommentModal = false;
		} else {
			// Handle error
		}
	};

	const closeModal = () => {
		$editCommentModal = null;
	};

	const handleImageUploaded = (image: any) => {
		console.log('Image uploaded:', image);
		// Image upload handled by the component
	};
    
	const handleInsertImage = (data: { markdown: string }) => {
		const { markdown } = data;
		// Insert the image markdown at the current cursor position
		if (comment.content) {
			comment.content = comment.content + '\n' + markdown;
		} else {
			comment.content = markdown;
		}

		// Focus the textarea
		setTimeout(() => {
			const textarea = document.querySelector('#title') as HTMLTextAreaElement;
			if (textarea) {
				textarea.focus();
				textarea.setSelectionRange(comment.content.length, comment.content.length);
			}
		}, 0);
	};
</script>

<div class="modalBackground">
	<div class="modal">
		<h2>Edit Comment</h2>
		<form on:submit|preventDefault={editComment}>
			<label for="title">Content</label>
			<textarea id="title" bind:value={comment.content} required></textarea>

			<div class="form-actions">
				<button
					type="button"
					class="image-toggle"
					on:click={() => (showImageUpload = !showImageUpload)}
				>
					{showImageUpload ? 'Hide' : 'Add'} Images
				</button>
				<button type="submit">Edit</button>
				<button type="button" on:click={closeModal}>Cancel</button>
			</div>

			{#if showImageUpload}
				<ImageUpload
					commentId={comment.id}
					onImageUploaded={handleImageUploaded}
					onImageInserted={handleInsertImage}
					multiple={true}
					buttonText="Upload Images"
				/>
			{/if}
		</form>
	</div>
</div>

<style>
	textarea {
		width: 100%;
		height: 100px;
	}

	.form-actions {
		display: flex;
		gap: 10px;
		align-items: center;
		margin-top: 10px;
	}

	.image-toggle {
		background: #28a745;
		color: white;
		border: none;
		padding: 8px 16px;
		border-radius: 4px;
		cursor: pointer;
		font-size: 14px;
	}

	.image-toggle:hover {
		background: #218838;
	}
</style>
