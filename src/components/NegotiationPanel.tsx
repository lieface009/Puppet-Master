import React from 'react';
import type { Order, Player } from '../types/game';
import { Check, X, Coins, AlertCircle } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface NegotiationPanelProps {
  order: Order;
  sourcePlayer: Player;
  targetPlayer: Player;
  onAccept: () => void;
  onReject: () => void;
}

export const NegotiationPanel: React.FC<NegotiationPanelProps> = ({
  order,
  sourcePlayer,
  targetPlayer,
  onAccept,
  onReject,
}) => {
  const handleAccept = () => {
    soundManager.playAccept();
    onAccept();
  };

  const handleReject = () => {
    soundManager.playReject();
    onReject();
  };

  const orderTypeLabels: Record<string, string> = {
    reach_goal: 'ゴールを目指せ',
    enter_area: '指定エリアに入れ',
    move_direction: '指定方向へ進め',
  };

  const dirLabels: Record<string, string> = {
    up: '上 (↑)',
    down: '下 (↓)',
    left: '左 (←)',
    right: '右 (→)',
  };

  return (
    <div className="w-full max-w-sm mx-auto p-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-4 animate-fade-in select-none">
      {/* ヘッダー */}
      <div className="text-center space-y-1">
        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          スマホを {targetPlayer.name} に渡してください
        </span>
        <h3 className="text-base font-black text-slate-100 pt-1">
          {sourcePlayer.name} からの命令
        </h3>
      </div>

      {/* 命令詳細カード */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <span className="text-slate-400">命令者</span>
          <div className="flex items-center gap-1.5 font-bold">
            <span className={`w-3 h-3 rounded-full ${sourcePlayer.bgClass}`} />
            <span>{sourcePlayer.name} ({sourcePlayer.symbol})</span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-400">命令内容</span>
          <span className="font-extrabold text-indigo-400">
            {orderTypeLabels[order.type]} (Lv {order.level})
          </span>
        </div>

        {order.direction && (
          <div className="flex justify-between items-center">
            <span className="text-slate-400">指定方向</span>
            <span className="font-bold text-slate-200">
              {dirLabels[order.direction] || order.direction}
            </span>
          </div>
        )}

        {order.targetArea && (
          <div className="flex justify-between items-center">
            <span className="text-slate-400">指定エリア</span>
            <span className="font-bold text-slate-200">
              エリア【{order.targetArea}】
            </span>
          </div>
        )}

        {order.targetCoord && (
          <div className="flex justify-between items-center">
            <span className="text-slate-400">目的地マス</span>
            <span className="font-bold text-slate-200">
              ({order.targetCoord.x}, {order.targetCoord.y})
            </span>
          </div>
        )}
      </div>

      {/* 報酬とペナルティの提示 */}
      <div className="grid grid-cols-2 gap-2 text-center text-xs">
        <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30">
          <div className="text-[10px] text-emerald-300 font-bold">成功時の獲得報酬</div>
          <div className="text-base font-black text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
            <Coins className="w-4 h-4" />
            +{order.reward}コイン
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/30">
          <div className="text-[10px] text-rose-300 font-bold">失敗時のペナルティ</div>
          <div className="text-base font-black text-rose-400 flex items-center justify-center gap-1 mt-0.5">
            <Coins className="w-4 h-4" />
            -1コイン
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5">
            (所持0枚なら0)
          </div>
        </div>
      </div>

      {/* 注意喚起 */}
      <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-600/30 text-amber-300 text-[11px] leading-relaxed flex items-start gap-2">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
        <div>
          <strong>操作する駒：</strong> 受諾した場合、あなたが操作するのは<strong>【{sourcePlayer.name}】の駒</strong>です。あなたの駒は動きません。
        </div>
      </div>

      {/* 受諾・拒否ボタン */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          onClick={handleReject}
          className="py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors shadow-md active:scale-98"
        >
          <X className="w-4 h-4 text-rose-400" />
          命令を拒否する
        </button>

        <button
          onClick={handleAccept}
          className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-950/60 active:scale-98"
        >
          <Check className="w-4 h-4" />
          命令を受諾する
        </button>
      </div>
    </div>
  );
};
