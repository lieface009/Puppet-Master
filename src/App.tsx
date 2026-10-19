import React, { useEffect, useState } from 'react';
import type {
  Coordinate,
  GameResultRecord,
  GameState,
  Order,
  OrderResult,
  Player,
} from './types/game';
import {
  GOAL_COORD,
  START_POSITIONS,
  isSameCoord,
  isValidStep,
} from './logic/board';
import {
  evaluateOrder,
  getAvailableLv3Destinations,
  getMaxStepsForOrder,
} from './logic/order';
import {
  createInitialStats,
  dealSecretObjectives,
  evaluateFinalObjectives,
  recordEncounters,
  updateObjectivesInProgress,
} from './logic/objectives';
import {
  processOrderFailure,
  processOrderRejection,
  processOrderSuccess,
  processVoluntaryCoin,
  reserveOrderReward,
} from './logic/economy';
import { calculateScoresAndRankings } from './logic/scoring';
import type { PlayerScoreSummary } from './logic/scoring';
import {
  clearSavedGame,
  loadGameState,
  loadSoundSetting,
  saveGameState,
  saveLastGameResult,
  saveSoundSetting,
} from './utils/storage';
import { soundManager } from './utils/audio';
import { PLAYER_STYLES } from './utils/constants';

// コンポーネント群のインポート
import { TitleScreen } from './components/TitleScreen';
import { SetupScreen } from './components/SetupScreen';
import { GameIntroScreen } from './components/GameIntroScreen';
import { HandoverScreen } from './components/HandoverScreen';
import { BoardView } from './components/BoardView';
import { VoluntaryActionPanel } from './components/VoluntaryActionPanel';
import { OrderCreatePanel } from './components/OrderCreatePanel';
import { OrderConfirmModal } from './components/OrderConfirmModal';
import { NegotiationPanel } from './components/NegotiationPanel';
import { MoveExecutionPanel } from './components/MoveExecutionPanel';
import { OrderResultModal } from './components/OrderResultModal';
import { SecretObjectivesModal } from './components/SecretObjectivesModal';
import { RulesModal } from './components/RulesModal';
import { GameOverScreen } from './components/GameOverScreen';

import {
  BookOpen,
  Coins,
  Eye,
  Volume2,
  VolumeX,
} from 'lucide-react';

