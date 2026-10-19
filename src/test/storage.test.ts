import { beforeEach, describe, expect, it } from 'vitest';
import type { GameState } from '../types/game';
import {
  loadGameState,
  loadLastGameResult,
  saveGameState,
  saveLastGameResult,
  validateSaveData,
} from '../utils/storage';

// LocalStorage モック
class LocalStorageMock {
  private store: Record<string, string> = {};
  getItem(key: string) {
    return this.store[key] || null;
  }
  setItem(key: string, value: string) {
    this.store[key] = value;
  }
  removeItem(key: string) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

describe('Storage & State Restoration Tests', () => {
  beforeEach(() => {
    (globalThis as unknown as { localStorage: LocalStorageMock }).localStorage = new LocalStorageMock();
  });

  const validState: GameState = {
    players: [
      {
        id: 0,
        name: 'Player 1',
        color: '#ef4444',
        bgClass: 'bg-red-500',
        borderClass: 'border-red-500',
        symbol: '★',
        coin: 5,
        reservedCoin: 0,
        startCoord: { x: 0, y: 0 },
        currentCoord: { x: 0, y: 0 },
        reachedGoalEver: false,
        secretObjectives: [
          { id: 1, name: 'A', category: 'board', points: 5, isCompleted: false, description: '' },
          { id: 8, name: 'B', category: 'negotiation', points: 7, isCompleted: false, description: '' },
        ],
      },
      {
        id: 1,
        name: 'Player 2',
        color: '#3b82f6',
        bgClass: 'bg-blue-500',
        borderClass: 'border-blue-500',
        symbol: '◆',
        coin: 5,
        reservedCoin: 0,
        startCoord: { x: 4, y: 0 },
        currentCoord: { x: 4, y: 0 },
        reachedGoalEver: false,
        secretObjectives: [
          { id: 2, name: 'C', category: 'board', points: 7, isCompleted: false, description: '' },
          { id: 12, name: 'D', category: 'coin', points: 3, isCompleted: false, description: '' },
        ],
      },
      {
        id: 2,
        name: 'Player 3',
        color: '#10b981',
        bgClass: 'bg-emerald-500',
        borderClass: 'border-emerald-500',
        symbol: '▲',
        coin: 5,
        reservedCoin: 0,
        startCoord: { x: 0, y: 4 },
        currentCoord: { x: 0, y: 4 },
        reachedGoalEver: false,
        secretObjectives: [
          { id: 9, name: 'E', category: 'negotiation', points: 5, isCompleted: false, description: '' },
          { id: 14, name: 'F', category: 'coin', points: 5, isCompleted: false, description: '' },
        ],
      },
    ],
    turnOrder: [0, 1, 2],
    currentRound: 1,
    currentTurnIndex: 0,
    phase: 'VOLUNTARY',
    activeOrder: null,
    currentMovePath: [],
    lastOrderResult: null,
    stats: {
      successfulOrdersIssued: { 0: 0, 1: 0, 2: 0 },
      ordersRejected: { 0: 0, 1: 0, 2: 0 },
      successfulOrdersReceivedFrom: { 0: [], 1: [], 2: [] },
      coinsPaidAsReward: { 0: 0, 1: 0, 2: 0 },
      frugalCount: { 0: 0, 1: 0, 2: 0 },
      coinsReceivedAsReward: { 0: 0, 1: 0, 2: 0 },
      guidedDistance: { 0: 0, 1: 0, 2: 0 },
      metPlayers: { 0: [], 1: [], 2: [] },
    },
    soundEnabled: true,
    actionId: 'init-1',
    processedActionIds: [],
  };

  it('saves and loads valid game state properly', () => {
    const saveRes = saveGameState(validState);
    expect(saveRes.success).toBe(true);

    const loadRes = loadGameState();
    expect(loadRes.isValid).toBe(true);
    expect(loadRes.state).not.toBeNull();
    expect(loadRes.state?.players.length).toBe(3);
    expect(loadRes.state?.phase).toBe('VOLUNTARY');
  });

  it('detects corrupted save data and rejects it', () => {
    // Missing required fields
    const corrupted1 = { players: [{ name: 'only one' }] };
    const res1 = validateSaveData(corrupted1);
    expect(res1.isValid).toBe(false);

    // Invalid round
    const corrupted2 = { ...validState, currentRound: 99 };
    const res2 = validateSaveData(corrupted2);
    expect(res2.isValid).toBe(false);
  });

  it('saves and loads last game result independently', () => {
    const resultRecord = {
      date: '2026-10-19',
      playerCount: 3,
      players: [
        {
          id: 0,
          name: 'Player 1',
          finalScore: 15,
          remainingCoins: 5,
          rank: 1,
          isWinner: true,
          objectives: [{ name: 'Goal', isCompleted: true, points: 5 }],
        },
      ],
    };

    saveLastGameResult(resultRecord);
    const loaded = loadLastGameResult();
    expect(loaded).not.toBeNull();
    expect(loaded?.playerCount).toBe(3);
    expect(loaded?.players[0].isWinner).toBe(true);
  });
});
