import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// In-memory storage (same as create endpoint)
let quizzes = new Map();

export const GET: RequestHandler = async ({ params }) => {
	try {
		const { gameId } = params;
		
		// For demo purposes, create a sample quiz if none exists
		if (!quizzes.has(gameId)) {
			// Create a demo quiz
			const demoQuiz = {
				id: `quiz_${Date.now()}`,
				gameId,
				title: 'Demo Quiz',
				description: 'A sample quiz for testing',
				primaryLanguage: 'en',
				availableLanguages: ['en'],
				maxParticipants: 500,
				slides: [
					{
						id: 'slide_0',
						type: 'multiple_choice',
						title: 'What is 2 + 2?',
						content: {
							question: 'What is 2 + 2?',
							answers: [
								{ content: { Text: '3' }, correct: false },
								{ content: { Text: '4' }, correct: true },
								{ content: { Text: '5' }, correct: false },
								{ content: { Text: '6' }, correct: false }
							]
						},
						timeLimit: 30,
						points: 10,
						order: 0
					},
					{
						id: 'slide_1',
						type: 'multiple_choice',
						title: 'What is the capital of France?',
						content: {
							question: 'What is the capital of France?',
							answers: [
								{ content: { Text: 'London' }, correct: false },
								{ content: { Text: 'Berlin' }, correct: false },
								{ content: { Text: 'Paris' }, correct: true },
								{ content: { Text: 'Madrid' }, correct: false }
							]
						},
						timeLimit: 30,
						points: 10,
						order: 1
					}
				],
				createdAt: new Date().toISOString(),
				isActive: false,
				participants: []
			};
			
			quizzes.set(gameId, demoQuiz);
		}
		
		const quiz = quizzes.get(gameId);
		
		if (!quiz) {
			return json({ success: false, error: 'Quiz not found' }, { status: 404 });
		}
		
		return json({
			success: true,
			quiz
		});
		
	} catch (error) {
		console.error('Error getting quiz:', error);
		return json({ success: false, error: 'Failed to get quiz' }, { status: 500 });
	}
};
