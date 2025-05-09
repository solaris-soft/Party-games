import { WorkerEntrypoint } from "cloudflare:workers";
import {Paranoia} from "./durable-objects/Paranoia";
import {Murder} from "./durable-objects/Murder";
import {OddsOn} from "./durable-objects/Odds-on";

type Env = {
    PARANOIA: DurableObjectNamespace<Paranoia> 
    MURDER: DurableObjectNamespace<Murder>
    ODDS_ON: DurableObjectNamespace<OddsOn>
  } 

var routes = [
  {
    path: '/ws/paranoia',
    namespace: 'PARANOIA' as keyof Env
  },
  {
    path: '/ws/murder',
    namespace: 'MURDER' as keyof Env
  },
  {
    path: '/ws/odds-on',
    namespace: 'ODDS_ON' as keyof Env
  }
]


// Worker
export default class PartyApp extends WorkerEntrypoint<Env> {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    for (var route of routes) {
      if (url.pathname === route.path) {
        const roomId = url.searchParams.get('roomId');
        if (!roomId) {
          return new Response('Missing roomId', { status: 400 });
        }

        const id = this.env[route.namespace].idFromName(roomId);
        const room = this.env[route.namespace].get(id);
        return room.fetch(request);
      }
    }

    // Handle other requests
    return new Response('Not found', { status: 404 });
  }
} 

export { Paranoia, Murder, OddsOn };