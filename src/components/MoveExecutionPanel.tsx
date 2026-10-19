import React from 'react';
import type { Coordinate, Order, Player } from '../types/game';
import { getMaxStepsForOrder } from '../logic/order';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface MoveExecutionPanelProps {
  order: Order;
  sourcePlayer: Player; // 命令を出したプレイヤー（駒の持ち主）
  targetPlayer: Player; // 操作しているプレイヤー
  path: Coordinate[];
  onUndo: () => void;
  onReset: () => void;
  onComplete: () => void;
}

export const MoveExecutionPanel: React.FC<MoveExecutionPanelProps> = ({
  order,
  sourcePlayer,
  targetPlayer,
  path,
  onUndo,
  onReset,
  onComplete,
}) => {
  const stepsTaken = path.length - 1;
  const maxSteps = getMaxStepsForOrder(order);
  const remainingSteps = maxSteps - stepsTaken;

  const handleUndo = () => {
    soundManager.playClick();
    onUndo();
  };

  const handleReset = () => {
    soundManager.playClick();
    onReset();
  };

  const handleComplete = () => {
    soundManager.playTurnChange();
    onComplete();
  };

  return (
    <div className="w-full max-w-sm mx-auto p-4 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-3 animate-fade-in select-none">
      {/* 操り人形ヘッダー */}
      <div className="flex items-center justify-between p-2.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30">
        <div className="flex items-center gap-2">
          <div className={`w-3.5 h-3.5 rounded-full ${sourcePlayer.bgClass}`} />
          <div className="text-left">
            <div className="text-[10px] text-indigo-300 font-semibold">操っている駒</div>
            <div className="text-xs font-black text-white">
              {sourcePlayer.name} の駒 ({sourcePlayer.symbol})
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] text-slate-400">操作中のプレイヤー</div>
          <div className="text-xs font-bold text-slate-200">
            {targetPlayer.name}
          </div>
        </div>
      </div>

      {/* ステップカウンター */}
      <div className="flex items-center justify-between px-1 text-xs">
        <span className="text-slate-400">
          移動数: <strong className="text-indigo-400 font-bold">{stepsTaken}</strong> / {maxSteps}マス
        </span>
        <span className={`text-[11px] font-bold ${remainingSteps === 0 ? 'text-amber-400' : 'text-slate-400'}`}>
          {remainingSteps === 0 ? '最大移動数に到達' : `あと最大${remainingSteps}マス移動可能`}
        </span>
      </div>

      {/* ガイドテキスト */}
      <div className="text-center text-xs text-slate-300">
        {stepsTaken === 0 ? (
          <p className="text-indigo-300 font-semibold animate-pulse">
            盤面上の光るマス（上下左右）をタップして移動してください
          </p>
        ) : (
          <p className="text-slate-300">
            続けてマスをタップするか、「移動完了」で確定してください
          </p>
        )}
      </div>

      {/* アクションボタン群 */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <button
          disabled={stepsTaken === 0}
          onClick={handleReset}
          className={`py-3 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-colors ${
            stepsTaken > 0
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 shadow-md active:scale-98'
              : 'bg-slate-950 text-slate-600 border border-slate-900 cursor-not-allowed opacity-50'
          }`}
        >
          リセット
        </button>

        <button
          disabled={stepsTaken === 0}
          onClick={handleUndo}
          className={`py-3 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-colors ${
            stepsTaken > 0
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 shadow-md active:scale-98'
              : 'bg-slate-950 text-slate-600 border border-slate-900 cursor-not-allowed opacity-50'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" /> 1手戻る
        </button>

        <button
          disabled={stepsTaken === 0}
          onClick={handleComplete}
          className={`py-3 px-2 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1 transition-all shadow-lg ${
            stepsTaken > 0
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/60 active:scale-98'
              : 'bg-slate-950 text-slate-600 border border-slate-900 cursor-not-allowed opacity-50'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" /> 確定
        </button>
      </div>
    </div>
  );
};
