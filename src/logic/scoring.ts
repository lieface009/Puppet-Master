import type { Player } from '../types/game';

export interface PlayerScoreSummary {
  player: Player;
  finalScore: number;
  objectivePoints: number;
  completedObjectivesCount: number;
  remainingCoins: number;
  reachedGoalEver: boolean;
  rank: number;
  isWinner: boolean;
}

export function calculateScoresAndRankings(players: Player[]): PlayerScoreSummary[] {
  const summaries: PlayerScoreSummary[] = players.map((p) => {
    const completedObjs = p.secretObjectives.filter((o) => o.isCompleted);
    const objectivePoints = completedObjs.reduce((sum, o) => sum + o.points, 0);
    const remainingCoins = p.coin;
    const finalScore = remainingCoins + objectivePoints;

    return {
      player: p,
      finalScore,
      objectivePoints,
      completedObjectivesCount: completedObjs.length,
      remainingCoins,
      reachedGoalEver: p.reachedGoalEver,
      rank: 1,
      isWinner: false,
    };
  });

  // 厳格なタイブレーク順でソート:
  // 1. 最終得点 (降順)
  // 2. 達成した秘密目標の枚数 (降順)
  // 3. 残りコイン数 (降順)
  // 4. ゴールEに到達したことがあるか (true優先)
  // 5. 同順位 (引き分け)
  summaries.sort((a, b) => {
    if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
    if (b.completedObjectivesCount !== a.completedObjectivesCount) {
      return b.completedObjectivesCount - a.completedObjectivesCount;
    }
    if (b.remainingCoins !== a.remainingCoins) return b.remainingCoins - a.remainingCoins;
    if (a.reachedGoalEver !== b.reachedGoalEver) {
      return a.reachedGoalEver ? -1 : 1;
    }
    return 0; // 完全一致
  });

  // 順位付け (同点なら同じランク)
  for (let i = 0; i < summaries.length; i++) {
    if (i === 0) {
      summaries[i].rank = 1;
    } else {
      const prev = summaries[i - 1];
      const curr = summaries[i];
      const isTieWithPrev =
        curr.finalScore === prev.finalScore &&
        curr.completedObjectivesCount === prev.completedObjectivesCount &&
        curr.remainingCoins === prev.remainingCoins &&
        curr.reachedGoalEver === prev.reachedGoalEver;

      if (isTieWithPrev) {
        curr.rank = prev.rank;
      } else {
        curr.rank = i + 1;
      }
    }
  }

  // rank === 1 のプレイヤーを勝者 (単独または同率1位) に設定
  for (const s of summaries) {
    s.isWinner = s.rank === 1;
  }

  return summaries;
}
