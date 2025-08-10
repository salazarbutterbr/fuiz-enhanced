<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let quizzes: any[] = [];
	let isLoading = true;
	let error = '';

	onMount(async () => {
		// For demo purposes, show some sample quizzes
		quizzes = [
			{
				gameId: 'GAME0001',
				title: 'Math Quiz',
				description: 'Basic mathematics questions',
				slides: [
					{ title: 'What is 2 + 2?', type: 'multiple_choice' },
					{ title: 'What is 5 x 5?', type: 'multiple_choice' }
				],
				createdAt: new Date().toISOString()
			},
			{
				gameId: 'GAME0002',
				title: 'Geography Quiz',
				description: 'World geography questions',
				slides: [
					{ title: 'What is the capital of France?', type: 'multiple_choice' },
					{ title: 'What is the largest ocean?', type: 'multiple_choice' }
				],
				createdAt: new Date().toISOString()
			}
		];
		isLoading = false;
	});

	function startQuiz(gameId: string) {
		// In a real app, this would start the quiz
		alert(`Starting quiz ${gameId}...`);
	}

	function shareQuiz(gameId: string) {
		const url = `${window.location.origin}/play/${gameId}`;
		navigator.clipboard.writeText(url);
		alert('Quiz link copied to clipboard!');
	}
</script>

<svelte:head>
	<title>Host Quizzes - Fuiz Enhanced</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
	<!-- Header -->
	<header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center h-16">
				<div class="flex items-center">
					<h1 class="text-2xl font-bold text-gray-900 dark:text-white">Fuiz</h1>
				</div>
				<div class="flex items-center space-x-4">
					<a href="/create" class="button-primary px-4 py-2 rounded-md text-sm font-medium">
						Create New Quiz
					</a>
					<a href="/" class="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
						Back to Home
					</a>
				</div>
			</div>
		</div>
	</header>

	<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<div class="mb-8">
			<h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Your Quizzes</h2>
			<p class="text-gray-600 dark:text-gray-300">Manage and host your created quizzes</p>
		</div>

		{#if isLoading}
			<div class="text-center py-12">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
				<p class="mt-4 text-gray-600 dark:text-gray-300">Loading quizzes...</p>
			</div>
		{:else if quizzes.length === 0}
			<div class="text-center py-12">
				<div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md mx-auto">
					<h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">No quizzes yet</h3>
					<p class="text-gray-600 dark:text-gray-300 mb-6">Create your first quiz to get started!</p>
					<a href="/create" class="button-primary px-6 py-3 rounded-lg">
						Create Your First Quiz
					</a>
				</div>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each quizzes as quiz}
					<div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
						<div class="p-6">
							<h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">{quiz.title}</h3>
							{#if quiz.description}
								<p class="text-gray-600 dark:text-gray-300 mb-4">{quiz.description}</p>
							{/if}
							
							<div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
								<span>Game ID: {quiz.gameId}</span>
								<span>{quiz.slides?.length || 0} questions</span>
							</div>
							
							<div class="flex space-x-2">
								<button
									on:click={() => startQuiz(quiz.gameId)}
									class="flex-1 button-primary px-4 py-2 rounded-md text-sm font-medium"
								>
									Start Quiz
								</button>
								<button
									on:click={() => shareQuiz(quiz.gameId)}
									class="button-secondary px-4 py-2 rounded-md text-sm font-medium"
								>
									Share
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</main>
</div>

<style>
	.button-primary {
		@apply bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors;
	}
	
	.button-secondary {
		@apply bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors;
	}
	
	.animate-spin {
		animation: spin 1s linear infinite;
	}
	
	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style> 