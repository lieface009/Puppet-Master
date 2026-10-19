import React from 'react';
import { Smartphone, CheckCircle, Eye } from 'lucide-react';
import type { Player } from '../types/game';
import { soundManager } from '../utils/audio';

interface HandoverScreenProps {
  player: Player;
  round: number;
  onReady: () => void;
  onOpenSecretObjectives: () => void;
}

export const HandoverScreen: React.FC<HandoverScreenProps> = ({
  player,
  round,
  onReady,
  onOpenSecretObjectives,
}) => {
  const handleReady = () => {
    soundManager.playTurnChange();
    onReady();
  };

  const handleObjectives = () => {
    soundManager.playClick();
    onOpenSecretObjectives();
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-6 text-center select-none animate-fade-in">
      {/* ラウンド表示 */}
      <div className="pt-2">
        <span className="inline-block px-3.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300">
          第 <strong className="text-indigo-400 font-extrabold">{round}</strong> ラウンド／全6ラウンド
        </span>
      </div>

      {/* メインメッセージ */}
      <div className="my-auto space-y-6 max-w-xs mx-auto">
        <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto animate-pulse-subtle">
          <Smartphone className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <div className="inline-block p-1 rounded-2xl bg-slate-900 border border-slate-800">
            <div
              className={`px-4 py-2 rounded-xl ${player.bgClass} text-white font-black text-xl flex items-center justify-center gap-2 shadow-lg`}
            >
              <span>{player.symbol}</span>
              <span>{player.name} の番！</span>
            </div>
          </div>

          <p className="text-sm font-bold text-slate-200 pt-2">
            スマホを <strong className="text-indigo-400">{player.name}</strong> に渡してください
          </p>
          <p className="text-xs text-slate-400">
            受け取ったプレイヤー以外は画面を見ないでください
          </p>
        </div>

        {/* 秘密目標確認ボタン */}
        <div className="pt-2">
          <button
            onClick={handleObjectives}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:text-white font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Eye className="w-4 h-4 text-purple-400" />
            自分の秘密目標を確認する
          </button>
        </div>
      </div>

      {/* 準備OKボタン */}
      <div className="pb-4 max-w-xs mx-auto w-full">
        <button
          onClick={handleReady}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/60 transition-all transform active:scale-98"
        >
          <CheckCircle className="w-5 h-5" />
          準備OK（手番を始める）
        </button>
      </div>
    </div>
  );
};
