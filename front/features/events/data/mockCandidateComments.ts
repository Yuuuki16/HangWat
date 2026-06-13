export type CandidateComment = {
  id: string;
  displayName: string;
  body: string;
  likeCount: number;
};

export const mockCandidateComments: CandidateComment[] = [
  {
    id: "comment-1",
    displayName: "はせたく",
    body: "昼ごはん何食べよ",
    likeCount: 3,
  },
  {
    id: "comment-2",
    displayName: "小梅",
    body: "それな",
    likeCount: 44,
  },
  {
    id: "comment-3",
    displayName: "クリスティアーノ",
    body: "この前言ってた梅田に新しくできたラーメン屋とかどう？",
    likeCount: 111,
  },
];
