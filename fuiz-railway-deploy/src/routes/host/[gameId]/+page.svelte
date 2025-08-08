<script lang="ts">
	import { page } from '$app/stores';
	import { onMount, onDestroy } from 'svelte';
	import { LanguageManager } from '$lib/utils/languageManager';
	import { CSVExporter } from '$lib/utils/csvExport';
	import type { AvailableLanguageTag, CSVExportData, ParticipantData } from '$lib/types';

	export let data;

	let gameId: string = $page.params.gameId;
	let selectedLanguage: AvailableLanguageTag = 'en';
	let participants: ParticipantData[] = [];
	let isExporting = false;
	let showExportOptions = false;
	let exportFields: ('nickname' | 'score' | 'team' | 'answers' | 'response_time')[] = ['nickname', 'score'];
	let gameTitle = 'Quiz Game';
	let gameLanguage: AvailableLanguageTag = 'en';

	onMount(() => {
		// Get language from URL params
		const urlParams = new URLSearchParams(window.location.search);
		const langParam = urlParams.get('lang');
		if (langParam && LanguageManager.isLanguageSupported(langParam)) {
			selectedLanguage = langParam as AvailableLanguageTag;
		}

		// Simulate participant data for demo
		simulateParticipants();
	});

	function simulateParticipants() {
		// This would normally come from the game server
		participants = [
			{
				nickname: 'Alice',
				score: 85,
				team: 'Team A',
				answers: [
					{ questionIndex: 1, questionTitle: 'What is 2+2?', answer: '4', correct: true, responseTime: 1500, points: 10 },
					{ questionIndex: 2, questionTitle: 'Capital of France?', answer: 'Paris', correct: true, responseTime: 2000, points: 10 }
				],
				totalResponseTime: 3500,
				correctAnswers: 2,
				totalQuestions: 2,
				accuracy: 1.0
			},
			{
				nickname: 'Bob',
				score: 70,
				team: 'Team B',
				answers: [
					{ questionIndex: 1, questionTitle: 'What is 2+2?', answer: '4', correct: true, responseTime: 3000, points: 10 },
					{ questionIndex: 2, questionTitle: 'Capital of France?', answer: 'London', correct: false, responseTime: 1500, points: 0 }
				],
				totalResponseTime: 4500,
				correctAnswers: 1,
				totalQuestions: 2,
				accuracy: 0.5
			}
		];
	}

	function exportCSV(type: 'participants' | 'summary' | 'analysis') {
		isExporting = true;

		const exportData: CSVExportData = {
			quizTitle: gameTitle,
			quizLanguage: gameLanguage,
			exportDate: new Date().toISOString(),
			participants: participants,
			summary: {
				totalParticipants: participants.length,
				averageScore: participants.reduce((sum, p) => sum + p.score, 0) / participants.length,
				highestScore: Math.max(...participants.map(p => p.score)),
				lowestScore: Math.min(...participants.map(p => p.score)),
				averageAccuracy: participants.reduce((sum, p) => sum + p.accuracy, 0) / participants.length
			}
		};

		let csvContent: string;
		let filename: string;

		switch (type) {
			case 'participants':
				csvContent = CSVExporter.exportToCSV(exportData);
				filename = CSVExporter.generateFilename(gameTitle, 'participants');
				break;
			case 'summary':
				csvContent = CSVExporter.exportSummaryToCSV(exportData);
				filename = CSVExporter.generateFilename(gameTitle, 'summary');
				break;
			case 'analysis':
				csvContent = CSVExporter.exportDetailedAnalysis(exportData);
				filename = CSVExporter.generateFilename(gameTitle, 'analysis');
				break;
		}

		CSVExporter.downloadCSV(csvContent, filename);
		isExporting = false;
		showExportOptions = false;
	}

	function getLanguageLabel(langCode: AvailableLanguageTag): string {
		const lang = LanguageManager.getLanguageByCode(langCode);
		return lang ? `${lang.flag} ${lang.name}` : langCode;
	}
</script>

