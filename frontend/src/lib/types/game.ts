export type Effect = {
    name: string;
    description: string;
}

export type Card = {
    type: 'king' | 'power' | 'challenge' | 'minigame';
    content: string;
    effect?: Effect;
}

export type Player = {
    id: string;
    name: string;
    ready: boolean;
    powerCards: string[];
    currentEffects: Effect[];
    isEliminated?: boolean;
}

export type GamePhase = 'waiting' | 'playing' | 'minigame' | 'challenge' | 'ended' | 'ultimate_cup';

export type GameState = {
    phase: GamePhase;
    currentPlayer: Player | null;
    currentCard: Card | null;
    ultimateCup: {
        drinks: number;
        isActive: boolean;
    };
    eliminatedPlayers: Player[];
} 