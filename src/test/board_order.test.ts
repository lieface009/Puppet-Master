import { describe, expect, it } from 'vitest';
import {
  GOAL_COORD,
  getArea,
  isEligibleBorderSquare,
  isValidStep,
} from '../logic/board';
import {
  canIssueOrder,
  evaluateOrder,
} from '../logic/order';
import type { Coordinate, Order } from '../types/game';

describe('Board & Movement Tests', () => {
  it('correctly identifies areas on 5x5 grid', () => {
    // A A B C C
    // A A B C C
    // D D E F F
    // G G H I I
    // G G H I I
    expect(getArea({ x: 0, y: 0 })).toBe('A');
    expect(getArea({ x: 1, y: 1 })).toBe('A');
    expect(getArea({ x: 2, y: 0 })).toBe('B');
    expect(getArea({ x: 2, y: 1 })).toBe('B');
    expect(getArea({ x: 3, y: 0 })).toBe('C');
    expect(getArea({ x: 4, y: 1 })).toBe('C');
    expect(getArea({ x: 0, y: 2 })).toBe('D');
    expect(getArea({ x: 1, y: 2 })).toBe('D');
    expect(getArea({ x: 2, y: 2 })).toBe('E'); // Goal E
    expect(getArea({ x: 3, y: 2 })).toBe('F');
    expect(getArea({ x: 4, y: 2 })).toBe('F');
    expect(getArea({ x: 0, y: 3 })).toBe('G');
    expect(getArea({ x: 1, y: 4 })).toBe('G');
    expect(getArea({ x: 2, y: 3 })).toBe('H');
    expect(getArea({ x: 2, y: 4 })).toBe('H');
    expect(getArea({ x: 3, y: 3 })).toBe('I');
    expect(getArea({ x: 4, y: 4 })).toBe('I');
  });

  it('validates single-step adjacent movement without diagonal or out of bounds', () => {
    const origin: Coordinate = { x: 2, y: 2 };
    expect(isValidStep(origin, { x: 2, y: 1 })).toBe(true); // up
    expect(isValidStep(origin, { x: 2, y: 3 })).toBe(true); // down
    expect(isValidStep(origin, { x: 1, y: 2 })).toBe(true); // left
    expect(isValidStep(origin, { x: 3, y: 2 })).toBe(true); // right
    expect(isValidStep(origin, { x: 3, y: 3 })).toBe(false); // diagonal
    expect(isValidStep(origin, { x: 2, y: 2 })).toBe(false); // same
    expect(isValidStep(origin, { x: 2, y: 4 })).toBe(false); // 2 steps

    const corner: Coordinate = { x: 0, y: 0 };
    expect(isValidStep(corner, { x: -1, y: 0 })).toBe(false); // out of board
    expect(isValidStep(corner, { x: 0, y: -1 })).toBe(false); // out of board
    expect(isValidStep(corner, { x: 1, y: 0 })).toBe(true);
  });

  it('evaluates eligible border square for objective 4 (辺境の支配者)', () => {
    const startCoord: Coordinate = { x: 0, y: 0 }; // A corner
    // Start coord itself is not eligible
    expect(isEligibleBorderSquare(startCoord, startCoord)).toBe(false);
    // Adjacent to start coord: (1,0) and (0,1) are not eligible
    expect(isEligibleBorderSquare({ x: 1, y: 0 }, startCoord)).toBe(false);
    expect(isEligibleBorderSquare({ x: 0, y: 1 }, startCoord)).toBe(false);

    // Other borders are eligible:
    expect(isEligibleBorderSquare({ x: 2, y: 0 }, startCoord)).toBe(true);
    expect(isEligibleBorderSquare({ x: 4, y: 0 }, startCoord)).toBe(true);
    expect(isEligibleBorderSquare({ x: 0, y: 4 }, startCoord)).toBe(true);
    expect(isEligibleBorderSquare({ x: 4, y: 4 }, startCoord)).toBe(true);
    // Center is not on border
    expect(isEligibleBorderSquare({ x: 2, y: 2 }, startCoord)).toBe(false);
  });
});

