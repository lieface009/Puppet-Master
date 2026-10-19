import React from 'react';
import type { Order, Player } from '../types/game';
import { Coins, Send, ArrowLeft } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface OrderConfirmModalProps {
  order: Order;
  sourcePlayer: Player;
  targetPlayer: Player;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const OrderConfirmModal: React.FC<OrderConfirmModalProps> = ({
  order,
  sourcePlayer,
  targetPlayer,
  isOpen,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    soundManager.playClick();
    onConfirm();
  };

  const handleCancel = () => {
    soundManager.playClick();
    onCancel();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4 text-slate-100">
        <h3 className="text-base font-bold text-center border-b border-slate-800 pb-3">
          命令内容の最終確認
        </h3>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400">命令者（あなた）</span>
            <div className="flex items-center gap-1.5 font-bold">
              <span className={`w-2.5 h-2.5 rounded-full ${sourcePlayer.bgClass}`} />
              <span>{sourcePlayer.name} ({sourcePlayer.symbol})</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400">命令の対象</span>
            <div className="flex items-center gap-1.5 font-bold">
              <span className={`w-2.5 h-2.5 rounded-full ${targetPlayer.bgClass}`} />
              <span>{targetPlayer.name} ({targetPlayer.symbol})</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">命令</span>
              <span className="font-bold text-indigo-400">
                {orderTypeLabels[order.type]} (Lv {order.level})
              </span>
            </div>

            {order.direction && (
              <div className="flex justify-between">
                <span className="text-slate-400">指定方向</span>
                <span className="font-bold text-slate-200">
                  {dirLabels[order.direction] || order.direction}
                </span>
              </div>
            )}

            {order.targetArea && (
              <div className="flex justify-between">
                <span className="text-slate-400">目標エリア</span>
                <span className="font-bold text-slate-200">
                  エリア【{order.targetArea}】
                </span>
              </div>
            )}

            {order.targetCoord && (
              <div className="flex justify-between">
                <span className="text-slate-400">目的地マス</span>
                <span className="font-bold text-slate-200">
                  ({order.targetCoord.x}, {order.targetCoord.y})
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-600/30">
              <div className="text-[10px] text-amber-300">成功時の報酬（固定）</div>
              <div className="text-sm font-extrabold text-amber-400 flex items-center justify-center gap-1 mt-0.5">
                <Coins className="w-3.5 h-3.5" />
                {order.reward}コイン支払い
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-600/30">
              <div className="text-[10px] text-rose-300">失敗時のペナルティ</div>
              <div className="text-sm font-extrabold text-rose-400 flex items-center justify-center gap-1 mt-0.5">
                <Coins className="w-3.5 h-3.5" />
                1コイン獲得
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 text-center leading-relaxed">
            ※命令確定時、あなたの所持コインから報酬{order.reward}枚が一時予約されます。拒否された場合は全額返却されます。
          </p>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleCancel}
            className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> 戻って修正
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-indigo-950/60 active:scale-98"
          >
            <Send className="w-4 h-4" /> 命令を確定
          </button>
        </div>
      </div>
    </div>
  );
};
