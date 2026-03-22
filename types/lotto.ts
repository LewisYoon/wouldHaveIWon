// types/lotto.ts

export type WinningResult = {
  id: string;
  numbers: number[];
  drawNumbers: number[];
  drawBonus: number[];
  drawDate: string;
  prizeTier: string;
  mainMatchesCount: number;
  bonusMatchesCount: number;
  game: 'Oz Lotto' | 'Powerball' | 'Tatts Lotto';
  prizeValue?: number;
  weekNumber?: number;
  isSimulated?: boolean;
};

export interface DrawResult {
  game: string;
  drawDate: string;
  numbers: number[];
  bonus: number[];
  prizes: Record<string, number>;
}
