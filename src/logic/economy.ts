import type { GameStats, Order, Player } from '../types/game';

// 命令報酬の予約
export function reserveOrderReward(
  order: Order,
  players: Player[]
): { success: boolean; players: Player[]; error?: string } {
  const source = players.find((p) => p.id === order.sourcePlayerId);
  if (!source) return { success: false, players, error: '命令したプレイヤーが見つかりません' };

  if (source.coin < order.reward) {
    return {
      success: false,
      players,
      error: `所持コインが不足しています（必要: ${order.reward}コイン / 所持: ${source.coin}コイン）`,
    };
  }

  const updatedPlayers = players.map((p) => {
    if (p.id === order.sourcePlayerId) {
      return {
        ...p,
        coin: p.coin - order.reward,
        reservedCoin: p.reservedCoin + order.reward,
      };
    }
    return p;
  });

  return { success: true, players: updatedPlayers };
}

// 命令拒否時の返却処理
export function processOrderRejection(
  order: Order,
  players: Player[],
  stats: GameStats,
  actionId: string,
  processedActionIds: string[]
): {
  players: Player[];
  stats: GameStats;
  processedActionIds: string[];
} {
  if (processedActionIds.includes(actionId)) {
    return { players, stats, processedActionIds };
  }

  const updatedPlayers = players.map((p) => {
    if (p.id === order.sourcePlayerId) {
      return {
        ...p,
        coin: p.coin + order.reward,
        reservedCoin: Math.max(0, p.reservedCoin - order.reward),
      };
    }
    return p;
  });

  const updatedStats: GameStats = {
    ...stats,
    ordersRejected: {
      ...stats.ordersRejected,
      [order.targetPlayerId]: (stats.ordersRejected[order.targetPlayerId] || 0) + 1,
    },
  };

  return {
    players: updatedPlayers,
    stats: updatedStats,
    processedActionIds: [...processedActionIds, actionId],
  };
}

// 命令成功時の精算処理
export function processOrderSuccess(
  order: Order,
  movedSteps: number,
  players: Player[],
  stats: GameStats,
  actionId: string,
  processedActionIds: string[]
): {
  players: Player[];
  stats: GameStats;
  coinsTransferred: { from: number; to: number; amount: number; type: 'reward' };
  processedActionIds: string[];
} {
  const coinsTransferred = {
    from: order.sourcePlayerId,
    to: order.targetPlayerId,
    amount: order.reward,
    type: 'reward' as const,
  };

  if (processedActionIds.includes(actionId)) {
    return { players, stats, coinsTransferred, processedActionIds };
  }

  // 命令者の reservedCoin を消費し、被命令者の coin を増加
  const updatedPlayers = players.map((p) => {
    if (p.id === order.sourcePlayerId) {
      return {
        ...p,
        reservedCoin: Math.max(0, p.reservedCoin - order.reward),
      };
    }
    if (p.id === order.targetPlayerId) {
      return {
        ...p,
        coin: p.coin + order.reward,
      };
    }
    return p;
  });

  // stats 更新
  const sourceReceivedList = stats.successfulOrdersReceivedFrom[order.targetPlayerId] || [];
  const updatedReceivedList = sourceReceivedList.includes(order.sourcePlayerId)
    ? sourceReceivedList
    : [...sourceReceivedList, order.sourcePlayerId];

  const updatedStats: GameStats = {
    ...stats,
    // 敏腕交渉人: 命令を出した側が成功
    successfulOrdersIssued: {
      ...stats.successfulOrdersIssued,
      [order.sourcePlayerId]: (stats.successfulOrdersIssued[order.sourcePlayerId] || 0) + 1,
    },
    // 人たらし: 命令を受けた側が命令者からの命令を成功
    successfulOrdersReceivedFrom: {
      ...stats.successfulOrdersReceivedFrom,
      [order.targetPlayerId]: updatedReceivedList,
    },
    // 商売上手: 命令を出した側が支払った成功報酬
    coinsPaidAsReward: {
      ...stats.coinsPaidAsReward,
      [order.sourcePlayerId]: (stats.coinsPaidAsReward[order.sourcePlayerId] || 0) + order.reward,
    },
    // 報酬コレクター: 命令を受けた側が受け取った報酬
    coinsReceivedAsReward: {
      ...stats.coinsReceivedAsReward,
      [order.targetPlayerId]: (stats.coinsReceivedAsReward[order.targetPlayerId] || 0) + order.reward,
    },
    // 誘導の達人: 移動マス数を記録（命令者側と被命令者側の両方に加算してどちらの解釈にも完全適合可能にする）
    guidedDistance: {
      ...stats.guidedDistance,
      [order.targetPlayerId]: (stats.guidedDistance[order.targetPlayerId] || 0) + movedSteps,
      [order.sourcePlayerId]: (stats.guidedDistance[order.sourcePlayerId] || 0) + movedSteps,
    },
  };

  return {
    players: updatedPlayers,
    stats: updatedStats,
    coinsTransferred,
    processedActionIds: [...processedActionIds, actionId],
  };
}

