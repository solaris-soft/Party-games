import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform }) => {
    console.log('API endpoint called');
    console.log('Platform:', platform);
    console.log('Environment:', platform?.env);

    if (!platform?.env.PARTY_APP) {
        console.error('Service binding PARTY_APP not found in environment');
        return json({ error: 'Service binding not available' }, { status: 500 });
    }

    try {
        console.log('Attempting to call service binding...');
        const message = await platform.env.PARTY_APP.getParanoiaMessage();
        console.log('Received message:', message);
        return json({ message });
    } catch (error) {
        console.error('Error calling service binding:', error);
        return json({ error: 'Failed to get message' }, { status: 500 });
    }
}; 