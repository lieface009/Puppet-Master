import type {
  AreaId,
  Coordinate,
  Direction,
  Order,
  OrderLevel,
  OrderType,
} from '../types/game';
import {
  BOARD_SIZE,
  GOAL_COORD,
  getArea,
  getCoordInDirection,
  getManhattanDistance,
  getOppositeDirection,
  getStepDirection,
  isSameCoord,
  isWithinBoard,
} from './board';

// レベル別の固定報酬
export const ORDER_REWARDS: Record<OrderLevel, number> = {
  1: 1,
  2: 2,
  3: 3,
};

// 命令発行バリデーション
export function canIssueOrder(
  type: OrderType,
  level: OrderLevel,
  currentCoord: Coordinate,
  playerCoins: number
): { canIssue: boolean; reason?: string } {
  const reward = ORDER_REWARDS[level];
  if (playerCoins < reward) {
    return { canIssue: false, reason: `コインが不足しています（必要: ${reward}コイン / 所持: ${playerCoins}コイン）` };
  }

  if (type === 'reach_goal') {
    if (isSameCoord(currentCoord, GOAL_COORD)) {
      return { canIssue: false, reason: '既にゴールEにいるため、「ゴールを目指せ」は出せません' };
    }
    if (level === 2) {
      // 直線1〜2マスでゴールEまでのマンハッタン距離が縮まる方向が存在するか
      const validDirections = getValidDirectionsForGoalLv2(currentCoord);
      if (validDirections.length === 0) {
        return { canIssue: false, reason: '直線1〜2マスでゴールに近づける方向がありません' };
      }
    } else if (level === 3) {
      // マンハッタン距離が3以下でなければならない
      const dist = getManhattanDistance(currentCoord, GOAL_COORD);
      if (dist > 3) {
        return { canIssue: false, reason: 'ゴールEまで4マス以上離れているため、レベル3の命令は出せません（最大3マス以内）' };
      }
    }
  }

  if (type === 'enter_area') {
    if (level === 2) {
      // どこかのエリアに直線1〜2マスで入れる方向があるか
      const validOptions = getAvailableLv2AreaOptions(currentCoord);
      if (validOptions.length === 0) {
        return { canIssue: false, reason: '有効なエリア・方向の組み合わせがありません' };
      }
    } else if (level === 3) {
      // マンハッタン距離1〜3以内のマスが存在するか（盤面内なら常に存在する）
      const validDestinations = getAvailableLv3Destinations(currentCoord);
      if (validDestinations.length === 0) {
        return { canIssue: false, reason: '3マス以内で到達可能なマスがありません' };
      }
    }
  }

  if (type === 'move_direction') {
    if (level === 2) {
      // 盤面内で1マス以上進める方向があるか
      const validDirs = getValidDirectionsForDirectionLv2(currentCoord);
      if (validDirs.length === 0) {
        return { canIssue: false, reason: '進める方向がありません' };
      }
    } else if (level === 3) {
      const validDestinations = getAvailableLv3Destinations(currentCoord);
      if (validDestinations.length === 0) {
        return { canIssue: false, reason: '3マス以内で到達可能な目的地がありません' };
      }
    }
  }

  return { canIssue: true };
}

// ゴールLv2で距離が縮まる方向一覧
export function getValidDirectionsForGoalLv2(coord: Coordinate): Direction[] {
  const directions: Direction[] = ['up', 'down', 'left', 'right'];
  const currentDist = getManhattanDistance(coord, GOAL_COORD);
  return directions.filter((dir) => {
    // 1マス進んだ場合
    const c1 = getCoordInDirection(coord, dir, 1);
    if (isWithinBoard(c1) && getManhattanDistance(c1, GOAL_COORD) < currentDist) {
      return true;
    }
    // 2マス進んだ場合
    const c2 = getCoordInDirection(coord, dir, 2);
    if (isWithinBoard(c2) && getManhattanDistance(c2, GOAL_COORD) < currentDist) {
      return true;
    }
    return false;
  });
}

// 進路Lv2で1マス以上進める方向一覧
export function getValidDirectionsForDirectionLv2(coord: Coordinate): Direction[] {
  const directions: Direction[] = ['up', 'down', 'left', 'right'];
  return directions.filter((dir) => {
    const c1 = getCoordInDirection(coord, dir, 1);
    return isWithinBoard(c1);
  });
}

