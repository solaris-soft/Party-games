import { Service } from 'cloudflare:workers';
import { Paranoia } from '../backend/PartyApp';

declare global {
    namespace App {
        interface Platform {
            env: {
                COUNTER: DurableObjectNamespace;
                PARTY_APP: DurableObjectNamespace;
                PARANOIA: DurableObjectNamespace<Paranoia>;
            };
            context: {
                waitUntil(promise: Promise): void;
            };
            caches: CacheStorage & { default: Cache }
        }
    }
}

export {};