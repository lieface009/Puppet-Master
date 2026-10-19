import React, { useEffect } from 'react';
import type { OrderResult, Player } from '../types/game';
import { CheckCircle2, XCircle, Coins, ArrowRight } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface OrderResultModalProps {
  result: OrderResult;
  players: Player[];
  isOpen: boolean;
  onProceed: () => void;
}

export const OrderResultModal: React.FC<OrderResultModalProps> = ({
  result,
  players,
  isOpen,
  onProceed,
}) => {
  useEffect(() => {
    if (isOpen) {
      if (result.success) {
        soundManager.playSuccess();
      } else {
        soundManager.playFailure();
      }
    }
  }, [isOpen, result.success]);

  if (!isOpen) return null;

  const handleProceed = () => {
    soundManager.playClick();
    onProceed();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-5 text-center text-slate-100 select-none">
        {/* 結果バッジ */}
        <div className="space-y-2">
          {result.success ? (
            <div className="inline-flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-950/40 animate-bounce">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h2 className="text-2xl font-black text-emerald-400">
                命令成功！
              </h2>
            </div>
          ) : (
            <div className="inline-flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-3xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-950/40 animate-pulse">
                <XCircle className="w-9 h-9" />
              </div>
              <h2 className="text-2xl font-black text-rose-400">
                命令失敗…
              </h2>
            </div>
          )}

          {/* 判定理由 */}
          <div className="p-3 bg-slate-950/90 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed font-medium">
            {result.reason}
          </div>
        </div>

        {/* コイン精算表示 */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
          <div className="text-[11px] font-bold text-slate-400">コインの移動</div>
          {result.coinsTransferred ? (
            <div className="flex items-center justify-center gap-2 font-bold text-sm">
              <span className="text-slate-200">
                {players.find((p) => p.id === result.coinsTransferred?.from)?.name}
              </span>
              <span className="text-slate-500">→</span>
              <span className="text-indigo-400">
                {players.find((p) => p.id === result.coinsTransferred?.to)?.name}
              </span>
              <div className="ml-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1 font-black">
                <Coins className="w-3.5 h-3.5" />
                {result.coinsTransferred.amount}コイン
              </div>
            </div>
          ) : (
            <div className="text-slate-400">
              ペナルティ支払い対象のコインがありませんでした（0コイン）
            </div>
          )}

          {result.success ? (
            <div className="text-[10px] text-emerald-400">
              命令達成により成功報酬が支払われました
            </div>
          ) : (
            <div className="text-[10px] text-rose-400">
              失敗ペナルティとして命令された側から支払われました
            </div>
          )}
        </div>

        {/* 次へ進むボタン */}
        <button
          onClick={handleProceed}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-xl shadow-indigo-950/60 transition-all transform active:scale-98"
        >
          手番を完了する
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
