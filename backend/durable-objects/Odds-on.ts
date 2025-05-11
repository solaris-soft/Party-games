import { DurableObject } from 'cloudflare:workers';

type Player = {
  id: string;
  name: string;
  ready: boolean;
  secrets: Secret[];
  ws?: WebSocket;
}

type Secret = {
  id: string;
  secret: string;
  playerName: string;
}

type Room = {
  id: string;
  players: Player[];
  game: Game;
}

type Game = {
  id: string;
  players: Player[];
  secrets: Secret[];
  currentPlayer: Player | null;
  votes: Map<string, string>;
  currentRound: number;
  currentPhase: 'waiting' | 'voting' | 'answer' | 'results';
}

type GameState = {
  rooms: Room[];
}

export class OddsOn extends DurableObject<Env> {
  private state: DurableObjectState;
  private gameState: GameState;
  private sessions: Map<string, WebSocket>;

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
    this.state = state;
    this.sessions = new Map<string, WebSocket>();
    this.gameState = {
      rooms: []
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
    const url = new URL(request.url);
    const roomId = url.searchParams.get('roomId');
    const playerId = url.searchParams.get('playerId');

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
          case 'submit_secret':
            await this.handleSubmitSecret(roomId, playerId, data.secret);
            break;
          case 'vote':
            await this.handleVote(roomId, playerId, data.votedPlayerId);
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
          secrets: [],
          currentPlayer: null,
          votes: new Map(),
          currentRound: 0,
          currentPhase: 'waiting'
        }
      };
      this.gameState.rooms.push(room);
    }

    // Check for duplicate name
    if (room.players.some(p => p.name === name)) {
      const ws = this.sessions.get(playerId);
      if (ws) {
        ws.send(JSON.stringify({
          type: 'error',
          error: 'name_exists'
        }));
        ws.close(1000, 'Duplicate name');
        this.sessions.delete(playerId);
      }
      return;
    }

    const player: Player = {
      id: playerId,
      name,
      ready: false,
      secrets: []
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

    await this.broadcastToRoom(roomId, {
      type: 'players_list',
      players: room.players
    });

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

    if (room.players.every(p => p.ready) && room.game.currentPhase === 'waiting') {
      await this.startNewRound(room);
    }
    await this.saveState();
  }

  private async handleSubmitSecret(roomId: string, playerId: string, secret: string) {
    const room = this.gameState.rooms.find(r => r.id === roomId);
    if (!room) return;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return;

    const newSecret: Secret = {
      id: crypto.randomUUID(),
      secret,
      playerName: player.name
    };

    player.secrets.push(newSecret);
    room.game.secrets.push(newSecret);

    await this.broadcastToRoom(roomId, {
      type: 'secret_submitted',
      playerId
    });

    // Check if all players have submitted their secrets
    if (room.players.every(p => p.secrets.length > 0)) {
      await this.startNewRound(room);
    }
    await this.saveState();
  }

  private async startNewRound(room: Room) {
    if (room.game.secrets.length === 0) return;

    // Select random secret
    const randomIndex = Math.floor(Math.random() * room.game.secrets.length);
    const selectedSecret = room.game.secrets[randomIndex];
    
    // Remove the selected secret from the pool
    room.game.secrets.splice(randomIndex, 1);
    
    const currentPlayer = room.players.find(p => p.name === selectedSecret.playerName);
    if (!currentPlayer) return;
    
    room.game.currentPlayer = currentPlayer;
    room.game.currentRound++;
    room.game.currentPhase = 'voting';
    room.game.votes.clear();

    // Reset all players' ready status
    room.players.forEach(player => {
      player.ready = false;
    });

    await this.broadcastToRoom(room.id, {
      type: 'round_start',
      secret: selectedSecret.secret,
      round: room.game.currentRound,
      phase: room.game.currentPhase
    });
  }

  private async handleVote(roomId: string, playerId: string, votedPlayerId: string) {
    const room = this.gameState.rooms.find(r => r.id === roomId);
    if (!room || room.game.currentPhase !== 'voting') return;

    const voter = room.players.find(p => p.id === playerId);
    const votedPlayer = room.players.find(p => p.id === votedPlayerId);
    if (!voter || !votedPlayer) return;

    room.game.votes.set(playerId, votedPlayerId);

    // Check if all players have voted
    if (room.game.votes.size === room.players.length) {
      await this.resolveVoting(room);
    }
  }

  private async resolveVoting(room: Room) {
    // Count votes
    const voteCount = new Map<string, number>();
    for (const [_, votedId] of room.game.votes) {
      voteCount.set(votedId, (voteCount.get(votedId) || 0) + 1);
    }

    // Find player with most votes
    let maxVotes = 0;
    let mostVotedPlayer: Player | null = null;
    for (const [playerId, votes] of voteCount) {
      if (votes > maxVotes) {
        maxVotes = votes;
        mostVotedPlayer = room.players.find(p => p.id === playerId) || null;
      }
    }

    if (!mostVotedPlayer || !room.game.currentPlayer) return;

    // Check if the most voted player is the one who submitted the secret
    const isCorrect = mostVotedPlayer.id === room.game.currentPlayer.id;

    room.game.currentPhase = 'results';

    await this.broadcastToRoom(room.id, {
      type: 'voting_results',
      mostVotedPlayer: mostVotedPlayer,
      isCorrect,
      secretOwner: room.game.currentPlayer
    });

    // Wait for 5 seconds before moving to next phase
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Move to answer phase
    room.game.currentPhase = 'answer';
    await this.broadcastToRoom(room.id, {
      type: 'phase_change',
      phase: 'answer'
    });

    // Wait for all players to be ready
    room.players.forEach(player => {
      player.ready = false;
    });

    await this.broadcastToRoom(room.id, {
      type: 'waiting_for_ready',
      players: room.players
    });
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

    const messageStr = JSON.stringify(message);
    for (const player of room.players) {
      if (!excludePlayerIds.includes(player.id)) {
        const ws = this.sessions.get(player.id);
        if (ws) {
          ws.send(messageStr);
        }
      }
    }
  }

  private async saveState() {
    await this.state.storage.put('gameState', this.gameState);
  }
} 