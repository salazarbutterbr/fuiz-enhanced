<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { LanguageManager } from '$lib/utils/languageManager.js';
	import type { AvailableLanguageTag } from '$lib/types';

	export let data;

	let selectedLanguage: AvailableLanguageTag = 'en';
	let nickname: string = '';
	let gameId: string = $page.params.gameId;
	let isLoading = false;
	let error: string | null = null;
	let quiz = data.quiz;

	onMount(() => {
		// Set default language based on browser preference
		selectedLanguage = LanguageManager.getBrowserLanguage();
		
		// Check if quiz exists
		if (!quiz) {
			error = 'Quiz not found. Please check the game ID.';
		}
	});

	async function joinGame() {
		if (!nickname.trim()) {
			error = 'Please enter a nickname';
			return;
		}

		if (!quiz) {
			error = 'Quiz not found';
			return;
		}

		isLoading = true;
		error = null;

		try {
			// Store language preference in session storage
			sessionStorage.setItem('fuiz_language', selectedLanguage);
			sessionStorage.setItem('fuiz_nickname', nickname);

			// Navigate to the actual game
			goto(`/play/${gameId}/game`);
		} catch (err) {
			error = 'Failed to join game. Please try again.';
			isLoading = false;
		}
	}

	function getLanguageLabel(langCode: AvailableLanguageTag): string {
		const lang = LanguageManager.getLanguageByCode(langCode);
		return lang ? `${lang.flag} ${lang.name}` : langCode;
	}
</script>

<svelte:head>
	<title>Join Quiz - Fuiz Enhanced</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-md">
	<div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
		<div class="text-center mb-6">
			<h1 class="text-2xl font-bold text-gray-800 dark:text-white mb-2">
				🎯 Join Quiz
			</h1>
			<p class="text-gray-600 dark:text-gray-300">
				Game ID: <span class="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{gameId}</span>
			</p>
			
			{#if quiz}
				<div class="mt-4 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
					<h3 class="font-semibold text-blue-900 dark:text-blue-100">{quiz.title}</h3>
					{#if quiz.description}
						<p class="text-sm text-blue-700 dark:text-blue-300 mt-1">{quiz.description}</p>
					{/if}
					<p class="text-xs text-blue-600 dark:text-blue-400 mt-2">
						{quiz.slides?.length || 0} questions • {quiz.maxParticipants} max participants
					</p>
				</div>
			{/if}
		</div>

		{#if error}
			<div class="mb-6 text-red-600 text-sm bg-red-50 dark:bg-red-900 p-3 rounded-md">
				{error}
			</div>
		{/if}

		{#if quiz}
			<form on:submit|preventDefault={joinGame} class="space-y-6">
				<!-- Language Selection -->
				<div>
					<label for="language" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						🌍 Select Your Language
					</label>
					<select
						id="language"
						bind:value={selectedLanguage}
						class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
					>
						{#each LanguageManager.getSupportedLanguages() as language}
							<option value={language.code}>
								{language.flag} {language.name}
							</option>
						{/each}
					</select>
				</div>

				<!-- Nickname Input -->
				<div>
					<label for="nickname" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						👤 Enter Your Nickname
					</label>
					<input
						id="nickname"
						type="text"
						bind:value={nickname}
						placeholder="Your nickname..."
						maxlength="20"
						class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
						required
					/>
				</div>

				<!-- Join Button -->
				<button
					type="submit"
					disabled={isLoading || !nickname.trim()}
					class="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					{isLoading ? 'Joining...' : 'Join Game'}
				</button>
			</form>
		{/if}

		<!-- Back to Home -->
		<div class="mt-6 text-center">
			<a href="/" class="text-blue-600 dark:text-blue-400 hover:underline">
				← Back to Home
			</a>
		</div>
	</div>
</div>

<style>
	.container {
		min-height: 100vh;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding-top: 2rem;
		padding-bottom: 2rem;
	}
</style> 