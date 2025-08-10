import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// In-memory storage for demos (replace with database in production)
let quizzes = new Map();
let quizCounter = 1;

export const POST: RequestHandler = async ({ request }) => {
	try {
		const quizData = await request.json();
		
		// Validate required fields
		if (!quizData.title?.trim()) {
			return json({ success: false, error: 'Quiz title is required' }, { status: 400 });
		}
		
		if (!quizData.slides || quizData.slides.length === 0) {
			return json({ success: false, error: 'At least one question is required' }, { status: 400 });
		}
		
		// Generate unique game ID
		const gameId = `GAME${String(quizCounter).padStart(4, '0')}`;
		quizCounter++;
		
		// Create quiz object
		const quiz = {
			id: `quiz_${Date.now()}`,
			gameId,
			title: quizData.title,
			description: quizData.description || '',
			primaryLanguage: quizData.primaryLanguage || 'en',
			availableLanguages: quizData.availableLanguages || ['en'],
			maxParticipants: quizData.maxParticipants || 500,
			slides: quizData.slides.map((slide: any, index: number) => ({
				...slide,
				id: `slide_${index}`,
				order: index
			})),
			createdAt: new Date().toISOString(),
			isActive: false,
			participants: []
		};
		
		// Store quiz
		quizzes.set(gameId, quiz);
		
		return json({
			success: true,
			quiz: {
				gameId: quiz.gameId,
				title: quiz.title,
				slides: quiz.slides
			}
		});
		
	} catch (error) {
		console.error('Error creating quiz:', error);
		return json({ success: false, error: 'Failed to create quiz' }, { status: 500 });
	}
};