<svelte:head>
	<title>Host Quiz - Fuiz Enhanced</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<div class="bg-white rounded-lg shadow-lg p-6">
		<!-- Header -->
		<div class="flex justify-between items-center mb-6">
			<div>
				<h1 class="text-2xl font-bold text-gray-800">
					🎯 Hosting Quiz
				</h1>
				<p class="text-gray-600">
					Game ID: <span class="font-mono bg-gray-100 px-2 py-1 rounded">{gameId}</span>
				</p>
			</div>
			<div class="text-right">
				<p class="text-sm text-gray-600">
					Language: {getLanguageLabel(selectedLanguage)}
				</p>
				<p class="text-sm text-gray-600">
					Participants: {participants.length}
				</p>
			</div>
		</div>

		<!-- Export Section -->
		<div class="mb-6 p-4 bg-blue-50 rounded-lg">
			<div class="flex justify-between items-center">
				<div>
					<h3 class="font-semibold text-blue-800">📊 Export Results</h3>
					<p class="text-sm text-blue-600">Download participant data and scores</p>
				</div>
				<button
					on:click={() => showExportOptions = !showExportOptions}
					class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
				>
					{showExportOptions ? 'Hide' : 'Export Options'}
				</button>
			</div>

			{#if showExportOptions}
				<div class="mt-4 space-y-3">
					<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
						<button
							on:click={() => exportCSV('participants')}
							disabled={isExporting}
							class="p-3 bg-green-100 text-green-800 rounded-md hover:bg-green-200 disabled:opacity-50"
						>
							📋 Participant Data
						</button>
						<button
							on:click={() => exportCSV('summary')}
							disabled={isExporting}
							class="p-3 bg-purple-100 text-purple-800 rounded-md hover:bg-purple-200 disabled:opacity-50"
						>
							📈 Summary Statistics
						</button>
						<button
							on:click={() => exportCSV('analysis')}
							disabled={isExporting}
							class="p-3 bg-orange-100 text-orange-800 rounded-md hover:bg-orange-200 disabled:opacity-50"
						>
							🔍 Detailed Analysis
						</button>
					</div>
					{#if isExporting}
						<div class="text-center text-blue-600">
							⏳ Generating CSV file...
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Participants List -->
		<div class="mb-6">
			<h3 class="font-semibold text-gray-800 mb-3">👥 Participants</h3>
			<div class="space-y-2">
				{#each participants as participant, index}
					<div class="flex justify-between items-center p-3 bg-gray-50 rounded-md">
						<div class="flex items-center space-x-3">
							<span class="text-lg">#{index + 1}</span>
							<div>
								<div class="font-medium">{participant.nickname}</div>
								<div class="text-sm text-gray-600">
									Team: {participant.team || 'None'} | 
									Accuracy: {(participant.accuracy * 100).toFixed(1)}%
								</div>
							</div>
						</div>
						<div class="text-right">
							<div class="font-bold text-lg">{participant.score} pts</div>
							<div class="text-sm text-gray-600">
								{participant.correctAnswers}/{participant.totalQuestions} correct
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Game Controls -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<button class="p-4 bg-green-100 text-green-800 rounded-md hover:bg-green-200">
				▶️ Start Game
			</button>
			<button class="p-4 bg-red-100 text-red-800 rounded-md hover:bg-red-200">
				⏹️ End Game
			</button>
		</div>

		<!-- Language Info -->
		<div class="mt-6 p-4 bg-gray-50 rounded-lg">
			<h3 class="font-semibold text-gray-800 mb-2">🌍 Multi-Language Support</h3>
			<p class="text-sm text-gray-600">
				Participants can select their preferred language when joining. 
				The quiz content will be displayed in their chosen language.
			</p>
			<div class="mt-2 flex flex-wrap gap-2">
				{#each LanguageManager.getSupportedLanguages() as language}
					<span class="px-2 py-1 bg-white rounded text-sm">
						{language.flag} {language.name}
					</span>
				{/each}
			</div>
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