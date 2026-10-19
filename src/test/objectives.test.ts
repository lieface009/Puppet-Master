import { describe, expect, it } from 'vitest';
import { GOAL_COORD, START_POSITIONS } from '../logic/board';
import {
  createInitialStats,
  dealSecretObjectives,
  evaluateFinalObjectives,
  recordEncounters,
  updateObjectivesInProgress,
} from '../logic/objectives';
import type { Coordinate, Player } from '../types/game';

describe('Secret Objectives Distribution Tests', () => {
  it('deals 2 objectives per player with different categories and NO duplicates for 3 players', () => {
    const players = [
      { id: 0, startCoord: START_POSITIONS.A },
      { id: 1, startCoord: START_POSITIONS.C },
      { id: 2, startCoord: START_POSITIONS.G },
    ];
    const playerIds = [0, 1, 2];

    // 複数回試行してランダム抽選でも常に制約が満たされるか検証
    for (let run = 0; run < 10; run++) {
      const dealt = dealSecretObjectives(players, playerIds);
      const allDealtIds = new Set<number>();

      expect(dealt.size).toBe(3);

      for (const [, objs] of dealt.entries()) {
        expect(objs.length).toBe(2);
        // 異なるカテゴリであること
        expect(objs[0].category).not.toBe(objs[1].category);

        for (const obj of objs) {
          // 全体で重複がないこと
          expect(allDealtIds.has(obj.id)).toBe(false);
          allDealtIds.add(obj.id);
        }
      }
      expect(allDealtIds.size).toBe(6);
    }
  });

  it('deals 2 objectives per player with different categories and NO duplicates for 4 players', () => {
    const players = [
      { id: 0, startCoord: START_POSITIONS.A },
      { id: 1, startCoord: START_POSITIONS.C },
      { id: 2, startCoord: START_POSITIONS.G },
      { id: 3, startCoord: START_POSITIONS.I },
    ];
    const playerIds = [0, 1, 2, 3];

    for (let run = 0; run < 10; run++) {
      const dealt = dealSecretObjectives(players, playerIds);
      const allDealtIds = new Set<number>();

      expect(dealt.size).toBe(4);

      for (const [, objs] of dealt.entries()) {
        expect(objs.length).toBe(2);
        expect(objs[0].category).not.toBe(objs[1].category);

        for (const obj of objs) {
          expect(allDealtIds.has(obj.id)).toBe(false);
          allDealtIds.add(obj.id);
        }
      }
      expect(allDealtIds.size).toBe(8);
    }
  });
});

describe('Secret Objectives Evaluation Tests', () => {
  function makePlayer(
    id: number,
    startCoord: Coordinate,
    currentCoord: Coordinate,
    coin: number,
    reachedGoalEver: boolean = false
  ): Player {
    return {
      id,
      name: `Player ${id + 1}`,
      color: '#ef4444',
      bgClass: 'bg-red-500',
      borderClass: 'border-red-500',
      symbol: '★',
      coin,
      reservedCoin: 0,
      startCoord,
      currentCoord,
      reachedGoalEver,
      secretObjectives: [],
    };
  }

  it('updates in-progress objectives correctly and hides end-only objectives', () => {
    const p0 = makePlayer(0, START_POSITIONS.A, { x: 1, y: 1 }, 5);
    p0.secretObjectives = [
      {
        id: 1, // ゴール到達者
        name: 'ゴール到達者',
        category: 'board',
        points: 5,
        description: '',
        isCompleted: false,
      },
      {
        id: 2, // ゴールキーパー (終了時のみ)
        name: 'ゴールキーパー',
        category: 'board',
        points: 7,
        description: '',
        isCompleted: false,
      },
    ];

    const stats = createInitialStats([0, 1, 2]);

    // 進行中はゴールキーパーは未達成のまま
    const updated = updateObjectivesInProgress(p0, [p0], stats);
    expect(updated.secretObjectives[0].isCompleted).toBe(false);
    expect(updated.secretObjectives[1].isCompleted).toBe(false);

    // ゴール到達実績がついたらゴール到達者は達成
    p0.reachedGoalEver = true;
    const updated2 = updateObjectivesInProgress(p0, [p0], stats);
    expect(updated2.secretObjectives[0].isCompleted).toBe(true);
    expect(updated2.secretObjectives[1].isCompleted).toBe(false);
  });

  it('evaluates final objectives accurately', () => {
    const p0 = makePlayer(0, START_POSITIONS.A, GOAL_COORD, 12, true); // at Goal E, 12 coins
    p0.secretObjectives = [
      {
        id: 2, // ゴールキーパー
        name: 'ゴールキーパー',
        category: 'board',
        points: 7,
        description: '',
        isCompleted: false,
      },
      {
        id: 12, // 守銭奴 (10コイン以上)
        name: '守銭奴',
        category: 'coin',
        points: 3,
        description: '',
        isCompleted: false,
      },
    ];

    const p1 = makePlayer(1, START_POSITIONS.C, { x: 2, y: 0 }, 5); // on border, 5 coins
    p1.secretObjectives = [
      {
        id: 4, // 辺境の支配者 (開始C(4,0)の隣接(3,0),(4,1)以外、(2,0)はOK)
        name: '辺境の支配者',
        category: 'board',
        points: 3,
        description: '',
        isCompleted: false,
      },
      {
        id: 13, // 大富豪 (最多コイン) -> p0が12枚なのでp1は未達成
        name: '大富豪',
        category: 'coin',
        points: 5,
        description: '',
        isCompleted: false,
      },
    ];

    const stats = createInitialStats([0, 1]);
    const finalPlayers = evaluateFinalObjectives([p0, p1], stats);

    // p0: GoalKeeper = true, Miser(12>=10) = true
    expect(finalPlayers[0].secretObjectives[0].isCompleted).toBe(true);
    expect(finalPlayers[0].secretObjectives[1].isCompleted).toBe(true);

    // p1: BorderRuler = true, Billionaire = false
    expect(finalPlayers[1].secretObjectives[0].isCompleted).toBe(true);
    expect(finalPlayers[1].secretObjectives[1].isCompleted).toBe(false);
  });

  it('records encounter during multi-step movement correctly', () => {
    const p0 = makePlayer(0, { x: 0, y: 0 }, { x: 0, y: 0 }, 5);
    const p1 = makePlayer(1, { x: 2, y: 0 }, { x: 2, y: 0 }, 5); // p1 is sitting at (2,0)
    const stats = createInitialStats([0, 1]);

    // p0 moves (0,0) -> (1,0) -> (2,0) [steps on p1] -> (3,0)
    const path: Coordinate[] = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
    ];

    recordEncounters(0, path, [p0, p1], stats);

    expect(stats.metPlayers[0]).toContain(1);
    expect(stats.metPlayers[1]).toContain(0);
  });
});
