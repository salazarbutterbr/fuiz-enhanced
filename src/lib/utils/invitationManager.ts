import type { AvailableLanguageTag, IdlessFuizConfig } from '$lib/types';

export class InvitationManager {
	/**
	 * Generate a unique game ID
	 */
	static generateGameId(): string {
		return Math.random().toString(36).substring(2, 8).toUpperCase();
	}

	/**
	 * Create an invitation link for a quiz
	 */
	static createInvitationLink(gameId: string, baseUrl: string = window.location.origin): string {
		return `${baseUrl}/play/${gameId}`;
	}

	/**
	 * Create a QR code URL for easy mobile access
	 */
	static createQRCodeUrl(invitationLink: string): string {
		return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(invitationLink)}`;
	}

	/**
	 * Generate invitation text for sharing
	 */
	static generateInvitationText(
		quizTitle: string,
		gameId: string,
		availableLanguages: AvailableLanguageTag[],
		invitationLink: string
	): string {
		const languageList = availableLanguages
			.map(lang => {
				const langNames: Record<string, string> = {
					'en': 'English',
					'es': 'Spanish',
					'fr': 'French',
					'pt': 'Portuguese',
					'ru': 'Russian',
					'zh-cn': 'Chinese',
					'vi': 'Vietnamese',
					'tr': 'Turkish'
				};
				return langNames[lang] || lang;
			})
			.join(', ');

		return `🎯 Join my quiz: "${quizTitle}"

🌍 Available in: ${languageList}
🎮 Game ID: ${gameId}
🔗 Join here: ${invitationLink}

Select your preferred language when joining!`;
	}

	/**
	 * Share invitation via Web Share API (mobile) or copy to clipboard
	 */
	static async shareInvitation(
		quizTitle: string,
		gameId: string,
		availableLanguages: AvailableLanguageTag[],
		invitationLink: string
	): Promise<void> {
		const invitationText = this.generateInvitationText(quizTitle, gameId, availableLanguages, invitationLink);

		// Try Web Share API first (mobile devices)
		if (navigator.share) {
			try {
				await navigator.share({
					title: `Join my quiz: ${quizTitle}`,
					text: invitationText,
					url: invitationLink
				});
				return;
			} catch (error) {
				console.log('Web Share API failed, falling back to clipboard');
			}
		}

		// Fallback to clipboard
		try {
			await navigator.clipboard.writeText(invitationText);
			alert('Invitation link copied to clipboard!');
		} catch (error) {
			// Fallback for older browsers
			const textArea = document.createElement('textarea');
			textArea.value = invitationText;
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand('copy');
			document.body.removeChild(textArea);
			alert('Invitation link copied to clipboard!');
		}
	}

	/**
	 * Create a simple invitation card HTML
	 */
	static createInvitationCard(
		quizTitle: string,
		gameId: string,
		availableLanguages: AvailableLanguageTag[],
		invitationLink: string
	): string {
		const languageFlags: Record<string, string> = {
			'en': '🇺🇸',
			'es': '🇪🇸',
			'fr': '🇫🇷',
			'pt': '🇵🇹',
			'ru': '🇷🇺',
			'zh-cn': '🇨🇳',
			'vi': '🇻🇳',
			'tr': '🇹🇷'
		};

		const languageList = availableLanguages
			.map(lang => `${languageFlags[lang]} ${lang.toUpperCase()}`)
			.join(' ');

		return `
			<div style="
				background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
				color: white;
				padding: 20px;
				border-radius: 12px;
				text-align: center;
				font-family: Arial, sans-serif;
				max-width: 400px;
				margin: 20px auto;
			">
				<h2 style="margin: 0 0 10px 0; font-size: 24px;">🎯 Quiz Invitation</h2>
				<h3 style="margin: 0 0 15px 0; font-size: 18px;">${quizTitle}</h3>
				<div style="margin: 15px 0; font-size: 14px;">
					🌍 Available Languages:<br>
					${languageList}
				</div>
				<div style="margin: 15px 0; padding: 10px; background: rgba(255,255,255,0.2); border-radius: 8px;">
					<strong>Game ID:</strong> ${gameId}
				</div>
				<a href="${invitationLink}" style="
					display: inline-block;
					background: #4CAF50;
					color: white;
					padding: 12px 24px;
					text-decoration: none;
					border-radius: 6px;
					font-weight: bold;
					margin-top: 10px;
				">
					🎮 Join Quiz
				</a>
			</div>
		`;
	}

	/**
	 * Validate game ID format
	 */
	static isValidGameId(gameId: string): boolean {
		return /^[A-Z0-9]{6}$/.test(gameId);
	}

	/**
	 * Extract game ID from URL
	 */
	static extractGameIdFromUrl(url: string): string | null {
		const match = url.match(/\/play\/([A-Z0-9]{6})/);
		return match ? match[1] : null;
	}
} 