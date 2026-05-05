import React, { useEffect, useRef } from "react";
import { useStudio } from "../../contexts/StudioContext";
import { useUserProfile } from "../../hooks/useUserProfile";

const AD_CLIENT = import.meta.env.VITE_AD_CLIENT as string | undefined;
const AD_SLOT = import.meta.env.VITE_AD_SLOT as string | undefined;

function injectAdSenseScript() {
  if (!AD_CLIENT) return;
  if (document.querySelector("script[data-adsense]")) return;
  const script = document.createElement("script");
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CLIENT}`;
  script.async = true;
  script.crossOrigin = "anonymous";
  script.dataset.adsense = "true";
  document.head.appendChild(script);
}

export const AdBanner: React.FC = () => {
  const { aiMode, user } = useStudio();
  const profile = useUserProfile();

  if (aiMode === "byok_local" || aiMode === "byok_cloud") return null;
  // ログイン済みだがプロフィールロード中 → 有料プランの可能性があるため待機
  if (user && !profile) return null;
  // プロフィール取得済みで Free 以外 → 非表示
  if (profile && profile.plan !== "free") return null;
  // オフラインユーザー（user=null, profile=null）は Free 扱いで広告表示

  if (!AD_CLIENT || !AD_SLOT) {
    return (
      <div style={{
        padding: "8px 16px",
        background: "#070a14",
        borderTop: "1px solid #1a2535",
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 10, color: "#2a4060", flexShrink: 0 }}>広告</div>
        <div style={{
          flex: 1,
          height: 36,
          background: "#0d1520",
          border: "1px dashed #1a2535",
          borderRadius: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 10,
          color: "#1e2d42",
        }}>
          広告スロット
        </div>
      </div>
    );
  }

  return <AdSenseBanner />;
};

function AdSenseBanner() {
  const pushed = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    injectAdSenseScript();

    const tryPush = () => {
      if (pushed.current) return;
      const el = containerRef.current;
      // コンテナの幅が 0 の場合（AIパネルのアニメーション中など）はスキップ
      if (!el || el.offsetWidth === 0) return;
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        pushed.current = true;
      } catch {
        // 失敗時は pushed を立てないことで ResizeObserver による再試行を許可
      }
    };

    tryPush();

    const ro = new ResizeObserver(tryPush);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        padding: "8px 16px",
        background: "#070a14",
        borderTop: "1px solid #1a2535",
        flexShrink: 0,
      }}
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={AD_SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
