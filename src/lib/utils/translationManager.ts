import type { AvailableLanguageTag, IdlessSlide, IdlessFuizConfig } from '$lib/types';
import { LanguageManager } from './languageManager';

export class TranslationManager {
	static addTranslation(
		config: IdlessFuizConfig,
		slideIndex: number,
		language: AvailableLanguageTag,
		translation: any
	): IdlessFuizConfig {
		const updatedConfig = { ...config };
		
		if (!updatedConfig.slides[slideIndex].translations) {
			updatedConfig.slides[slideIndex].translations = {};
		}
		
		updatedConfig.slides[slideIndex].translations![language] = translation;
		
		return updatedConfig;
	}

	static removeTranslation(
		config: IdlessFuizConfig,
		slideIndex: number,
		language: AvailableLanguageTag
	): IdlessFuizConfig {
		const updatedConfig = { ...config };
		
		if (updatedConfig.slides[slideIndex].translations) {
			delete updatedConfig.slides[slideIndex].translations![language];
		}
		
		return updatedConfig;
	}

	static getTranslation(
		slide: IdlessSlide,
		language: AvailableLanguageTag
	): any | null {
		return slide.translations?.[language] || null;
	}

	static hasTranslation(
		slide: IdlessSlide,
		language: AvailableLanguageTag
	): boolean {
		return !!slide.translations?.[language];
	}

	static getAvailableTranslations(slide: IdlessSlide): AvailableLanguageTag[] {
		return Object.keys(slide.translations || {}) as AvailableLanguageTag[];
	}
} 