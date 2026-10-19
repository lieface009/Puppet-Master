import React from 'react';
import type { AreaId, Coordinate, Player } from '../types/game';
import { BOARD_SIZE, GOAL_COORD, getArea, isSameCoord } from '../logic/board';
import { AREA_COLORS } from '../utils/constants';
import { Crown, Flag } from 'lucide-react';

interface BoardViewProps {
  players: Player[];
  activePlayerId?: number; // 現在操作中のプレイヤー（自主行動）または操作対象の駒の持ち主
  controlledPiecePlayerId?: number; // 実際に盤上で動かされている駒のプレイヤーID
  selectableCoords?: Coordinate[]; // タップ可能な隣接マス
  movePath?: Coordinate[]; // 移動中の経路
  targetCoordHighlight?: Coordinate; // レベル3等の目的地ハイライト
  onSquareClick?: (coord: Coordinate) => void;
  interactive?: boolean;
}

export const BoardView: React.FC<BoardViewProps> = ({
  players,
  controlledPiecePlayerId,
  selectableCoords = [],
  movePath = [],
  targetCoordHighlight,
  onSquareClick,
  interactive = true,
}) => {
  // マスごとの駒一覧をマッピング
  const getPiecesAtCoord = (coord: Coordinate): Player[] => {
    return players.filter((p) => {
      // もしこの駒が現在移動操作中なら、movePath の最後の座標に表示する
      if (controlledPiecePlayerId === p.id && movePath.length > 0) {
        const currentMovingPos = movePath[movePath.length - 1];
        return isSameCoord(currentMovingPos, coord);
      }
      return isSameCoord(p.currentCoord, coord);
    });
  };

  // 経路のインデックスを取得（1-indexed）
  const getPathStepIndex = (coord: Coordinate): number | null => {
    const idx = movePath.findIndex((c) => isSameCoord(c, coord));
    return idx >= 0 ? idx : null;
  };

  const isSelectable = (coord: Coordinate): boolean => {
    return selectableCoords.some((c) => isSameCoord(c, coord));
  };

  const isTargetDestination = (coord: Coordinate): boolean => {
    return !!targetCoordHighlight && isSameCoord(targetCoordHighlight, coord);
  };

  // 重なり駒のオフセットCSSクラス計算
  // 1マス内に最大4個重なる可能性がある
  const getPieceOffsetStyle = (index: number, total: number) => {
    if (total <= 1) return { transform: 'translate(0, 0)', zIndex: 10 };
    if (total === 2) {
      return index === 0
        ? { transform: 'translate(-25%, -25%) scale(0.85)', zIndex: 10 }
        : { transform: 'translate(25%, 25%) scale(0.85)', zIndex: 11 };
    }
    if (total === 3) {
      if (index === 0) return { transform: 'translate(-25%, -25%) scale(0.75)', zIndex: 10 };
      if (index === 1) return { transform: 'translate(25%, -25%) scale(0.75)', zIndex: 11 };
      return { transform: 'translate(0%, 25%) scale(0.75)', zIndex: 12 };
    }
    // 4個
    const positions = [
      { transform: 'translate(-25%, -25%) scale(0.7)', zIndex: 10 },
      { transform: 'translate(25%, -25%) scale(0.7)', zIndex: 11 },
      { transform: 'translate(-25%, 25%) scale(0.7)', zIndex: 12 },
      { transform: 'translate(25%, 25%) scale(0.7)', zIndex: 13 },
    ];
    return positions[index % 4];
  };

  return (
    <div className="w-full max-w-[380px] aspect-square mx-auto p-2 bg-slate-950/90 rounded-3xl border border-slate-800 shadow-2xl flex flex-col justify-between">
      <div className="grid grid-cols-5 grid-rows-5 gap-1.5 w-full h-full">
        {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, i) => {
          const x = i % BOARD_SIZE;
          const y = Math.floor(i / BOARD_SIZE);
          const coord: Coordinate = { x, y };
          const area: AreaId = getArea(coord);
          const isGoal = isSameCoord(coord, GOAL_COORD);
          const areaStyle = AREA_COLORS[area];
          const pieces = getPiecesAtCoord(coord);
          const selectable = interactive && isSelectable(coord);
          const pathStep = getPathStepIndex(coord);
          const isTarget = isTargetDestination(coord);

          return (
            <div
              key={`${x}-${y}`}
              onClick={() => {
                if (selectable && onSquareClick) {
                  onSquareClick(coord);
                }
              }}
              className={`relative rounded-xl flex items-center justify-center transition-all duration-200 select-none ${
                areaStyle.bg
              } ${areaStyle.border} border ${
                isGoal ? 'ring-2 ring-amber-400/80 bg-amber-950/50' : ''
              } ${
                selectable
                  ? 'cursor-pointer ring-2 ring-indigo-400 bg-indigo-900/40 hover:bg-indigo-800/50 scale-[1.03] z-20 animate-pulse'
                  : ''
              } ${isTarget ? 'ring-2 ring-rose-400 bg-rose-900/40' : ''}`}
            >
              {/* エリアラベル (薄く角に表示) */}
              <span
                className={`absolute top-1 left-1.5 text-[9px] font-black ${areaStyle.text} opacity-60 leading-none pointer-events-none`}
              >
                {area}
              </span>

              {/* ゴールEの中央アイコン */}
              {isGoal && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25">
                  <Crown className="w-6 h-6 text-amber-400" />
                </div>
              )}

              {/* 目的地アイコン */}
              {isTarget && (
                <div className="absolute top-1 right-1 pointer-events-none text-rose-400">
                  <Flag className="w-3.5 h-3.5 fill-current" />
                </div>
              )}

              {/* 経路移動ステップ番号 */}
              {pathStep !== null && (
                <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-indigo-500 text-white font-extrabold text-[9px] flex items-center justify-center shadow-md z-30 pointer-events-none">
                  {pathStep}
                </div>
              )}

              {/* 駒の表示（重なり考慮） */}
              <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
                {pieces.map((p, idx) => {
                  const offsetStyle = getPieceOffsetStyle(idx, pieces.length);
                  const isControlled = controlledPiecePlayerId === p.id;

                  return (
                    <div
                      key={p.id}
                      style={offsetStyle}
                      className={`absolute w-7 h-7 sm:w-8 sm:h-8 rounded-full ${p.bgClass} text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-lg transition-transform duration-200 ${
                        isControlled
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110 z-30 animate-pulse-subtle'
                          : ''
                      }`}
                    >
                      <span>{p.symbol}</span>
                    </div>
                  );
                })}
              </div>

              {/* タップ可能マスのインジケータードット */}
              {selectable && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-3 h-3 rounded-full bg-indigo-400 shadow-md animate-ping opacity-75" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
