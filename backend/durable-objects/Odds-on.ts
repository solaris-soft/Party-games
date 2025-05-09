import { DurableObject } from 'cloudflare:workers';

export class OddsOn extends DurableObject {
  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
  }
}