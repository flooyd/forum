<script lang="ts">
	import { onMount } from 'svelte';
	import { currentPage, editCommentModal, user } from '../../../lib/stores';
	import EditComment from '../../../lib/components/EditComment.svelte';
	import TagDisplay from '../../../lib/components/TagDisplay.svelte';
	import ImageUpload from '../../../lib/components/ImageUpload.svelte';
	import ImageLightbox from '../../../lib/components/ImageLightbox.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import { rel, fullDate } from '$lib/util';
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
		const quoteText = `<blockquote data-author="${comment.displayName}" data-id="${comment.id}">${comment.content}</blockquote>\n`;
		newComment = quoteText + newComment;
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
		let sanitized = content.replace(/</g, '&lt;').replace(/>/g, '&gt;');
		let previousSanitized;
		do {
			previousSanitized = sanitized;
			sanitized = previousSanitized.replace(
				/&lt;blockquote data-author="([^"]+)" data-id="([^"]+)"&gt;([\s\S]*?)&lt;\/blockquote&gt;/gs,
				(_match, author, id, quote) => {
					return `<div class="quoted-content"><div class="quote-header">Quoted ${comments.find((c) => c.id === Number(id))?.displayName || 'Unknown'} <span class="quote-id">#${id}</span>:</div><div class="quote-body">${quote}</div></div>`;
				}
			);
		} while (sanitized !== previousSanitized);
		sanitized = sanitized.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt, url) => {
			const altText = alt || 'User uploaded image';
			return `<img src="${url}" alt="${altText}" class="comment-image clickable-image" loading="lazy" data-lightbox="true" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
            <div class="image-load-fallback" style="display:none;">Failed to load: ${altText}</div>`;
		});
		sanitized = sanitized.replace(/https?:\/\/(?:www\.)?streamable\.com\/([a-zA-Z0-9]+)/g, (_m, id) => {
			return `<iframe src="https://streamable.com/e/${id}" frameborder="0" allowfullscreen class="streamable-embed"></iframe>`;
		});
		sanitized = sanitized.replace(/https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/g, (_m, id) => {
			return `<iframe src="https://www.youtube.com/embed/${id}" frameborder="0" allowfullscreen class="youtube-embed"></iframe>`;
		});
		const isJustQuote = /^(\s*)<div class="quoted-content">[\s\S]*<\/div>(\s*)$/.test(sanitized);
		if (!isJustQuote) sanitized = sanitized.replace(/\n/g, '<br>');
		return sanitized;
	};

	const addComment = async () => {
		const threadId = window.location.pathname.split('/')[2];
		const response = await fetch(`/comments/${threadId}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
			body: JSON.stringify({ content: newComment })
		});
		if (response.ok) {
			const data = await response.json();
			data.comment[0].avatar = $user.avatar;
			data.comment[0].displayName = $user.displayName;
			comments = [...comments, data.comment[0]];
			newComment = '';
		}
	};

	const editComment = (comment: any) => {
		actionComment = { ...comment };
		$editCommentModal = true;
	};

	const deleteComment = async (commentId: string) => {
		const confirmed = confirm('Are you sure you want to delete this comment? This action cannot be undone.');
		if (!confirmed) return;
		const threadId = window.location.pathname.split('/')[2];
		const response = await fetch(`/comments/${threadId}`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
			body: JSON.stringify({ commentId })
		});
		if (response.ok) comments = comments.filter((comment) => comment.id !== commentId);
	};

	const handleImageUploaded = (image: any) => {};
	const handleInsertImage = (data: { markdown: string }) => {
		const { markdown } = data;
		newComment = newComment ? newComment + '\n' + markdown : markdown;
		setTimeout(() => {
			const textarea = document.querySelector('textarea');
			if (textarea) {
				textarea.focus();
				textarea.setSelectionRange(newComment.length, newComment.length);
			}
		}, 0);
	};

	const openLightbox = (imageSrc: string, imageAlt: string) => {
		const allImages: any[] = [];
		const commentImages = document.querySelectorAll('.comment-image[data-lightbox="true"]');
		commentImages.forEach((img: Element, index: number) => {
			const el = img as HTMLImageElement;
			allImages.push({ url: el.src, alt: el.alt || `Image ${index + 1}`, src: el.src });
		});
		const clickedIndex = allImages.findIndex((img) => img.url === imageSrc);
		lightboxImages = allImages;
		lightboxCurrentIndex = clickedIndex >= 0 ? clickedIndex : 0;
		lightboxImageSrc = imageSrc;
		lightboxImageAlt = imageAlt;
		lightboxOpen = true;
	};
	const closeLightbox = () => (lightboxOpen = false);

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
		const threadId = window.location.pathname.split('/')[2];
		const response = await fetch(`/comments/${threadId}`, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }
		});
		const data = await response.json();
		comments = data.comments;
		threadTitle = data.threadTitle;
	};

	const fetchAiComment = async () => {
		aiCommentLoading = true;
		const threadId = window.location.pathname.split('/')[2];
		const response = await fetch(`/comments/ai/${threadId}`, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }
		});
		if (!response.ok) { aiCommentLoading = false; return; }
		const data = await response.json();
		aiComment = data.aiComment || null;
		aiCommentLoading = false;
	};

	const fetchTags = async () => {
		const threadId = window.location.pathname.split('/')[2];
		const response = await fetch(`/thread-tags/${threadId}`, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }
		});
		tags = await response.json();
	};

	$: $editCommentModal === false && fetchComments();
</script>

{#if ready}
	<div class="reader-wrap" transition:fade>
		<main class="reader">
			<a class="back" href="/"><Icon name="back" size={16} stroke={2.2} /> All threads</a>

			{#if comments.length > 0}
				<header class="reader__head">
					{#if tags?.length}<div class="reader__tags"><TagDisplay {tags} maxDisplay={5} /></div>{/if}
					<h1 class="reader__title">{threadTitle}</h1>
					<div class="reader__meta">
						<span class="muted-mono">{comments.length} {comments.length === 1 ? 'reply' : 'replies'}</span>
					</div>
				</header>

				<div class="comments-list">
					{#each comments as comment, i}
						<article class="comment" style="animation-delay:{Math.min(i, 10) * 60}ms">
							<div class="comment__rail">
								<Avatar user={{ displayName: comment.displayName, avatar: comment.avatar, id: comment.userId }} size={42} />
								<div class="comment__thread-line"></div>
							</div>
							<div class="comment__body">
								<div class="comment__head">
									<span class="comment__author">{comment.displayName}</span>
									<span class="dot-sep">·</span>
									<time class="muted-mono" title={fullDate(comment.createdAt)}>{rel(comment.createdAt)}</time>
									{#if comment.updatedAt}<span class="muted-mono comment__edited">· edited</span>{/if}
								</div>
								<div class="comment__content">{@html formatComment(comment.content)}</div>
								<div class="comment__actions">
									{#if $user}
										<button class="cact" on:click={() => quoteComment(comment)} type="button"><Icon name="quote" size={15} stroke={2} /> Quote</button>
									{/if}
									{#if $user && $user.id === comment.userId}
										<button class="cact" on:click={() => editComment(comment)} type="button"><Icon name="edit" size={15} stroke={2} /> Edit</button>
										<button class="cact cact--danger" on:click={() => deleteComment(comment.id)} type="button"><Icon name="trash" size={15} stroke={2} /> Delete</button>
									{/if}
								</div>
							</div>
						</article>
					{/each}
				</div>
			{/if}

			{#if $user}
				<div class="composer">
					<div class="composer__avatar"><Avatar user={$user} size={38} /></div>
					<div class="composer__main">
						{#if aiComment}
							<div class="ai-card">
								<div class="ai-card__head">
									<span class="ai-card__title"><Icon name="sparkle" size={15} stroke={1.8} /> Suggested reply</span>
									<button class="ai-card__close" on:click={() => (aiComment = null)} type="button"><Icon name="x" size={14} stroke={2.2} /></button>
								</div>
								<p class="ai-card__body">{aiComment}</p>
								<div class="ai-card__foot">
									<button class="btn btn--soft btn--sm" on:click={() => { newComment = (newComment ? newComment + '\n\n' : '') + aiComment; aiComment = null; }} type="button"><Icon name="check" size={15} stroke={2} /><span>Use this</span></button>
								</div>
							</div>
						{/if}

						<form on:submit|preventDefault={addComment}>
							<div class="composer__box">
								<textarea placeholder="Share your thoughts…  Quote a reply, drop a link, or add an image." bind:value={newComment}></textarea>
							</div>
							<div class="composer__bar">
								<button type="button" class="composer__tool" class:is-on={showImageUpload} on:click={() => (showImageUpload = !showImageUpload)}>
									<Icon name="image" size={16} stroke={2} /> Image
								</button>
								<button type="button" class="composer__tool" disabled={aiCommentLoading} on:click={fetchAiComment}>
									<span class:spin={aiCommentLoading}><Icon name="sparkle" size={16} stroke={2} /></span>
									{aiCommentLoading ? 'Thinking…' : 'AI assist'}
								</button>
								<span class="toolbar-spacer"></span>
								<span class="composer__hint">{newComment.length > 0 ? `${newComment.length} chars` : 'Markdown supported'}</span>
								<button class="btn btn--primary" type="submit" disabled={!newComment.trim()}><span>Post reply</span><Icon name="arrow" size={17} stroke={2.1} /></button>
							</div>

							{#if showImageUpload}
								<div style="margin-top:12px">
									<ImageUpload
										threadId={Number(window.location.pathname.split('/')[2])}
										onImageUploaded={handleImageUploaded}
										onImageInserted={handleInsertImage}
										multiple={true}
										buttonText="Upload Images"
									/>
								</div>
							{/if}
						</form>
					</div>
				</div>
			{/if}

			{#if $editCommentModal}<EditComment comment={actionComment} />{/if}
		</main>
	</div>
{/if}

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
	.composer textarea {
		width: 100%;
		min-height: 96px;
		border: none;
		outline: none;
		background: none;
		padding: 14px 16px;
		resize: vertical;
		font-size: 0.96rem;
		line-height: 1.6;
	}

	/* rich content rendered by formatComment() */
	:global(.comment__content .quoted-content) {
		margin: 4px 0 12px;
		padding: 11px 15px;
		border-left: 3px solid var(--accent);
		background: var(--accent-soft);
		border-radius: 0 var(--r-sm) var(--r-sm) 0;
	}
	:global(.comment__content .quote-header) {
		display: flex;
		align-items: center;
		gap: 5px;
		font-size: 0.74rem;
		font-weight: 700;
		color: var(--accent-strong);
		margin-bottom: 4px;
		font-family: var(--font-mono);
	}
	:global(.comment__content .quote-id) {
		color: var(--text-3);
	}
	:global(.comment__content .quote-body) {
		color: var(--text-2);
		font-style: italic;
	}
	:global(.comment-image) {
		max-width: 340px;
		max-height: 420px;
		border-radius: var(--r-sm);
		margin: 10px 0;
		cursor: pointer;
		border: 1px solid var(--border);
		box-shadow: var(--shadow-sm);
		transition: transform 0.18s ease, box-shadow 0.2s ease;
	}
	:global(.comment-image.clickable-image:hover) {
		transform: scale(1.02);
		box-shadow: var(--shadow-md);
	}
	:global(.streamable-embed),
	:global(.youtube-embed) {
		width: 100%;
		max-width: 480px;
		aspect-ratio: 16 / 9;
		border: none;
		border-radius: var(--r-sm);
		margin: 10px 0;
	}
	:global(.image-load-fallback) {
		padding: 10px;
		border: 1px dashed var(--border-strong);
		color: var(--text-3);
		text-align: center;
		margin: 10px 0;
		max-width: 340px;
		border-radius: var(--r-sm);
		font-size: 0.86rem;
	}
</style>