export const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [hasSavedGame, setHasSavedGame] = useState<boolean>(false);
  const [saveDataError, setSaveDataError] = useState<string | undefined>(undefined);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // モーダル表示フラグ
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [isSecretObjectivesOpen, setIsSecretObjectivesOpen] = useState<boolean>(false);
  const [isConfirmOrderOpen, setIsConfirmOrderOpen] = useState<boolean>(false);

  // 一時操作用ステート
  const [voluntarySelectedCoord, setVoluntarySelectedCoord] = useState<Coordinate | null>(null);
  const [orderSelectedCoord, setOrderSelectedCoord] = useState<Coordinate | null>(null);
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [rankings, setRankings] = useState<PlayerScoreSummary[] | null>(null);

  // 初回起動時のセーブデータ・音声設定ロード
  useEffect(() => {
    const soundPref = loadSoundSetting();
    setSoundEnabled(soundPref);
    soundManager.setEnabled(soundPref);

    const loaded = loadGameState();
    if (loaded.isValid && loaded.state) {
      setHasSavedGame(true);
    } else if (loaded.error) {
      setSaveDataError(loaded.error);
    }
  }, []);

  // 音声切り替え
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.setEnabled(next);
    saveSoundSetting(next);
  };

  // セーブ更新ヘルパー
  const updateAndSaveState = (newState: GameState) => {
    setGameState(newState);
    const saveRes = saveGameState(newState);
    if (saveRes.success) {
      setHasSavedGame(true);
    }
  };

  // 1. 新規ゲーム開始（設定画面へ）
  const handleNewGame = () => {
    setGameState({
      players: [],
      turnOrder: [],
      currentRound: 1,
      currentTurnIndex: 0,
      phase: 'SETUP',
      activeOrder: null,
      currentMovePath: [],
      lastOrderResult: null,
      stats: createInitialStats([]),
      soundEnabled,
      actionId: `init-${Date.now()}`,
      processedActionIds: [],
    });
  };

  // 続きから再開
  const handleResumeGame = () => {
    const loaded = loadGameState();
    if (loaded.isValid && loaded.state) {
      setGameState(loaded.state);
      setSoundEnabled(loaded.state.soundEnabled);
      soundManager.setEnabled(loaded.state.soundEnabled);
    }
  };

  // 2. プレイヤー設定確定・初期化
  const handleStartGameFromSetup = (playersConfig: { name: string }[]) => {
    const count = playersConfig.length;
    // 4つの角から開始位置を選択（3人ならランダムに3つ、4人なら4つ）
    const corners = [
      START_POSITIONS.A,
      START_POSITIONS.C,
      START_POSITIONS.G,
      START_POSITIONS.I,
    ];
    // シャッフル
    const shuffledCorners = [...corners].sort(() => Math.random() - 0.5);
    const chosenStarts = shuffledCorners.slice(0, count);

    // 手番順のランダム決定（0..count-1）
    const playerIds = Array.from({ length: count }, (_, i) => i);
    const shuffledTurnOrder = [...playerIds].sort(() => Math.random() - 0.5);

    // 秘密目標の一括抽選（各2枚、別カテゴリ、重複なし）
    const playersPartial = playerIds.map((id) => ({
      id,
      startCoord: chosenStarts[id],
    }));
    const objectivesMap = dealSecretObjectives(playersPartial, playerIds);

    const players: Player[] = playersConfig.map((cfg, idx) => {
      const style = PLAYER_STYLES[idx];
      return {
        id: idx,
        name: cfg.name,
        color: style.color,
        bgClass: style.bgClass,
        borderClass: style.borderClass,
        symbol: style.symbol,
        coin: 5, // 初期5コイン
        reservedCoin: 0,
        startCoord: chosenStarts[idx],
        currentCoord: chosenStarts[idx],
        reachedGoalEver: false,
        secretObjectives: objectivesMap.get(idx) || [],
      };
    });

    const stats = createInitialStats(playerIds);

    const initialState: GameState = {
      players,
      turnOrder: shuffledTurnOrder,
      currentRound: 1,
      currentTurnIndex: 0,
      phase: 'INTRO',
      activeOrder: null,
      currentMovePath: [],
      lastOrderResult: null,
      stats,
      soundEnabled,
      actionId: `act-start-${Date.now()}`,
      processedActionIds: [],
    };

    updateAndSaveState(initialState);
  };

  // 現在の手番プレイヤー情報
  const currentTurnPlayerId = gameState?.turnOrder[gameState.currentTurnIndex] ?? 0;
  const currentTurnPlayer = gameState?.players.find((p) => p.id === currentTurnPlayerId)!;

  // 自主行動: コイン獲得
  const handleVoluntaryCoin = () => {
    if (!gameState) return;
    const actionId = `vol-coin-${gameState.currentRound}-${gameState.currentTurnIndex}-${Date.now()}`;
    const result = processVoluntaryCoin(
      currentTurnPlayerId,
      gameState.players,
      gameState.stats,
      actionId,
      gameState.processedActionIds
    );

    // 目標更新
    const updatedPlayers = result.players.map((p) =>
      updateObjectivesInProgress(p, result.players, result.stats)
    );

    const nextState: GameState = {
      ...gameState,
      players: updatedPlayers,
      stats: result.stats,
      phase: 'ORDER_CREATE',
      processedActionIds: result.processedActionIds,
    };
    updateAndSaveState(nextState);
  };

  // 自主行動: 1マス移動確定
  const handleVoluntaryMove = (newCoord: Coordinate) => {
    if (!gameState) return;
    const path = [currentTurnPlayer.currentCoord, newCoord];

    // 遭遇記録
    const statsCopy = { ...gameState.stats };
    recordEncounters(currentTurnPlayerId, path, gameState.players, statsCopy);

    const reachedGoal = currentTurnPlayer.reachedGoalEver || isSameCoord(newCoord, GOAL_COORD);

    const updatedPlayers = gameState.players.map((p) => {
      if (p.id === currentTurnPlayerId) {
        return {
          ...p,
          currentCoord: newCoord,
          reachedGoalEver: reachedGoal,
        };
      }
      return p;
    });

    // リアルタイム目標同期
    const finalPlayers = updatedPlayers.map((p) =>
      updateObjectivesInProgress(p, updatedPlayers, statsCopy)
    );

    setVoluntarySelectedCoord(null);

    const nextState: GameState = {
      ...gameState,
      players: finalPlayers,
      stats: statsCopy,
      phase: 'ORDER_CREATE',
    };
    updateAndSaveState(nextState);
  };

  // 命令の作成・確認へ
  const handleOrderPrepared = (order: Order) => {
    setPendingOrder(order);
    setIsConfirmOrderOpen(true);
  };

  // 命令確定・送信（報酬コイン予約）
  const handleConfirmOrder = () => {
    if (!gameState || !pendingOrder) return;
    const reserveRes = reserveOrderReward(pendingOrder, gameState.players);
    if (!reserveRes.success) return;

    setIsConfirmOrderOpen(false);

    const nextState: GameState = {
      ...gameState,
      players: reserveRes.players,
      activeOrder: pendingOrder,
      phase: 'ORDER_NEGOTIATE',
    };
    updateAndSaveState(nextState);
  };

  // 命令拒否
  const handleOrderReject = () => {
    if (!gameState || !gameState.activeOrder) return;
    const actionId = `rej-${gameState.currentRound}-${gameState.currentTurnIndex}-${Date.now()}`;
    const rejRes = processOrderRejection(
      gameState.activeOrder,
      gameState.players,
      gameState.stats,
      actionId,
      gameState.processedActionIds
    );

    const updatedPlayers = rejRes.players.map((p) =>
      updateObjectivesInProgress(p, rejRes.players, rejRes.stats)
    );

    // 拒否時は手番交代へ進む
    advanceTurn({
      ...gameState,
      players: updatedPlayers,
      stats: rejRes.stats,
      activeOrder: null,
      processedActionIds: rejRes.processedActionIds,
    });
  };

  // 命令受諾 -> 移動操作へ
  const handleOrderAccept = () => {
    if (!gameState || !gameState.activeOrder) return;
    // 操作されるのは命令した側（sourcePlayer）の駒！
    const sourcePlayer = gameState.players.find((p) => p.id === gameState.activeOrder!.sourcePlayerId)!;

    const nextState: GameState = {
      ...gameState,
      currentMovePath: [sourcePlayer.currentCoord],
      phase: 'ORDER_EXECUTE',
    };
    updateAndSaveState(nextState);
  };

  // 移動操作中のマス選択（1マスずつステップ）
  const handleStepClick = (coord: Coordinate) => {
    if (!gameState || !gameState.activeOrder) return;
    const currentPath = gameState.currentMovePath;
    const lastCoord = currentPath[currentPath.length - 1];

    if (!isValidStep(lastCoord, coord)) return;

    const maxSteps = getMaxStepsForOrder(gameState.activeOrder);
    if (currentPath.length - 1 >= maxSteps) return;

    soundManager.playClick();
    setGameState({
      ...gameState,
      currentMovePath: [...currentPath, coord],
    });
  };

  // 1手戻る
  const handleUndoStep = () => {
    if (!gameState || gameState.currentMovePath.length <= 1) return;
    setGameState({
      ...gameState,
      currentMovePath: gameState.currentMovePath.slice(0, -1),
    });
  };

  // 移動リセット
  const handleResetSteps = () => {
    if (!gameState || gameState.currentMovePath.length <= 1) return;
    setGameState({
      ...gameState,
      currentMovePath: [gameState.currentMovePath[0]],
    });
  };

  // 移動完了・結果判定
  const handleCompleteOrderMove = () => {
    if (!gameState || !gameState.activeOrder) return;
    const order = gameState.activeOrder;
    const path = gameState.currentMovePath;
    const finalCoord = path[path.length - 1];
    const stepsMoved = path.length - 1;

    // 1. 移動評価
    const evalRes = evaluateOrder(order, path);

    // 2. 遭遇記録
    const statsCopy = { ...gameState.stats };
    recordEncounters(order.sourcePlayerId, path, gameState.players, statsCopy);

    // 3. 駒のゴール到達実績
    const sourcePlayer = gameState.players.find((p) => p.id === order.sourcePlayerId)!;
    const reachedGoal = sourcePlayer.reachedGoalEver || isSameCoord(finalCoord, GOAL_COORD);

    // 4. コイン精算
    let updatedPlayers = gameState.players.map((p) => {
      if (p.id === order.sourcePlayerId) {
        return { ...p, currentCoord: finalCoord, reachedGoalEver: reachedGoal };
      }
      return p;
    });

    let coinsTransferred: OrderResult['coinsTransferred'] = null;
    let processedIds = gameState.processedActionIds;
    const actionId = `order-res-${gameState.currentRound}-${gameState.currentTurnIndex}-${Date.now()}`;

    if (evalRes.success) {
      const succRes = processOrderSuccess(
        order,
        stepsMoved,
        updatedPlayers,
        statsCopy,
        actionId,
        processedIds
      );
      updatedPlayers = succRes.players;
      coinsTransferred = succRes.coinsTransferred;
      processedIds = succRes.processedActionIds;
    } else {
      const failRes = processOrderFailure(
        order,
        updatedPlayers,
        statsCopy,
        actionId,
        processedIds
      );
      updatedPlayers = failRes.players;
      coinsTransferred = failRes.coinsTransferred;
      processedIds = failRes.processedActionIds;
    }

    // 目標のリアルタイム更新
    const synchronizedPlayers = updatedPlayers.map((p) =>
      updateObjectivesInProgress(p, updatedPlayers, statsCopy)
    );

    const orderResult: OrderResult = {
      order,
      success: evalRes.success,
      reason: evalRes.reason,
      path,
      coinsTransferred,
    };

    const nextState: GameState = {
      ...gameState,
      players: synchronizedPlayers,
      stats: statsCopy,
      lastOrderResult: orderResult,
      phase: 'ORDER_RESULT',
      processedActionIds: processedIds,
    };
    updateAndSaveState(nextState);
  };

  // 手番進行・ラウンド更新・ゲーム終了判定
  const advanceTurn = (state: GameState) => {
    let nextTurnIndex = state.currentTurnIndex + 1;
    let nextRound = state.currentRound;

    // 全員の手番終了時
    if (nextTurnIndex >= state.players.length) {
      nextTurnIndex = 0;
      nextRound += 1;
    }

    // 全6ラウンド終了時の判定
    if (nextRound > 6) {
      // 終了時目標の一括確定判定
      const finalEvaluatedPlayers = evaluateFinalObjectives(state.players, state.stats);
      // 得点計算＆厳格タイブレーク順位決定
      const calculatedRankings = calculateScoresAndRankings(finalEvaluatedPlayers);
      setRankings(calculatedRankings);

      // 直前ゲーム結果の保存
      const resultRecord: GameResultRecord = {
        date: new Date().toLocaleDateString('ja-JP'),
        playerCount: state.players.length,
        players: calculatedRankings.map((r) => ({
          id: r.player.id,
          name: r.player.name,
          finalScore: r.finalScore,
          remainingCoins: r.remainingCoins,
          rank: r.rank,
          isWinner: r.isWinner,
          objectives: r.player.secretObjectives.map((o) => ({
            name: o.name,
            isCompleted: o.isCompleted,
            points: o.points,
          })),
        })),
      };
      saveLastGameResult(resultRecord);
      clearSavedGame();
      setHasSavedGame(false);

      const finalState: GameState = {
        ...state,
        players: finalEvaluatedPlayers,
        phase: 'GAME_OVER',
      };
      setGameState(finalState);
      return;
    }

    // 次の手番へ
    const nextState: GameState = {
      ...state,
      currentRound: nextRound,
      currentTurnIndex: nextTurnIndex,
      phase: 'HANDOVER',
      activeOrder: null,
      currentMovePath: [],
      lastOrderResult: null,
    };
    updateAndSaveState(nextState);
  };

  // 判定結果モーダルからの「次へ」
  const handleProceedAfterResult = () => {
    if (!gameState) return;
    advanceTurn(gameState);
  };

  // もう一度遊ぶ
  const handlePlayAgain = () => {
    setRankings(null);
    setGameState({
      players: [],
      turnOrder: [],
      currentRound: 1,
      currentTurnIndex: 0,
      phase: 'SETUP',
      activeOrder: null,
      currentMovePath: [],
      lastOrderResult: null,
      stats: createInitialStats([]),
      soundEnabled,
      actionId: `init-${Date.now()}`,
      processedActionIds: [],
    });
  };

  // 盤面タップ時のハンドラ
  const handleBoardSquareClick = (coord: Coordinate) => {
    if (!gameState) return;

    if (gameState.phase === 'VOLUNTARY_MOVE') {
      soundManager.playClick();
      setVoluntarySelectedCoord(coord);
    } else if (gameState.phase === 'ORDER_CREATE') {
      soundManager.playClick();
      setOrderSelectedCoord(coord);
    } else if (gameState.phase === 'ORDER_EXECUTE') {
      handleStepClick(coord);
    }
  };

  // 盤面で選択可能なマスを計算
  const getSelectableCoords = (): Coordinate[] => {
    if (!gameState) return [];

    if (gameState.phase === 'VOLUNTARY_MOVE') {
      // 現在の駒から上下左右1マス
      const cur = currentTurnPlayer.currentCoord;
      const candidates: Coordinate[] = [
        { x: cur.x, y: cur.y - 1 },
        { x: cur.x, y: cur.y + 1 },
        { x: cur.x - 1, y: cur.y },
        { x: cur.x + 1, y: cur.y },
      ];
      return candidates.filter((c) => isValidStep(cur, c));
    }

    if (gameState.phase === 'ORDER_CREATE') {
      // Lv3の目的地選択
      return getAvailableLv3Destinations(currentTurnPlayer.currentCoord);
    }

    if (gameState.phase === 'ORDER_EXECUTE') {
      // 移動操作中：直前マスから上下左右1マス
      const path = gameState.currentMovePath;
      if (path.length === 0) return [];
      const last = path[path.length - 1];
      const maxSteps = gameState.activeOrder ? getMaxStepsForOrder(gameState.activeOrder) : 5;
      if (path.length - 1 >= maxSteps) return []; // 最大移動数到達

      const candidates: Coordinate[] = [
        { x: last.x, y: last.y - 1 },
        { x: last.x, y: last.y + 1 },
        { x: last.x - 1, y: last.y },
        { x: last.x + 1, y: last.y },
      ];
      return candidates.filter((c) => isValidStep(last, c));
    }

    return [];
  };

  // 現在盤面上で操作対象になっている駒の持ち主ID
  const getControlledPiecePlayerId = (): number | undefined => {
    if (!gameState) return undefined;
    if (gameState.phase === 'ORDER_EXECUTE' && gameState.activeOrder) {
      return gameState.activeOrder.sourcePlayerId;
    }
    if (gameState.phase === 'VOLUNTARY' || gameState.phase === 'VOLUNTARY_MOVE') {
      return currentTurnPlayerId;
    }
    return undefined;
  };

  // ルートコンテナの描画
  return (
    <div className="game-container">
      {/* 1. タイトル画面 */}
      {(!gameState || gameState.phase === 'TITLE') && (
        <TitleScreen
          hasSavedGame={hasSavedGame}
          saveDataError={saveDataError}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          onNewGame={handleNewGame}
          onResumeGame={handleResumeGame}
          onOpenRules={() => setIsRulesOpen(true)}
        />
      )}

      {/* 2. プレイヤー設定画面 */}
      {gameState?.phase === 'SETUP' && (
        <SetupScreen
          onStartGame={handleStartGameFromSetup}
          onBack={() => setGameState(null)}
        />
      )}

      {/* 3. ゲーム開始演出（手番順表示） */}
      {gameState?.phase === 'INTRO' && (
        <GameIntroScreen
          players={gameState.players}
          turnOrder={gameState.turnOrder}
          onProceed={() => {
            const nextState: GameState = { ...gameState, phase: 'HANDOVER' };
            updateAndSaveState(nextState);
          }}
        />
      )}

      {/* 4. 手番受け渡し画面 */}
      {gameState?.phase === 'HANDOVER' && (
        <HandoverScreen
          player={currentTurnPlayer}
          round={gameState.currentRound}
          onReady={() => {
            const nextState: GameState = { ...gameState, phase: 'VOLUNTARY' };
            updateAndSaveState(nextState);
          }}
          onOpenSecretObjectives={() => setIsSecretObjectivesOpen(true)}
        />
      )}

      {/* 5. ゲームオーバー（結果画面） */}
      {gameState?.phase === 'GAME_OVER' && rankings && (
        <GameOverScreen
          rankings={rankings}
          onPlayAgain={handlePlayAgain}
        />
      )}

      {/* 6. メインゲーム画面（VOLUNTARY, ORDER_CREATE, ORDER_NEGOTIATE, ORDER_EXECUTE, ORDER_RESULT） */}
      {gameState &&
        [
          'VOLUNTARY',
          'VOLUNTARY_MOVE',
          'ORDER_CREATE',
          'ORDER_NEGOTIATE',
          'ORDER_EXECUTE',
          'ORDER_RESULT',
        ].includes(gameState.phase) && (
          <div className="flex-1 flex flex-col justify-between p-3 select-none overflow-y-auto">
            {/* 上部ヘッダー */}
            <div className="space-y-2 mb-1">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-300">
                  第 <strong className="text-indigo-400">{gameState.currentRound}</strong>/6 ラウンド
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsSecretObjectivesOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-950/50 border border-purple-500/40 text-[11px] font-bold text-purple-300 hover:text-white transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> 秘密目標
                  </button>

                  <button
                    onClick={() => setIsRulesOpen(true)}
                    className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <BookOpen className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleToggleSound}
                    className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
                  >
                    {soundEnabled ? (
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <VolumeX className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* プレイヤー一覧・コイン表示 */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {gameState.players.map((p) => {
                  const isCurrent = p.id === currentTurnPlayerId;
                  return (
                    <div
                      key={p.id}
                      className={`p-1.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                        isCurrent
                          ? 'bg-indigo-950/40 border-indigo-500/60 shadow-md ring-1 ring-indigo-400/30'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <div
                          className={`w-5 h-5 rounded-md ${p.bgClass} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}
                        >
                          {p.symbol}
                        </div>
                        <span className="truncate font-bold text-slate-200 text-[11px]">
                          {p.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-400 font-extrabold text-[11px] shrink-0">
                        <Coins className="w-3 h-3" />
                        {p.coin}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 盤面 */}
            <div className="my-auto py-1">
              <BoardView
                players={gameState.players}
                activePlayerId={currentTurnPlayerId}
                controlledPiecePlayerId={getControlledPiecePlayerId()}
                selectableCoords={getSelectableCoords()}
                movePath={
                  gameState.phase === 'ORDER_EXECUTE'
                    ? gameState.currentMovePath
                    : voluntarySelectedCoord
                    ? [currentTurnPlayer.currentCoord, voluntarySelectedCoord]
                    : []
                }
                targetCoordHighlight={
                  gameState.phase === 'ORDER_CREATE'
                    ? orderSelectedCoord || undefined
                    : gameState.activeOrder?.targetCoord
                }
                onSquareClick={handleBoardSquareClick}
              />
            </div>

            {/* 下部操作パネル */}
            <div className="pt-2">
              {(gameState.phase === 'VOLUNTARY' || gameState.phase === 'VOLUNTARY_MOVE') && (
                <VoluntaryActionPanel
                  player={currentTurnPlayer}
                  onChooseCoin={handleVoluntaryCoin}
                  onConfirmMove={handleVoluntaryMove}
                  selectedCoord={voluntarySelectedCoord}
                  onSelectCoord={(c) => {
                    setVoluntarySelectedCoord(c);
                    setGameState({ ...gameState, phase: 'VOLUNTARY_MOVE' });
                  }}
                />
              )}

              {gameState.phase === 'ORDER_CREATE' && (
                <OrderCreatePanel
                  currentPlayer={currentTurnPlayer}
                  allPlayers={gameState.players}
                  onOrderPrepared={handleOrderPrepared}
                  selectedCoord={orderSelectedCoord}
                  onSelectCoord={setOrderSelectedCoord}
                />
              )}

              {gameState.phase === 'ORDER_NEGOTIATE' && gameState.activeOrder && (
                <NegotiationPanel
                  order={gameState.activeOrder}
                  sourcePlayer={
                    gameState.players.find(
                      (p) => p.id === gameState.activeOrder!.sourcePlayerId
                    )!
                  }
                  targetPlayer={
                    gameState.players.find(
                      (p) => p.id === gameState.activeOrder!.targetPlayerId
                    )!
                  }
                  onAccept={handleOrderAccept}
                  onReject={handleOrderReject}
                />
              )}

              {gameState.phase === 'ORDER_EXECUTE' && gameState.activeOrder && (
                <MoveExecutionPanel
                  order={gameState.activeOrder}
                  sourcePlayer={
                    gameState.players.find(
                      (p) => p.id === gameState.activeOrder!.sourcePlayerId
                    )!
                  }
                  targetPlayer={
                    gameState.players.find(
                      (p) => p.id === gameState.activeOrder!.targetPlayerId
                    )!
                  }
                  path={gameState.currentMovePath}
                  onUndo={handleUndoStep}
                  onReset={handleResetSteps}
                  onComplete={handleCompleteOrderMove}
                />
              )}
            </div>
          </div>
        )}

      {/* モーダル群 */}
      {/* 1. 命令確認モーダル */}
      {isConfirmOrderOpen && pendingOrder && gameState && (
        <OrderConfirmModal
          order={pendingOrder}
          sourcePlayer={
            gameState.players.find((p) => p.id === pendingOrder.sourcePlayerId)!
          }
          targetPlayer={
            gameState.players.find((p) => p.id === pendingOrder.targetPlayerId)!
          }
          isOpen={isConfirmOrderOpen}
          onConfirm={handleConfirmOrder}
          onCancel={() => setIsConfirmOrderOpen(false)}
        />
      )}

      {/* 2. 結果モーダル */}
      {gameState?.phase === 'ORDER_RESULT' && gameState.lastOrderResult && (
        <OrderResultModal
          result={gameState.lastOrderResult}
          players={gameState.players}
          isOpen={true}
          onProceed={handleProceedAfterResult}
        />
      )}

      {/* 3. 秘密目標モーダル */}
      {isSecretObjectivesOpen && currentTurnPlayer && (
        <SecretObjectivesModal
          player={currentTurnPlayer}
          isOpen={isSecretObjectivesOpen}
          onClose={() => setIsSecretObjectivesOpen(false)}
        />
      )}

      {/* 4. ルールモーダル */}
      <RulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />
    </div>
  );
};

export default App;
