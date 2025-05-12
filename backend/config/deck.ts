import type { Card, Effect } from '../durable-objects/Ultimate-cup';

export class Deck {
    private cards: Card[];
    private static readonly KING_CARDS: Card[] = Array(4).fill({
        type: 'king',
        content: 'Add drinks to the Ultimate Cup',
        effect: 'add_drink'
    });

    private static readonly POWER_CARDS: Card[] = [
        {
            type: 'power',
            content: 'Skip next turn',
            effect: {
                name: 'skip_turn',
                description: 'Skip next turn'
            }
        },
        {
            type: 'power',
            content: 'Reverse turn order',
            effect: {
                name: 'reverse_order',
                description: 'Reverse turn order'
            }
        },
        {
            type: 'power',
            content: 'Force another player to drink',
            effect: {
                name: 'force_drink',
                description: 'Force another player to drink'
            }
        },
        {
            type: 'power',
            content: 'Protection from next challenge',
            effect: {
                name: 'protection',
                description: 'Protection from next challenge'
            }
        },
        {
            type: 'power',
            content: 'Draw two cards',
            effect: {
                name: 'draw_two',
                description: 'Draw two cards'
            }
        }
    ];

    private static readonly CHALLENGE_CARDS: Card[] = [
        {
            type: 'challenge',
            content: 'Complete a dare',
            effect: {
                name: 'dare',
                description: 'Complete a dare'
            }
        },
        {
            type: 'challenge',
            content: 'Answer a question',
            effect: {
                name: 'question',
                description: 'Answer a question'
            }
        },
        {
            type: 'challenge',
            content: 'Perform a task',
            effect: {
                name: 'task',
                description: 'Perform a task'
            }
        },
        {
            type: 'challenge',
            content: 'Take a shot',
            effect: {
                name: 'shot',
                description: 'Take a shot'
            }
        },
        {
            type: 'challenge',
            content: 'Make someone laugh',
            effect: {
                name: 'laugh',
                description: 'Make someone laugh'
            }
        }
    ];

    private static readonly MINIGAME_CARDS: Card[] = [
        {
            type: 'minigame',
            content: 'Never Have I Ever',
            effect: {
                name: 'never_have_i_ever',
                description: 'Never Have I Ever'
            }
        },
        {
            type: 'minigame',
            content: 'Truth or Dare',
            effect: {
                name: 'truth_or_dare',
                description: 'Truth or Dare'
            }
        },
        {
            type: 'minigame',
            content: 'Categories',
            effect: {
                name: 'categories',
                description: 'Categories'
            }
        },
        {
            type: 'minigame',
            content: 'Word Association',
            effect: {
                name: 'word_association',
                description: 'Word Association'
            }
        },
        {
            type: 'minigame',
            content: 'Rhyme Time',
            effect: {
                name: 'rhyme_time',
                description: 'Rhyme Time'
            }
        }
    ];

    constructor() {
        this.cards = [];
        this.initializeDeck();
    }

    private initializeDeck(): void {
        this.cards = [
            ...Deck.KING_CARDS,
            ...Deck.POWER_CARDS,
            ...Deck.CHALLENGE_CARDS,
            ...Deck.MINIGAME_CARDS
        ];
        this.shuffle();
    }

    public shuffle(): void {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    public drawCard(): Card | undefined {
        return this.cards.pop();
    }

    public getCardEffect(card: Card): Effect {
        if (!card.effect) {
            throw new Error('Card has no effect');
        }     
        return {
            name: card.effect.name,
            description: card.effect.description
        };
    }

    public getRemainingCards(): number {
        return this.cards.length;
    }

    public getCards(): Card[] {
        return [...this.cards];
    }
} 