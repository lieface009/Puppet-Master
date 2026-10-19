export type Coordinate = {
  x: number; // 0..4
  y: number; // 0..4
};

export type AreaId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I';

export type Direction = 'up' | 'down' | 'left' | 'right';

export type OrderType = 'reach_goal' | 'enter_area' | 'move_direction';
export type OrderLevel = 1 | 2 | 3;

export interface Order {
  type: OrderType;
  level: OrderLevel;
  sourcePlayerId: number; // 命令を出したプレイヤー
  targetPlayerId: number; // 命令を受けたプレイヤー
  reward: number; // 1, 2, or 3
  direction?: Direction; // レベル2、またはレベル1の指定方向
  targetArea?: AreaId; // 「指定エリアに入れ」用
  targetCoord?: Coordinate; // レベル3の目的地
}

export type ObjectiveCategory = 'board' | 'negotiation' | 'coin';

export interface SecretObjective {
  id: number; // 1..15
  name: string;
  category: ObjectiveCategory;
  points: number;
  description: string;
  isCompleted: boolean;
  progress?: number;
  maxProgress?: number;
  designatedArea?: AreaId; // 陣取り屋用
  designatedPlayerId?: number; // 仲良しコンビ用
}

export interface Player {
  id: number;
  name: string;
  color: string;
  bgClass: string;
  borderClass: string;
  symbol: string;
  coin: number;
  reservedCoin: number;
  startCoord: Coordinate;
  currentCoord: Coordinate;
  reachedGoalEver: boolean;
  secretObjectives: SecretObjective[];
}

export interface OrderResult {
  order: Order;
  success: boolean;
  reason: string;
  path: Coordinate[];
  coinsTransferred: {
    from: number;
    to: number;
    amount: number;
    type: 'reward' | 'penalty';
  } | null;
  refundedToSource?: number; // 拒否時の返却など
}

export interface GameStats {
  successfulOrdersIssued: Record<number, number>; // 敏腕交渉人(3回以上)
  ordersRejected: Record<number, number>; // 反骨精神(3回以上)
  successfulOrdersReceivedFrom: Record<number, number[]>; // 人たらし(他全プレイヤから成功)
  coinsPaidAsReward: Record<number, number>; // 商売上手(6コイン以上)
  frugalCount: Record<number, number>; // 倹約家(自主コイン3回以上)
  coinsReceivedAsReward: Record<number, number>; // 報酬コレクター(5コイン以上)
  guidedDistance: Record<number, number>; // 誘導の達人(命令で動いたマス計3以上)
  metPlayers: Record<number, number[]>; // 遭遇マスター(重なったプレイヤーID)
}

export type GamePhase =
  | 'TITLE'
  | 'SETUP'
  | 'INTRO'
  | 'HANDOVER'
  | 'VOLUNTARY'
  | 'VOLUNTARY_MOVE'
  | 'ORDER_CREATE'
  | 'ORDER_CONFIRM'
  | 'ORDER_NEGOTIATE'
  | 'ORDER_EXECUTE'
  | 'ORDER_RESULT'
  | 'GAME_OVER';

export interface GameState {
  players: Player[];
  turnOrder: number[]; // プレイヤーIDの順序
  currentRound: number; // 1..6
  currentTurnIndex: number; // turnOrder 内のインデックス (0..players.length-1)
  phase: GamePhase;
  activeOrder: Order | null;
  currentMovePath: Coordinate[]; // 現在の移動経路
  lastOrderResult: OrderResult | null;
  stats: GameStats;
  soundEnabled: boolean;
  actionId: string; // トランザクションID（二重処理防止）
  processedActionIds: string[]; // 処理済みアクションID一覧
}

export interface GameResultRecord {
  date: string;
  playerCount: number;
  players: {
    id: number;
    name: string;
    finalScore: number;
    remainingCoins: number;
    rank: number;
    isWinner: boolean;
    objectives: {
      name: string;
      isCompleted: boolean;
      points: number;
    }[];
  }[];
}
