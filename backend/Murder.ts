import { DurableObject } from 'cloudflare:workers';

type Player = {
  id: string;
  name: string;
  ready: boolean;
  ws?: WebSocket;
}

type Room = {
  id: string;
  players: Player[];
  game: Game;
}

type Game = {
  id: string;
  players: Player[];
  murderer: Player | null;
  victims: Player[];
  votes: Map<Player, Player>;
  currentRound: number;
  status: 'murder' | 'voting' | 'revealing';
}

type GameState = {
  rooms: Room[];
  games: Game[];
}

export class Murder extends DurableObject<Env> {
  private state: DurableObjectState;
  private gameState: GameState;
  private sessions: Map<string, WebSocket>;

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
    this.state = state;
    this.sessions = new Map();
    this.gameState = {
      rooms: [],
      games: []
    };
  }

  async initialize() {
    const stored = await this.state.storage.get<GameState>('gameState');
    if (stored) {
      this.gameState = stored;
    }
  }

  async fetch(request: Request) {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket', { status: 400 });
    }

    const { 0: client, 1: server } = new WebSocketPair();
    const roomId = new URL(request.url).searchParams.get('roomId');
    const playerId = new URL(request.url).searchParams.get('playerId');

    if (!roomId || !playerId) {
      return new Response('Missing roomId or playerId', { status: 400 });
    }

    await this.handleSession(server, roomId, playerId);
    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  private async handleSession(ws: WebSocket, roomId: string, playerId: string) {
    ws.accept();
    this.sessions.set(playerId, ws);

    ws.addEventListener('message', async (msg) => {
      try {
        const data = JSON.parse(msg.data as string);
        await this.handleMessage(roomId, playerId, data);
      } catch (err) {
        ws.send(JSON.stringify({ error: 'Invalid message format' }));
      }
    });

    ws.addEventListener('close', () => {
      this.sessions.delete(playerId);
      this.handlePlayerDisconnect(roomId, playerId);
    });
  }

  private async handleMessage(roomId: string, playerId: string, data: any) {
    switch (data.type) {
      case 'join':
        await this.handleJoinRoom(roomId, playerId, data.name);
        break;
      default:
        const room = this.gameState.rooms.find(r => r.id === roomId);
        if (!room) return;

        switch (data.type) {
          case 'ready':
            await this.handlePlayerReady(roomId, playerId);
            break;
          case 'submit_question':
            await this.handleSubmitQuestion(roomId, playerId, data.question);
            break;
          case 'submit_answer':
            await this.handleSubmitAnswer(roomId, playerId, data.answer);
            break;
          case 'flip_coin':
            await this.handleCoinFlip(roomId, playerId);
            break;
        }
    }
  }

  private async handleJoinRoom(roomId: string, playerId: string, name: string) {
    let room = this.gameState.rooms.find(r => r.id === roomId);
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
          status: 'waiting',
          questionAsker: null
        }
      };
      this.gameState.rooms.push(room);
    }

    const player: Player = {
      id: playerId,
      name,
      ready: false
    };

    room.players.push(player);
    room.game.players.push(player);

    // Send current players list to the new player
    const ws = this.sessions.get(playerId);
    if (ws) {
      ws.send(JSON.stringify({
        type: 'players_list',
        players: room.players
      }));
    }

    // Notify other players about the new player
    await this.broadcastToRoom(roomId, {
      type: 'player_joined',
      player
    }, [playerId]); // Exclude the new player from this broadcast

    await this.saveState();
  }

  private async handlePlayerReady(roomId: string, playerId: string) {
    const room = this.gameState.rooms.find(r => r.id === roomId);
    if (!room) return;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return;

    player.ready = true;
    await this.broadcastToRoom(roomId, {
      type: 'player_ready',
      playerId
    });

    // Check if all players are ready and we're in waiting state
    if (room.players.every(p => p.ready) && room.game.status === 'waiting') {
      await this.startNewRound(room);
    }
    await this.saveState();
  }

  private async startNewRound(room: Room) {
    // Select random player to be asked
    const randomPlayer = room.players[Math.floor(Math.random() * room.players.length)];
    // Select random player to ask the question (different from the one being asked)
    let questionAsker;
    do {
      questionAsker = room.players[Math.floor(Math.random() * room.players.length)];
    } while (questionAsker.id === randomPlayer.id);
    
    room.game.currentPlayer = randomPlayer;
    room.game.questionAsker = questionAsker;
    room.game.currentRound++;
    room.game.status = 'answering';

    await this.broadcastToRoom(room.id, {
      type: 'round_start',
      currentPlayer: randomPlayer,
      questionAsker: questionAsker,
      round: room.game.currentRound
    });
  }

  private async handleMurder(roomId: string, playerId: string, question: string) {
    const room = this.gameState.rooms.find(r => r.id === roomId);
    if (!room || room.game.questionAsker?.id !== playerId) return;

    room.game.currentQuestion = question;
    room.game.status = 'answering';
    await this.broadcastToRoom(roomId, {
      type: 'question_submitted',
      question
    });
    await this.saveState();
  }

  private async handleVoting(roomId: string, playerId: string, answer: string) {
    const room = this.gameState.rooms.find(r => r.id === roomId);
    if (!room || room.game.currentPlayer?.id !== playerId) return;

    const answerPlayer = room.players.find(p => p.id === answer);
    if (!answerPlayer) return;

    room.game.currentAnswer = answerPlayer;
    room.game.status = 'flipping';
    
    // Select random player to flip the coin
    let coinFlipper;
    do {
      coinFlipper = room.players[Math.floor(Math.random() * room.players.length)];
    } while (coinFlipper.id === playerId || coinFlipper.id === answer);
    
    room.game.coinFlipper = coinFlipper;

    await this.broadcastToRoom(roomId, {
      type: 'answer_submitted',
      answer: answerPlayer,
      coinFlipper: coinFlipper
    });
    await this.saveState();
  }


  private async handlePlayerDisconnect(roomId: string, playerId: string) {
    const room = this.gameState.rooms.find(r => r.id === roomId);
    if (!room) return;

    room.players = room.players.filter(p => p.id !== playerId);
    room.game.players = room.game.players.filter(p => p.id !== playerId);

    if (room.players.length === 0) {
      this.gameState.rooms = this.gameState.rooms.filter(r => r.id !== roomId);
    } else {
      await this.broadcastToRoom(roomId, {
        type: 'player_left',
        playerId
      });
    }
    await this.saveState();
  }

  private async broadcastToRoom(roomId: string, message: any, excludePlayerIds: string[] = []) {
    const room = this.gameState.rooms.find(r => r.id === roomId);
    if (!room) return;

    for (const player of room.players) {
      if (excludePlayerIds.includes(player.id)) continue;
      const ws = this.sessions.get(player.id);
      if (ws) {
        ws.send(JSON.stringify(message));
      }
    }
  }

  private async saveState() {
    await this.state.storage.put('gameState', this.gameState);
  }
}