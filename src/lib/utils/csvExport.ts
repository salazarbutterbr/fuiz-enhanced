import Papa from 'papaparse';
import type { CSVExportData, ParticipantData } from '$lib/types';

export class CSVExporter {
	/**
	 * Export participant data to CSV format
	 */
	static exportToCSV(data: CSVExportData): string {
		// Create headers based on available data
		const headers = [
			'Nickname',
			'Score',
			'Team',
			'Correct Answers',
			'Total Questions',
			'Accuracy (%)',
			'Total Response Time (ms)',
			'Average Response Time (ms)'
		];

		// Add question-specific headers if detailed answers are available
		const hasDetailedAnswers = data.participants.some(p => p.answers.length > 0);
		if (hasDetailedAnswers) {
			const maxQuestions = Math.max(...data.participants.map(p => p.answers.length));
			for (let i = 1; i <= maxQuestions; i++) {
				headers.push(`Q${i} Answer`, `Q${i} Correct`, `Q${i} Response Time (ms)`, `Q${i} Points`);
			}
		}

		// Create rows
		const rows = data.participants.map(participant => {
			const row = [
				participant.nickname,
				participant.score,
				participant.team || '',
				participant.correctAnswers,
				participant.totalQuestions,
				(participant.accuracy * 100).toFixed(2),
				participant.totalResponseTime,
				participant.totalResponseTime / participant.totalQuestions
			];

			// Add detailed answer data if available
			if (hasDetailedAnswers) {
				for (let i = 0; i < maxQuestions; i++) {
					const answer = participant.answers[i];
					if (answer) {
						row.push(
							answer.answer,
							answer.correct ? 'Yes' : 'No',
							answer.responseTime,
							answer.points
						);
					} else {
						row.push('', '', '', '');
					}
				}
			}

			return row;
		});

		// Add summary row
		const summaryRow = [
			'SUMMARY',
			`${data.summary.averageScore.toFixed(2)} (avg)`,
			`${data.summary.totalParticipants} participants`,
			`${data.summary.averageAccuracy * 100}% avg accuracy`,
			'',
			'',
			'',
			''
		];

		// Combine all data
		const csvData = [headers, ...rows, [], summaryRow];

		// Convert to CSV
		return Papa.unparse(csvData);
	}

	/**
	 * Export summary statistics to CSV
	 */
	static exportSummaryToCSV(data: CSVExportData): string {
		const headers = [
			'Metric',
			'Value'
		];

		const rows = [
			['Quiz Title', data.quizTitle],
			['Quiz Language', data.quizLanguage],
			['Export Date', data.exportDate],
			['Total Participants', data.summary.totalParticipants.toString()],
			['Average Score', data.summary.averageScore.toFixed(2)],
			['Highest Score', data.summary.highestScore.toString()],
			['Lowest Score', data.summary.lowestScore.toString()],
			['Average Accuracy (%)', (data.summary.averageAccuracy * 100).toFixed(2)],
			['Total Questions', data.participants[0]?.totalQuestions.toString() || '0']
		];

		const csvData = [headers, ...rows];
		return Papa.unparse(csvData);
	}

	/**
	 * Export detailed participant analysis
	 */
	static exportDetailedAnalysis(data: CSVExportData): string {
		const headers = [
			'Nickname',
			'Score',
			'Rank',
			'Percentile',
			'Team',
			'Correct Answers',
			'Total Questions',
			'Accuracy (%)',
			'Average Response Time (ms)',
			'Fastest Response (ms)',
			'Slowest Response (ms)'
		];

		// Sort participants by score (descending)
		const sortedParticipants = [...data.participants].sort((a, b) => b.score - a.score);

		const rows = sortedParticipants.map((participant, index) => {
			const rank = index + 1;
			const percentile = ((data.summary.totalParticipants - rank) / data.summary.totalParticipants * 100).toFixed(1);
			
			const responseTimes = participant.answers.map(a => a.responseTime);
			const fastestResponse = Math.min(...responseTimes);
			const slowestResponse = Math.max(...responseTimes);

			return [
				participant.nickname,
				participant.score,
				rank,
				percentile,
				participant.team || '',
				participant.correctAnswers,
				participant.totalQuestions,
				(participant.accuracy * 100).toFixed(2),
				(participant.totalResponseTime / participant.totalQuestions).toFixed(0),
				fastestResponse,
				slowestResponse
			];
		});

		const csvData = [headers, ...rows];
		return Papa.unparse(csvData);
	}

	/**
	 * Download CSV file
	 */
	static downloadCSV(csvContent: string, filename: string): void {
		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		
		if (link.download !== undefined) {
			const url = URL.createObjectURL(blob);
			link.setAttribute('href', url);
			link.setAttribute('download', filename);
			link.style.visibility = 'hidden';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}
	}

	/**
	 * Generate filename with timestamp
	 */
	static generateFilename(quizTitle: string, type: 'participants' | 'summary' | 'analysis'): string {
		const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
		const sanitizedTitle = quizTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
		return `fuiz_${sanitizedTitle}_${type}_${timestamp}.csv`;
	}
} 