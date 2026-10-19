import React, { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, CheckCircle2, Lock, Award } from 'lucide-react';
import type { Player } from '../types/game';
import { soundManager } from '../utils/audio';

interface SecretObjectivesModalProps {
  player: Player;
  isOpen: boolean;
  onClose: () => void;
}

export const SecretObjectivesModal: React.FC<SecretObjectivesModalProps> = ({
  player,
  isOpen,
  onClose,
}) => {
  const [isRevealed, setIsRevealed] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    soundManager.playClick();
    setIsRevealed(false);
    onClose();
  };

  const toggleReveal = () => {
    soundManager.playClick();
    setIsRevealed(!isRevealed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden text-slate-100">
        {/* ヘッダー */}
        <div className="px-6 py-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-3.5 h-3.5 rounded-full ${player.bgClass}`} />
            <h3 className="font-bold text-base text-slate-100">
              {player.name} の秘密目標
            </h3>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-medium">
            非公開情報
          </span>
        </div>

        {/* 覗き見防止カバーまたはカード一覧 */}
        <div className="p-6">
          {!isRevealed ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Lock className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-lg text-slate-100">画面を隠してください</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  他のプレイヤーに見られないよう注意して、下のボタンを押して目標を確認してください。
                </p>
              </div>
              <button
                onClick={toggleReveal}
                className="mt-2 flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-900/50"
              >
                <Eye className="w-4 h-4" />
                目標を表示する
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>割り当てられた目標（全2枚）</span>
                <button
                  onClick={toggleReveal}
                  className="flex items-center gap-1 text-slate-400 hover:text-slate-200"
                >
                  <EyeOff className="w-3.5 h-3.5" /> 隠す
                </button>
              </div>

              {player.secretObjectives.map((obj, idx) => {
                const isEndOnly = [2, 3, 4, 6, 12, 13].includes(obj.id);

                return (
                  <div
                    key={obj.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      obj.isCompleted
                        ? 'bg-emerald-950/30 border-emerald-500/50 shadow-md shadow-emerald-950/20'
                        : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                          {obj.category === 'board' ? '盤面系' : obj.category === 'negotiation' ? '交渉系' : 'コイン系'}
                        </span>
                        <h4 className="font-bold text-slate-100 text-sm">
                          {idx + 1}. {obj.name}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1 text-amber-400 font-extrabold text-sm shrink-0">
                        <Award className="w-4 h-4" />
                        {obj.points}点
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed mb-3">
                      {obj.description}
                    </p>

                    {/* 達成状況 / 進捗 */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      {isEndOnly ? (
                        <div className="text-slate-400 italic flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-slate-500" />
                          ゲーム終了時に判定
                        </div>
                      ) : obj.isCompleted ? (
                        <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          達成済み！
                        </div>
                      ) : obj.maxProgress !== undefined && obj.progress !== undefined ? (
                        <div className="w-full">
                          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                            <span>進捗状況</span>
                            <span className="font-bold text-indigo-400">
                              {obj.progress} / {obj.maxProgress}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 transition-all duration-300"
                              style={{
                                width: `${Math.min(100, (obj.progress / obj.maxProgress) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-400 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                          未達成
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/70 flex justify-end">
          <button
            onClick={handleClose}
            className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold transition-colors text-sm"
          >
            確認完了（閉じる）
          </button>
        </div>
      </div>
    </div>
  );
};
