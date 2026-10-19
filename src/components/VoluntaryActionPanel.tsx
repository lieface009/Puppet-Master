import React, { useState } from 'react';
import { ArrowRight, Coins, Footprints, RotateCcw } from 'lucide-react';
import type { Coordinate, Player } from '../types/game';
import { isValidStep } from '../logic/board';
import { soundManager } from '../utils/audio';

interface VoluntaryActionPanelProps {
  player: Player;
  onChooseCoin: () => void;
  onConfirmMove: (newCoord: Coordinate) => void;
  selectedCoord: Coordinate | null;
  onSelectCoord: (coord: Coordinate | null) => void;
}

export const VoluntaryActionPanel: React.FC<VoluntaryActionPanelProps> = ({
  player,
  onChooseCoin,
  onConfirmMove,
  selectedCoord,
  onSelectCoord,
}) => {
  const [mode, setMode] = useState<'choose' | 'moving'>('choose');

  const handleSelectCoin = () => {
    soundManager.playCoin();
    onChooseCoin();
  };

  const handleStartMove = () => {
    soundManager.playClick();
    setMode('moving');
    onSelectCoord(null);
  };

  const handleCancelMove = () => {
    soundManager.playClick();
    setMode('choose');
    onSelectCoord(null);
  };

  const handleConfirmMove = () => {
    if (!selectedCoord) return;
    if (!isValidStep(player.currentCoord, selectedCoord)) return;
    soundManager.playTurnChange();
    onConfirmMove(selectedCoord);
  };

  return (
    <div className="w-full max-w-sm mx-auto p-4 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-3 animate-fade-in select-none">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${player.bgClass}`} />
          <span className="text-xs font-bold text-slate-200">
            {player.name} の自主行動
          </span>
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/20">
          ステップ 1/2
        </span>
      </div>

      {mode === 'choose' ? (
        <div className="space-y-2.5">
          <p className="text-xs text-slate-400 text-center">
            手番の最初に、どちらの行動を行うか選択してください
          </p>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={handleStartMove}
              className="py-4 px-3 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-indigo-500 text-slate-100 font-bold text-xs sm:text-sm flex flex-col items-center justify-center gap-2 transition-all shadow-md active:scale-98"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
                <Footprints className="w-5 h-5" />
              </div>
              <span>1マス移動する</span>
              <span className="text-[10px] text-slate-400 font-normal">上下左右の隣接マスへ</span>
            </button>

            <button
              onClick={handleSelectCoin}
              className="py-4 px-3 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-amber-500 text-slate-100 font-bold text-xs sm:text-sm flex flex-col items-center justify-center gap-2 transition-all shadow-md active:scale-98"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                <Coins className="w-5 h-5" />
              </div>
              <span>1コイン獲得</span>
              <span className="text-[10px] text-slate-400 font-normal">所持コイン +1</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-300 text-center font-medium">
            盤面上の光っているマス（上下左右1マス）をタップしてください
          </p>

          <div className="flex gap-2">
            <button
              onClick={handleCancelMove}
              className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> 選び直す
            </button>
            <button
              disabled={!selectedCoord}
              onClick={handleConfirmMove}
              className={`flex-1 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg ${
                selectedCoord
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950/60 active:scale-98'
                  : 'bg-slate-800/50 text-slate-500 cursor-not-allowed border border-slate-800'
              }`}
            >
              移動を確定する
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
