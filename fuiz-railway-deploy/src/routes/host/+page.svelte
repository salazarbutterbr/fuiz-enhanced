<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { LanguageManager } from '$lib/utils/languageManager';
	import type { AvailableLanguageTag } from '$lib/paraglide/runtime.js';

	let selectedLanguage: AvailableLanguageTag = 'en';
	let gameId: string | null = null;

	onMount(() => {
		// Get language from URL params or use browser language
		const urlParams = new URLSearchParams(window.location.search);
		const langParam = urlParams.get('lang');
		if (langParam && LanguageManager.isLanguageSupported(langParam)) {
			selectedLanguage = langParam as AvailableLanguageTag;
		} else {
			selectedLanguage = LanguageManager.getBrowserLanguage();
		}
	});

	function startHosting() {
		if (gameId) {
			goto(`/host/${gameId}?lang=${selectedLanguage}`);
		}
	}

	function createNewQuiz() {
		goto(`/create?lang=${selectedLanguage}`);
	}
</script>

<svelte:head>
	<title>Host Quiz - Fuiz Enhanced</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-2xl">
	<div class="bg-white rounded-lg shadow-lg p-6">
		<h1 class="text-3xl font-bold text-center mb-8 text-gray-800">
			🎯 Host Quiz
		</h1>

		<!-- Language Selection -->
		<div class="mb-6">
			<label for="language" class="block text-sm font-medium text-gray-700 mb-2">
				Select Language / Seleccionar Idioma / Choisir la Langue
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

		<!-- Join Existing Game -->
		<div class="mb-6">
			<label for="gameId" class="block text-sm font-medium text-gray-700 mb-2">
				Game ID
			</label>
			<div class="flex gap-2">
				<input
					id="gameId"
					type="text"
					bind:value={gameId}
					placeholder="Enter game ID..."
					class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
				<button
					on:click={startHosting}
					disabled={!gameId}
					class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Host
				</button>
			</div>
		</div>

		<!-- Create New Quiz -->
		<div class="text-center">
			<button
				on:click={createNewQuiz}
				class="w-full px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
			>
				Create New Quiz
			</button>
		</div>

		<!-- Features Info -->
		<div class="mt-8 p-4 bg-blue-50 rounded-lg">
			<h3 class="font-semibold text-blue-800 mb-2">✨ Enhanced Features:</h3>
			<ul class="text-sm text-blue-700 space-y-1">
				<li>🌍 Multi-language support (8 languages)</li>
				<li>📊 CSV export for participant data</li>
				<li>📈 Detailed analytics and statistics</li>
				<li>🎯 Real-time quiz hosting</li>
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