import type { GameResultRecord, GameState } from '../types/game';

const SAVE_KEY = 'puppet_master_save_v1';
const LAST_RESULT_KEY = 'puppet_master_last_result_v1';
const SOUND_SETTING_KEY = 'puppet_master_sound_setting';

export interface SaveValidationResult {
  isValid: boolean;
  state: GameState | null;
  error?: string;
}

// セーブデータを検証
export function validateSaveData(data: unknown): SaveValidationResult {
  if (!data || typeof data !== 'object') {
    return { isValid: false, state: null, error: 'データが存在しないか不正です' };
  }

  const s = data as Partial<GameState>;

  if (!Array.isArray(s.players) || s.players.length < 3 || s.players.length > 4) {
    return { isValid: false, state: null, error: 'プレイヤー情報の形式が不正です' };
  }

  for (const p of s.players) {
    if (typeof p.id !== 'number' || typeof p.name !== 'string' || typeof p.coin !== 'number') {
      return { isValid: false, state: null, error: 'プレイヤー個別情報が破損しています' };
    }
    if (!p.currentCoord || typeof p.currentCoord.x !== 'number' || typeof p.currentCoord.y !== 'number') {
      return { isValid: false, state: null, error: '駒の座標情報が破損しています' };
    }
    if (!Array.isArray(p.secretObjectives) || p.secretObjectives.length !== 2) {
      return { isValid: false, state: null, error: '秘密目標の保存形式が不正です' };
    }
  }

  if (!Array.isArray(s.turnOrder) || s.turnOrder.length !== s.players.length) {
    return { isValid: false, state: null, error: '手番順情報が不正です' };
  }

  if (typeof s.currentRound !== 'number' || s.currentRound < 1 || s.currentRound > 6) {
    return { isValid: false, state: null, error: 'ラウンド情報が不正です' };
  }

  if (typeof s.currentTurnIndex !== 'number' || s.currentTurnIndex < 0 || s.currentTurnIndex >= s.players.length) {
    return { isValid: false, state: null, error: '手番インデックスが不正です' };
  }

  if (!s.phase || typeof s.phase !== 'string') {
    return { isValid: false, state: null, error: 'ゲームフェーズが不正です' };
  }

  if (!s.stats || typeof s.stats !== 'object') {
    return { isValid: false, state: null, error: '統計情報が破損しています' };
  }

  if (!Array.isArray(s.processedActionIds)) {
    return { isValid: false, state: null, error: 'アクションID履歴が破損しています' };
  }

  return { isValid: true, state: s as GameState };
}

// ゲーム状態の保存
export function saveGameState(state: GameState): { success: boolean; error?: string } {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(SAVE_KEY, serialized);
    return { success: true };
  } catch (err) {
    console.warn('Failed to save game state to localStorage:', err);
    return { success: false, error: 'ストレージ容量不足等のため自動保存に失敗しました' };
  }
}

// ゲーム状態の読み込み
export function loadGameState(): SaveValidationResult {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      return { isValid: false, state: null };
    }
    const parsed = JSON.parse(raw);
    return validateSaveData(parsed);
  } catch (err) {
    console.warn('Failed to parse save data:', err);
    return { isValid: false, state: null, error: 'セーブデータが破損しています' };
  }
}

// 進行中セーブデータの削除
export function clearSavedGame(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (err) {
    console.warn('Failed to clear saved game:', err);
  }
}

// 直前の結果保存
export function saveLastGameResult(result: GameResultRecord): void {
  try {
    localStorage.setItem(LAST_RESULT_KEY, JSON.stringify(result));
  } catch (err) {
    console.warn('Failed to save last game result:', err);
  }
}

export function loadLastGameResult(): GameResultRecord | null {
  try {
    const raw = localStorage.getItem(LAST_RESULT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GameResultRecord;
  } catch {
    return null;
  }
}

// サウンド設定の保存と読み込み
export function saveSoundSetting(enabled: boolean): void {
  try {
    localStorage.setItem(SOUND_SETTING_KEY, enabled ? '1' : '0');
  } catch {}
}

export function loadSoundSetting(): boolean {
  try {
    const val = localStorage.getItem(SOUND_SETTING_KEY);
    if (val === null) return true; // デフォルト ON
    return val === '1';
  } catch {
    return true;
  }
}
