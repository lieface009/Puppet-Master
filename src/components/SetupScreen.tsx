import React, { useState } from 'react';
import { Users, ArrowLeft, Play, Sparkles } from 'lucide-react';
import { PLAYER_STYLES } from '../utils/constants';
import { soundManager } from '../utils/audio';

interface SetupScreenProps {
  onStartGame: (playersConfig: { name: string }[]) => void;
  onBack: () => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ onStartGame, onBack }) => {
  const [playerCount, setPlayerCount] = useState<3 | 4>(4);
  const [names, setNames] = useState<string[]>([
    'プレイヤー1',
    'プレイヤー2',
    'プレイヤー3',
    'プレイヤー4',
  ]);

  const handleNameChange = (index: number, val: string) => {
    const updated = [...names];
    updated[index] = val;
    setNames(updated);
  };

  const handleCountChange = (count: 3 | 4) => {
    soundManager.playClick();
    setPlayerCount(count);
  };

  const handleStart = () => {
    soundManager.playClick();
    // 名前が空文字の場合は自動補完
    const sanitized = names.slice(0, playerCount).map((name, idx) => ({
      name: name.trim() ? name.trim() : `プレイヤー${idx + 1}`,
    }));
    onStartGame(sanitized);
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-5 max-w-md mx-auto w-full select-none">
      {/* 上部ナビ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => {
              soundManager.playClick();
              onBack();
            }}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-indigo-400" /> プレイヤー設定
          </h2>
          <div className="w-9" />
        </div>

        {/* プレイ人数選択 */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 mb-4">
          <label className="text-xs font-semibold text-slate-400 block">
            プレイ人数を選択
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[3, 4].map((count) => (
              <button
                key={count}
                onClick={() => handleCountChange(count as 3 | 4)}
                className={`py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border transition-all ${
                  playerCount === count
                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-950/60'
                    : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-4 h-4" />
                {count}人プレイ
              </button>
            ))}
          </div>
        </div>

        {/* プレイヤー名入力 */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-400 block px-1">
            各プレイヤーの名前
          </label>
          {Array.from({ length: playerCount }).map((_, idx) => {
            const style = PLAYER_STYLES[idx];
            return (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-sm"
              >
                {/* 駒アイコン */}
                <div
                  className={`w-10 h-10 rounded-xl ${style.bgClass} flex items-center justify-center text-white font-extrabold text-base shadow-md shrink-0`}
                >
                  {style.symbol}
                </div>

                {/* 入力欄 */}
                <div className="flex-1">
                  <div className="text-[11px] font-semibold text-slate-400 mb-0.5">
                    {style.name}の駒
                  </div>
                  <input
                    type="text"
                    maxLength={10}
                    value={names[idx]}
                    onChange={(e) => handleNameChange(idx, e.target.value)}
                    placeholder={`プレイヤー${idx + 1}`}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 開始ボタン */}
      <div className="pt-6 pb-2">
        <button
          onClick={handleStart}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-xl shadow-indigo-950/60 transition-all transform active:scale-98"
        >
          <Play className="w-5 h-5 fill-current" />
          対戦を開始する
        </button>
        <p className="text-center text-[11px] text-slate-500 mt-2 flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          手番順と初期位置はランダムに決定されます
        </p>
      </div>
    </div>
  );
};
