// Simplified auth for Railway deployment
export const handle = async ({ event, resolve }) => {
	// Simple pass-through for now
	return resolve(event);
};
