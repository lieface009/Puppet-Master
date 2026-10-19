import type {
  Coordinate,
  GameStats,
  ObjectiveCategory,
  Player,
  SecretObjective,
} from '../types/game';
import {
  GOAL_COORD,
  getArea,
  getManhattanDistance,
  getTerritoryCandidates,
  isEligibleBorderSquare,
  isSameCoord,
} from './board';

export interface ObjectiveDefinition {
  id: number;
  name: string;
  category: ObjectiveCategory;
  points: number;
  description: string;
  maxProgress?: number;
  evaluatesAtEndOnly?: boolean;
}

export const OBJECTIVE_DEFINITIONS: ObjectiveDefinition[] = [
  // 盤面系 (1..7)
  {
    id: 1,
    name: 'ゴール到達者',
    category: 'board',
    points: 5,
    description: '自分の駒が移動を終了した位置がゴールEになったことが1回以上ある。',
  },
  {
    id: 2,
    name: 'ゴールキーパー',
    category: 'board',
    points: 7,
    description: 'ゲーム終了時に、自分の駒がゴールEにいる。',
    evaluatesAtEndOnly: true,
  },
  {
    id: 3,
    name: '陣取り屋',
    category: 'board',
    points: 5,
    description: 'ゲーム終了時に、指定されたエリアにいる。',
    evaluatesAtEndOnly: true,
  },
  {
    id: 4,
    name: '辺境の支配者',
    category: 'board',
    points: 3,
    description: 'ゲーム終了時に外周マスにいる（開始マスとその隣接4マスは除く）。',
    evaluatesAtEndOnly: true,
  },
  {
    id: 5,
    name: '誘導の達人',
    category: 'board',
    points: 5,
    description: '命令成功により自分の駒が合計3マス以上移動している。',
    maxProgress: 3,
  },
  {
    id: 6,
    name: '仲良しコンビ',
    category: 'board',
    points: 5,
    description: 'ゲーム終了時に、指定された他プレイヤーの駒と上下左右で隣接している。',
    evaluatesAtEndOnly: true,
  },
  {
    id: 7,
    name: '遭遇マスター',
    category: 'board',
    points: 7,
    description: '他の全プレイヤーと少なくとも1回同じマスに重なったことがある。',
  },

  // 交渉系 (8..11)
  {
    id: 8,
    name: '敏腕交渉人',
    category: 'negotiation',
    points: 7,
    description: '自分が出した命令を他のプレイヤーが合計3回以上成功させる。',
    maxProgress: 3,
  },
  {
    id: 9,
    name: '反骨精神',
    category: 'negotiation',
    points: 5,
    description: '他のプレイヤーから受けた命令を合計3回以上拒否する。',
    maxProgress: 3,
  },
  {
    id: 10,
    name: '人たらし',
    category: 'negotiation',
    points: 7,
    description: '自分以外のすべてのプレイヤーから命令を受け、成功させる。',
  },
  {
    id: 11,
    name: '商売上手',
    category: 'negotiation',
    points: 5,
    description: '命令の成功報酬として他のプレイヤーへ合計6コイン以上を支払う。',
    maxProgress: 6,
  },

  // コイン系 (12..15)
  {
    id: 12,
    name: '守銭奴',
    category: 'coin',
    points: 3,
    description: 'ゲーム終了時に10コイン以上を持っている。',
    evaluatesAtEndOnly: true,
  },
  {
    id: 13,
    name: '大富豪',
    category: 'coin',
    points: 5,
    description: 'ゲーム終了時の所持コインが最も多い（同率1位も達成）。',
    evaluatesAtEndOnly: true,
  },
  {
    id: 14,
    name: '倹約家',
    category: 'coin',
    points: 5,
    description: '自主行動でコイン獲得を3回以上選ぶ。',
    maxProgress: 3,
  },
  {
    id: 15,
    name: '報酬コレクター',
    category: 'coin',
    points: 5,
    description: '他のプレイヤーから命令の成功報酬として合計5コイン以上を受け取る。',
    maxProgress: 5,
  },
];

// 初期化用 GameStats 生成
export function createInitialStats(playerIds: number[]): GameStats {
  const stats: GameStats = {
    successfulOrdersIssued: {},
    ordersRejected: {},
    successfulOrdersReceivedFrom: {},
    coinsPaidAsReward: {},
    frugalCount: {},
    coinsReceivedAsReward: {},
    guidedDistance: {},
    metPlayers: {},
  };

  for (const id of playerIds) {
    stats.successfulOrdersIssued[id] = 0;
    stats.ordersRejected[id] = 0;
    stats.successfulOrdersReceivedFrom[id] = [];
    stats.coinsPaidAsReward[id] = 0;
    stats.frugalCount[id] = 0;
    stats.coinsReceivedAsReward[id] = 0;
    stats.guidedDistance[id] = 0;
    stats.metPlayers[id] = [];
  }
  return stats;
}

