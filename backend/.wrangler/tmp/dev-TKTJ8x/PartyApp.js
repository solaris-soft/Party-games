var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// PartyApp.ts
import { DurableObject, WorkerEntrypoint } from "cloudflare:workers";
var Paranoia = class extends DurableObject {
  static {
    __name(this, "Paranoia");
  }
  state;
  gameState;
  sessions;
  constructor(state, env) {
    super(state, env);
    this.state = state;
    this.sessions = /* @__PURE__ */ new Map();
    this.gameState = {
      rooms: [],
      games: []
    };
  }
  async initialize() {
    const stored = await this.state.storage.get("gameState");
    if (stored) {
      this.gameState = stored;
    }
  }
  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket", { status: 400 });
    }
    const { 0: client, 1: server } = new WebSocketPair();
    const roomId = new URL(request.url).searchParams.get("roomId");
    const playerId = new URL(request.url).searchParams.get("playerId");
    if (!roomId || !playerId) {
      return new Response("Missing roomId or playerId", { status: 400 });
    }
    await this.handleSession(server, roomId, playerId);
    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }
  async handleSession(ws, roomId, playerId) {
    ws.accept();
    this.sessions.set(playerId, ws);
    ws.addEventListener("message", async (msg) => {
      try {
        const data = JSON.parse(msg.data);
        await this.handleMessage(roomId, playerId, data);
      } catch (err) {
        ws.send(JSON.stringify({ error: "Invalid message format" }));
      }
    });
    ws.addEventListener("close", () => {
      this.sessions.delete(playerId);
      this.handlePlayerDisconnect(roomId, playerId);
    });
  }
  async handleMessage(roomId, playerId, data) {
    switch (data.type) {
      case "join":
        await this.handleJoinRoom(roomId, playerId, data.name);
        break;
      default:
        const room = this.gameState.rooms.find((r) => r.id === roomId);
        if (!room) return;
        switch (data.type) {
          case "ready":
            await this.handlePlayerReady(roomId, playerId);
            break;
          case "submit_question":
            await this.handleSubmitQuestion(roomId, playerId, data.question);
            break;
          case "submit_answer":
            await this.handleSubmitAnswer(roomId, playerId, data.answer);
            break;
          case "flip_coin":
            await this.handleCoinFlip(roomId, playerId);
            break;
        }
    }
  }
  async handleJoinRoom(roomId, playerId, name) {
    let room = this.gameState.rooms.find((r) => r.id === roomId);
    if (!room) {
      room = {
        id: roomId,
        players: [],
        game: {
          id: roomId,
          players: [],
          currentPlayer: null,
          currentQuestion: null,
          currentAnswer: null,
          coinFlipper: null,
          currentRound: 0,
          status: "waiting"
        }
      };
      this.gameState.rooms.push(room);
    }
    const player = {
      id: playerId,
      name,
      ready: false
    };
    room.players.push(player);
    room.game.players.push(player);
    const ws = this.sessions.get(playerId);
    if (ws) {
      ws.send(JSON.stringify({
        type: "players_list",
        players: room.players
      }));
    }
    await this.broadcastToRoom(roomId, {
      type: "player_joined",
      player
    }, [playerId]);
    await this.saveState();
  }
  async handlePlayerReady(roomId, playerId) {
    const room = this.gameState.rooms.find((r) => r.id === roomId);
    if (!room) return;
    const player = room.players.find((p) => p.id === playerId);
    if (!player) return;
    player.ready = true;
    await this.broadcastToRoom(roomId, {
      type: "player_ready",
      playerId
    });
    if (room.players.every((p) => p.ready)) {
      await this.startNewRound(room);
    }
    await this.saveState();
  }
  async startNewRound(room) {
    const randomPlayer = room.players[Math.floor(Math.random() * room.players.length)];
    const randomFlipper = room.players[Math.floor(Math.random() * room.players.length)];
    room.game.currentPlayer = randomPlayer;
    room.game.coinFlipper = randomFlipper;
    room.game.currentRound++;
    room.game.status = "answering";
    await this.broadcastToRoom(room.id, {
      type: "round_start",
      currentPlayer: randomPlayer,
      coinFlipper: randomFlipper,
      round: room.game.currentRound
    });
  }
  async handleSubmitQuestion(roomId, playerId, question) {
    const room = this.gameState.rooms.find((r) => r.id === roomId);
    if (!room || room.game.currentPlayer?.id !== playerId) return;
    room.game.currentQuestion = question;
    room.game.status = "flipping";
    await this.broadcastToRoom(roomId, {
      type: "question_submitted",
      question
    });
    await this.saveState();
  }
  async handleSubmitAnswer(roomId, playerId, answer) {
    const room = this.gameState.rooms.find((r) => r.id === roomId);
    if (!room || room.game.currentPlayer?.id !== playerId) return;
    const answerPlayer = room.players.find((p) => p.id === answer);
    if (!answerPlayer) return;
    room.game.currentAnswer = answerPlayer;
    await this.broadcastToRoom(roomId, {
      type: "answer_submitted",
      answer: answerPlayer
    });
    await this.saveState();
  }
  async handleCoinFlip(roomId, playerId) {
    const room = this.gameState.rooms.find((r) => r.id === roomId);
    if (!room || room.game.coinFlipper?.id !== playerId) return;
    const isHeads = Math.random() < 0.5;
    room.game.status = "revealing";
    await this.broadcastToRoom(roomId, {
      type: "coin_flip",
      result: isHeads,
      question: isHeads ? room.game.currentQuestion : null,
      answer: room.game.currentAnswer
    });
    room.game.currentQuestion = null;
    room.game.currentAnswer = null;
    room.game.status = "waiting";
    await this.saveState();
  }
  async handlePlayerDisconnect(roomId, playerId) {
    const room = this.gameState.rooms.find((r) => r.id === roomId);
    if (!room) return;
    room.players = room.players.filter((p) => p.id !== playerId);
    room.game.players = room.game.players.filter((p) => p.id !== playerId);
    if (room.players.length === 0) {
      this.gameState.rooms = this.gameState.rooms.filter((r) => r.id !== roomId);
    } else {
      await this.broadcastToRoom(roomId, {
        type: "player_left",
        playerId
      });
    }
    await this.saveState();
  }
  async broadcastToRoom(roomId, message, excludePlayerIds = []) {
    const room = this.gameState.rooms.find((r) => r.id === roomId);
    if (!room) return;
    for (const player of room.players) {
      if (excludePlayerIds.includes(player.id)) continue;
      const ws = this.sessions.get(player.id);
      if (ws) {
        ws.send(JSON.stringify(message));
      }
    }
  }
  async saveState() {
    await this.state.storage.put("gameState", this.gameState);
  }
};
var PartyApp = class extends WorkerEntrypoint {
  static {
    __name(this, "PartyApp");
  }
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/ws") {
      const roomId = url.searchParams.get("roomId");
      if (!roomId) {
        return new Response("Missing roomId", { status: 400 });
      }
      const id = this.env.PARANOIA.idFromName(roomId);
      const room = this.env.PARANOIA.get(id);
      return room.fetch(request);
    }
    return new Response("Not found", { status: 404 });
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-OEQody/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = PartyApp;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-OEQody/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  Paranoia,
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=PartyApp.js.map
