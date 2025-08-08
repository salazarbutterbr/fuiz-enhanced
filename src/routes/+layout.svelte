<script lang="ts">
	import { navigating } from '$app/state';
	import Loading from '$lib/Loading.svelte';
	import { onMount } from 'svelte';
	import '../app.css';

	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	let mounting = $state(true);
	let navigatingBoolean = $derived(navigating.type !== null);

	const startTimer = (f: () => void, ms: number) => {
		let timer = setTimeout(f, ms);
		return () => {
			clearTimeout(timer);
		};
	};

	let longNavigating = $state(false);
	let stopTimer = $state(() => {
		// left empty for a reason
	});

	$effect(() => {
		if (navigatingBoolean) {
			stopTimer = startTimer(() => {
				longNavigating = true;
			}, 100);
		} else {
			stopTimer();
			longNavigating = false;
		}
	});

	onMount(() => {
		mounting = false;
	});
</script>

{#if mounting || longNavigating}
	<Loading />
{:else}
	{@render children?.()}
{/if}

<style>
	:global(body) {
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		font-size: 16px;
	}

	:global(html) {
		background: var(--background-color, #ffffff);
	}

	:global(.dark) {
		--background-color: #111827;
	}
</style>
