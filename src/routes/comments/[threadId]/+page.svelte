<script lang="ts">
	import { onMount } from 'svelte';
	import { currentPage, editCommentModal, user } from '../../../lib/stores';
	import EditComment from '../../../lib/components/EditComment.svelte';
	import TagDisplay from '../../../lib/components/TagDisplay.svelte';
	import { fade } from 'svelte/transition';

	let comments: any[] = [];
	let tags: any[] = [];
	let threadTitle: string = '';
	let newComment: string = '';
	let actionComment: any = {};
	let ready = false;

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
					return `<div class="quoted-content"><div class="quote-header">Quoted ${comments.find(c => c.id === Number(id)).displayName} <span class="quote-id">#${id}</span>:</div><div class="quote-body">${quote}</div></div>`;
				}
			);
		} while (sanitized !== previousSanitized); // Continue until no more changes are made

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
				<TagDisplay tags={tags} maxDisplay={3} />
			</div>
			<div class="comments">
				{#each comments as comment}
					<div class="comment">
						{@html formatComment(comment.content)}						<div class="commentInfo">
							<p class="creator">
								<img src={comment.avatar || '/question-mark.webp'} alt="comment author avatar" />{comment.displayName}
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
			<form on:submit|preventDefault={addComment}>
				<textarea placeholder="Add a comment" bind:value={newComment}></textarea>
				<button type="submit">Add Comment</button>
			</form>
		{/if}
		{#if $editCommentModal}
			<EditComment comment={actionComment} />
		{/if}
	</div>
{/if}

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
</style>
