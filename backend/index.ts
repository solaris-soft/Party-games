import { WorkerEntrypoint } from "cloudflare:workers";
import {Paranoia} from "./Paranoia";
import {Murder} from "./Murder";

type Env = {
    PARANOIA: DurableObjectNamespace<Paranoia> 
    MURDER: DurableObjectNamespace<Murder>
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

    if (url.pathname === '/ws/murder') {
      const roomId = url.searchParams.get('roomId');
      if (!roomId) {
        return new Response('Missing roomId', { status: 400 });
      }

      const id = this.env.MURDER.idFromName(roomId);
      const room = this.env.MURDER.get(id);
      return room.fetch(request);
    }

    // Handle other requests
    return new Response('Not found', { status: 404 });
  }
} 

export { Paranoia, Murder };