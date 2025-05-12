import { DurableObject } from 'cloudflare:workers';
import { Deck } from '../config/deck';

export type Effect = {
    name: string;
    description: string;
}

type Player = {
    id: string;
    name: string;
    ready: boolean;
    ws?: WebSocket;
    powerCards: string[];
    currentEffects: Effect[];
    isEliminated?: boolean;
    disconnected?: boolean;
}

export type Card = {
    type: 'king' | 'power' | 'challenge' | 'minigame';
    content: string;
    effect?: Effect;
}

type Room = {
    id: string;
    players: Player[];
    game: Game;
}

type Game = {
    id: string;
    players: Player[];
    currentPlayer: Player | null;
    deck: Card[];
    ultimateCup: {
        drinks: number;
        isActive: boolean;
    };
    currentCard: Card | null;
    phase: 'waiting' | 'playing' | 'minigame' | 'challenge' | 'ended' | 'ultimate_cup';
    eliminatedPlayers: Player[];
}

type GameState = {
    rooms: Room[];
}

type WebSocketMessage = {
    type: 'join' | 'ready' | 'draw_card' | 'use_power' | 'complete_challenge' | 'finish_minigame';
    name?: string;
    powerCard?: string;
    success?: boolean;
    results?: any;
}

export class UltimateCup extends DurableObject {
    private state: DurableObjectState;
    private gameState: GameState;
    private sessions: Map<string, WebSocket>;

    constructor(state: DurableObjectState, env: any) {
        super(state, env);
        this.state = state;
        this.gameState = { rooms: [] };
        this.sessions = new Map();
    }

    async initialize(): Promise<void> {
        const stored = await this.state.storage.get<GameState>('gameState');
        if (stored) {
            this.gameState = stored;
        }
    }

