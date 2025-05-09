import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {


	const roomId = params.id;
	if (!roomId) {
		throw error(400, 'Room ID is required');
	}

	try {
		// Return the room ID and service binding for client-side use
		return {
			roomId,
		};
	} catch (err) {
		console.error('Error initializing game room:', err);
		throw error(500, 'Failed to initialize game room');
	}
};
