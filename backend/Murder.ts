import { DurableObject } from 'cloudflare:workers';

type Player = {
  id: string;
  name: string;
  ready: boolean;
  isMurderer: boolean;
  isAlive: boolean;
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
  votes: Map<string, string>; // Map of voterId to votedPlayerId
  currentRound: number;
  phase: 'waiting' | 'voting' | 'murder' | 'revealing';
  eliminatedPlayers: Player[];
}

type GameState = {
  rooms: Room[];
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
          case 'vote':
            await this.handleVote(roomId, playerId, data.votedPlayerId);
            break;
          case 'murder':
            await this.handleMurder(roomId, playerId, data.targetPlayerId);
            break;
        }
    }
  }

  private async handleJoinRoom(roomId: string, playerId: string, name: string) {
    console.log(`Handling join room: roomId=${roomId}, playerId=${playerId}, name=${name}`);
    
    let room = this.gameState.rooms.find(r => r.id === roomId);
    if (!room) {
      room = {
        id: roomId,
        players: [],
        game: {
          id: roomId,
          players: [],
          murderer: null,
          victims: [],
          votes: new Map(),
          currentRound: 0,
          phase: 'waiting',
          eliminatedPlayers: []
        }
      };
      this.gameState.rooms.push(room);
    }

    // Remove any existing player with this ID to prevent duplicates
    room.players = room.players.filter(p => p.id !== playerId);
    room.game.players = room.game.players.filter(p => p.id !== playerId);

    const player: Player = {
      id: playerId,
      name,
      ready: false,
      isMurderer: false,
      isAlive: true
    };

    console.log('Adding player to room:', player);
    room.players.push(player);
    room.game.players.push(player);

    // Send current players list to the new player
    const ws = this.sessions.get(playerId);
    if (ws) {
      console.log('Sending players list to new player:', room.players);
      ws.send(JSON.stringify({
        type: 'players_list',
        players: room.players
      }));
    }

    // Send updated players list to all players in the room
    console.log('Broadcasting updated players list to all players:', room.players);
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

    if (room.players.every(p => p.ready) && room.game.phase === 'waiting') {
      await this.startNewGame(room);
    }
    await this.saveState();
  }

  private async startNewGame(room: Room) {
    // Select random murderer
    const murdererIndex = Math.floor(Math.random() * room.players.length);
    const murderer = room.players[murdererIndex];
    murderer.isMurderer = true;
    room.game.murderer = murderer;

    room.game.phase = 'voting';
    room.game.currentRound = 1;

    // Notify all players about game start
    await this.broadcastToRoom(room.id, {
      type: 'game_start',
      round: room.game.currentRound,
      phase: room.game.phase
    });

    // Secretly notify murderer
    const murdererWs = this.sessions.get(murderer.id);
    if (murdererWs) {
      murdererWs.send(JSON.stringify({
        type: 'you_are_murderer'
      }));
    }
  }

  private async handleVote(roomId: string, playerId: string, votedPlayerId: string) {
    const room = this.gameState.rooms.find(r => r.id === roomId);
    if (!room || room.game.phase !== 'voting') return;

    const voter = room.players.find(p => p.id === playerId);
    const votedPlayer = room.players.find(p => p.id === votedPlayerId);
    if (!voter || !votedPlayer || !voter.isAlive || !votedPlayer.isAlive) return;

    room.game.votes.set(playerId, votedPlayerId);

    // Check if all alive players have voted
    const alivePlayers = room.players.filter(p => p.isAlive);
    if (room.game.votes.size === alivePlayers.length) {
      await this.resolveVoting(room);
    }
  }

  private async handleMurder(roomId: string, playerId: string, targetPlayerId: string) {
    const room = this.gameState.rooms.find(r => r.id === roomId);
    if (!room || room.game.phase !== 'murder') return;

    const murderer = room.game.murderer;
    if (!murderer || murderer.id !== playerId) return;

    const targetPlayer = room.players.find(p => p.id === targetPlayerId);
    if (!targetPlayer || !targetPlayer.isAlive) return;

    targetPlayer.isAlive = false;
    room.game.victims.push(targetPlayer);
    room.game.eliminatedPlayers.push(targetPlayer);

    await this.broadcastToRoom(roomId, {
      type: 'player_eliminated',
      playerId: targetPlayerId,
      reason: 'murdered'
    });

    // Check for game end conditions
    if (await this.checkGameEnd(room)) return;

    // Start next round
    room.game.phase = 'voting';
    room.game.currentRound++;
    room.game.votes.clear();

    await this.broadcastToRoom(roomId, {
      type: 'round_start',
      round: room.game.currentRound,
      phase: room.game.phase
    });
  }

  private async resolveVoting(room: Room) {
    // Count votes
    const voteCount = new Map<string, number>();
    for (const [_, votedId] of room.game.votes) {
      voteCount.set(votedId, (voteCount.get(votedId) || 0) + 1);
    }

    // Find player with most votes
    let maxVotes = 0;
    let accusedPlayer: Player | null = null;
    for (const [playerId, votes] of voteCount) {
      if (votes > maxVotes) {
        maxVotes = votes;
        accusedPlayer = room.players.find(p => p.id === playerId) || null;
      }
    }

    if (!accusedPlayer) return;

    // Check if accused is murderer
    if (accusedPlayer.isMurderer) {
      // Players win
      await this.broadcastToRoom(room.id, {
        type: 'game_end',
        winner: 'players',
        murderer: room.game.murderer
      });
      room.game.phase = 'waiting';
    } else {
      // Wrong accusation
      accusedPlayer.isAlive = false;
      room.game.eliminatedPlayers.push(accusedPlayer);
      await this.broadcastToRoom(room.id, {
        type: 'player_eliminated',
        playerId: accusedPlayer.id,
        reason: 'wrong_accusation'
      });

      // Check for game end conditions
      if (await this.checkGameEnd(room)) return;

      // Move to murder phase
      room.game.phase = 'murder';
      await this.broadcastToRoom(room.id, {
        type: 'phase_change',
        phase: 'murder'
      });
    }
  }

  private async checkGameEnd(room: Room): Promise<boolean> {
    const alivePlayers = room.players.filter(p => p.isAlive);
    const aliveNonMurderers = alivePlayers.filter(p => !p.isMurderer);

    if (aliveNonMurderers.length === 0) {
      // Murderer wins
      await this.broadcastToRoom(room.id, {
        type: 'game_end',
        winner: 'murderer',
        murderer: room.game.murderer
      });
      room.game.phase = 'waiting';
      return true;
    }

    return false;
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
          console.log(`Broadcasting to player ${player.id}:`, message);
          ws.send(messageStr);
        }
      }
    }
  }

  private async saveState() {
    await this.state.storage.put('gameState', this.gameState);
  }
}