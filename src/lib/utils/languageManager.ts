import type { AvailableLanguageTag, LanguageConfig } from '$lib/types';

export class LanguageManager {
	static getSupportedLanguages(): LanguageConfig[] {
		return [
			{ code: 'en', name: 'English', flag: '🇺🇸' },
			{ code: 'es', name: 'Español', flag: '🇪🇸' },
			{ code: 'fr', name: 'Français', flag: '🇫🇷' },
			{ code: 'pt', name: 'Português', flag: '🇵🇹' },
			{ code: 'ru', name: 'Русский', flag: '🇷🇺' },
			{ code: 'zh', name: '中文', flag: '🇨🇳' },
			{ code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
			{ code: 'tr', name: 'Türkçe', flag: '🇹🇷' }
		];
	}

	static getLanguageByCode(code: AvailableLanguageTag): LanguageConfig | undefined {
		return this.getSupportedLanguages().find(lang => lang.code === code);
	}

	static getDefaultLanguage(): AvailableLanguageTag {
		return 'en';
	}
} 