import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, url }) => {
  const { id } = params;
  const playerName = url.searchParams.get('playerName');
  
  if (!playerName) {
    // Redirect to setup page with return URL
    const returnUrl = encodeURIComponent(`/odds-on/${id}`);
    throw redirect(302, `/odds-on?returnTo=${returnUrl}`);
  }

  return { id, playerName };
};
