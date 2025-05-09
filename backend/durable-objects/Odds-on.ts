import { DurableObject } from 'cloudflare:workers';

type Player = {
  id: string;
  name: string;
  ready: boolean;
  questions: Question[];
  ws?: WebSocket;
}

type Question = {
  id: string;
  question: string;
  answer: string;
}

type Room = {
  id: string;
  players: Player[];
  questions: Question[];
}


export class OddsOn extends DurableObject {
  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
  }
}