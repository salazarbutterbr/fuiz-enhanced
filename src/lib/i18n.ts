// Simplified i18n without paraglide
export const i18n = {
	handle: () => {
		return async ({ event, resolve }) => {
			// Set default language
			event.locals.lang = 'en';
			return resolve(event);
		};
	},
	resolveRoute: (route: string) => route
};
