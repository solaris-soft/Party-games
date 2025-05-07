import { DurableObject, WorkerEntrypoint } from 'cloudflare:workers';

type Env = {
    PARANOIA: DurableObjectNamespace<Paranoia> 
} 

export class Paranoia extends DurableObject<Env> {
     constructor(ctx: DurableObjectState, env: Env) {
       super(ctx, env);
     }
     async sayHello(): Promise<string> {
        return "Goodbye"
     }
}

// Worker
export default class PartyApp extends WorkerEntrypoint<Env> {
  // Add an RPC method that can be called via service binding
  async getParanoiaMessage(): Promise<string> {
    const id = this.env.PARANOIA.idFromName("foo");
    const stub = this.env.PARANOIA.get(id);
    return await stub.sayHello();
  }

  async fetch(request: Request): Promise<Response> {
    // Every unique ID refers to an individual instance of the Durable Object class
    const id = this.env.PARANOIA.idFromName("foo");

    // A stub is a client used to invoke methods on the Durable Object
    const stub = this.env.PARANOIA.get(id);

    // Methods on the Durable Object are invoked via the stub
    const rpcResponse = await stub.sayHello();

    return new Response(rpcResponse);
  }
} 