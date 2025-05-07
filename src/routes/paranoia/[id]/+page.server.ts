import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, platform }) => {
	if (!platform?.env.PARTY_APP) {
		return { error: 'Service binding not available' };
	}

	try {
		const message = await platform.env.PARTY_APP.getParanoiaMessage();
		return { hello: message };
	} catch (error) {
		console.error('Error calling service binding:', error);
		return { error: 'Failed to get message' };
	}
};