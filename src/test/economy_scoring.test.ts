import { describe, expect, it } from 'vitest';
import {
  processOrderFailure,
  processOrderRejection,
  processOrderSuccess,
  processVoluntaryCoin,
  reserveOrderReward,
} from '../logic/economy';
import { createInitialStats } from '../logic/objectives';
import { calculateScoresAndRankings } from '../logic/scoring';
import type { Order, Player } from '../types/game';

function createDummyPlayer(id: number, coin: number, reservedCoin: number = 0): Player {
  return {
    id,
    name: `Player ${id + 1}`,
    color: '#3b82f6',
    bgClass: 'bg-blue-500',
    borderClass: 'border-blue-500',
    symbol: '★',
    coin,
    reservedCoin,
    startCoord: { x: 0, y: 0 },
    currentCoord: { x: 0, y: 0 },
    reachedGoalEver: false,
    secretObjectives: [],
  };
}

describe('Economy and Penalty Tests', () => {
  it('reserves coin reward correctly and prevents issuance if coins insufficient', () => {
    const p0 = createDummyPlayer(0, 2);
    const p1 = createDummyPlayer(1, 5);

    const order: Order = {
      type: 'reach_goal',
      level: 3,
      sourcePlayerId: 0,
      targetPlayerId: 1,
      reward: 3,
    };

    // p0 has only 2 coins, cannot reserve 3
    const resFail = reserveOrderReward(order, [p0, p1]);
    expect(resFail.success).toBe(false);

    // p0 has 3 coins
    const p0Enough = createDummyPlayer(0, 3);
    const resSuccess = reserveOrderReward(order, [p0Enough, p1]);
    expect(resSuccess.success).toBe(true);
    expect(resSuccess.players[0].coin).toBe(0);
    expect(resSuccess.players[0].reservedCoin).toBe(3);
  });

  it('refunds reserved coins on order rejection', () => {
    const p0 = createDummyPlayer(0, 3, 2); // 2 coins reserved
    const p1 = createDummyPlayer(1, 5, 0);
    const stats = createInitialStats([0, 1]);

    const order: Order = {
      type: 'reach_goal',
      level: 2,
      sourcePlayerId: 0,
      targetPlayerId: 1,
      reward: 2,
    };

    const res = processOrderRejection(order, [p0, p1], stats, 'act-1', []);
    expect(res.players[0].coin).toBe(5); // 3 + 2
    expect(res.players[0].reservedCoin).toBe(0);
    expect(res.stats.ordersRejected[1]).toBe(1);
    expect(res.processedActionIds).toContain('act-1');
  });

  it('transfers reserved coins to target on order success and prevents double execution', () => {
    const p0 = createDummyPlayer(0, 3, 2);
    const p1 = createDummyPlayer(1, 5, 0);
    const stats = createInitialStats([0, 1]);

    const order: Order = {
      type: 'reach_goal',
      level: 2,
      sourcePlayerId: 0,
      targetPlayerId: 1,
      reward: 2,
    };

    const res1 = processOrderSuccess(order, 2, [p0, p1], stats, 'act-2', []);
    expect(res1.players[0].coin).toBe(3);
    expect(res1.players[0].reservedCoin).toBe(0);
    expect(res1.players[1].coin).toBe(7); // 5 + 2

    // Same action ID attempted again (duplicate click)
    const res2 = processOrderSuccess(order, 2, res1.players, res1.stats, 'act-2', res1.processedActionIds);
    expect(res2.players[1].coin).toBe(7); // unchanged
  });

  it('processes failure penalty from target to source and refunds reward', () => {
    const p0 = createDummyPlayer(0, 3, 1); // 1 coin reserved
    const p1 = createDummyPlayer(1, 4, 0); // has 4 coins
    const stats = createInitialStats([0, 1]);

    const order: Order = {
      type: 'reach_goal',
      level: 1,
      sourcePlayerId: 0,
      targetPlayerId: 1,
      reward: 1,
    };

    const res = processOrderFailure(order, [p0, p1], stats, 'act-fail-1', []);
    // p0 gets reserved coin refunded (1) + penalty (1) = 3 + 1 + 1 = 5
    expect(res.players[0].coin).toBe(5);
    expect(res.players[0].reservedCoin).toBe(0);
    // p1 pays 1 penalty = 4 - 1 = 3
    expect(res.players[1].coin).toBe(3);
  });

  it('processes failure penalty when target has 0 coins without going negative', () => {
    const p0 = createDummyPlayer(0, 2, 2); // 2 coins reserved
    const p1 = createDummyPlayer(1, 0, 0); // 0 coins!
    const stats = createInitialStats([0, 1]);

    const order: Order = {
      type: 'reach_goal',
      level: 2,
      sourcePlayerId: 0,
      targetPlayerId: 1,
      reward: 2,
    };

    const res = processOrderFailure(order, [p0, p1], stats, 'act-fail-2', []);
    // p0 gets reserved refund (2), but 0 penalty = 2 + 2 = 4
    expect(res.players[0].coin).toBe(4);
    expect(res.players[0].reservedCoin).toBe(0);
    // p1 stays 0
    expect(res.players[1].coin).toBe(0);
  });

  it('increments coin and frugal count on voluntary coin action', () => {
    const p0 = createDummyPlayer(0, 5, 0);
    const stats = createInitialStats([0]);

    const res = processVoluntaryCoin(0, [p0], stats, 'act-vol-1', []);
    expect(res.players[0].coin).toBe(6);
    expect(res.stats.frugalCount[0]).toBe(1);
  });
});

describe('Scoring and Tie-Breaking Tests', () => {
  it('strictly breaks ties according to rules (score -> objectives -> coins -> goalReached)', () => {
    const p0 = createDummyPlayer(0, 6); // score: 6 + 5 = 11, 1 obj, 6 coins, goal: false
    p0.secretObjectives = [
      { id: 1, name: 'A', category: 'board', points: 5, isCompleted: true, description: '' },
    ];

    const p1 = createDummyPlayer(1, 1); // score: 1 + 10 = 11, 2 objs, 1 coin, goal: false
    p1.secretObjectives = [
      { id: 1, name: 'A', category: 'board', points: 5, isCompleted: true, description: '' },
      { id: 2, name: 'B', category: 'negotiation', points: 5, isCompleted: true, description: '' },
    ];

    const p2 = createDummyPlayer(2, 6); // score: 6 + 5 = 11, 1 obj, 6 coins, goal: true
    p2.reachedGoalEver = true;
    p2.secretObjectives = [
      { id: 1, name: 'A', category: 'board', points: 5, isCompleted: true, description: '' },
    ];

    const p3 = createDummyPlayer(3, 15); // score: 15, 0 objs
    p3.secretObjectives = [];

    const rankings = calculateScoresAndRankings([p0, p1, p2, p3]);

    // Rank 1: p3 (score 15)
    expect(rankings[0].player.id).toBe(3);
    expect(rankings[0].rank).toBe(1);

    // Score 11:
    // p1 has 2 objectives -> Rank 2
    expect(rankings[1].player.id).toBe(1);
    expect(rankings[1].rank).toBe(2);

    // p2 vs p0: both have 1 objective and 6 coins, but p2 reached goal -> Rank 3
    expect(rankings[2].player.id).toBe(2);
    expect(rankings[2].rank).toBe(3);

    // p0 -> Rank 4
    expect(rankings[3].player.id).toBe(0);
    expect(rankings[3].rank).toBe(4);
  });
});
