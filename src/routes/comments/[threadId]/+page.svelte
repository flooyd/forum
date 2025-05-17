<script lang="ts">
	import { onMount } from 'svelte';
	import { currentPage, editCommentModal, user } from '../../../lib/stores';
	import EditComment from '../../../lib/components/EditComment.svelte';

	let comments: any[] = [];
	let threadTitle: string = '';
	let newComment: string = '';
	let actionComment: any = {};

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
			comments = comments.filter(comment => comment.id !== commentId);
		} else {
			console.error('Failed to delete comment');
		}
	}

	onMount(async () => {
		$currentPage = 'comments';
		await fetchComments();
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
	}

	$: $editCommentModal === false && fetchComments();
	$: if($editCommentModal === null) {
		console.log('Edit comment modal closed');
		console.log(comments);
	}
</script>

<h2>{threadTitle}</h2>
{#if comments.length > 0}
	<div class="comments">
		{#each comments as comment}
			<div class="comment">
				<p>{comment.content}</p>
				<div class="commentInfo">
					<p class="creator">
						<img src={comment.avatar} alt="comment author avatar" />{comment.displayName}
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
				</div>
			</div>
		{/each}
	</div>
{:else}
	<p>No comments yet.</p>
{/if}
{#if $user}
	<form on:submit|preventDefault={addComment}>
		<textarea placeholder="Add a comment" bind:value={newComment}></textarea>
		<button type="submit">Submit</button>
	</form>
{/if}
{#if $editCommentModal}
	<EditComment comment={actionComment} />
{/if}

<style>
	h2 {
		color: yellow;
	}

	form {
		margin-top: 10px;
		display: flex;
		align-items: center;
		gap: 5px;
	}

	.comments {
		border: 1px solid white;
		display: flex;
		flex-direction: column;
	}

	.comment {
		padding: 5px;
		display: flex;
		gap: 5px;
		flex-direction: column;
		border-bottom: 1px solid white;
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
                flex-wrap: wrap:
		align-items: center;
	}
	.commentActions {
		display: flex;
		gap: 5px;
		justify-content: flex-end;
	}
</style>
