<script lang="ts">
	import { token, createThreadModal, threads, originalThreads, user } from '../../lib/stores';
	import ImageUpload from './ImageUpload.svelte';
	
	let title = '';
	let initialComment = '';
	let uploadedImages: any[] = [];
	let showImageUpload = false;

	const createThread = async () => {
		const response = await fetch('/threads', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${$token}`
			},
			body: JSON.stringify({ title })
		});
		if (response.ok) {
			const data = await response.json();
			const newThread = data.thread[0];
			newThread.avatar = $user.avatar;
			newThread.displayName = $user.displayName;
			newThread.tags = []; // Initialize empty tags array
			$threads = [newThread, ...$threads];
			$originalThreads = [
				JSON.parse(JSON.stringify(newThread)),
				...JSON.parse(JSON.stringify($originalThreads))
			]; // Deep copy
			console.log($threads);			// If there's an initial comment, add it to the thread
			if (initialComment.trim()) {
				await addInitialComment(newThread.id);
			}

			closeModal();
		} else {
			// Handle error
		}
	};
	
	const addInitialComment = async (threadId: number) => {
		try {
			const response = await fetch(`/comments/${threadId}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${$token}`
				},
				body: JSON.stringify({ content: initialComment })
			});

			if (response.ok) {
				// If there are uploaded images, associate them with the new comment
				if (uploadedImages.length > 0) {
					const commentData = await response.json();
					const commentId = commentData.comment[0].id;
					
					// Update image associations
					for (const image of uploadedImages) {
						await fetch(`/images`, {
							method: 'PUT',
							headers: {
								'Content-Type': 'application/json',
								Authorization: `Bearer ${$token}`
							},
							body: JSON.stringify({
								imageId: image.id,
								commentId: commentId
							})
						});
					}
				}
			} else {
				console.error('Failed to add initial comment');
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
	};
	// Handle image upload events
	const handleImageUploaded = (image: any) => {
		uploadedImages = [...uploadedImages, image];
	};

	const handleImageRemoved = (data: { imageId: number }) => {
		uploadedImages = uploadedImages.filter(img => img.id !== data.imageId);
	};	const handleImageInserted = (data: { filename: string; altText: string; markdown: string }) => {
		const { markdown } = data;
		
		// Insert at cursor position or append to end
		const textarea = document.getElementById('initialComment') as HTMLTextAreaElement;
		if (textarea) {
			const cursorPos = textarea.selectionStart;
			const textBefore = initialComment.substring(0, cursorPos);
			const textAfter = initialComment.substring(textarea.selectionEnd);
			initialComment = textBefore + markdown + '\n' + textAfter;
			
			// Update cursor position
			setTimeout(() => {
				const newPos = cursorPos + markdown.length + 1;
				textarea.setSelectionRange(newPos, newPos);
				textarea.focus();
			}, 0);
		} else {
			initialComment += (initialComment ? '\n' : '') + markdown;
		}
	};
</script>

<div class="modalBackground">
	<div class="modal">
		<h2>Create Thread</h2>
		<form on:submit|preventDefault={createThread}>
			<label for="title">Title</label>
			<input type="text" id="title" bind:value={title} required />			<label for="initialComment">Initial Comment (optional)</label>
			<div class="textarea-container">
				<textarea
					id="initialComment"
					bind:value={initialComment}
					placeholder="Add an initial comment to start the discussion..."
				></textarea>
				
				{#if initialComment.trim()}
					<div class="form-actions">
						<button 
							type="button" 
							class="image-toggle-btn"
							class:active={showImageUpload}
							on:click={() => showImageUpload = !showImageUpload}
							title="Toggle image upload"
						>
							📷 Images
						</button>
					</div>
				{/if}
			</div>

			{#if showImageUpload && initialComment.trim()}				<div class="image-upload-section">
					<ImageUpload
						threadId={null}
						commentId={null}
						onImageUploaded={handleImageUploaded}
						onImageRemoved={handleImageRemoved}
						onImageInserted={handleImageInserted}
					/>
				</div>
			{/if}

			<button type="submit">Create Thread</button>
			<button type="button" on:click={closeModal}>Cancel</button>
		</form>
	</div>
</div>

<style>
	input,
	textarea {
		max-width: calc(100vw - 40px);
		min-width: 100%;
	}

	textarea {
		height: 120px;
		resize: vertical;
		min-height: 80px;
	}

	.textarea-container {
		position: relative;
	}

	.form-actions {
		display: flex;
		gap: 8px;
		margin-top: 8px;
		align-items: center;
	}

	.image-toggle-btn {
		background: #333;
		color: white;
		border: 1px solid #555;
		padding: 6px 12px;
		border-radius: 4px;
		cursor: pointer;
		font-size: 14px;
		transition: all 0.2s ease;
	}

	.image-toggle-btn:hover {
		background: #444;
		border-color: #666;
	}

	.image-toggle-btn.active {
		background: #0066cc;
		border-color: #0066cc;
	}

	.image-upload-section {
		margin-top: 15px;
		padding: 15px;
		border: 1px solid #333;
		border-radius: 6px;
		background: #1a1a1a;
	}

	button {
		margin-top: 5px;
	}

	label {
		margin-top: 10px;
	}

	label:first-child {
		margin-top: 0;
	}
</style>
