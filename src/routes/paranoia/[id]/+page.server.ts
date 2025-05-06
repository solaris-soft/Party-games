import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	const hello = await fetch('/api/new-paranoia').then((res) => console.log(res));
	return { hello };
};