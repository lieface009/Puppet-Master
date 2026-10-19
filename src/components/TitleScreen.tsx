import React, { useState } from 'react';
import { Play, RotateCcw, BookOpen, Volume2, VolumeX, AlertTriangle, Sparkles } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface TitleScreenProps {
  hasSavedGame: boolean;
  saveDataError?: string;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onNewGame: () => void;
  onResumeGame: () => void;
  onOpenRules: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  hasSavedGame,
  saveDataError,
  soundEnabled,
  onToggleSound,
  onNewGame,
  onResumeGame,
  onOpenRules,
}) => {
  const [showConfirmOverwrite, setShowConfirmOverwrite] = useState(false);

  const handleNewGameClick = () => {
    soundManager.playClick();
    if (hasSavedGame) {
      setShowConfirmOverwrite(true);
    } else {
      onNewGame();
    }
  };

  const handleConfirmNewGame = () => {
    soundManager.playClick();
    setShowConfirmOverwrite(false);
    onNewGame();
  };

  const handleCancelNewGame = () => {
    soundManager.playClick();
    setShowConfirmOverwrite(false);
  };

  const handleResumeClick = () => {
    soundManager.playClick();
    onResumeGame();
  };

  const handleRulesClick = () => {
    soundManager.playClick();
    onOpenRules();
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-between p-6 text-center select-none">
      {/* サウンドトグル */}
      <div className="w-full flex justify-end">
        <button
          onClick={onToggleSound}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300 hover:text-white transition-all shadow-md"
        >
          {soundEnabled ? (
            <>
              <Volume2 className="w-4 h-4 text-emerald-400" /> 効果音: ON
            </>
          ) : (
            <>
              <VolumeX className="w-4 h-4 text-slate-500" /> 効果音: OFF
            </>
          )}
        </button>
      </div>

      {/* メインタイトルロゴ */}
      <div className="my-auto py-6 space-y-4 max-w-sm">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold tracking-wider">
          <Sparkles className="w-3.5 h-3.5" /> 対人駆け引きボードゲーム
        </div>

        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-indigo-200 via-white to-indigo-400 drop-shadow-lg">
          PUPPET<br />MASTER
        </h1>

        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          他人を操り、交渉し、裏をかけ。<br />
          1台のスマホで楽しむ3〜4人対戦ゲーム
        </p>
      </div>

      {/* 破損警告メッセージ */}
      {saveDataError && (
        <div className="w-full max-w-xs mb-4 p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs flex items-start gap-2 text-left">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
          <span>前回データが破損していたためリセットされました。新規ゲームを開始できます。</span>
        </div>
      )}

      {/* 操作ボタン群 */}
      <div className="w-full max-w-xs space-y-3 pb-6">
        {hasSavedGame && (
          <button
            onClick={handleResumeClick}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-base flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-950/50 transition-all transform active:scale-98"
          >
            <RotateCcw className="w-5 h-5" />
            続きから再開
          </button>
        )}

        <button
          onClick={handleNewGameClick}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-base flex items-center justify-center gap-2.5 shadow-xl shadow-indigo-950/50 transition-all transform active:scale-98"
        >
          <Play className="w-5 h-5 fill-current" />
          ゲーム開始
        </button>

        <button
          onClick={handleRulesClick}
          className="w-full py-3 px-6 rounded-2xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-md"
        >
          <BookOpen className="w-4 h-4 text-indigo-400" />
          ルールを確認
        </button>
      </div>

      {/* バージョン表記 */}
      <div className="text-[11px] text-slate-600 pb-2">
        PUPPET MASTER v1.0.0 • 3〜4人プレイ
      </div>

      {/* 上書き確認ダイアログ */}
      {showConfirmOverwrite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-xs w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">進行中のゲームがあります</h3>
              <p className="text-xs text-slate-400 mt-1">
                新しいゲームを始めると、現在保存されている進行中データが上書きされます。よろしいですか？
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleCancelNewGame}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleConfirmNewGame}
                className="flex-1 py-2.5 rounded-xl bg-crimson hover:bg-red-500 text-white text-xs font-bold transition-colors shadow-lg shadow-red-950/50"
              >
                上書きして開始
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
