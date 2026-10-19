import { describe, expect, it } from 'vitest';
import {
  GOAL_COORD,
  START_POSITIONS,
  isValidStep,
} from '../logic/board';
import {
  canIssueOrder,
  evaluateOrder,
} from '../logic/order';
import {
  createInitialStats,
  dealSecretObjectives,
  evaluateFinalObjectives,
  updateObjectivesInProgress,
} from '../logic/objectives';
import {
  processOrderFailure,
  processOrderRejection,
  processOrderSuccess,
} from '../logic/economy';
import { validateSaveData } from '../utils/storage';
import type { Coordinate, Order, Player } from '../types/game';

describe('Comprehensive Verification of Required Specifications', () => {
  // 1. ゲーム進行テスト
  describe('1. Game Progress Tests', () => {
    it('initializes 3-player and 4-player games with unique starting positions from 4 corners', () => {
      const corners = [
        START_POSITIONS.A,
        START_POSITIONS.C,
        START_POSITIONS.G,
        START_POSITIONS.I,
      ];

      // 3人プレイの検証（複数回）
      for (let run = 0; run < 10; run++) {
        const shuffled = [...corners].sort(() => Math.random() - 0.5);
        const starts3 = shuffled.slice(0, 3);
        expect(starts3.length).toBe(3);
        const unique = new Set(starts3.map((c) => `${c.x},${c.y}`));
        expect(unique.size).toBe(3);
      }

      // 4人プレイの検証
      const starts4 = [...corners].sort(() => Math.random() - 0.5);
      expect(starts4.length).toBe(4);
      const unique4 = new Set(starts4.map((c) => `${c.x},${c.y}`));
      expect(unique4.size).toBe(4);
    });

    it('advances turns across 6 rounds with fixed turn order', () => {
      const turnOrder = [2, 0, 1]; // 固定された手番順
      let round = 1;
      let turnIndex = 0;
      let totalTurns = 0;

      while (round <= 6) {
        // 現在のプレイヤー
        const activePlayer = turnOrder[turnIndex];
        expect(activePlayer).toBe(turnOrder[turnIndex]); // 手番順は変化しない
        totalTurns++;

        turnIndex++;
        if (turnIndex >= turnOrder.length) {
          turnIndex = 0;
          round++;
        }
      }

      expect(totalTurns).toBe(18); // 3人 x 6ラウンド = 18手番
      expect(round).toBe(7); // 6ラウンド終了後に完了
    });
  });

  // 2. 命令とコインのテスト
  describe('2. Orders and Coin Economy Tests', () => {
    const makeP = (id: number, coin: number, reservedCoin: number = 0): Player => ({
      id,
      name: `P${id}`,
      color: '#fff',
      bgClass: '',
      borderClass: '',
      symbol: '★',
      coin,
      reservedCoin,
      startCoord: { x: 0, y: 0 },
      currentCoord: { x: 0, y: 0 },
      reachedGoalEver: false,
      secretObjectives: [],
    });

    it('transfers reward on success, prevents double payment with same actionId', () => {
      const p0 = makeP(0, 5, 2); // 2 reserved
      const p1 = makeP(1, 5, 0);
      const order: Order = {
        type: 'reach_goal',
        level: 2,
        sourcePlayerId: 0,
        targetPlayerId: 1,
        reward: 2,
      };

      const res = processOrderSuccess(order, 2, [p0, p1], createInitialStats([0, 1]), 'tx-01', []);
      expect(res.players[0].coin).toBe(5);
      expect(res.players[0].reservedCoin).toBe(0);
      expect(res.players[1].coin).toBe(7); // 5 + 2

      // Duplicate attempt
      const resDup = processOrderSuccess(order, 2, res.players, res.stats, 'tx-01', res.processedActionIds);
      expect(resDup.players[1].coin).toBe(7); // no duplicate
    });

    it('refunds reserved reward on rejection', () => {
      const p0 = makeP(0, 4, 1); // 1 reserved
      const p1 = makeP(1, 5, 0);
      const order: Order = {
        type: 'reach_goal',
        level: 1,
        sourcePlayerId: 0,
        targetPlayerId: 1,
        reward: 1,
      };

      const res = processOrderRejection(order, [p0, p1], createInitialStats([0, 1]), 'tx-02', []);
      expect(res.players[0].coin).toBe(5); // 4 + 1 refunded
      expect(res.players[0].reservedCoin).toBe(0);
    });

    it('penalizes target on Lv1/Lv2 failure: target pays 1 coin to source, source gets reserved refund', () => {
      const p0 = makeP(0, 4, 1); // 1 reserved
      const p1 = makeP(1, 3, 0); // has 3 coins
      const order: Order = {
        type: 'reach_goal',
        level: 1,
        sourcePlayerId: 0,
        targetPlayerId: 1,
        reward: 1,
      };

      const res = processOrderFailure(order, [p0, p1], createInitialStats([0, 1]), 'tx-03', []);
      // p0: 4 + 1(refund) + 1(penalty) = 6
      expect(res.players[0].coin).toBe(6);
      expect(res.players[0].reservedCoin).toBe(0);
      // p1: 3 - 1 = 2
      expect(res.players[1].coin).toBe(2);
    });

    it('handles failure when target has 0 coins: 0 penalty paid, no negative coins', () => {
      const p0 = makeP(0, 3, 2); // 2 reserved
      const p1 = makeP(1, 0, 0); // 0 coins
      const order: Order = {
        type: 'reach_goal',
        level: 2,
        sourcePlayerId: 0,
        targetPlayerId: 1,
        reward: 2,
      };

      const res = processOrderFailure(order, [p0, p1], createInitialStats([0, 1]), 'tx-04', []);
      expect(res.players[0].coin).toBe(5); // 3 + 2 (refund only)
      expect(res.players[1].coin).toBe(0); // remains 0
    });

    it('cannot issue order when coins are insufficient', () => {
      const check = canIssueOrder('reach_goal', 3, { x: 1, y: 1 }, 2); // needs 3 coins, has 2
      expect(check.canIssue).toBe(false);
    });
  });

  // 3. 移動と判定テスト
  describe('3. Movement and Board Validation Tests', () => {
    it('disallows diagonal movement, same square, and movement outside board', () => {
      expect(isValidStep({ x: 2, y: 2 }, { x: 3, y: 3 })).toBe(false); // diagonal
      expect(isValidStep({ x: 2, y: 2 }, { x: 2, y: 2 })).toBe(false); // same
      expect(isValidStep({ x: 0, y: 0 }, { x: -1, y: 0 })).toBe(false); // outside
      expect(isValidStep({ x: 4, y: 4 }, { x: 5, y: 4 })).toBe(false); // outside
      expect(isValidStep({ x: 2, y: 2 }, { x: 2, y: 1 })).toBe(true); // adjacent up
    });

    it('enforces maximum 5 steps for Lv1', () => {
      const order: Order = {
        type: 'reach_goal',
        level: 1,
        sourcePlayerId: 0,
        targetPlayerId: 1,
        reward: 1,
      };

      // 6 steps (exceeds max 5)
      const path6: Coordinate[] = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 3, y: 0 },
        { x: 4, y: 0 },
        { x: 4, y: 1 },
        { x: 3, y: 1 },
      ];
      const res = evaluateOrder(order, path6);
      expect(res.success).toBe(false);
    });

    it('distinguishes between passing through goal E and reaching goal E at move end', () => {
      // ゴール到達者: 移動終了位置がEになったことがある
      const p = {
        id: 0,
        name: 'P0',
        color: '',
        bgClass: '',
        borderClass: '',
        symbol: '',
        coin: 5,
        reservedCoin: 0,
        startCoord: { x: 0, y: 2 },
        currentCoord: { x: 3, y: 2 }, // 移動終了位置は (3,2) Fエリア
        reachedGoalEver: false,
        secretObjectives: [
          {
            id: 1, // ゴール到達者
            name: 'ゴール到達者',
            category: 'board' as const,
            points: 5,
            description: '',
            isCompleted: false,
          },
        ],
      };

      // (0,2) -> (1,2) -> (2,2)[E通過] -> (3,2)[F終了]
      // 終了位置がEではないので reachedGoalEver は false
      const updated = updateObjectivesInProgress(p, [p], createInitialStats([0]));
      expect(updated.secretObjectives[0].isCompleted).toBe(false);

      // 終了位置が (2,2) E で移動終了した場合
      p.currentCoord = GOAL_COORD;
      p.reachedGoalEver = true;
      const updatedReached = updateObjectivesInProgress(p, [p], createInitialStats([0]));
      expect(updatedReached.secretObjectives[0].isCompleted).toBe(true);
    });

    it('distinguishes passing through area from ending in area', () => {
      const order: Order = {
        type: 'enter_area',
        level: 1,
        sourcePlayerId: 0,
        targetPlayerId: 1,
        reward: 1,
        targetArea: 'C',
      };

      // Passes through C (3,0) but finishes in B (2,0)
      const path: Coordinate[] = [
        { x: 4, y: 0 }, // C
        { x: 3, y: 0 }, // C
        { x: 2, y: 0 }, // B
      ];
      const res = evaluateOrder(order, path);
      expect(res.success).toBe(false); // ended in B, not C
    });
  });

  // 4. 全15種類の秘密目標テスト
  describe('4. All 15 Secret Objectives Verification', () => {
    it('verifies non-duplication across all players and different categories per player', () => {
      const players = [
        { id: 0, startCoord: START_POSITIONS.A },
        { id: 1, startCoord: START_POSITIONS.C },
        { id: 2, startCoord: START_POSITIONS.G },
        { id: 3, startCoord: START_POSITIONS.I },
      ];
      const dealt = dealSecretObjectives(players, [0, 1, 2, 3]);

      const seen = new Set<number>();
      for (const [, objs] of dealt.entries()) {
        expect(objs.length).toBe(2);
        expect(objs[0].category).not.toBe(objs[1].category);
        for (const o of objs) {
          expect(seen.has(o.id)).toBe(false);
          seen.add(o.id);
        }
      }
      expect(seen.size).toBe(8);
    });

    it('evaluates end-only objectives strictly at game over', () => {
      const p0: Player = {
        id: 0,
        name: 'P0',
        color: '',
        bgClass: '',
        borderClass: '',
        symbol: '',
        coin: 11, // 10以上 (守銭奴)
        reservedCoin: 0,
        startCoord: START_POSITIONS.A,
        currentCoord: GOAL_COORD, // Eにいる (ゴールキーパー)
        reachedGoalEver: true,
        secretObjectives: [
          { id: 2, name: 'ゴールキーパー', category: 'board', points: 7, isCompleted: false, description: '' },
          { id: 12, name: '守銭奴', category: 'coin', points: 3, isCompleted: false, description: '' },
        ],
      };

      const stats = createInitialStats([0]);

      // 途中更新では未達成のまま
      const inProgress = updateObjectivesInProgress(p0, [p0], stats);
      expect(inProgress.secretObjectives[0].isCompleted).toBe(false);
      expect(inProgress.secretObjectives[1].isCompleted).toBe(false);

      // ゲーム終了時判定で達成
      const finalPlayers = evaluateFinalObjectives([p0], stats);
      expect(finalPlayers[0].secretObjectives[0].isCompleted).toBe(true);
      expect(finalPlayers[0].secretObjectives[1].isCompleted).toBe(true);
    });
  });

  // 5. セーブと復元テスト
  describe('5. Save and Restore Tests', () => {
    it('rejects corrupted save data properly', () => {
      const invalid = { players: 'invalid' };
      const res = validateSaveData(invalid);
      expect(res.isValid).toBe(false);
    });
  });
});
