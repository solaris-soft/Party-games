import { WorkerEntrypoint } from "cloudflare:workers";
import {Paranoia} from "./Paranoia";

type Env = {
    PARANOIA: DurableObjectNamespace<Paranoia> 
  } 


// Worker
export default class PartyApp extends WorkerEntrypoint<Env> {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle WebSocket connections
    if (url.pathname === '/ws/paranoia') {
      const roomId = url.searchParams.get('roomId');
      if (!roomId) {
        return new Response('Missing roomId', { status: 400 });
      }

      const id = this.env.PARANOIA.idFromName(roomId);
      const room = this.env.PARANOIA.get(id);
      return room.fetch(request);
    }

    // Handle other requests
    return new Response('Not found', { status: 404 });
  }
} 

export { Paranoia };