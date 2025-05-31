<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	
	export let isOpen = false;
	export let imageSrc = '';
	export let imageAlt = '';
	export let images: any[] = [];
	export let currentIndex = 0;
	
	const dispatch = createEventDispatcher();
	
	const close = () => {
		dispatch('close');
	};
	
	const nextImage = () => {
		if (images.length > 1) {
			currentIndex = (currentIndex + 1) % images.length;
			imageSrc = images[currentIndex].url || images[currentIndex].src;
			imageAlt = images[currentIndex].alt || '';
		}
	};
	
	const prevImage = () => {
		if (images.length > 1) {
			currentIndex = (currentIndex - 1 + images.length) % images.length;
			imageSrc = images[currentIndex].url || images[currentIndex].src;
			imageAlt = images[currentIndex].alt || '';
		}
	};
	
	const handleKeydown = (event: KeyboardEvent) => {
		if (!isOpen) return;
		
		switch (event.key) {
			case 'Escape':
				close();
				break;
			case 'ArrowLeft':
				prevImage();
				break;
			case 'ArrowRight':
				nextImage();
				break;
		}
	};
	
	const handleBackdropClick = (event: MouseEvent) => {
		if (event.target === event.currentTarget) {
			close();
		}
	};
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
	<div class="lightbox-overlay" on:click={handleBackdropClick} role="dialog" aria-modal="true">
		<div class="lightbox-container">
			<button class="close-button" on:click={close} aria-label="Close lightbox">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<line x1="18" y1="6" x2="6" y2="18"></line>
					<line x1="6" y1="6" x2="18" y2="18"></line>
				</svg>
			</button>
			
			{#if images.length > 1}
				<button class="nav-button prev" on:click={prevImage} aria-label="Previous image">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="15,18 9,12 15,6"></polyline>
					</svg>
				</button>
			{/if}
			
			<div class="image-container">
				<img src={imageSrc} alt={imageAlt} />
				
				{#if images.length > 1}
					<div class="image-counter">
						{currentIndex + 1} / {images.length}
					</div>
				{/if}
			</div>
			
			{#if images.length > 1}
				<button class="nav-button next" on:click={nextImage} aria-label="Next image">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="9,18 15,12 9,6"></polyline>
					</svg>
				</button>
			{/if}
		</div>
	</div>
{/if}

<style>
	.lightbox-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.9);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		animation: fadeIn 0.2s ease-out;
	}
	
	.lightbox-container {
		position: relative;
		max-width: 95vw;
		max-height: 95vh;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.image-container {
		position: relative;
		max-width: 100%;
		max-height: 100%;
	}
	
	.image-container img {
		max-width: 100%;
		max-height: 95vh;
		object-fit: contain;
		border-radius: 8px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
	}
	
	.close-button {
		position: absolute;
		top: -50px;
		right: 0;
		background: rgba(255, 255, 255, 0.1);
		border: none;
		color: white;
		padding: 12px;
		border-radius: 50%;
		cursor: pointer;
		transition: background-color 0.2s ease;
		z-index: 1001;
	}
	
	.close-button:hover {
		background: rgba(255, 255, 255, 0.2);
	}
	
	.nav-button {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		background: rgba(255, 255, 255, 0.1);
		border: none;
		color: white;
		padding: 16px;
		border-radius: 50%;
		cursor: pointer;
		transition: background-color 0.2s ease;
		z-index: 1001;
	}
	
	.nav-button:hover {
		background: rgba(255, 255, 255, 0.2);
	}
	
	.nav-button.prev {
		left: -80px;
	}
	
	.nav-button.next {
		right: -80px;
	}
	
	.image-counter {
		position: absolute;
		bottom: -40px;
		left: 50%;
		transform: translateX(-50%);
		background: rgba(0, 0, 0, 0.7);
		color: white;
		padding: 8px 16px;
		border-radius: 20px;
		font-size: 14px;
		font-weight: 500;
	}
	
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	
	@media (max-width: 768px) {
		.nav-button.prev {
			left: 10px;
		}
		
		.nav-button.next {
			right: 10px;
		}
		
		.close-button {
			top: 10px;
			right: 10px;
		}
		
		.image-counter {
			bottom: 10px;
		}
	}
</style>
