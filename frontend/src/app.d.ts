import { Service } from 'cloudflare:workers';

declare global {
    namespace App {
        interface Platform {
            env: {
                COUNTER: DurableObjectNamespace;
                PARTY_APP: Service<{
                    getParanoiaMessage(): Promise<string>;
                }>;
            };
            context: {
                waitUntil(promise: Promise): void;
            };
            caches: CacheStorage & { default: Cache }
        }
    }
}

export {};