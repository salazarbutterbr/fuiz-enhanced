import { sequence } from '@sveltejs/kit/hooks';
import { handle as authHandle } from './auth';

export const handle = sequence(authHandle);

// Add proper error handling
export const handleError = ({ error, event }) => {
	console.error('Server error:', error);
	
	return {
		message: 'Internal server error',
		code: error?.code ?? 'UNKNOWN'
	};
};
