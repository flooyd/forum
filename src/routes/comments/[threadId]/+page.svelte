<script lang="ts">
	import { onMount } from 'svelte';
	import { currentPage, editCommentModal, user } from '../../../lib/stores';
	import EditComment from '../../../lib/components/EditComment.svelte';
	import TagDisplay from '../../../lib/components/TagDisplay.svelte';
	import ImageUpload from '../../../lib/components/ImageUpload.svelte';
	import ImageLightbox from '../../../lib/components/ImageLightbox.svelte';
	import { fade } from 'svelte/transition';

	let comments: any[] = [];
	let tags: any[] = [];
	let threadTitle: string = '';
	let newComment: string = '';
	let actionComment: any = {};
	let ready = false;
	let showImageUpload = false;
	let aiComment: null = null;
	let aiCommentLoading = false;

	// Lightbox state
	let lightboxOpen = false;
	let lightboxImageSrc = '';
	let lightboxImageAlt = '';
	let lightboxImages: any[] = [];
	let lightboxCurrentIndex = 0;

	const quoteComment = (comment: any) => {
		// Format the quote with HTML blockquote including display name
		const quoteText = `<blockquote data-author="${comment.displayName}" data-id="${comment.id}">${comment.content}</blockquote>\n`;

		// Add the quote to the textarea
		newComment = quoteText + newComment;

		// Focus on textarea and move cursor to the end
		setTimeout(() => {
			const textarea = document.querySelector('textarea');
			if (textarea) {
				textarea.focus();
				textarea.selectionStart = textarea.selectionEnd - 1;
			}
		}, 0);
	};
	const formatComment = (content: string) => {
		if (!content) return '';

		// Sanitize content first
		let sanitized = content.replace(/</g, '&lt;').replace(/>/g, '&gt;');

		// Process blockquotes recursively
		let previousSanitized;
		do {
			previousSanitized = sanitized;
			sanitized = previousSanitized.replace(
				/&lt;blockquote data-author="([^"]+)" data-id="([^"]+)"&gt;([\s\S]*?)&lt;\/blockquote&gt;/gs,
				(_match, author, id, quote) => {
					// Fix: Remove extra indentation and line breaks in the template
					return `<div class="quoted-content"><div class="quote-header">Quoted ${comments.find((c) => c.id === Number(id))?.displayName || 'Unknown'} <span class="quote-id">#${id}</span>:</div><div class="quote-body">${quote}</div></div>`;
				}
			);
		} while (sanitized !== previousSanitized); // Continue until no more changes are made
		// Process image markdown: ![alt](url)
		sanitized = sanitized.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt, url) => {
			const altText = alt || 'User uploaded image';
			// Added onerror handler and fallback div
			return `<img src="${url}" alt="${altText}" class="comment-image clickable-image" loading="lazy" data-lightbox="true" onerror="this.style.display=\\'none\\'; this.nextElementSibling.style.display=\\'block\\';" />
            <div class="image-load-fallback" style="display:none;">
                Failed to load: ${altText}
            </div>`;
		});
		//streamable embed
		sanitized = sanitized.replace(
			/https?:\/\/(?:www\.)?streamable\.com\/([a-zA-Z0-9]+)/g,
			(_match, id) => {
				return `<iframe src="https://streamable.com/e/${id}" frameborder="0" allowfullscreen class="streamable-embed"></iframe>`;
			});
		// YouTube embed
		sanitized = sanitized.replace(
			/https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/g,
			(_match, id) => {
				return `<iframe src="https://www.youtube.com/embed/${id}" frameborder="0" allowfullscreen class="youtube-embed"></iframe>`;
			});

		// Check if the content was just a quote (plus maybe some whitespace)
		const isJustQuote = /^(\s*)<div class="quoted-content">[\s\S]*<\/div>(\s*)$/.test(sanitized);

		if (!isJustQuote) {
			// Only add <br> for newlines if there's actual content besides quotes
			sanitized = sanitized.replace(/\n/g, '<br>');
		}

		return sanitized;
	};

	const addComment = async () => {
		const threadId = window.location.pathname.split('/')[2];
		const response = await fetch(`/comments/${threadId}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${localStorage.getItem('token')}`
			},
			body: JSON.stringify({ content: newComment })
		});
		if (response.ok) {
			const data = await response.json();
			data.comment[0].avatar = $user.avatar;
			data.comment[0].displayName = $user.displayName;
			comments = [...comments, data.comment[0]];
			newComment = '';
		} else {
			console.error('Failed to add comment');
		}
	};

	const editComment = (comment: any) => {
		//clone comment to avoid mutating the original
		actionComment = { ...comment };
		$editCommentModal = true;
	};

	const deleteComment = async (commentId: string) => {
		// Show confirmation dialog
		const confirmed = confirm(
			'Are you sure you want to delete this comment? This action cannot be undone.'
		);

		if (!confirmed) {
			return; // User cancelled, don't delete
		}

		const threadId = window.location.pathname.split('/')[2];
		const response = await fetch(`/comments/${threadId}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${localStorage.getItem('token')}`
			},
			body: JSON.stringify({ commentId })
		});

		if (response.ok) {
			comments = comments.filter((comment) => comment.id !== commentId);
		} else {
			console.error('Failed to delete comment');
		}
	};
	const handleImageUploaded = (image: any) => {
		console.log('Image uploaded:', image);
		// Image upload handled by the component
	};

	const handleInsertImage = (data: { markdown: string }) => {
		const { markdown } = data;
		// Insert the image markdown at the current cursor position
		if (newComment) {
			newComment = newComment + '\n' + markdown;
		} else {
			newComment = markdown;
		}

		// Focus the textarea
		setTimeout(() => {
			const textarea = document.querySelector('textarea');
			if (textarea) {
				textarea.focus();
				textarea.setSelectionRange(newComment.length, newComment.length);
			}
		}, 0);
	};

	const openLightbox = (imageSrc: string, imageAlt: string) => {
		// Collect all images from the current comment thread
		const allImages: any[] = [];

		// Get all comment images from the page
		const commentImages = document.querySelectorAll('.comment-image[data-lightbox="true"]');
		commentImages.forEach((img: Element, index: number) => {
			const imgElement = img as HTMLImageElement;
			allImages.push({
				url: imgElement.src,
				alt: imgElement.alt || `Image ${index + 1}`,
				src: imgElement.src
			});
		});

		// Find the index of the clicked image
		const clickedIndex = allImages.findIndex((img) => img.url === imageSrc);

		lightboxImages = allImages;
		lightboxCurrentIndex = clickedIndex >= 0 ? clickedIndex : 0;
		lightboxImageSrc = imageSrc;
		lightboxImageAlt = imageAlt;
		lightboxOpen = true;
	};

	const closeLightbox = () => {
		lightboxOpen = false;
	};

	const handleImageClick = (event: Event) => {
		const target = event.target as HTMLImageElement;
		if (target && target.classList.contains('clickable-image')) {
			event.preventDefault();
			openLightbox(target.src, target.alt);
		}
	};

	onMount(async () => {
		$currentPage = 'comments';
		await fetchComments();
		await fetchTags();
		ready = true;
	});

	const fetchComments = async () => {
		console.log('Fetching comments...');
		const threadId = window.location.pathname.split('/')[2];
		const response = await fetch(`/comments/${threadId}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${localStorage.getItem('token')}`
			}
		});
		const data = await response.json();
		console.log(data);
		comments = data.comments;
		threadTitle = data.threadTitle;
	};

	const fetchAiComment = async () => {
		aiCommentLoading = true;
		const threadId = window.location.pathname.split('/')[2];
		const response = await fetch(`/comments/ai/${threadId}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${localStorage.getItem('token')}`
			}
		});

		if (!response.ok) {
			console.error('Failed to fetch user comments');
			return;
		}

		const data = await response.json();
		aiComment = data.aiComment || null;
		aiCommentLoading = false;
	};

	const fetchTags = async () => {
		const threadId = window.location.pathname.split('/')[2];
		const response = await fetch(`/thread-tags/${threadId}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${localStorage.getItem('token')}`
			}
		});
		const data = await response.json();
		tags = data;
	};

	$: $editCommentModal === false && fetchComments();