// 命令失敗時のペナルティ処理 (Lv1, Lv2)
export function processOrderFailure(
  order: Order,
  players: Player[],
  stats: GameStats,
  actionId: string,
  processedActionIds: string[]
): {
  players: Player[];
  stats: GameStats;
  coinsTransferred: { from: number; to: number; amount: number; type: 'penalty' } | null;
  processedActionIds: string[];
} {
  const targetPlayer = players.find((p) => p.id === order.targetPlayerId);
  const targetCoin = targetPlayer ? targetPlayer.coin : 0;

  // ペナルティ: 被命令者が1以上持っていれば1コイン、0なら0
  const penaltyAmount = targetCoin >= 1 ? 1 : Math.max(0, targetCoin);

  const coinsTransferred =
    penaltyAmount > 0
      ? {
          from: order.targetPlayerId,
          to: order.sourcePlayerId,
          amount: penaltyAmount,
          type: 'penalty' as const,
        }
      : null;

  if (processedActionIds.includes(actionId)) {
    return { players, stats, coinsTransferred, processedActionIds };
  }

  // 1. 命令者の予約コインは返却（報酬は支払わない）
  // 2. 被命令者から命令者へ penaltyAmount を移動
  const updatedPlayers = players.map((p) => {
    if (p.id === order.sourcePlayerId) {
      return {
        ...p,
        coin: p.coin + order.reward + penaltyAmount,
        reservedCoin: Math.max(0, p.reservedCoin - order.reward),
      };
    }
    if (p.id === order.targetPlayerId) {
      return {
        ...p,
        coin: Math.max(0, p.coin - penaltyAmount),
      };
    }
    return p;
  });

  return {
    players: updatedPlayers,
    stats,
    coinsTransferred,
    processedActionIds: [...processedActionIds, actionId],
  };
}

// 自主行動: 1コイン獲得
export function processVoluntaryCoin(
  playerId: number,
  players: Player[],
  stats: GameStats,
  actionId: string,
  processedActionIds: string[]
): {
  players: Player[];
  stats: GameStats;
  processedActionIds: string[];
} {
  if (processedActionIds.includes(actionId)) {
    return { players, stats, processedActionIds };
  }

  const updatedPlayers = players.map((p) => {
    if (p.id === playerId) {
      return { ...p, coin: p.coin + 1 };
    }
    return p;
  });

  const updatedStats: GameStats = {
    ...stats,
    frugalCount: {
      ...stats.frugalCount,
      [playerId]: (stats.frugalCount[playerId] || 0) + 1,
    },
  };

  return {
    players: updatedPlayers,
    stats: updatedStats,
    processedActionIds: [...processedActionIds, actionId],
  };
}
