import type { Card, Suit, Rank } from '../types';

export class CardDeck {
  private cards: Card[] = [];

  constructor(includeJokers: boolean = false) {
    this.initializeDeck(includeJokers);
  }

  private initializeDeck(includeJokers: boolean): void {
    const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

    this.cards = [];

    // Create standard 52-card deck
    suits.forEach(suit => {
      ranks.forEach(rank => {
        this.cards.push({
          id: `${suit}-${rank}`,
          suit,
          rank,
          value: this.getCardValue(rank),
          faceUp: false,
          selected: false,
        });
      });
    });

    // Add jokers if requested
    if (includeJokers) {
      this.cards.push(
        {
          id: 'joker-red',
          suit: 'hearts', // Arbitrary for jokers
          rank: 'A', // Arbitrary for jokers
          value: 0,
          faceUp: false,
          selected: false,
        },
        {
          id: 'joker-black',
          suit: 'spades', // Arbitrary for jokers
          rank: 'A', // Arbitrary for jokers
          value: 0,
          faceUp: false,
          selected: false,
        }
      );
    }
  }

  private getCardValue(rank: Rank): number {
    switch (rank) {
      case 'A': return 1; // Can be 1 or 14 depending on game
      case 'J': return 11;
      case 'Q': return 12;
      case 'K': return 13;
      default: return parseInt(rank);
    }
  }

  shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  deal(count: number = 1): Card[] {
    return this.cards.splice(0, count);
  }

  dealHand(playerCount: number, cardsPerPlayer: number): Card[][] {
    const hands: Card[][] = [];
    
    for (let player = 0; player < playerCount; player++) {
      hands.push([]);
    }

    for (let card = 0; card < cardsPerPlayer; card++) {
      for (let player = 0; player < playerCount; player++) {
        const dealtCard = this.deal(1)[0];
        if (dealtCard) {
          hands[player].push(dealtCard);
        }
      }
    }

    return hands;
  }

  dealAllEvenly(playerCount: number): Card[][] {
    const hands: Card[][] = [];
    
    for (let player = 0; player < playerCount; player++) {
      hands.push([]);
    }

    // Deal all cards evenly by dealing one card to each player in turn
    let currentPlayer = 0;
    while (this.cards.length > 0) {
      const dealtCard = this.deal(1)[0];
      if (dealtCard) {
        hands[currentPlayer].push(dealtCard);
        currentPlayer = (currentPlayer + 1) % playerCount;
      }
    }

    return hands;
  }

  peek(count: number = 1): Card[] {
    return this.cards.slice(0, count);
  }

  addCard(card: Card): void {
    this.cards.push(card);
  }

  addCards(cards: Card[]): void {
    this.cards.push(...cards);
  }

  getCount(): number {
    return this.cards.length;
  }

  isEmpty(): boolean {
    return this.cards.length === 0;
  }

  reset(): void {
    this.initializeDeck(false);
    this.shuffle();
  }

  getCards(): Card[] {
    return [...this.cards];
  }
}

export class CardUtils {
  static getSuitColor(suit: Suit): 'red' | 'black' {
    return suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black';
  }

  static getSuitSymbol(suit: Suit): string {
    const symbols = {
      hearts: '♥',
      diamonds: '♦',
      clubs: '♣',
      spades: '♠',
    };
    return symbols[suit];
  }

  static getCardDisplayName(card: Card): string {
    return `${card.rank}${this.getSuitSymbol(card.suit)}`;
  }

  static compareCards(card1: Card, card2: Card, aceHigh: boolean = false): number {
    const getValue = (rank: Rank) => {
      if (rank === 'A') return aceHigh ? 14 : 1;
      if (rank === 'J') return 11;
      if (rank === 'Q') return 12;
      if (rank === 'K') return 13;
      return parseInt(rank);
    };

    const value1 = getValue(card1.rank);
    const value2 = getValue(card2.rank);
    
    return value1 - value2;
  }

