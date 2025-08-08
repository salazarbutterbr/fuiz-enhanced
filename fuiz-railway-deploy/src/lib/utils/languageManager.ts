import type { AvailableLanguageTag, LanguageConfig } from '$lib/types';

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
	{
		code: 'en',
		name: 'English',
		flag: '🇺🇸'
	},
	{
		code: 'es',
		name: 'Español',
		flag: '🇪🇸'
	},
	{
		code: 'fr',
		name: 'Français',
		flag: '🇫🇷'
	},
	{
		code: 'pt',
		name: 'Português',
		flag: '🇵🇹'
	},
	{
		code: 'ru',
		name: 'Русский',
		flag: '🇷🇺'
	},
	{
		code: 'zh-cn',
		name: '中文 (简体)',
		flag: '🇨🇳'
	},
	{
		code: 'vi',
		name: 'Tiếng Việt',
		flag: '🇻🇳'
	},
	{
		code: 'tr',
		name: 'Türkçe',
		flag: '🇹🇷'
	}
];

export class LanguageManager {
	/**
	 * Get all supported languages
	 */
	static getSupportedLanguages(): LanguageConfig[] {
		return SUPPORTED_LANGUAGES;
	}

	/**
	 * Get language config by code
	 */
	static getLanguageByCode(code: AvailableLanguageTag): LanguageConfig | undefined {
		return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
	}

	/**
	 * Get language name by code
	 */
	static getLanguageName(code: AvailableLanguageTag): string {
		const lang = this.getLanguageByCode(code);
		return lang?.name || code;
	}

	/**
	 * Get language flag by code
	 */
	static getLanguageFlag(code: AvailableLanguageTag): string {
		const lang = this.getLanguageByCode(code);
		return lang?.flag || '🌐';
	}

	/**
	 * Check if language is supported
	 */
	static isLanguageSupported(code: string): code is AvailableLanguageTag {
		return SUPPORTED_LANGUAGES.some(lang => lang.code === code);
	}

	/**
	 * Get default language (English)
	 */
	static getDefaultLanguage(): AvailableLanguageTag {
		return 'en';
	}

	/**
	 * Get fallback language if requested language is not supported
	 */
	static getFallbackLanguage(requestedCode: string): AvailableLanguageTag {
		if (this.isLanguageSupported(requestedCode)) {
			return requestedCode as AvailableLanguageTag;
		}
		return this.getDefaultLanguage();
	}

	/**
	 * Get browser language or fallback to default
	 */
	static getBrowserLanguage(): AvailableLanguageTag {
		if (typeof window === 'undefined') {
			return this.getDefaultLanguage();
		}

		const browserLang = navigator.language.split('-')[0];
		return this.getFallbackLanguage(browserLang);
	}

	/**
	 * Get RTL languages
	 */
	static getRTLLanguages(): AvailableLanguageTag[] {
		// Currently none of the supported languages are RTL
		// This can be extended if needed
		return [];
	}

	/**
	 * Check if language is RTL
	 */
	static isRTLLanguage(code: AvailableLanguageTag): boolean {
		return this.getRTLLanguages().includes(code);
	}

	/**
	 * Get language codes as array
	 */
	static getLanguageCodes(): AvailableLanguageTag[] {
		return SUPPORTED_LANGUAGES.map(lang => lang.code);
	}

	/**
	 * Sort languages by name
	 */
	static getSortedLanguages(): LanguageConfig[] {
		return [...SUPPORTED_LANGUAGES].sort((a, b) => a.name.localeCompare(b.name));
	}

	/**
	 * Get languages grouped by region (for UI organization)
	 */
	static getLanguagesByRegion(): Record<string, LanguageConfig[]> {
		return {
			'Western': [
				SUPPORTED_LANGUAGES.find(l => l.code === 'en')!,
				SUPPORTED_LANGUAGES.find(l => l.code === 'es')!,
				SUPPORTED_LANGUAGES.find(l => l.code === 'fr')!,
				SUPPORTED_LANGUAGES.find(l => l.code === 'pt')!
			],
			'Asian': [
				SUPPORTED_LANGUAGES.find(l => l.code === 'zh-cn')!,
				SUPPORTED_LANGUAGES.find(l => l.code === 'vi')!
			],
			'Other': [
				SUPPORTED_LANGUAGES.find(l => l.code === 'ru')!,
				SUPPORTED_LANGUAGES.find(l => l.code === 'tr')!
			]
		};
	}
} 