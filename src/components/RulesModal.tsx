import React, { useState } from 'react';
import { X, BookOpen, Crown, Coins, Navigation, ShieldAlert, Award } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'movement' | 'orders' | 'objectives' | 'scoring'>('overview');

  if (!isOpen) return null;

  const handleClose = () => {
    soundManager.playClick();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-200">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-100">ルール説明書</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* タブ */}
        <div className="flex border-b border-slate-800 bg-slate-950/80 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: '基本' },
            { id: 'movement', label: '盤面と自主行動' },
            { id: 'orders', label: '命令と交渉' },
            { id: 'objectives', label: '秘密目標' },
            { id: 'scoring', label: '得点と勝敗' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                soundManager.playClick();
                setActiveTab(tab.id as typeof activeTab);
              }}
              className={`flex-1 min-w-[70px] py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* コンテンツ */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 text-sm leading-relaxed">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-indigo-950/40 border border-indigo-500/30 rounded-xl">
                <h3 className="font-bold text-indigo-300 mb-1 flex items-center gap-1.5">
                  <Crown className="w-4 h-4" /> ゲームの目的
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm">
                  他人を利用・交渉しながら、自分の秘密目標を達成し、多くのコインと得点を獲得したプレイヤーが勝者となります！
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-100">進行の流れ（全6ラウンド）</h4>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 pl-1 text-xs sm:text-sm">
                  <li>手番のプレイヤーへスマホを渡します。</li>
                  <li><strong>自主行動</strong>（1マス移動 または コイン1枚獲得）を行います。</li>
                  <li>他のプレイヤー1人を選び、<strong>命令</strong>を出します。</li>
                  <li>命令されたプレイヤーが<strong>受諾または拒否</strong>を選びます。</li>
                  <li>受諾された場合、命令されたプレイヤーが<strong>命令者の駒</strong>を操作します。</li>
                  <li>命令の成功・失敗を判定し、報酬またはペナルティを精算します。</li>
                </ol>
              </div>

              <div className="p-3 bg-amber-950/40 border border-amber-600/30 rounded-xl text-xs sm:text-sm text-amber-200">
                <strong>最重要ルール：</strong>
                命令されたプレイヤーが動かすのは、<strong>命令したプレイヤーの駒</strong>です。命令された本人の駒は動かしません！
              </div>
            </div>
          )}

          {activeTab === 'movement' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-100 mb-2">5×5の盤面と9つのエリア</h4>
                <p className="text-slate-300 text-xs sm:text-sm mb-3">
                  盤面は9つのエリア（A〜I）に分かれています。中央のエリアEの中央マス (x=2, y=2) が共通ゴールです。
                </p>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-center leading-loose">
                  A A B C C<br />
                  A A B C C<br />
                  D D <span className="text-amber-400 font-bold bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500">E(ゴール)</span> F F<br />
                  G G H I I<br />
                  G G H I I
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-100">移動のルール</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-300 text-xs sm:text-sm">
                  <li>上下左右の隣接マスにのみ移動可能（斜め移動は禁止）。</li>
                  <li>盤面の外には移動できません。</li>
                  <li>他の駒と同じマスに重なることができます（重なった駒はずらして表示されます）。</li>
                  <li>ゴールEに到達した後も移動できます。</li>
                </ul>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-xl">
                <h4 className="font-bold text-slate-100 mb-1 flex items-center gap-1.5 text-xs sm:text-sm">
                  <Navigation className="w-4 h-4 text-emerald-400" /> 手番の自主行動
                </h4>
                <p className="text-slate-300 text-xs">手番の最初に、次のどちらか1つを選択します：</p>
                <ul className="list-disc list-inside text-xs text-slate-300 mt-1 space-y-0.5">
                  <li>自分の駒を上下左右に1マス移動する</li>
                  <li>コインを1枚獲得する</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-bold text-slate-100 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-400" /> 命令のレベルと報酬
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-700 text-slate-400">
                        <th className="py-2">レベル</th>
                        <th className="py-2">報酬</th>
                        <th className="py-2">移動条件</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      <tr>
                        <td className="py-2 font-bold text-indigo-400">Lv 1</td>
                        <td className="py-2 text-amber-400 font-bold">1コイン</td>
                        <td className="py-2">最大5マス。方向転換可能</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-bold text-indigo-400">Lv 2</td>
                        <td className="py-2 text-amber-400 font-bold">2コイン</td>
                        <td className="py-2">指定方向へ直線1〜2マス（方向転換不可）</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-bold text-indigo-400">Lv 3</td>
                        <td className="py-2 text-amber-400 font-bold">3コイン</td>
                        <td className="py-2">指定目的地へ最大3マスで到達</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
                <h5 className="font-bold text-slate-200">成功・失敗時のコイン移動</h5>
                <ul className="space-y-1.5 text-slate-300">
                  <li><strong className="text-emerald-400">成功：</strong> 予約した報酬を命令者から命令された側へ支払います。</li>
                  <li><strong className="text-rose-400">Lv1/2 失敗：</strong> 命令された側から命令者へ<strong>1コインのペナルティ</strong>を支払います（0枚なら支払いなし、1枚未満なら全額）。成功報酬は支払われません。</li>
                  <li><strong className="text-slate-400">拒否：</strong> 駒は動かさず、予約した報酬が命令者へ戻ります。</li>
                </ul>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300">
                <h5 className="font-bold text-slate-200">3種類の命令</h5>
                <p><strong>1. ゴールを目指せ：</strong> ゴールEへ近づく（Lv1/2: マンハッタン距離短縮、Lv3: 到達）。</p>
                <p><strong>2. 指定エリアに入れ：</strong> 移動終了時に指定エリアにいる。</p>
                <p><strong>3. 指定方向へ進め：</strong> 指定方向へ進む（Lv1: 指定方向へ1回以上・反対方向不可、Lv2: 直線1〜2マス、Lv3: 目的地到達）。</p>
              </div>
            </div>
          )}

          {activeTab === 'objectives' && (
            <div className="space-y-4">
              <div className="p-3 bg-purple-950/40 border border-purple-500/30 rounded-xl">
                <h4 className="font-bold text-purple-300 mb-1 flex items-center gap-1.5 text-xs sm:text-sm">
                  <ShieldAlert className="w-4 h-4" /> 秘密目標（全15種類）
                </h4>
                <p className="text-slate-300 text-xs">
                  各プレイヤーに2枚ずつ、<strong>異なるカテゴリ</strong>から配布されます。全プレイヤー間でカードの重複はありません。ゲーム終了まで他の人には秘密です！
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <h5 className="font-bold text-blue-400 mb-1">【盤面系】</h5>
                  <ul className="space-y-1 text-slate-300">
                    <li>・<strong>ゴール到達者(5点):</strong> 移動終了位置がゴールEになったことがある。</li>
                    <li>・<strong>ゴールキーパー(7点):</strong> ゲーム終了時にゴールEにいる。</li>
                    <li>・<strong>陣取り屋(5点):</strong> ゲーム終了時に開始時に指定されたエリアにいる。</li>
                    <li>・<strong>辺境の支配者(3点):</strong> 終了時に盤面外周にいる（開始マス＋隣接4マス除く）。</li>
                    <li>・<strong>誘導の達人(5点):</strong> 他の命令を受諾・成功させ、操作したマス数が累計3マス以上。</li>
                    <li>・<strong>仲良しコンビ(5点):</strong> 終了時に指定された他プレイヤーの駒と上下左右隣接。</li>
                    <li>・<strong>遭遇マスター(7点):</strong> 他のすべてのプレイヤーと一度でも同じマスに重なる。</li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-bold text-amber-400 mb-1">【交渉系】</h5>
                  <ul className="space-y-1 text-slate-300">
                    <li>・<strong>敏腕交渉人(7点):</strong> 自分が出した命令を相手が合計3回以上成功。</li>
                    <li>・<strong>反骨精神(5点):</strong> 受けた命令を合計3回以上拒否。</li>
                    <li>・<strong>人たらし(7点):</strong> 自分以外のすべてのプレイヤーから命令を受けて成功。</li>
                    <li>・<strong>商売上手(5点):</strong> 命令の成功報酬として合計6コイン以上を支払う。</li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-bold text-emerald-400 mb-1">【コイン系】</h5>
                  <ul className="space-y-1 text-slate-300">
                    <li>・<strong>守銭奴(3点):</strong> ゲーム終了時に10コイン以上所持。</li>
                    <li>・<strong>大富豪(5点):</strong> ゲーム終了時の所持コインが最多（同率1位も達成）。</li>
                    <li>・<strong>倹約家(5点):</strong> 自主行動でコイン獲得を3回以上選ぶ。</li>
                    <li>・<strong>報酬コレクター(5点):</strong> 命令成功報酬として合計5コイン以上を受け取る。</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'scoring' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-xl text-center">
                <div className="text-xs text-amber-300 font-semibold mb-1">最終得点の計算式</div>
                <div className="text-lg font-black text-amber-400">
                  最終得点 ＝ 残りコイン数 ＋ 達成した秘密目標の得点
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-100 flex items-center gap-1.5 text-xs sm:text-sm">
                  <Award className="w-4 h-4 text-indigo-400" /> 厳密な順位決定（タイブレーク）
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-300">
                  <li><strong>最終得点</strong>が高いプレイヤー</li>
                  <li><strong>達成した秘密目標の枚数</strong>が多いプレイヤー</li>
                  <li><strong>残りコイン数</strong>が多いプレイヤー</li>
                  <li><strong>ゴールEに到達したことがある</strong>プレイヤー</li>
                  <li>すべて同じなら<strong>引き分け</strong></li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={handleClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors shadow-lg shadow-indigo-900/40 text-sm"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
