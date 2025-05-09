import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, url }) => {

    const roomId = params.id;
    const playerName = url.searchParams.get('name');
    if (!roomId) {
        throw error(400, 'Room ID is required');
    }
    if (!playerName) {
        redirect(302, '/murder');
    }

    return {
        roomId,
        playerName
    };
};
