import type { AreaId, Coordinate, Direction } from '../types/game';

export const BOARD_SIZE = 5;

export const GOAL_COORD: Coordinate = { x: 2, y: 2 };

// 9エリアの配置定義
// A A B C C
// A A B C C
// D D E F F
// G G H I I
// G G H I I
const AREA_GRID: AreaId[][] = [
  ['A', 'A', 'B', 'C', 'C'],
  ['A', 'A', 'B', 'C', 'C'],
  ['D', 'D', 'E', 'F', 'F'],
  ['G', 'G', 'H', 'I', 'I'],
  ['G', 'G', 'H', 'I', 'I'],
];

export const START_POSITIONS: { [area in 'A' | 'C' | 'G' | 'I']: Coordinate } = {
  A: { x: 0, y: 0 },
  C: { x: 4, y: 0 },
  G: { x: 0, y: 4 },
  I: { x: 4, y: 4 },
};

export function getArea(coord: Coordinate): AreaId {
  if (coord.x < 0 || coord.x >= BOARD_SIZE || coord.y < 0 || coord.y >= BOARD_SIZE) {
    throw new Error(`Invalid coordinate: (${coord.x}, ${coord.y})`);
  }
  return AREA_GRID[coord.y][coord.x];
}

export function isSameCoord(c1: Coordinate, c2: Coordinate): boolean {
  return c1.x === c2.x && c1.y === c2.y;
}

export function getManhattanDistance(c1: Coordinate, c2: Coordinate): number {
  return Math.abs(c1.x - c2.x) + Math.abs(c1.y - c2.y);
}

export function isWithinBoard(coord: Coordinate): boolean {
  return coord.x >= 0 && coord.x < BOARD_SIZE && coord.y >= 0 && coord.y < BOARD_SIZE;
}

export function isValidStep(from: Coordinate, to: Coordinate): boolean {
  if (!isWithinBoard(to)) return false;
  const dist = getManhattanDistance(from, to);
  return dist === 1; // 上下左右1マスのみ（斜め不可、同じマス不可）
}

export function getStepDirection(from: Coordinate, to: Coordinate): Direction | null {
  if (from.x === to.x && from.y - 1 === to.y) return 'up';
  if (from.x === to.x && from.y + 1 === to.y) return 'down';
  if (from.x - 1 === to.x && from.y === to.y) return 'left';
  if (from.x + 1 === to.x && from.y === to.y) return 'right';
  return null;
}

export function getOppositeDirection(dir: Direction): Direction {
  switch (dir) {
    case 'up':
      return 'down';
    case 'down':
      return 'up';
    case 'left':
      return 'right';
    case 'right':
      return 'left';
  }
}

export function getCoordInDirection(from: Coordinate, dir: Direction, steps: number = 1): Coordinate {
  let { x, y } = from;
  switch (dir) {
    case 'up':
      y -= steps;
      break;
    case 'down':
      y += steps;
      break;
    case 'left':
      x -= steps;
      break;
    case 'right':
      x += steps;
      break;
  }
  return { x, y };
}

// 辺境の支配者判定用: 外周マスかどうか（ただし開始マスとその隣接4マスは除外）
export function isEligibleBorderSquare(coord: Coordinate, startCoord: Coordinate): boolean {
  if (!isWithinBoard(coord)) return false;
  // 外周マスか？ (x=0,4 or y=0,4)
  const isBorder = coord.x === 0 || coord.x === 4 || coord.y === 0 || coord.y === 4;
  if (!isBorder) return false;

  // 自分の開始マスか？
  if (isSameCoord(coord, startCoord)) return false;

  // 開始マスの上下左右隣接4マスか？ (マンハッタン距離が1)
  if (getManhattanDistance(coord, startCoord) === 1) return false;

  return true;
}

// 陣取り屋の候補エリア取得
export function getTerritoryCandidates(startArea: AreaId): AreaId[] {
  switch (startArea) {
    case 'A':
      return ['C', 'E', 'F', 'G', 'H'];
    case 'C':
      return ['A', 'D', 'E', 'H', 'I'];
    case 'G':
      return ['A', 'B', 'E', 'F', 'I'];
    case 'I':
      return ['B', 'C', 'D', 'E', 'G'];
    default:
      return ['E'];
  }
}
