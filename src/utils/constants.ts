import type { AreaId } from '../types/game';

export interface PlayerStyle {
  color: string;
  name: string;
  symbol: string;
  bgClass: string;
  borderClass: string;
  ringClass: string;
  textClass: string;
}

export const PLAYER_STYLES: PlayerStyle[] = [
  {
    color: '#ef4444',
    name: '赤',
    symbol: '★',
    bgClass: 'bg-red-600',
    borderClass: 'border-red-500',
    ringClass: 'ring-red-400',
    textClass: 'text-red-400',
  },
  {
    color: '#3b82f6',
    name: '青',
    symbol: '◆',
    bgClass: 'bg-blue-600',
    borderClass: 'border-blue-500',
    ringClass: 'ring-blue-400',
    textClass: 'text-blue-400',
  },
  {
    color: '#10b981',
    name: '緑',
    symbol: '▲',
    bgClass: 'bg-emerald-600',
    borderClass: 'border-emerald-500',
    ringClass: 'ring-emerald-400',
    textClass: 'text-emerald-400',
  },
  {
    color: '#f59e0b',
    name: '黄',
    symbol: '●',
    bgClass: 'bg-amber-500',
    borderClass: 'border-amber-400',
    ringClass: 'ring-amber-300',
    textClass: 'text-amber-300',
  },
];

export const AREA_COLORS: Record<AreaId, { bg: string; border: string; text: string }> = {
  A: { bg: 'bg-rose-950/40', border: 'border-rose-800/40', text: 'text-rose-400' },
  B: { bg: 'bg-cyan-950/40', border: 'border-cyan-800/40', text: 'text-cyan-400' },
  C: { bg: 'bg-blue-950/40', border: 'border-blue-800/40', text: 'text-blue-400' },
  D: { bg: 'bg-orange-950/40', border: 'border-orange-800/40', text: 'text-orange-400' },
  E: { bg: 'bg-amber-900/60', border: 'border-amber-500', text: 'text-amber-300' }, // Goal E
  F: { bg: 'bg-purple-950/40', border: 'border-purple-800/40', text: 'text-purple-400' },
  G: { bg: 'bg-emerald-950/40', border: 'border-emerald-800/40', text: 'text-emerald-400' },
  H: { bg: 'bg-teal-950/40', border: 'border-teal-800/40', text: 'text-teal-400' },
  I: { bg: 'bg-indigo-950/40', border: 'border-indigo-800/40', text: 'text-indigo-400' },
};
