import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
  const { id } = params;
  const playerName = url.searchParams.get('playerName');
  if (!playerName) {
    throw ;
  }

  return { id, playerName };
};
