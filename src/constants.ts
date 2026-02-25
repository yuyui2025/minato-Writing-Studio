import { Scene, Settings, SceneStatus } from "./types";

export const initialSettings: Settings = {
  world: `【時代】21世紀末〜22世紀初頭。人口約6,000万人の近未来日本。
【社会】AI主導のロゴス統治。行動評価スコア（ロゴス・スコア）により福祉・信用が配分。
【都市】サブスク型生活。完全デジタル行政。競争圧力は弱まり「維持型社会」へ。
【地方】準離島扱いの海沿い集落。物流は週数回の自律船・ドローン。監視は薄い。余白と実験の空間。`,
  characters: `【主人公】
・元都市テック系。中央社会からドロップアウト.
・スコアは平均以下ではないが高くもない「目立たない層」。
・どこか醒めている。好奇心はあるが表に出さない。
・退屈に耐えきれず「受け取るだけの仕事」を引き受ける。

【アンドロイド】
・美少女型。白い素体。最小限の装飾。青白い内部発光。灰色の瞳。
・行政AI認証タグなし。ローカルOS。自律学習制限が外れている可能性。
・未登録個体（例外存在）。
・起動直後はロゴス的な（無機質）。海辺で徐々に非効率な行動を学習。`,
  theme: `【テーマ】
・ロゴス（理性）とパトス（情動）の対立
・管理社会の中の例外
・人口減少社会の余白
・労働なき時代の存在意義
・「粋」とは何か — システムへの洗練された逸脱

【トーン】
・静かな近未来。派手な崩壊はない。世界は縮んでいるだけ。
・青（テック）と橙（夕日）の対比。
・夜明け前の霧の港が象徴的な風景。`,
};

export const initialScenes: Scene[] = [
  { id: 1, chapter: "第一章", title: "夜明け前の接岸", status: "draft", synopsis: "主人公が夜明け前の港で自律貨物船を待つ。軍用規格の木箱が届く。" },
  { id: 2, chapter: "第一章", title: "箱の中身", status: "empty", synopsis: "" },
  { id: 3, chapter: "第二章", title: "起動", status: "empty", synopsis: "" },
];

export const statusColors: Record<SceneStatus, string> = { done: "#4ade80", draft: "#facc15", empty: "#334155" };
export const statusLabels: Record<SceneStatus, string> = { done: "完成", draft: "執筆中", empty: "未着手" };