    async fetch(request: Request): Promise<Response> {
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

    private async handleSession(ws: WebSocket, roomId: string, playerId: string): Promise<void> {
        ws.accept();
        this.sessions.set(playerId, ws);

        ws.addEventListener('message', async (msg) => {
            try {
                const data = JSON.parse(msg.data as string) as WebSocketMessage;
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

    private async handleMessage(roomId: string, playerId: string, data: WebSocketMessage): Promise<void> {
        switch (data.type) {
            case 'join':
                if (!data.name) {
                    const ws = this.sessions.get(playerId);
                    if (ws) {
                        ws.send(JSON.stringify({ error: 'Missing name' }));
                    }
                    return;
                }
                await this.handleJoinRoom(roomId, playerId, data.name);
                break;
            default:
                const room = this.gameState.rooms.find(r => r.id === roomId);
                if (!room) return;

                switch (data.type) {
                    case 'ready':
                        await this.handlePlayerReady(roomId, playerId);
                        break;
                    case 'draw_card':
                        await this.handleDrawCard(roomId, playerId);
                        break;
                    case 'use_power':
                        if (!data.powerCard) {
                            const ws = this.sessions.get(playerId);
                            if (ws) {
                                ws.send(JSON.stringify({ error: 'Missing power card' }));
                            }
                            return;
                        }
                        await this.handleUsePower(roomId, playerId, data.powerCard);
                        break;
                    case 'complete_challenge':
                        if (typeof data.success !== 'boolean') {
                            const ws = this.sessions.get(playerId);
                            if (ws) {
                                ws.send(JSON.stringify({ error: 'Missing success status' }));
                            }
                            return;
                        }
                        await this.handleCompleteChallenge(roomId, playerId, data.success);
                        break;
                    case 'finish_minigame':
                        if (!data.results) {
                            const ws = this.sessions.get(playerId);
                            if (ws) {
                                ws.send(JSON.stringify({ error: 'Missing minigame results' }));
                            }
                            return;
                        }
                        await this.handleFinishMinigame(roomId, playerId, data.results);
                        break;
                }
        }
    }

    private async handleJoinRoom(roomId: string, playerId: string, name: string): Promise<void> {
        let room = this.gameState.rooms.find(r => r.id === roomId);
        if (!room) {
            room = {
                id: roomId,
                players: [],
                game: {
                    id: roomId,
                    players: [],
                    currentPlayer: null,
                    deck: new Deck().getCards(),
                    ultimateCup: {
                        drinks: 0,
                        isActive: false
                    },
                    currentCard: null,
                    phase: 'waiting',
                    eliminatedPlayers: []
                }
            };
            this.gameState.rooms.push(room);
        }

        // Check for existing player with same ID
        const existingPlayer = room.players.find(p => p.id === playerId);
        if (existingPlayer) {
            // Reconnecting player
            existingPlayer.disconnected = false;
            existingPlayer.ws = this.sessions.get(playerId);
            
            // Send current game state to reconnecting player
            const ws = this.sessions.get(playerId);
            if (ws) {
                ws.send(JSON.stringify({
                    type: 'game_state',
                    players: room.players,
                    game: room.game
                }));
            }

            await this.broadcastToRoom(roomId, {
                type: 'player_reconnected',
                playerId
            });
            return;
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
            powerCards: [],
            currentEffects: [],
            isEliminated: false,
            disconnected: false
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

    private async handlePlayerReady(roomId: string, playerId: string): Promise<void> {
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

    private async startNewGame(room: Room): Promise<void> {
        room.game.phase = 'playing';
        room.game.currentPlayer = room.players[0];
        room.game.deck = new Deck().getCards()

        await this.broadcastToRoom(room.id, {
            type: 'game_start',
            currentPlayer: room.game.currentPlayer
        });
    }

    private async handleDrawCard(roomId: string, playerId: string): Promise<void> {
        const room = this.gameState.rooms.find(r => r.id === roomId);
        if (!room || room.game.phase !== 'playing') return;

        const player = room.players.find(p => p.id === playerId);
        if (!player || player.id !== room.game.currentPlayer?.id) return;

        if (room.game.deck.length === 0) {
            await this.broadcastToRoom(roomId, {
                type: 'error',
                error: 'no_cards_left'
            });
            return;
        }

        const card = room.game.deck.pop();
        if (!card) {
            await this.broadcastToRoom(roomId, {
                type: 'error',
                error: 'no_cards_left'
            });
            return;
        }

        room.game.currentCard = card;

        await this.broadcastToRoom(roomId, {
            type: 'card_drawn',
            card,
            playerId
        });

        // Handle different card types
        switch (card.type) {
            case 'king':
                await this.handleKingCard(room, card);
                break;
            case 'power':
                await this.handlePowerCard(room, player, card);
                break;
            case 'challenge':
                await this.handleChallengeCard(room, player, card);
                break;
            case 'minigame':
                await this.handleMinigameCard(room, card);
                break;
        }

        await this.saveState();
    }

    private async handleKingCard(room: Room, card: Card): Promise<void> {
        room.game.ultimateCup.drinks += 1;
        
        // Check if this was the last king
        const remainingKings = room.game.deck.filter(c => c.type === 'king').length;
        if (remainingKings === 0) {
            room.game.ultimateCup.isActive = true;
            room.game.phase = 'ultimate_cup';
            await this.broadcastToRoom(room.id, {
                type: 'ultimate_cup_activated',
                drinks: room.game.ultimateCup.drinks
            });

            // Start the Ultimate Cup phase
            await this.startUltimateCupPhase(room);
        }
    }

    private async handlePowerCard(room: Room, player: Player, card: Card): Promise<void> {
        if (card.effect) {
            player.powerCards.push(card.effect.name);
            player.currentEffects.push(card.effect);
            await this.broadcastToRoom(room.id, {
                type: 'power_card_received',
                playerId: player.id,
                power: card.effect
            });
        }
    }

    private async handleChallengeCard(room: Room, player: Player, card: Card): Promise<void> {
        // Check if player has protection
        const hasProtection = player.currentEffects.some(e => e.name === 'protection');
        if (hasProtection) {
            // Remove protection effect
            const protectionIndex = player.currentEffects.findIndex(e => e.name === 'protection');
            if (protectionIndex !== -1) {
                player.currentEffects.splice(protectionIndex, 1);
            }
            await this.broadcastToRoom(room.id, {
                type: 'protection_used',
                playerId: player.id
            });
            return;
        }

        room.game.phase = 'challenge';
        await this.broadcastToRoom(room.id, {
            type: 'challenge_started',
            playerId: player.id,
            challenge: card.content,
            effect: card.effect
        });
    }

    private async handleMinigameCard(room: Room, card: Card): Promise<void> {
        room.game.phase = 'minigame';
        await this.broadcastToRoom(room.id, {
            type: 'minigame_started',
            minigame: card.content,
            effect: card.effect
        });
    }

    private async handleUsePower(roomId: string, playerId: string, powerCard: string): Promise<void> {
        const room = this.gameState.rooms.find(r => r.id === roomId);
        if (!room) return;

        const player = room.players.find(p => p.id === playerId);
        if (!player) return;

        const powerIndex = player.powerCards.indexOf(powerCard);
        if (powerIndex === -1) return;

        // Remove the power card and its effect
        player.powerCards.splice(powerIndex, 1);
        const effectIndex = player.currentEffects.findIndex(e => e.name === powerCard);
        if (effectIndex !== -1) {
            player.currentEffects.splice(effectIndex, 1);
        }

        // Apply power effect
        switch (powerCard) {
            case 'skip_turn':
                await this.skipNextTurn(room);
                break;
            case 'reverse_order':
                await this.reverseTurnOrder(room);
                break;
            case 'force_drink':
                // This would need additional logic to select target player
                await this.broadcastToRoom(roomId, {
                    type: 'power_effect',
                    effect: 'force_drink',
                    playerId
                });
                break;
            case 'protection':
                // Add protection effect
                player.currentEffects.push({
                    name: 'protection',
                    description: 'Protected from next challenge'
                });
                break;
            case 'draw_two':
                await this.handleDrawCard(roomId, playerId);
                await this.handleDrawCard(roomId, playerId);
                break;
        }

        await this.broadcastToRoom(roomId, {
            type: 'power_used',
            playerId,
            power: powerCard
        });

        await this.saveState();
    }

    private async handleCompleteChallenge(roomId: string, playerId: string, success: boolean): Promise<void> {
        const room = this.gameState.rooms.find(r => r.id === roomId);
        if (!room || room.game.phase !== 'challenge') return;

        const player = room.players.find(p => p.id === playerId);
        if (!player) return;

        if (!success) {
            if (room.game.ultimateCup.isActive) {
                player.isEliminated = true;
                room.game.eliminatedPlayers.push(player);
                await this.checkGameEnd(room);
            } else {
                room.game.ultimateCup.drinks += 1;
            }
        }

        room.game.phase = room.game.ultimateCup.isActive ? 'ultimate_cup' : 'playing';
        await this.nextTurn(room);

        await this.broadcastToRoom(roomId, {
            type: 'challenge_completed',
            playerId,
            success,
            phase: room.game.phase
        });

        await this.saveState();
    }

    private async handleFinishMinigame(roomId: string, playerId: string, results: any): Promise<void> {
        const room = this.gameState.rooms.find(r => r.id === roomId);
        if (!room || room.game.phase !== 'minigame') return;

        const player = room.players.find(p => p.id === playerId);
        if (!player) return;

        // Handle minigame results
        if (!results.success) {
            if (room.game.ultimateCup.isActive) {
                player.isEliminated = true;
                room.game.eliminatedPlayers.push(player);
                await this.checkGameEnd(room);
            } else {
                room.game.ultimateCup.drinks += 1;
            }
        }

        room.game.phase = 'playing';
        await this.nextTurn(room);

        await this.broadcastToRoom(roomId, {
            type: 'minigame_completed',
            results,
            playerId
        });

        await this.saveState();
    }

    private async skipNextTurn(room: Room): Promise<void> {
        await this.nextTurn(room);
        await this.broadcastToRoom(room.id, {
            type: 'turn_skipped',
            currentPlayer: room.game.currentPlayer
        });
    }

    private async reverseTurnOrder(room: Room): Promise<void> {
        room.players.reverse();
        room.game.players.reverse();
        await this.broadcastToRoom(room.id, {
            type: 'turn_order_reversed',
            players: room.players
        });
    }

    private async nextTurn(room: Room): Promise<void> {
        const currentIndex = room.players.findIndex(p => p.id === room.game.currentPlayer?.id);
        let nextIndex = (currentIndex + 1) % room.players.length;
        
        // Skip eliminated players
        while (room.players[nextIndex].isEliminated) {
            nextIndex = (nextIndex + 1) % room.players.length;
        }

        room.game.currentPlayer = room.players[nextIndex];
        await this.broadcastToRoom(room.id, {
            type: 'turn_changed',
            currentPlayer: room.game.currentPlayer
        });
    }

    private async checkGameEnd(room: Room): Promise<void> {
        const activePlayers = room.players.filter(p => !p.isEliminated);
        if (activePlayers.length === 1) {
            room.game.phase = 'ended';
            const winner = activePlayers[0];
            await this.broadcastToRoom(room.id, {
                type: 'game_end',
                winner,
                eliminatedPlayers: room.game.eliminatedPlayers
            });
        } else if (activePlayers.length === 0) {
            room.game.phase = 'ended';
            await this.broadcastToRoom(room.id, {
                type: 'game_end',
                winner: null,
                eliminatedPlayers: room.game.eliminatedPlayers
            });
        }
    }

    private async handlePlayerDisconnect(roomId: string, playerId: string): Promise<void> {
        const room = this.gameState.rooms.find(r => r.id === roomId);
        if (!room) return;

        const player = room.players.find(p => p.id === playerId);
        if (player) {
            player.disconnected = true;
            player.ws = undefined;
        }

        await this.broadcastToRoom(roomId, {
            type: 'player_left',
            playerId
        });
        await this.saveState();
    }

    private async broadcastToRoom(roomId: string, message: any, excludePlayerIds: string[] = []): Promise<void> {
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

    private async saveState(): Promise<void> {
        await this.state.storage.put('gameState', this.gameState);
    }

    private async startUltimateCupPhase(room: Room): Promise<void> {
        // Reset player order to start with the player who drew the last king
        const lastKingPlayer = room.game.currentPlayer;
        if (lastKingPlayer) {
            const playerIndex = room.players.findIndex(p => p.id === lastKingPlayer.id);
            if (playerIndex !== -1) {
                room.players = [
                    ...room.players.slice(playerIndex),
                    ...room.players.slice(0, playerIndex)
                ];
                room.game.players = [...room.players];
            }
        }

        // Start with the first non-eliminated player
        const firstActivePlayer = room.players.find(p => !p.isEliminated);
        if (firstActivePlayer) {
            room.game.currentPlayer = firstActivePlayer;
            await this.broadcastToRoom(room.id, {
                type: 'ultimate_cup_phase_started',
                currentPlayer: firstActivePlayer,
                drinks: room.game.ultimateCup.drinks
            });
        }
    }
}