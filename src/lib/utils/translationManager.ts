import type { AvailableLanguageTag, IdlessSlide, IdlessFuizConfig } from '$lib/types';
import { LanguageManager } from './languageManager';

export class TranslationManager {
	/**
	 * Get quiz content in the specified language
	 */
	static getQuizInLanguage(
		quizConfig: IdlessFuizConfig,
		targetLanguage: AvailableLanguageTag
	): IdlessFuizConfig {
		// If target language is the primary language, return original
		if (quizConfig.languages?.primary === targetLanguage) {
			return quizConfig;
		}

		// Check if we have manual translations
		if (quizConfig.languages?.translations?.[targetLanguage]) {
			return {
				title: quizConfig.languages.translations[targetLanguage].title,
				slides: quizConfig.languages.translations[targetLanguage].slides,
				languages: quizConfig.languages
			};
		}

		// Use automatic translation as fallback
		return this.autoTranslateQuiz(quizConfig, targetLanguage);
	}

	/**
	 * Automatic translation using a translation service
	 * In a real implementation, this would use Google Translate, DeepL, or similar
	 */
	private static autoTranslateQuiz(
		quizConfig: IdlessFuizConfig,
		targetLanguage: AvailableLanguageTag
	): IdlessFuizConfig {
		const translatedSlides = quizConfig.slides.map(slide => {
			if ('MultipleChoice' in slide) {
				return {
					MultipleChoice: {
						...slide.MultipleChoice,
						title: this.translateText(slide.MultipleChoice.title, targetLanguage),
						answers: slide.MultipleChoice.answers.map(answer => ({
							...answer,
							content: {
								Text: this.translateText(answer.content.Text, targetLanguage)
							}
						}))
					}
				};
			} else if ('TypeAnswer' in slide) {
				return {
					TypeAnswer: {
						...slide.TypeAnswer,
						title: this.translateText(slide.TypeAnswer.title, targetLanguage),
						answers: slide.TypeAnswer.answers.map(answer =>
							this.translateText(answer, targetLanguage)
						)
					}
				};
			} else if ('Order' in slide) {
				return {
					Order: {
						...slide.Order,
						title: this.translateText(slide.Order.title, targetLanguage),
						answers: slide.Order.answers.map(answer =>
							this.translateText(answer, targetLanguage)
						)
					}
				};
			}
			return slide;
		});

		return {
			title: this.translateText(quizConfig.title, targetLanguage),
			slides: translatedSlides,
			languages: quizConfig.languages
		};
	}

	/**
	 * Simple translation mapping for demo purposes
	 * In production, this would use a real translation API
	 */
	private static translateText(text: string, targetLanguage: AvailableLanguageTag): string {
		// Simple demo translations - in real app, use Google Translate API or similar
		const translations: Record<string, Record<string, string>> = {
			'What is 2+2?': {
				'es': '¿Cuánto es 2+2?',
				'fr': 'Qu\'est-ce que 2+2?',
				'pt': 'Quanto é 2+2?',
				'ru': 'Сколько будет 2+2?',
				'zh-cn': '2+2等于多少？',
				'vi': '2+2 bằng bao nhiêu?',
				'tr': '2+2 kaçtır?'
			},
			'Capital of France': {
				'es': 'Capital de Francia',
				'fr': 'Capitale de la France',
				'pt': 'Capital da França',
				'ru': 'Столица Франции',
				'zh-cn': '法国首都',
				'vi': 'Thủ đô của Pháp',
				'tr': 'Fransa\'nın başkenti'
			},
			'Paris': {
				'es': 'París',
				'fr': 'Paris',
				'pt': 'Paris',
				'ru': 'Париж',
				'zh-cn': '巴黎',
				'vi': 'Paris',
				'tr': 'Paris'
			},
			'London': {
				'es': 'Londres',
				'fr': 'Londres',
				'pt': 'Londres',
				'ru': 'Лондон',
				'zh-cn': '伦敦',
				'vi': 'London',
				'tr': 'Londra'
			},
			'4': {
				'es': '4',
				'fr': '4',
				'pt': '4',
				'ru': '4',
				'zh-cn': '4',
				'vi': '4',
				'tr': '4'
			}
		};

		// Check if we have a translation for this text
		if (translations[text] && translations[text][targetLanguage]) {
			return translations[text][targetLanguage];
		}

		// For demo purposes, add a marker to show it would be translated
		// In production, this would call a real translation API
		return `[${targetLanguage.toUpperCase()}] ${text}`;
	}

	/**
	 * Check if a quiz has translations for a specific language
	 */
	static hasTranslation(
		quizConfig: IdlessFuizConfig,
		language: AvailableLanguageTag
	): boolean {
		return !!quizConfig.languages?.translations?.[language];
	}

	/**
	 * Get available languages for a quiz
	 */
	static getAvailableLanguages(quizConfig: IdlessFuizConfig): AvailableLanguageTag[] {
		return quizConfig.languages?.available || [quizConfig.languages?.primary || 'en'];
	}

	/**
	 * Add manual translation to a quiz
	 */
	static addTranslation(
		quizConfig: IdlessFuizConfig,
		language: AvailableLanguageTag,
		translatedTitle: string,
		translatedSlides: IdlessSlide[]
	): IdlessFuizConfig {
		const updatedConfig = { ...quizConfig };
		
		if (!updatedConfig.languages) {
			updatedConfig.languages = {
				primary: 'en',
				available: ['en'],
				translations: {}
			};
		}

		if (!updatedConfig.languages.translations) {
			updatedConfig.languages.translations = {};
		}

		updatedConfig.languages.translations[language] = {
			title: translatedTitle,
			slides: translatedSlides
		};

		return updatedConfig;
	}
} 