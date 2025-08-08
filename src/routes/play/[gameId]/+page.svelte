<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { LanguageManager } from '$lib/utils/languageManager';
	import type { AvailableLanguageTag } from '$lib/paraglide/runtime.js';

	export let data;

	let selectedLanguage: AvailableLanguageTag = 'en';
	let nickname: string = '';
	let gameId: string = $page.params.gameId;
	let isLoading = false;
	let error: string | null = null;

	onMount(() => {
		// Set default language based on browser preference
		selectedLanguage = LanguageManager.getBrowserLanguage();
	});

	async function joinGame() {
		if (!nickname.trim()) {
			error = 'Please enter a nickname';
			return;
		}

		isLoading = true;
		error = null;

		try {
			// Store language preference in session storage
			sessionStorage.setItem('fuiz_language', selectedLanguage);
			sessionStorage.setItem('fuiz_nickname', nickname);

			// Navigate to the actual game with language parameter
			goto(`/play/${gameId}/game?lang=${selectedLanguage}&nickname=${encodeURIComponent(nickname)}`);
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
	<div class="bg-white rounded-lg shadow-lg p-6">
		<div class="text-center mb-6">
			<h1 class="text-2xl font-bold text-gray-800 mb-2">
				🎯 Join Quiz
			</h1>
			<p class="text-gray-600">
				Game ID: <span class="font-mono bg-gray-100 px-2 py-1 rounded">{gameId}</span>
			</p>
		</div>

		<form on:submit|preventDefault={joinGame} class="space-y-6">
			<!-- Language Selection -->
			<div>
				<label for="language" class="block text-sm font-medium text-gray-700 mb-2">
					🌍 Select Your Language
				</label>
				<select
					id="language"
					bind:value={selectedLanguage}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
				<label for="nickname" class="block text-sm font-medium text-gray-700 mb-2">
					👤 Enter Your Nickname
				</label>
				<input
					id="nickname"
					type="text"
					bind:value={nickname}
					placeholder="Your nickname..."
					maxlength="20"
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					required
				/>
			</div>

			<!-- Error Message -->
			{#if error}
				<div class="text-red-600 text-sm bg-red-50 p-3 rounded-md">
					{error}
				</div>
			{/if}

			<!-- Join Button -->
			<button
				type="submit"
				disabled={isLoading || !nickname.trim()}
				class="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			>
				{isLoading ? 'Joining...' : 'Join Game'}
			</button>
		</form>

		<!-- Language Preview -->
		<div class="mt-6 p-4 bg-gray-50 rounded-lg">
			<h3 class="font-semibold text-gray-800 mb-2">
				Selected Language: {getLanguageLabel(selectedLanguage)}
			</h3>
			<p class="text-sm text-gray-600">
				The quiz will be displayed in your selected language.
			</p>
		</div>

		<!-- Features Info -->
		<div class="mt-6 p-4 bg-blue-50 rounded-lg">
			<h3 class="font-semibold text-blue-800 mb-2">✨ Multi-Language Features:</h3>
			<ul class="text-sm text-blue-700 space-y-1">
				<li>🌍 Quiz content in your language</li>
				<li>📊 Real-time scoring</li>
				<li>🏆 Leaderboard</li>
				<li>📱 Mobile-friendly</li>
			</ul>
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