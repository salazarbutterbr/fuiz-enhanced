<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import type { AvailableLanguageTag } from '$lib/types';

	const gameId = $page.params.gameId;
	
	// Game state
	let quiz: any = null;
	let currentSlideIndex = 0;
	let timeLeft = 30;
	let isAnswering = false;
	let selectedAnswer = '';
	let typedAnswer = '';
	let nickname = '';
	let language: AvailableLanguageTag = 'en';
	let gameStatus = 'waiting'; // waiting, active, finished
	let errorMessage = '';
	let score = 0;
	let totalQuestions = 0;
	
	// Timer
	let timerInterval: number;
	
	onMount(async () => {
		// Get participant info from session storage
		nickname = sessionStorage.getItem('fuiz_nickname') || '';
		language = (sessionStorage.getItem('fuiz_language') as AvailableLanguageTag) || 'en';
		
		if (!nickname) {
			goto(`/play/${gameId}`);
			return;
		}
		
		// Load quiz data
		try {
			const response = await fetch(`/api/quiz/${gameId}`);
			const data = await response.json();
			
			if (data.success) {
				quiz = data.quiz;
				totalQuestions = quiz.slides.length;
				gameStatus = 'active';
				startTimer();
			} else {
				errorMessage = 'Failed to load quiz';
			}
		} catch (error) {
			errorMessage = 'Failed to load quiz';
		}
	});
	
	function startTimer() {
		if (timerInterval) clearInterval(timerInterval);
		
		timeLeft = quiz?.slides[currentSlideIndex]?.timeLimit || 30;
		
		timerInterval = setInterval(() => {
			timeLeft--;
			
			if (timeLeft <= 0) {
				clearInterval(timerInterval);
				nextQuestion();
			}
		}, 1000);
	}
	
	function nextQuestion() {
		if (currentSlideIndex < quiz.slides.length - 1) {
			currentSlideIndex++;
			selectedAnswer = '';
			typedAnswer = '';
			isAnswering = false;
			startTimer();
		} else {
			// Quiz finished
			gameStatus = 'finished';
			if (timerInterval) clearInterval(timerInterval);
		}
	}
	
	function submitAnswer() {
		if (isAnswering) return;
		
		isAnswering = true;
		const currentSlide = quiz.slides[currentSlideIndex];
		
		if (currentSlide.type === 'multiple_choice') {
			// Check if answer is correct
			const correctAnswer = currentSlide.content.answers.findIndex((answer: any) => answer.correct);
			if (selectedAnswer === correctAnswer.toString()) {
				score += currentSlide.points;
			}
		} else if (currentSlide.type === 'type_answer') {
			// Simple text matching (case insensitive)
			const correctAnswers = currentSlide.content.answers.map((answer: string) => answer.toLowerCase());
			if (correctAnswers.includes(typedAnswer.toLowerCase())) {
				score += currentSlide.points;
			}
		}
		
		// Move to next question after a short delay
		setTimeout(() => {
			nextQuestion();
		}, 1500);
	}
	
	function getCurrentSlide() {
		return quiz?.slides[currentSlideIndex];
	}
</script>

<svelte:head>
	<title>Playing Quiz - Fuiz Enhanced</title>
</svelte:head>

<div class="min-h-screen bg-black">
	<!-- Header -->
	<header class="bg-black/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center h-16">
				<div class="flex items-center space-x-4">
					<h1 class="text-xl font-semibold text-white">Fuiz</h1>
					<span class="text-sm text-white/60">Game: {gameId}</span>
				</div>
				<div class="flex items-center space-x-4">
					<span class="text-sm text-white/60">Player: {nickname}</span>
					<span class="text-sm font-medium text-blue-400">Score: {score}</span>
				</div>
			</div>
		</div>
	</header>

	<main class="max-w-4xl mx-auto px-4 py-8">
		{#if errorMessage}
			<div class="mb-6 bg-red-900/20 border border-red-500/20 rounded-xl p-4">
				<div class="flex">
					<div class="flex-shrink-0">
						<svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
						</svg>
					</div>
					<div class="ml-3">
						<p class="text-sm text-red-400">{errorMessage}</p>
					</div>
				</div>
			</div>
		{/if}

		{#if gameStatus === 'waiting'}
			<!-- Loading -->
			<div class="text-center py-12">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
				<h2 class="mt-4 text-xl font-semibold text-white">Loading quiz...</h2>
			</div>
		{:else if gameStatus === 'active' && quiz}
			<!-- Active Game -->
			<div class="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
				<!-- Progress and Timer -->
				<div class="flex justify-between items-center mb-6">
					<div class="text-sm text-white/60">
						Question {currentSlideIndex + 1} of {totalQuestions}
					</div>
					<div class="flex items-center space-x-2">
						<span class="text-sm text-white/60">Time:</span>
						<span class="text-lg font-bold {timeLeft <= 10 ? 'text-red-400' : 'text-blue-400'}">
							{timeLeft}s
						</span>
					</div>
				</div>

				<!-- Question -->
				<div class="mb-8">
					<h2 class="text-2xl font-bold text-white mb-4">
						{getCurrentSlide()?.title}
					</h2>
					
					{#if getCurrentSlide()?.type === 'multiple_choice'}
						<!-- Multiple Choice -->
						<div class="space-y-3">
							{#each getCurrentSlide().content.answers as answer, index}
								<button
									class="w-full p-4 text-left border rounded-xl hover:bg-white/5 transition-colors {selectedAnswer === index.toString() ? 'border-blue-500 bg-blue-600/20' : 'border-white/20'}"
									on:click={() => selectedAnswer = index.toString()}
									disabled={isAnswering}
								>
									{answer.content.Text}
								</button>
							{/each}
						</div>
					{:else if getCurrentSlide()?.type === 'type_answer'}
						<!-- Type Answer -->
						<div class="space-y-4">
							<input
								type="text"
								bind:value={typedAnswer}
								placeholder="Type your answer..."
								class="w-full p-4 bg-black/50 border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-white/40"
								disabled={isAnswering}
							/>
						</div>
					{/if}
				</div>

				<!-- Submit Button -->
				<div class="text-center">
					<button
						on:click={submitAnswer}
						disabled={isAnswering || (getCurrentSlide()?.type === 'multiple_choice' && !selectedAnswer) || (getCurrentSlide()?.type === 'type_answer' && !typedAnswer.trim())}
						class="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black"
					>
						{isAnswering ? 'Submitting...' : 'Submit Answer'}
					</button>
				</div>
			</div>
		{:else if gameStatus === 'finished'}
			<!-- Quiz Finished -->
			<div class="text-center py-12">
				<div class="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-8 max-w-2xl mx-auto">
					<h2 class="text-3xl font-bold text-white mb-4">Quiz Finished!</h2>
					<p class="text-lg text-white/60 mb-8">Thanks for participating!</p>
					
					<div class="grid grid-cols-2 gap-6 mb-8">
						<div class="text-center">
							<div class="text-3xl font-bold text-blue-400">{score}</div>
							<div class="text-sm text-white/60">Total Score</div>
						</div>
						<div class="text-center">
							<div class="text-3xl font-bold text-green-400">{totalQuestions}</div>
							<div class="text-sm text-white/60">Questions</div>
						</div>
					</div>
					
					<button
						on:click={() => goto('/')}
						class="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black"
					>
						Back to Home
					</button>
				</div>
			</div>
		{/if}
	</main>
</div>

<style>
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
