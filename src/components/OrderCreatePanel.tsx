import React, { useState } from 'react';
import type {
  AreaId,
  Coordinate,
  Direction,
  Order,
  OrderLevel,
  OrderType,
  Player,
} from '../types/game';
import {
  canIssueOrder,
  getAvailableLv1Areas,
  getAvailableLv2AreaOptions,
  getValidDirectionsForDirectionLv2,
  getValidDirectionsForGoalLv2,
} from '../logic/order';
import { GOAL_COORD } from '../logic/board';
import { soundManager } from '../utils/audio';
import {
  Coins,
  Compass,
  Send,
  Target,
  Users,
} from 'lucide-react';

interface OrderCreatePanelProps {
  currentPlayer: Player;
  allPlayers: Player[];
  onOrderPrepared: (order: Order) => void;
  selectedCoord: Coordinate | null;
  onSelectCoord: (coord: Coordinate | null) => void;
}

export const OrderCreatePanel: React.FC<OrderCreatePanelProps> = ({
  currentPlayer,
  allPlayers,
  onOrderPrepared,
  selectedCoord,
  onSelectCoord,
}) => {
  // 相手プレイヤー候補（自分以外）
  const otherPlayers = allPlayers.filter((p) => p.id !== currentPlayer.id);

  const [targetPlayerId, setTargetPlayerId] = useState<number>(otherPlayers[0]?.id ?? 0);
  const [orderType, setOrderType] = useState<OrderType>('reach_goal');
  const [orderLevel, setOrderLevel] = useState<OrderLevel>(1);
  const [direction, setDirection] = useState<Direction>('up');
  const [targetArea, setTargetArea] = useState<AreaId>('A');

  // 現在の駒の現在地＝命令を出す側（currentPlayer）の現在地
  // ※命令されたプレイヤーが動かすのは命令者の駒！
  const pieceCoord = currentPlayer.currentCoord;

  // 現在の設定で命令可能かチェック
  const validation = canIssueOrder(orderType, orderLevel, pieceCoord, currentPlayer.coin);

  // 選択肢の動的計算
  const goalLv2Dirs = getValidDirectionsForGoalLv2(pieceCoord);
  const dirLv2Dirs = getValidDirectionsForDirectionLv2(pieceCoord);
  const lv1Areas = getAvailableLv1Areas(pieceCoord);
  const lv2AreaOptions = getAvailableLv2AreaOptions(pieceCoord);

  const handleLevelSelect = (lvl: OrderLevel) => {
    soundManager.playClick();
    setOrderLevel(lvl);
    onSelectCoord(null);
  };

  const handleTypeSelect = (type: OrderType) => {
    soundManager.playClick();
    setOrderType(type);
    onSelectCoord(null);
  };

  const handleSubmit = () => {
    soundManager.playClick();
    const reward = orderLevel;
    let chosenTargetCoord: Coordinate | undefined = undefined;

    if (orderLevel === 3) {
      if (orderType === 'reach_goal') {
        chosenTargetCoord = GOAL_COORD;
      } else {
        if (!selectedCoord) return;
        chosenTargetCoord = selectedCoord;
      }
    }

    const order: Order = {
      type: orderType,
      level: orderLevel,
      sourcePlayerId: currentPlayer.id,
      targetPlayerId,
      reward,
      direction:
        orderType === 'move_direction' || (orderType === 'reach_goal' && orderLevel === 2) || (orderType === 'enter_area' && orderLevel === 2)
          ? direction
          : undefined,
      targetArea: orderType === 'enter_area' ? targetArea : undefined,
      targetCoord: chosenTargetCoord,
    };

    onOrderPrepared(order);
  };

  const dirLabels: Record<Direction, string> = {
    up: '上 (↑)',
    down: '下 (↓)',
    left: '左 (←)',
    right: '右 (→)',
  };

  return (
    <div className="w-full max-w-sm mx-auto p-4 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-4 animate-fade-in select-none">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${currentPlayer.bgClass}`} />
          <span className="text-xs font-bold text-slate-200">
            {currentPlayer.name} の命令作成
          </span>
        </div>
        <div className="flex items-center gap-1 text-amber-400 font-extrabold text-xs">
          <Coins className="w-3.5 h-3.5" />
          {currentPlayer.coin}コイン所持
        </div>
      </div>

      {/* 1. 命令相手を選択 */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
          <Users className="w-3.5 h-3.5 text-indigo-400" />
          命令する相手を選択
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {otherPlayers.map((other) => (
            <button
              key={other.id}
              onClick={() => {
                soundManager.playClick();
                setTargetPlayerId(other.id);
              }}
              className={`p-2 rounded-xl border flex items-center gap-2 transition-all ${
                targetPlayerId === other.id
                  ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-md'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`w-6 h-6 rounded-lg ${other.bgClass} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                {other.symbol}
              </div>
              <span className="text-xs font-bold truncate">{other.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. 命令の種類 */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
          <Compass className="w-3.5 h-3.5 text-indigo-400" />
          命令の種類
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { type: 'reach_goal', label: 'ゴールを目指せ' },
            { type: 'enter_area', label: '指定エリアへ' },
            { type: 'move_direction', label: '指定方向へ進め' },
          ].map((item) => (
            <button
              key={item.type}
              onClick={() => handleTypeSelect(item.type as OrderType)}
              className={`py-2 px-1 text-[11px] font-bold rounded-xl border transition-all text-center ${
                orderType === item.type
                  ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. 命令レベル */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
          <span>命令レベルと報酬</span>
          <span className="text-[10px] text-amber-400">成功時に相手へ支払うコイン</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {([1, 2, 3] as OrderLevel[]).map((lvl) => {
            const hasEnoughCoin = currentPlayer.coin >= lvl;
            return (
              <button
                key={lvl}
                disabled={!hasEnoughCoin}
                onClick={() => handleLevelSelect(lvl)}
                className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all ${
                  orderLevel === lvl
                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                    : hasEnoughCoin
                    ? 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    : 'bg-slate-950/20 border-slate-900 text-slate-600 cursor-not-allowed opacity-50'
                }`}
              >
                <span className="text-xs font-bold">Lv {lvl}</span>
                <span className="text-[10px] font-extrabold text-amber-400">
                  {lvl}コイン
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. 詳細条件の設定 */}
      <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800/80 space-y-2.5">
        <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
          <Target className="w-3.5 h-3.5 text-indigo-400" />
          詳細条件の設定
        </div>

        {/* ゴールを目指せ */}
        {orderType === 'reach_goal' && (
          <div className="text-xs text-slate-400">
            {orderLevel === 1 && (
              <p>移動後にゴールEまでの距離が今より短くなれば成功（最大5マス移動）</p>
            )}
            {orderLevel === 2 && (
              <div className="space-y-1.5">
                <p>直線1〜2マスでゴールEに近づく方向を選択：</p>
                <div className="grid grid-cols-2 gap-2">
                  {goalLv2Dirs.map((dir) => (
                    <button
                      key={dir}
                      onClick={() => setDirection(dir)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border ${
                        direction === dir
                          ? 'bg-indigo-600 text-white border-indigo-400'
                          : 'bg-slate-900 text-slate-300 border-slate-700'
                      }`}
                    >
                      {dirLabels[dir]}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {orderLevel === 3 && (
              <p>ゴールE (中央マス) に最大3マスで直接到達すれば成功</p>
            )}
          </div>
        )}

        {/* 指定エリアに入れ */}
        {orderType === 'enter_area' && (
          <div className="space-y-2 text-xs text-slate-400">
            {orderLevel === 1 && (
              <div className="space-y-1">
                <p>目標エリアを選択（移動終了時にこのエリアにいれば成功）：</p>
                <div className="flex flex-wrap gap-1.5">
                  {lv1Areas.map((a) => (
                    <button
                      key={a}
                      onClick={() => setTargetArea(a)}
                      className={`w-8 h-8 rounded-lg font-bold border text-xs ${
                        targetArea === a
                          ? 'bg-indigo-600 text-white border-indigo-400'
                          : 'bg-slate-900 text-slate-300 border-slate-700'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {orderLevel === 2 && (
              <div className="space-y-1.5">
                <p>直線1〜2マスで到達可能な方向とエリアを選択：</p>
                <div className="grid grid-cols-2 gap-2">
                  {lv2AreaOptions.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setDirection(opt.direction);
                        setTargetArea(opt.area);
                      }}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border text-left ${
                        direction === opt.direction && targetArea === opt.area
                          ? 'bg-indigo-600 text-white border-indigo-400'
                          : 'bg-slate-900 text-slate-300 border-slate-700'
                      }`}
                    >
                      {dirLabels[opt.direction]} → エリア{opt.area}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {orderLevel === 3 && (
              <div className="space-y-2">
                <p>目標エリアを選択し、盤面上のマスをタップして目的地を指定してください：</p>
                <div className="flex flex-wrap gap-1">
                  {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].map((a) => (
                    <button
                      key={a}
                      onClick={() => {
                        setTargetArea(a as AreaId);
                        onSelectCoord(null);
                      }}
                      className={`w-7 h-7 rounded-lg font-bold border text-xs ${
                        targetArea === a
                          ? 'bg-indigo-600 text-white border-indigo-400'
                          : 'bg-slate-900 text-slate-300 border-slate-700'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
                {selectedCoord && (
                  <div className="text-[11px] text-indigo-400 font-bold">
                    選択した目的地: ({selectedCoord.x}, {selectedCoord.y})
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 指定方向へ進め */}
        {orderType === 'move_direction' && (
          <div className="space-y-1.5 text-xs text-slate-400">
            {orderLevel === 1 && (
              <div className="space-y-1">
                <p>進む方向を選択（反対方向へ移動せず、この方向へ1回以上移動）：</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['up', 'down', 'left', 'right'] as Direction[]).map((dir) => (
                    <button
                      key={dir}
                      onClick={() => setDirection(dir)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border ${
                        direction === dir
                          ? 'bg-indigo-600 text-white border-indigo-400'
                          : 'bg-slate-900 text-slate-300 border-slate-700'
                      }`}
                    >
                      {dirLabels[dir]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {orderLevel === 2 && (
              <div className="space-y-1">
                <p>直線1〜2マス進む方向を選択：</p>
                <div className="grid grid-cols-2 gap-2">
                  {dirLv2Dirs.map((dir) => (
                    <button
                      key={dir}
                      onClick={() => setDirection(dir)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border ${
                        direction === dir
                          ? 'bg-indigo-600 text-white border-indigo-400'
                          : 'bg-slate-900 text-slate-300 border-slate-700'
                      }`}
                    >
                      {dirLabels[dir]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {orderLevel === 3 && (
              <div className="space-y-1">
                <p>盤面上で3マス以内の目的地マスを直接タップしてください：</p>
                {selectedCoord ? (
                  <div className="text-[11px] text-indigo-400 font-bold">
                    目的地: ({selectedCoord.x}, {selectedCoord.y})
                  </div>
                ) : (
                  <div className="text-[11px] text-amber-400 animate-pulse">
                    ※盤面上の光るマスをタップして目的地を選択してください
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* エラー / バリデーション警告 */}
      {!validation.canIssue && (
        <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs">
          {validation.reason}
        </div>
      )}

      {/* 送信ボタン */}
      <button
        disabled={
          !validation.canIssue ||
          (orderLevel === 3 && orderType !== 'reach_goal' && !selectedCoord)
        }
        onClick={handleSubmit}
        className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
          validation.canIssue && (orderLevel !== 3 || orderType === 'reach_goal' || !!selectedCoord)
            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-950/60 active:scale-98'
            : 'bg-slate-800 text-slate-600 border border-slate-800 cursor-not-allowed'
        }`}
      >
        <Send className="w-4 h-4" />
        命令内容を確認して送信
      </button>
    </div>
  );
};