  static sortHand(hand: Card[], bySuit: boolean = false, aceHigh: boolean = false): Card[] {
    return [...hand].sort((a, b) => {
      if (bySuit) {
        // Sort by suit first, then by rank
        if (a.suit !== b.suit) {
          const suitOrder = ['clubs', 'diamonds', 'hearts', 'spades'];
          return suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit);
        }
      }
      return this.compareCards(a, b, aceHigh);
    });
  }

  static findMatches(hand: Card[], matchType: 'rank' | 'suit' | 'color'): Card[][] {
    const groups: { [key: string]: Card[] } = {};

    hand.forEach(card => {
      let key: string;
      switch (matchType) {
        case 'rank':
          key = card.rank;
          break;
        case 'suit':
          key = card.suit;
          break;
        case 'color':
          key = this.getSuitColor(card.suit);
          break;
        default:
          key = card.rank;
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(card);
    });

    return Object.values(groups).filter(group => group.length > 1);
  }

  static isSequence(cards: Card[], aceHigh: boolean = false): boolean {
    if (cards.length < 2) return false;

    const sorted = this.sortHand(cards, false, aceHigh);
    
    for (let i = 1; i < sorted.length; i++) {
      const current = this.getCardValue(sorted[i].rank, aceHigh);
      const previous = this.getCardValue(sorted[i - 1].rank, aceHigh);
      
      if (current !== previous + 1) {
        return false;
      }
    }

    return true;
  }

  private static getCardValue(rank: Rank, aceHigh: boolean): number {
    if (rank === 'A') return aceHigh ? 14 : 1;
    if (rank === 'J') return 11;
    if (rank === 'Q') return 12;
    if (rank === 'K') return 13;
    return parseInt(rank);
  }

  static calculateHandValue(hand: Card[], gameType: 'blackjack' | 'poker' | 'sum' = 'sum'): number {
    switch (gameType) {
      case 'blackjack':
        return this.calculateBlackjackValue(hand);
      case 'poker':
        return this.calculatePokerValue(hand);
      default:
        return hand.reduce((sum, card) => sum + card.value, 0);
    }
  }

  private static calculateBlackjackValue(hand: Card[]): number {
    let value = 0;
    let aces = 0;

    hand.forEach(card => {
      if (card.rank === 'A') {
        aces++;
        value += 11;
      } else if (['J', 'Q', 'K'].includes(card.rank)) {
        value += 10;
      } else {
        value += parseInt(card.rank);
      }
    });

    // Adjust for aces
    while (value > 21 && aces > 0) {
      value -= 10;
      aces--;
    }

    return value;
  }

  private static calculatePokerValue(hand: Card[]): number {
    // This is a simplified poker hand ranking
    // In a real implementation, you'd want more sophisticated hand evaluation
    const ranks = hand.map(card => card.rank);
    const suits = hand.map(card => card.suit);
    
    // Check for flush
    const isFlush = suits.every(suit => suit === suits[0]);
    
    // Check for straight
    const isStraight = this.isSequence(hand);
    
    if (isFlush && isStraight) return 800; // Straight flush
    if (isFlush) return 500; // Flush
    if (isStraight) return 400; // Straight
    
    // Count pairs, three of a kind, etc.
    const rankCounts: { [key: string]: number } = {};
    ranks.forEach(rank => {
      rankCounts[rank] = (rankCounts[rank] || 0) + 1;
    });
    
    const counts = Object.values(rankCounts).sort((a, b) => b - a);
    
    if (counts[0] === 4) return 700; // Four of a kind
    if (counts[0] === 3 && counts[1] === 2) return 600; // Full house
    if (counts[0] === 3) return 300; // Three of a kind
    if (counts[0] === 2 && counts[1] === 2) return 200; // Two pair
    if (counts[0] === 2) return 100; // One pair
    
    return 0; // High card
  }
}