</script>

{#if ready}
	<div transition:fade>
		{#if comments.length > 0}
			<div class="title">
				<h2>{threadTitle}</h2>
				<TagDisplay {tags} maxDisplay={3} />
			</div>
			<div class="comments">
				{#each comments as comment}
					<div class="comment">
						{@html formatComment(comment.content)}
						<div class="commentInfo">
							<p class="creator">
								<img
									src={comment.avatar || '/question-mark.webp'}
									alt="comment author avatar"
								/>{comment.displayName}
							</p>
							<div class="commentInfoDates">
								<p>Commented on {new Date(comment.createdAt).toLocaleString()}</p>
								{#if comment.updatedAt}
									<p>Updated on {new Date(comment.updatedAt).toLocaleString()}</p>
								{/if}
							</div>
						</div>
						<div class="commentActions">
							{#if $user && $user.id === comment.userId}
								<button on:click={() => editComment(comment)}>Edit</button>
								<button on:click={() => deleteComment(comment.id)}>Delete</button>
							{/if}
							{#if $user}
								<button on:click={() => quoteComment(comment)}>Quote</button>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
		{#if $user}
			<div class="aiComment">
				AI-COMMENT: {aiComment}
			</div>
			<form on:submit|preventDefault={addComment}>
				<textarea placeholder="Add a comment" bind:value={newComment}></textarea>

				<div class="form-actions">
					<button
						type="button"
						class="image-toggle"
						on:click={() => (showImageUpload = !showImageUpload)}
					>
						{showImageUpload ? 'Hide' : 'Add'} Images
					</button>
					<button type="submit">Add Comment</button>
					<button type="button" disabled={aiCommentLoading} on:click={fetchAiComment}>
						{#if aiCommentLoading}
							<span>Loading AI Comment...</span>
						{:else}
							Generate AI Comment
						{/if}
					</button>
				</div>
				{#if showImageUpload}
					<ImageUpload
						threadId={Number(window.location.pathname.split('/')[2])}
						onImageUploaded={handleImageUploaded}
						onImageInserted={handleInsertImage}
						multiple={true}
						buttonText="Upload Images"
					/>
				{/if}
			</form>
		{/if}
		{#if $editCommentModal}
			<EditComment comment={actionComment} />
		{/if}
	</div>
{/if}

<!-- Image Lightbox -->
<ImageLightbox
	bind:isOpen={lightboxOpen}
	bind:imageSrc={lightboxImageSrc}
	bind:imageAlt={lightboxImageAlt}
	bind:images={lightboxImages}
	bind:currentIndex={lightboxCurrentIndex}
	on:close={closeLightbox}
/>

<svelte:window on:click={handleImageClick} />

<style>
	h2 {
		color: yellow;
	}

	.title {
		position: sticky;
		top: 61.5px;
		margin: 0px;
		padding: 10px 0px;
		background: black;
	}
	form {
		margin-top: 10px;
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	.form-actions {
		display: flex;
		gap: 10px;
		align-items: center;
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

	.comments {
		border: 2px solid white;
		border-radius: 4px;
		display: flex;
		flex-direction: column;
	}

	.comment {
		padding: 5px;
		display: flex;
		gap: 5px;
		flex-direction: column;
		border-bottom: 2px solid white;
	}

	.comment:last-child {
		border-bottom: none;
	}

	.comment:hover {
		background: #333;
	}

	.commentInfo {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 5px;
	}

	.commentActions {
		display: flex;
		gap: 5px;
		justify-content: flex-end;
	}

	textarea {
		width: 100%;
		height: 100px;
		resize: none;
	}

	.aiComment {
		margin-top: 10px;
	}
	
	:global(iframe) {
		width: 300px;
	}

	:global(.quoted-content) {
		background-color: #333;
		padding: 5px;
		margin: 5px 0px;
		border-left: 3px solid lightblue;
	}

	:global(.quote-header) {
		color: #aaa;
		font-size: 0.8em;
		font-weight: bold;
	}

	:global(.quote-body) {
		padding-left: 8px;
	}

	:global(.quote-id) {
		color: #888;
		font-size: 0.9em;
		margin-left: 4px;
	}

	:global(.comment-image) {
		max-width: 300px;
		max-height: 400px;
		width: fit-content;
		border-radius: 4px;
		margin: 8px 0;
		cursor: pointer;
		object-fit: contain;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
	}

	:global(.comment-image.clickable-image) {
		border: 2px solid transparent;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	:global(.comment-image.clickable-image:hover) {
		transform: scale(1.02);
		border-color: #0066cc;
		box-shadow: 0 4px 16px rgba(0, 102, 204, 0.2);
	}

	:global(.comment-image:hover) {
		transform: scale(1.02);
	}

	/* Image lightbox effect when clicked */
	:global(.comment-image.enlarged) {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%) scale(1);
		max-width: 90vw;
		max-height: 90vh;
		z-index: 1000;
		background: rgba(0, 0, 0, 0.9);
		padding: 20px;
		border-radius: 8px;
	}

	:global(.image-load-fallback) {
		display: none; /* Hidden by default */
		padding: 8px;
		border: 1px dashed #ccc;
		color: #888;
		text-align: center;
		margin: 8px 0;
		max-width: 300px; /* Consistent with image styling */
		background-color: #f9f9f9;
		border-radius: 4px;
	}

	@media (max-width: 768px) {
		:global(.comment-image) {
			max-width: 100%; /* Use full available width within the comment padding */
			max-height: 300px; /* Adjust height for mobile */
		}

		:global(.image-load-fallback) {
			font-size: 0.9em; /* Slightly smaller font on mobile */
			padding: 8px;
		}
	}
</style>
