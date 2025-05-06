import { DurableObject } from 'cloudflare:workers';

type Env = {
    paranoia: DurableObjectNamespace<Paranoia>
}

export class Paranoia extends DurableObject<Env> {
     constructor(ctx: DurableObjectState, env: Env) {
       super(ctx, env);
     }
     async sayHello(): Promise<string> {
        return "hello"
     }
}


// Worker
export default {
  async fetch(request, env) {
    // Every unique ID refers to an individual instance of the Durable Object class
    const id = env.paranoia.idFromName("foo");

    // A stub is a client used to invoke methods on the Durable Object
    const stub = env.paranoia.get(id);

    // Methods on the Durable Object are invoked via the stub
    const rpcResponse = await stub.sayHello();

    return new Response(rpcResponse);
  },
} satisfies ExportedHandler<Env>;