// プレイヤー全員への秘密目標一括抽選
// 要件：
// - 各プレイヤー2枚
// - 同じプレイヤーの2枚は異なるカテゴリ
// - 全プレイヤー間で同じカードを重複させない
export function dealSecretObjectives(
  players: { id: number; startCoord: Coordinate }[],
  allPlayerIds: number[]
): Map<number, SecretObjective[]> {
  const playerCount = players.length;

  // シャッフル用関数
  function shuffle<T>(array: T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  // カテゴリごとのIDリスト
  const byCategory: Record<ObjectiveCategory, number[]> = {
    board: shuffle(OBJECTIVE_DEFINITIONS.filter((d) => d.category === 'board').map((d) => d.id)),
    negotiation: shuffle(OBJECTIVE_DEFINITIONS.filter((d) => d.category === 'negotiation').map((d) => d.id)),
    coin: shuffle(OBJECTIVE_DEFINITIONS.filter((d) => d.category === 'coin').map((d) => d.id)),
  };

  // 各プレイヤーに割り当てる2つのカテゴリペアを決定
  // 3人の場合: [board, negotiation], [negotiation, coin], [coin, board] など
  // 4人の場合: カテゴリ組み合わせをバランス良く割り当て
  const possiblePairs: [ObjectiveCategory, ObjectiveCategory][] = [
    ['board', 'negotiation'],
    ['board', 'coin'],
    ['negotiation', 'coin'],
  ];

  let assignedPairs: [ObjectiveCategory, ObjectiveCategory][];
  if (playerCount === 3) {
    assignedPairs = shuffle([possiblePairs[0], possiblePairs[1], possiblePairs[2]]);
  } else {
    // 4人: 3種類のペア + ランダム1ペア
    const extraPair = possiblePairs[Math.floor(Math.random() * possiblePairs.length)];
    assignedPairs = shuffle([...possiblePairs, extraPair]);
  }

  const result = new Map<number, SecretObjective[]>();
  const usedIds = new Set<number>();

  for (let i = 0; i < playerCount; i++) {
    const player = players[i];
    const [cat1, cat2] = assignedPairs[i];

    // cat1 から未使用の1枚を選択
    const id1 = byCategory[cat1].find((id) => !usedIds.has(id));
    if (!id1) throw new Error('Not enough unique objective cards in category ' + cat1);
    usedIds.add(id1);

    // cat2 から未使用の1枚を選択
    const id2 = byCategory[cat2].find((id) => !usedIds.has(id));
    if (!id2) throw new Error('Not enough unique objective cards in category ' + cat2);
    usedIds.add(id2);

    const obj1 = createSecretObjectiveInstance(id1, player, allPlayerIds);
    const obj2 = createSecretObjectiveInstance(id2, player, allPlayerIds);

    result.set(player.id, [obj1, obj2]);
  }

  return result;
}

function createSecretObjectiveInstance(
  id: number,
  player: { id: number; startCoord: Coordinate },
  allPlayerIds: number[]
): SecretObjective {
  const def = OBJECTIVE_DEFINITIONS.find((d) => d.id === id);
  if (!def) throw new Error('Unknown objective id: ' + id);

  const obj: SecretObjective = {
    id: def.id,
    name: def.name,
    category: def.category,
    points: def.points,
    description: def.description,
    isCompleted: false,
    progress: def.maxProgress ? 0 : undefined,
    maxProgress: def.maxProgress,
  };

  // 陣取り屋 (id: 3)
  if (id === 3) {
    const startArea = getArea(player.startCoord);
    const candidates = getTerritoryCandidates(startArea);
    const designatedArea = candidates[Math.floor(Math.random() * candidates.length)];
    obj.designatedArea = designatedArea;
    obj.description = `ゲーム終了時に、指定エリア【${designatedArea}】にいる。`;
  }

  // 仲良しコンビ (id: 6)
  if (id === 6) {
    const others = allPlayerIds.filter((pid) => pid !== player.id);
    const partnerId = others[Math.floor(Math.random() * others.length)];
    obj.designatedPlayerId = partnerId;
    obj.description = `ゲーム終了時に、プレイヤー${partnerId + 1}の駒と上下左右で隣接している。`;
  }

  // 人たらし (id: 10) & 遭遇マスター (id: 7) の maxProgress
  if (id === 7 || id === 10) {
    obj.progress = 0;
    obj.maxProgress = allPlayerIds.length - 1;
  }

  return obj;
}

// ゲームプレイ中のリアルタイム更新
export function updateObjectivesInProgress(
  player: Player,
  allPlayers: Player[],
  stats: GameStats
): Player {
  const otherCount = allPlayers.length - 1;

  const updatedObjectives = player.secretObjectives.map((obj) => {
    const copy = { ...obj };

    switch (copy.id) {
      case 1: // ゴール到達者
        if (player.reachedGoalEver) {
          copy.isCompleted = true;
        }
        break;

      case 5: { // 誘導の達人 (3マス以上)
        const dist = stats.guidedDistance[player.id] || 0;
        copy.progress = dist;
        if (dist >= 3) {
          copy.isCompleted = true;
        }
        break;
      }

      case 7: { // 遭遇マスター
        const met = stats.metPlayers[player.id] || [];
        copy.progress = met.length;
        if (met.length >= otherCount) {
          copy.isCompleted = true;
        }
        break;
      }

      case 8: { // 敏腕交渉人 (3回以上)
        const issued = stats.successfulOrdersIssued[player.id] || 0;
        copy.progress = issued;
        if (issued >= 3) {
          copy.isCompleted = true;
        }
        break;
      }

      case 9: { // 反骨精神 (3回以上)
        const rej = stats.ordersRejected[player.id] || 0;
        copy.progress = rej;
        if (rej >= 3) {
          copy.isCompleted = true;
        }
        break;
      }

      case 10: { // 人たらし (全員から命令を受け成功)
        const receivedFrom = stats.successfulOrdersReceivedFrom[player.id] || [];
        copy.progress = receivedFrom.length;
        if (receivedFrom.length >= otherCount) {
          copy.isCompleted = true;
        }
        break;
      }

      case 11: { // 商売上手 (6コイン以上支払い)
        const paid = stats.coinsPaidAsReward[player.id] || 0;
        copy.progress = paid;
        if (paid >= 6) {
          copy.isCompleted = true;
        }
        break;
      }

      case 14: { // 倹約家 (自主コイン3回以上)
        const frugal = stats.frugalCount[player.id] || 0;
        copy.progress = frugal;
        if (frugal >= 3) {
          copy.isCompleted = true;
        }
        break;
      }

      case 15: { // 報酬コレクター (5コイン以上獲得)
        const collected = stats.coinsReceivedAsReward[player.id] || 0;
        copy.progress = collected;
        if (collected >= 5) {
          copy.isCompleted = true;
        }
        break;
      }

      default:
        // 終了時判定の目標は途中では達成済みにしない（仕様書の厳格準拠）
        break;
    }
    return copy;
  });

  return { ...player, secretObjectives: updatedObjectives };
}

// ゲーム終了時の一括確定判定
export function evaluateFinalObjectives(allPlayers: Player[], stats: GameStats): Player[] {
  // 最高所持コイン数を計算（大富豪用）
  const maxCoins = Math.max(...allPlayers.map((p) => p.coin));

  return allPlayers.map((player) => {
    // まず進行中目標を同期
    const intermediate = updateObjectivesInProgress(player, allPlayers, stats);

    const finalObjectives = intermediate.secretObjectives.map((obj) => {
      const copy = { ...obj };

      switch (copy.id) {
        case 2: // ゴールキーパー: ゲーム終了時にゴールEにいる
          copy.isCompleted = isSameCoord(player.currentCoord, GOAL_COORD);
          break;

        case 3: // 陣取り屋: 指定エリアにいる
          if (copy.designatedArea) {
            copy.isCompleted = getArea(player.currentCoord) === copy.designatedArea;
          }
          break;

        case 4: // 辺境の支配者: 外周マス（開始マス＋隣接4マス除外）
          copy.isCompleted = isEligibleBorderSquare(player.currentCoord, player.startCoord);
          break;

        case 6: { // 仲良しコンビ: 指定他プレイヤーと上下左右隣接
          if (copy.designatedPlayerId !== undefined) {
            const partner = allPlayers.find((p) => p.id === copy.designatedPlayerId);
            if (partner) {
              const dist = getManhattanDistance(player.currentCoord, partner.currentCoord);
              copy.isCompleted = dist === 1;
            }
          }
          break;
        }

        case 12: // 守銭奴: 10コイン以上
          copy.isCompleted = player.coin >= 10;
          break;

        case 13: // 大富豪: コイン最多（同率1位も達成）
          copy.isCompleted = player.coin === maxCoins;
          break;

        default:
          // リアルタイム目標はそのまま
          break;
      }
      return copy;
    });

    return { ...player, secretObjectives: finalObjectives };
  });
}

// 遭遇判定の記録（移動経路上のすべてのマスでの重なりを検出）
export function recordEncounters(
  movingPlayerId: number,
  path: Coordinate[],
  allPlayers: Player[],
  stats: GameStats
): void {
  for (const stepCoord of path) {
    for (const other of allPlayers) {
      if (other.id === movingPlayerId) continue;
      // 他の駒の現在地と同じマスに入ったか
      if (isSameCoord(stepCoord, other.currentCoord)) {
        // movingPlayerId が other に遭遇
        if (!stats.metPlayers[movingPlayerId].includes(other.id)) {
          stats.metPlayers[movingPlayerId].push(other.id);
        }
        // other も movingPlayerId に遭遇された
        if (!stats.metPlayers[other.id].includes(movingPlayerId)) {
          stats.metPlayers[other.id].push(movingPlayerId);
        }
      }
    }
  }
}
