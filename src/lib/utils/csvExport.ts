import Papa from 'papaparse';
import type { CSVExportData, ParticipantData } from '$lib/types';

export class CSVExporter {
	static exportParticipantData(data: CSVExportData): string {
		const csvData = data.participants.map(participant => ({
			'Participant Name': participant.name,
			'Score': participant.score,
			'Joined At': participant.joinedAt.toISOString(),
			'Total Questions': data.quizInfo.totalQuestions,
			'Quiz Title': data.quizInfo.title
		}));

		return Papa.unparse(csvData);
	}

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

	static generateFilename(quizTitle: string): string {
		const timestamp = new Date().toISOString().split('T')[0];
		const sanitizedTitle = quizTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
		return `fuiz_${sanitizedTitle}_${timestamp}.csv`;
	}
} 