// Simplified types for the quiz application
export type AvailableLanguageTag = 'en' | 'es' | 'fr' | 'pt' | 'ru' | 'zh' | 'vi' | 'tr';

export interface LanguageConfig {
	code: AvailableLanguageTag;
	name: string;
	flag: string;
}

export interface ParticipantData {
	id: string;
	name: string;
	score: number;
	joinedAt: Date;
	answers: any[];
}

export interface CSVExportData {
	participants: ParticipantData[];
	quizInfo: {
		title: string;
		totalQuestions: number;
		createdAt: Date;
	};
}

export interface IdlessSlide {
	title: string;
	type: 'multiple_choice' | 'type_answer' | 'order';
	content: any;
	timeLimit: number;
	points: number;
	translations?: Record<AvailableLanguageTag, any>;
}

export interface IdlessFuizConfig {
	title: string;
	description: string;
	slides: IdlessSlide[];
	primaryLanguage: AvailableLanguageTag;
	selectedLanguages: AvailableLanguageTag[];
	maxParticipants: number;
}
