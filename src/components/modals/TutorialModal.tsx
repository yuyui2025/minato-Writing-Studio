import { useState } from "react";
import { useStudio } from "../../contexts/StudioContext";

const STEPS = [
  {
    icon: "✦",
    title: "ようこそ、minato Writing Studio へ",
    body: "小説・シナリオの執筆を支援するツールです。シーン管理・執筆・AIアシストの3つの柱で創作をサポートします。このチュートリアルでは主な機能を簡単にご紹介します。",
  },
  {
    icon: "≡",
    title: "シーン管理",
    body: "左サイドバーの「＋」ボタンで章・シーンを追加できます。シーン名をクリックすると執筆エリアに切り替わり、ドラッグ＆ドロップで並び替えも可能です。",
  },
  {
    icon: "✎",
    title: "執筆エリア & 自動保存",
    body: "中央エリアで自由に文章を入力します。変更は自動保存されます。上部「バックアップ」から手動保存や過去バージョンへの復元も可能です。",
  },
  {
    icon: "⊞",
    title: "世界観メモ & 書き出し提案",
    body: "「設定」タブで世界観・キャラクター・テーマを記録できます。世界観・キャラクタータブの「✦ 書き出しを提案」ボタンで、設定をもとにAIが冒頭文を生成します（AI使用時のみ）。",
  },
  {
    icon: "↓",
    title: "取込・書き出し",
    body: "既存の原稿（.txt / .md）やプロジェクトファイルを「取込」で読み込めます。AIがシーン構成とタイトルを自動判別して分割します。「書き出し」では各種フォーマットで出力できます。",
  },
  {
    icon: "⧉",
    title: "プロジェクト切替",
    body: "ヘッダー左のプロジェクト名をクリックすると、複数のプロジェクトを管理できる棚が開きます。作品ごとにシーン・設定・AI履歴を独立して保持できます。",
  },
  {
    icon: "◈",
    title: "AIアシスタント & AI履歴",
    body: "画面右のAIパネルで文章の推敲・続き生成・文体チェックなどを実行できます。生成した内容は「AI履歴」タブに保存され、いつでも再利用できます。",
  },
] as const;

export function TutorialModal() {
  const { setShowTutorial } = useStudio();
  const [step, setStep] = useState(0);
  const total = STEPS.length;
  const current = STEPS[step];

  const dismiss = () => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("minato:tutorialSeen", "1");
    }
    setShowTutorial(false);
  };

  const handleNext = () => {
    if (step < total - 1) {
      setStep((s) => s + 1);
    } else {
      dismiss();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#0e1520",
          border: "1px solid #2a3f58",
          borderRadius: 8,
          padding: "28px 32px",
          maxWidth: 420,
          width: "90%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ヘッダー：ステップ表示 + スキップ */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <span style={{ fontSize: 11, color: "#3a5570", letterSpacing: 1 }}>
            {step + 1} / {total}
          </span>
          <button
            onClick={dismiss}
            style={{
              background: "transparent",
              border: "none",
              color: "#3a5570",
              cursor: "pointer",
              fontSize: 11,
              fontFamily: "inherit",
              padding: "2px 6px",
              letterSpacing: 1,
            }}
          >
            スキップ
          </button>
        </div>

        {/* アイコン */}
        <div
          style={{
            fontSize: 28,
            color: "#4a6fa5",
            textAlign: "center",
            marginBottom: 14,
            letterSpacing: 2,
          }}
        >
          {current.icon}
        </div>

        {/* タイトル */}
        <div
          style={{
            fontSize: 14,
            color: "#7ab3e0",
            textAlign: "center",
            marginBottom: 16,
            fontWeight: 700,
            letterSpacing: 1,
            lineHeight: 1.6,
          }}
        >
          {current.title}
        </div>

        {/* 本文 */}
        <div
          style={{
            fontSize: 13,
            color: "#c8d8e8",
            lineHeight: 1.9,
            textAlign: "center",
            marginBottom: 28,
          }}
        >
          {current.body}
        </div>

        {/* ステップドット */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 6,
            marginBottom: 24,
          }}
        >
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: i === step ? "#4a6fa5" : "#1e2d42",
                transition: "background 0.2s",
              }}
            />
          ))}
        </div>

        {/* ナビゲーションボタン */}
        <div style={{ display: "flex", gap: 8 }}>
          {step > 0 && (
            <button
              onClick={handleBack}
              style={{
                flex: 1,
                padding: "8px",
                background: "transparent",
                border: "1px solid #1e2d42",
                color: "#3a5570",
                cursor: "pointer",
                borderRadius: 4,
                fontSize: 12,
                fontFamily: "inherit",
              }}
            >
              戻る
            </button>
          )}
          <button
            onClick={handleNext}
            style={{
              flex: 1,
              padding: "8px",
              background: "rgba(74,111,165,0.2)",
              border: "1px solid #4a6fa5",
              color: "#7ab3e0",
              cursor: "pointer",
              borderRadius: 4,
              fontSize: 12,
              fontFamily: "inherit",
            }}
          >
            {step < total - 1 ? "次へ" : "はじめる"}
          </button>
        </div>
      </div>
    </div>
  );
}
