import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Award, Coins, RotateCcw, Trophy } from 'lucide-react';
import type { PlayerScoreSummary } from '../logic/scoring';
import { soundManager } from '../utils/audio';

interface GameOverScreenProps {
  rankings: PlayerScoreSummary[];
  onPlayAgain: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  rankings,
  onPlayAgain,
}) => {
  useEffect(() => {
    soundManager.playFanfare();
    // 紙吹雪エフェクト
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#f59e0b', '#10b981', '#ef4444'],
    });
  }, []);

  const winners = rankings.filter((r) => r.isWinner);
  const isSingleWinner = winners.length === 1;

  const handlePlayAgain = () => {
    soundManager.playClick();
    onPlayAgain();
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-5 text-center select-none overflow-y-auto max-w-md mx-auto w-full animate-fade-in">
      <div className="space-y-6 pt-2">
        {/* 勝者発表 */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-black tracking-wider animate-pulse-subtle">
            <Trophy className="w-4 h-4" /> ゲーム終了・結果発表
          </div>

          <div className="space-y-1">
            {isSingleWinner ? (
              <div className="space-y-2">
                <div className="text-sm font-semibold text-slate-400">勝者</div>
                <div className="flex items-center justify-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl ${winners[0].player.bgClass} flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-amber-950/40`}
                  >
                    {winners[0].player.symbol}
                  </div>
                  <h2 className="text-3xl font-black text-slate-100">
                    {winners[0].player.name}
                  </h2>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-amber-400">
                  引き分け（同率1位！）
                </h2>
                <p className="text-xs text-slate-400">
                  {winners.map((w) => w.player.name).join(' と ')} が同率勝利です
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 各プレイヤーの順位と詳細カード */}
        <div className="space-y-3 text-left">
          {rankings.map((summary) => {
            const { player, rank, finalScore, remainingCoins, objectivePoints, completedObjectivesCount } = summary;
            const isWinner = summary.isWinner;

            return (
              <div
                key={player.id}
                className={`p-4 rounded-3xl border transition-all ${
                  isWinner
                    ? 'bg-amber-950/25 border-amber-500/60 shadow-xl shadow-amber-950/30 ring-1 ring-amber-400/40'
                    : 'bg-slate-900/90 border-slate-800'
                }`}
              >
                {/* プレイヤーヘッダー */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs ${
                        rank === 1
                          ? 'bg-amber-500 text-slate-950 shadow-md'
                          : rank === 2
                          ? 'bg-slate-400 text-slate-950'
                          : rank === 3
                          ? 'bg-amber-800 text-amber-100'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {rank}位
                    </div>
                    <div
                      className={`w-7 h-7 rounded-xl ${player.bgClass} flex items-center justify-center text-white font-black text-xs`}
                    >
                      {player.symbol}
                    </div>
                    <span className="font-extrabold text-sm text-slate-100">
                      {player.name}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">最終得点</span>
                    <span className="text-xl font-black text-amber-400">
                      {finalScore} <span className="text-xs font-normal text-slate-300">点</span>
                    </span>
                  </div>
                </div>

                {/* 得点内訳 */}
                <div className="grid grid-cols-2 gap-2 py-2.5 text-xs text-slate-300 border-b border-slate-800/60">
                  <div className="flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <span>残りコイン: <strong>{remainingCoins}枚</strong> (+{remainingCoins}点)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-indigo-400" />
                    <span>目標達成: <strong>{completedObjectivesCount}枚</strong> (+{objectivePoints}点)</span>
                  </div>
                </div>

                {/* 秘密目標の結果一覧 */}
                <div className="pt-2.5 space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-400">秘密目標の内訳</div>
                  {player.secretObjectives.map((obj) => (
                    <div
                      key={obj.id}
                      className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-950/70 border border-slate-800/80"
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            obj.isCompleted ? 'bg-emerald-400' : 'bg-slate-600'
                          }`}
                        />
                        <span className="font-semibold text-slate-200 truncate">
                          {obj.name}
                        </span>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5 font-bold">
                        {obj.isCompleted ? (
                          <span className="text-emerald-400 text-[11px] font-extrabold">
                            +{obj.points}点（達成）
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">
                            0点（未達成）
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* もう一度遊ぶボタン */}
      <div className="pt-6 pb-4">
        <button
          onClick={handlePlayAgain}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-xl shadow-indigo-950/60 transition-all transform active:scale-98"
        >
          <RotateCcw className="w-5 h-5" />
          もう一度遊ぶ
        </button>
      </div>
    </div>
  );
};
