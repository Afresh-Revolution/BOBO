export type SeasonWinner = {
  id: string;
  seasonNumber: number;
  seasonLabel: string;
  winnerName: string;
  stateOfOrigin: string;
  imageUrl: string;
  sortOrder: number;
};

/** Always-available hero fallback (client + server safe). */
export const FALLBACK_WINNERS: SeasonWinner[] = [
  {
    id: "seed-season-1",
    seasonNumber: 1,
    seasonLabel: "Season 1",
    winnerName: "OBIANUJU",
    stateOfOrigin: "Abuja",
    imageUrl: "/winner.png",
    sortOrder: 0,
  },
];
