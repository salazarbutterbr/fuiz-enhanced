import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const { gameId } = params;
	
	try {
		const response = await fetch(`/api/quiz/${gameId}`);
		const data = await response.json();
		
		if (data.success) {
			return {
				quiz: data.quiz
			};
		} else {
			return {
				quiz: null,
				error: data.error
			};
		}
	} catch (error) {
		return {
			quiz: null,
			error: 'Failed to load quiz'
		};
	}
};
