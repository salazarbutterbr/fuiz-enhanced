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

<div class="min-h-screen bg-black">
	<!-- Header -->
	<header class="bg-black/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center h-16">
				<div class="flex items-center">
					<h1 class="text-2xl font-bold text-white">Fuiz</h1>
				</div>
				<div class="flex items-center space-x-4">
					<a href="/create" class="text-white/80 hover:text-white transition-colors">
						Create Quiz
					</a>
					<a href="/host" class="text-white/80 hover:text-white transition-colors">
						Host
					</a>
					<a href="/" class="text-white/80 hover:text-white transition-colors">
						Home
					</a>
				</div>
			</div>
		</div>
	</header>

	<main class="max-w-md mx-auto px-4 py-16">
		<div class="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
			<div class="text-center mb-8">
				<h2 class="text-3xl font-bold text-white mb-2">
					🎯 Join Quiz
				</h2>
				<p class="text-white/60">
					Game ID: <span class="font-mono bg-black/50 px-2 py-1 rounded-lg border border-white/10">{gameId}</span>
				</p>
				
				{#if quiz}
					<div class="mt-6 p-4 bg-blue-600/20 rounded-xl border border-blue-500/20">
						<h3 class="font-semibold text-blue-400 mb-1">{quiz.title}</h3>
						{#if quiz.description}
							<p class="text-sm text-blue-300">{quiz.description}</p>
						{/if}
						<p class="text-xs text-blue-400 mt-2">
							{quiz.slides?.length || 0} questions • {quiz.maxParticipants} max participants
						</p>
					</div>
				{/if}
			</div>

			{#if error}
				<div class="mb-6 text-red-400 text-sm bg-red-900/20 border border-red-500/20 p-3 rounded-xl">
					{error}
				</div>
			{/if}

			{#if quiz}
				<form on:submit|preventDefault={joinGame} class="space-y-6">
					<!-- Language Selection -->
					<div>
						<label for="language" class="block text-sm font-medium text-white/80 mb-2">
							🌍 Select Your Language
						</label>
						<select
							id="language"
							bind:value={selectedLanguage}
							class="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
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
						<label for="nickname" class="block text-sm font-medium text-white/80 mb-2">
							👤 Enter Your Nickname
						</label>
						<input
							id="nickname"
							type="text"
							bind:value={nickname}
							placeholder="Your nickname..."
							maxlength="20"
							class="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-white/40"
							required
						/>
					</div>

					<!-- Join Button -->
					<button
						type="submit"
						disabled={isLoading || !nickname.trim()}
						class="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black"
					>
						{isLoading ? 'Joining...' : 'Join Game'}
					</button>
				</form>
			{/if}

			<!-- Back to Home -->
			<div class="mt-6 text-center">
				<a href="/" class="text-blue-400 hover:text-blue-300 transition-colors">
					← Back to Home
				</a>
			</div>
		</div>
	</main>
</div> 