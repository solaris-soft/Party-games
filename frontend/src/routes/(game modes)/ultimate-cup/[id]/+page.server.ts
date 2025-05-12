import { goto } from '$app/navigation';
import type { PageServerLoad } from './$types';  

export const load: PageServerLoad = async ({ params, url }) => {
	const { id } = params;
	const playerName = url.searchParams.get('playerName');

	if (!playerName) {
		goto(`/ultimate-cup?returnTo=${id}`);
	}

	return {
		roomID: id,
		playerName,
	};
};