// エリアLv2で有効な (direction, area) のリスト
export function getAvailableLv2AreaOptions(coord: Coordinate): { direction: Direction; area: AreaId }[] {
  const directions: Direction[] = ['up', 'down', 'left', 'right'];
  const results: { direction: Direction; area: AreaId }[] = [];
  const seen = new Set<string>();

  for (const dir of directions) {
    for (const steps of [1, 2]) {
      const target = getCoordInDirection(coord, dir, steps);
      if (isWithinBoard(target)) {
        const area = getArea(target);
        const key = `${dir}-${area}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({ direction: dir, area });
        }
      }
    }
  }
  return results;
}

// エリアLv1で指定可能なエリア（現在のエリア以外の全エリア）
export function getAvailableLv1Areas(currentCoord: Coordinate): AreaId[] {
  const currentArea = getArea(currentCoord);
  const allAreas: AreaId[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
  return allAreas.filter((a) => a !== currentArea);
}

// Lv3で最大3マス以内で到達可能なマス（現在地は除く）
export function getAvailableLv3Destinations(currentCoord: Coordinate, targetArea?: AreaId): Coordinate[] {
  const destinations: Coordinate[] = [];
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const c = { x, y };
      if (isSameCoord(c, currentCoord)) continue;
      const dist = getManhattanDistance(currentCoord, c);
      if (dist <= 3) {
        if (!targetArea || getArea(c) === targetArea) {
          destinations.push(c);
        }
      }
    }
  }
  return destinations;
}

// レベルごとの最大移動マス数
export function getMaxStepsForOrder(order: Order): number {
  switch (order.level) {
    case 1:
      return 5;
    case 2:
      return 2;
    case 3:
      return 3;
  }
}

// 命令の成功・失敗の厳密評価
export function evaluateOrder(
  order: Order,
  path: Coordinate[]
): { success: boolean; reason: string } {
  if (path.length < 2) {
    return { success: false, reason: '1マスも移動していません（少なくとも1マスの移動が必要です）' };
  }

  const startCoord = path[0];
  const finalCoord = path[path.length - 1];
  const steps = path.length - 1;

  // 1. ゴールを目指せ
  if (order.type === 'reach_goal') {
    if (order.level === 1) {
      if (steps > 5) {
        return { success: false, reason: `最大5マスを超えて移動しました（移動数: ${steps}マス）` };
      }
      const initialDist = getManhattanDistance(startCoord, GOAL_COORD);
      const finalDist = getManhattanDistance(finalCoord, GOAL_COORD);
      if (finalDist < initialDist) {
        return {
          success: true,
          reason: `ゴールEに近づきました（距離: ${initialDist}マス → ${finalDist}マス）`,
        };
      } else {
        return {
          success: false,
          reason: `ゴールEに近づいていません（開始時距離: ${initialDist}マス / 終了時距離: ${finalDist}マス）`,
        };
      }
    }

    if (order.level === 2) {
      if (!order.direction) {
        return { success: false, reason: '指定方向が設定されていません' };
      }
      if (steps < 1 || steps > 2) {
        return { success: false, reason: `レベル2は直線1〜2マスの移動が必要です（移動数: ${steps}マス）` };
      }
      // 直線移動チェック
      for (let i = 0; i < steps; i++) {
        const stepDir = getStepDirection(path[i], path[i + 1]);
        if (stepDir !== order.direction) {
          return { success: false, reason: `指定方向（${order.direction}）と異なる直線外の移動が行われました` };
        }
      }
      const initialDist = getManhattanDistance(startCoord, GOAL_COORD);
      const finalDist = getManhattanDistance(finalCoord, GOAL_COORD);
      if (finalDist < initialDist) {
        return {
          success: true,
          reason: `指定方向へ進み、ゴールEに近づきました（距離: ${initialDist}マス → ${finalDist}マス）`,
        };
      } else {
        return {
          success: false,
          reason: `指定方向へ進みましたが、ゴールEに近づいていません（開始時距離: ${initialDist}マス / 終了時距離: ${finalDist}マス）`,
        };
      }
    }

    if (order.level === 3) {
      if (steps > 3) {
        return { success: false, reason: `最大3マスを超えて移動しました（移動数: ${steps}マス）` };
      }
      if (isSameCoord(finalCoord, GOAL_COORD)) {
        return { success: true, reason: '目的地ゴールEに到達しました' };
      } else {
        return { success: false, reason: `ゴールEに到達していません（現在地: (${finalCoord.x}, ${finalCoord.y})）` };
      }
    }
  }

  // 2. 指定エリアに入れ
  if (order.type === 'enter_area') {
    if (!order.targetArea) {
      return { success: false, reason: '指定エリアが設定されていません' };
    }

    if (order.level === 1) {
      if (steps > 5) {
        return { success: false, reason: `最大5マスを超えて移動しました（移動数: ${steps}マス）` };
      }
      const finalArea = getArea(finalCoord);
      if (finalArea === order.targetArea) {
        return { success: true, reason: `指定エリア【${order.targetArea}】に入りました` };
      } else {
        return { success: false, reason: `指定エリア【${order.targetArea}】ではなくエリア【${finalArea}】で移動を終了しました` };
      }
    }

    if (order.level === 2) {
      if (!order.direction) {
        return { success: false, reason: '指定方向が設定されていません' };
      }
      if (steps < 1 || steps > 2) {
        return { success: false, reason: `レベル2は直線1〜2マスの移動が必要です（移動数: ${steps}マス）` };
      }
      for (let i = 0; i < steps; i++) {
        const stepDir = getStepDirection(path[i], path[i + 1]);
        if (stepDir !== order.direction) {
          return { success: false, reason: `指定方向（${order.direction}）と異なる直線外の移動が行われました` };
        }
      }
      const finalArea = getArea(finalCoord);
      if (finalArea === order.targetArea) {
        return { success: true, reason: `指定方向へ直線移動し、指定エリア【${order.targetArea}】に入りました` };
      } else {
        return { success: false, reason: `指定方向へ直線移動しましたが、エリア【${finalArea}】でした（目標: ${order.targetArea}）` };
      }
    }

    if (order.level === 3) {
      if (steps > 3) {
        return { success: false, reason: `最大3マスを超えて移動しました（移動数: ${steps}マス）` };
      }
      if (!order.targetCoord) {
        return { success: false, reason: '目的地が設定されていません' };
      }
      if (isSameCoord(finalCoord, order.targetCoord)) {
        return { success: true, reason: `指定された目的地 (${order.targetCoord.x}, ${order.targetCoord.y}) に到達しました` };
      } else {
        return {
          success: false,
          reason: `指定された目的地 (${order.targetCoord.x}, ${order.targetCoord.y}) ではなく (${finalCoord.x}, ${finalCoord.y}) に到達しました`,
        };
      }
    }
  }

  // 3. 指定方向へ進め
  if (order.type === 'move_direction') {
    if (order.level === 1) {
      if (!order.direction) {
        return { success: false, reason: '指定方向が設定されていません' };
      }
      if (steps > 5) {
        return { success: false, reason: `最大5マスを超えて移動しました（移動数: ${steps}マス）` };
      }
      const oppositeDir = getOppositeDirection(order.direction);
      let movedInDesignatedDir = false;

      for (let i = 0; i < steps; i++) {
        const stepDir = getStepDirection(path[i], path[i + 1]);
        if (stepDir === oppositeDir) {
          return { success: false, reason: `指定方向の反対方向（${oppositeDir}）へ移動したため失敗です` };
        }
        if (stepDir === order.direction) {
          movedInDesignatedDir = true;
        }
      }

      if (!movedInDesignatedDir) {
        return { success: false, reason: `指定方向（${order.direction}）へ1度も進んでいません` };
      }

      return { success: true, reason: `指定方向（${order.direction}）へ進み、反対方向へ移動せず移動を完了しました` };
    }

    if (order.level === 2) {
      if (!order.direction) {
        return { success: false, reason: '指定方向が設定されていません' };
      }
      if (steps < 1 || steps > 2) {
        return { success: false, reason: `レベル2は直線1〜2マスの移動が必要です（移動数: ${steps}マス）` };
      }
      for (let i = 0; i < steps; i++) {
        const stepDir = getStepDirection(path[i], path[i + 1]);
        if (stepDir !== order.direction) {
          return { success: false, reason: `指定方向（${order.direction}）と異なる移動が行われました` };
        }
      }
      return { success: true, reason: `指定方向（${order.direction}）へ直線で${steps}マス進みました` };
    }

    if (order.level === 3) {
      if (steps > 3) {
        return { success: false, reason: `最大3マスを超えて移動しました（移動数: ${steps}マス）` };
      }
      if (!order.targetCoord) {
        return { success: false, reason: '目的地が設定されていません' };
      }
      if (isSameCoord(finalCoord, order.targetCoord)) {
        return { success: true, reason: `指定された目的地 (${order.targetCoord.x}, ${order.targetCoord.y}) に到達しました` };
      } else {
        return {
          success: false,
          reason: `指定された目的地 (${order.targetCoord.x}, ${order.targetCoord.y}) ではなく (${finalCoord.x}, ${finalCoord.y}) に到達しました`,
        };
      }
    }
  }

  return { success: false, reason: '未定義の命令条件です' };
}
