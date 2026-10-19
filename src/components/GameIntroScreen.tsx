import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import type { Player } from '../types/game';
import { soundManager } from '../utils/audio';

interface GameIntroScreenProps {
  players: Player[];
  turnOrder: number[];
  onProceed: () => void;
}

export const GameIntroScreen: React.FC<GameIntroScreenProps> = ({
  players,
  turnOrder,
  onProceed,
}) => {
  const firstPlayerId = turnOrder[0];
  const firstPlayer = players.find((p) => p.id === firstPlayerId)!;

  const handleProceed = () => {
    soundManager.playClick();
    onProceed();
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-6 text-center select-none animate-fade-in">
      <div className="my-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold tracking-wider animate-pulse-subtle">
          <Sparkles className="w-4 h-4" /> ゲーム開始！
        </div>

        <div>
          <h2 className="text-3xl font-black text-slate-100">手番順の決定</h2>
          <p className="text-xs text-slate-400 mt-1">
            抽選により、6ラウンド固定の手番順が決まりました
          </p>
        </div>

        {/* 手番順リスト */}
        <div className="space-y-2.5 max-w-xs mx-auto">
          {turnOrder.map((pid, idx) => {
            const player = players.find((p) => p.id === pid)!;
            const isFirst = idx === 0;

            return (
              <div
                key={pid}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  isFirst
                    ? 'bg-indigo-950/50 border-indigo-500/60 shadow-lg shadow-indigo-950/40 ring-1 ring-indigo-400/40'
                    : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs ${
                      isFirst ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div
                    className={`w-8 h-8 rounded-xl ${player.bgClass} flex items-center justify-center text-white font-extrabold text-sm`}
                  >
                    {player.symbol}
                  </div>
                  <span className="font-bold text-sm text-slate-100">
                    {player.name}
                  </span>
                </div>
                {isFirst && (
                  <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    最初のプレイヤー
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl max-w-xs mx-auto">
          <p className="text-xs text-slate-300">
            最初のプレイヤーは{' '}
            <strong className="text-indigo-400 font-bold">{firstPlayer.name}</strong>{' '}
            です！<br />
            スマートフォンを渡してゲームを開始しましょう。
          </p>
        </div>
      </div>

      <div className="pt-4 pb-2">
        <button
          onClick={handleProceed}
          className="w-full max-w-xs mx-auto py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-xl shadow-indigo-950/60 transition-all transform active:scale-98"
        >
          受け渡し画面へ進む
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