describe('Order System & Evaluation Tests', () => {
  it('checks order issuance validation with coins and position constraints', () => {
    // Insufficient coins
    const check1 = canIssueOrder('reach_goal', 3, { x: 0, y: 0 }, 2);
    expect(check1.canIssue).toBe(false);

    // Reach goal when already on goal E
    const check2 = canIssueOrder('reach_goal', 1, GOAL_COORD, 5);
    expect(check2.canIssue).toBe(false);

    // Reach goal Lv3 when distance is > 3
    const check3 = canIssueOrder('reach_goal', 3, { x: 0, y: 0 }, 5); // dist = 4
    expect(check3.canIssue).toBe(false);

    // Reach goal Lv3 when distance is <= 3
    const check4 = canIssueOrder('reach_goal', 3, { x: 1, y: 0 }, 5); // dist = 3
    expect(check4.canIssue).toBe(true);
  });

  it('evaluates reach_goal Lv1 correctly', () => {
    const order: Order = {
      type: 'reach_goal',
      level: 1,
      sourcePlayerId: 0,
      targetPlayerId: 1,
      reward: 1,
    };

    // Moving from (0,0) [dist 4] to (1,0) [dist 3] -> closer -> Success
    const res1 = evaluateOrder(order, [{ x: 0, y: 0 }, { x: 1, y: 0 }]);
    expect(res1.success).toBe(true);

    // Moving from (0,0) to (1,0) then back to (0,0) -> same dist -> Failure
    const res2 = evaluateOrder(order, [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 0 }]);
    expect(res2.success).toBe(false);

    // 0 steps -> Failure
    const res3 = evaluateOrder(order, [{ x: 0, y: 0 }]);
    expect(res3.success).toBe(false);
  });

  it('evaluates reach_goal Lv2 correctly (straight 1-2 steps closer)', () => {
    const order: Order = {
      type: 'reach_goal',
      level: 2,
      sourcePlayerId: 0,
      targetPlayerId: 1,
      reward: 2,
      direction: 'right',
    };

    // Straight right 2 steps from (0,2) to (2,2) -> closer and straight -> Success
    const res1 = evaluateOrder(order, [{ x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }]);
    expect(res1.success).toBe(true);

    // Turn right then up -> not straight -> Failure
    const res2 = evaluateOrder(order, [{ x: 0, y: 2 }, { x: 1, y: 2 }, { x: 1, y: 1 }]);
    expect(res2.success).toBe(false);
  });

  it('evaluates reach_goal Lv3 correctly (reaches E in <= 3 steps)', () => {
    const order: Order = {
      type: 'reach_goal',
      level: 3,
      sourcePlayerId: 0,
      targetPlayerId: 1,
      reward: 3,
      targetCoord: GOAL_COORD,
    };

    // (1,2) -> (2,2) (1 step) -> Success
    const res1 = evaluateOrder(order, [{ x: 1, y: 2 }, { x: 2, y: 2 }]);
    expect(res1.success).toBe(true);

    // Stops at (1,2) without reaching E -> Failure
    const res2 = evaluateOrder(order, [{ x: 0, y: 2 }, { x: 1, y: 2 }]);
    expect(res2.success).toBe(false);
  });

  it('evaluates enter_area Lv1, Lv2, Lv3', () => {
    // Lv1: enter designated area
    const orderLv1: Order = {
      type: 'enter_area',
      level: 1,
      sourcePlayerId: 0,
      targetPlayerId: 1,
      reward: 1,
      targetArea: 'B',
    };
    // (0,0)[A] -> (1,0)[A] -> (2,0)[B] -> Success
    const resLv1 = evaluateOrder(orderLv1, [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }]);
    expect(resLv1.success).toBe(true);

    // Lv2: straight line into area
    const orderLv2: Order = {
      type: 'enter_area',
      level: 2,
      sourcePlayerId: 0,
      targetPlayerId: 1,
      reward: 2,
      direction: 'right',
      targetArea: 'B',
    };
    const resLv2 = evaluateOrder(orderLv2, [{ x: 1, y: 0 }, { x: 2, y: 0 }]);
    expect(resLv2.success).toBe(true);

    // Lv3: reaches exact target coord in area
    const orderLv3: Order = {
      type: 'enter_area',
      level: 3,
      sourcePlayerId: 0,
      targetPlayerId: 1,
      reward: 3,
      targetArea: 'C',
      targetCoord: { x: 3, y: 0 },
    };
    const resLv3 = evaluateOrder(orderLv3, [{ x: 2, y: 0 }, { x: 3, y: 0 }]);
    expect(resLv3.success).toBe(true);
  });

  it('evaluates move_direction Lv1 (no opposite movement, at least 1 designated step)', () => {
    const order: Order = {
      type: 'move_direction',
      level: 1,
      sourcePlayerId: 0,
      targetPlayerId: 1,
      reward: 1,
      direction: 'right',
    };

    // Right, then Down -> Success (opposite of right is left, no left used)
    const res1 = evaluateOrder(order, [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }]);
    expect(res1.success).toBe(true);

    // Right, then Left -> Failure (used opposite direction)
    const res2 = evaluateOrder(order, [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 0 }]);
    expect(res2.success).toBe(false);

    // Only Down (no Right at all) -> Failure
    const res3 = evaluateOrder(order, [{ x: 0, y: 0 }, { x: 0, y: 1 }]);
    expect(res3.success).toBe(false);
  });
});
