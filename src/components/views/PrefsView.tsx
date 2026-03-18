import React, { useState } from "react";
import { useStudio } from "../../contexts/StudioContext";
import { featureFlags } from "../../utils/featureFlags";
import { testByokKey, removeByokLocalKey } from "../../utils/byokLocal";
import { useCredits } from "../../hooks/useCredits";
import { useUserProfile } from "../../hooks/useUserProfile";
import type { AiMode } from "../../types";

const sectionLabel: React.CSSProperties = { fontSize: 11, letterSpacing: 2, color: "#4a6fa5", marginBottom: 10 };
const modeBtn = (active: boolean): React.CSSProperties => ({
  flex: 1, padding: "8px 4px",
  background: active ? "rgba(74,111,165,0.2)" : "transparent",
  border: "1px solid",
  borderColor: active ? "#4a6fa5" : "#1e2d42",
  color: active ? "#7ab3e0" : "#3a5570",
  cursor: "pointer", fontSize: 12, borderRadius: 4, fontFamily: "inherit",
});

export const PrefsView: React.FC = () => {
  const { editorSettings, setEditorSettings, aiMode, setAiMode, byokLocalKey, setByokLocalKey } = useStudio();
  const credits = useCredits();
  const profile = useUserProfile();

  const [byokInput, setByokInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "ok" | "error">("idle");
  const [testError, setTestError] = useState("");

  const hasAnyByok = featureFlags.byokLocal || featureFlags.byokCloud;
  const isStandard = aiMode === "standard";
  const atDailyLimit = credits && credits.dailyUsed >= credits.dailyLimit;

  async function handleTestByok() {
    const key = aiMode === "byok_local" ? byokLocalKey : byokInput;
    if (!key) return;
    setTestStatus("testing");
    setTestError("");
    try {
      await testByokKey(key);
      setTestStatus("ok");
    } catch (e) {
      setTestStatus("error");
      setTestError(e instanceof Error ? e.message : "接続テストに失敗しました");
    }
  }

  function handleSaveByokLocal() {
    setByokLocalKey(byokInput);
    setByokInput("");
    setTestStatus("idle");
  }

  function handleRemoveByokLocal() {
    removeByokLocalKey();
    setByokLocalKey("");
    setAiMode("standard");
    setTestStatus("idle");
  }

  return (
    <div style={{ padding: "24px 32px", overflowY: "auto" }}>
      <h2 style={{ margin: "0 0 24px", fontSize: 16, color: "#7ab3e0", fontWeight: 400, letterSpacing: 2 }}>環境設定</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 360 }}>

        {/* テキスト設定 */}
        <div>
          <div style={sectionLabel}>文字サイズ　<span style={{ color: "#c8d8e8", fontSize: 14 }}>{editorSettings.fontSize}px</span></div>
          <input type="range" min={12} max={24} value={editorSettings.fontSize} onChange={e => setEditorSettings(s => ({ ...s, fontSize: Number(e.target.value) }))} style={{ width: "100%" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#2a4060", marginTop: 4 }}><span>12px</span><span>24px</span></div>
        </div>
        <div>
          <div style={sectionLabel}>行間　<span style={{ color: "#c8d8e8", fontSize: 14 }}>{editorSettings.lineHeight}</span></div>
          <input type="range" min={1.4} max={3.0} step={0.1} value={editorSettings.lineHeight} onChange={e => setEditorSettings(s => ({ ...s, lineHeight: Number(e.target.value) }))} style={{ width: "100%" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#2a4060", marginTop: 4 }}><span>狭い 1.4</span><span>広い 3.0</span></div>
        </div>
        <div style={{ padding: "12px 16px", background: "#070a14", border: "1px solid #1a2535", borderRadius: 6 }}>
          <div style={{ fontSize: editorSettings.fontSize, lineHeight: editorSettings.lineHeight, color: "#8ab0cc", fontFamily: "'Noto Serif JP','Georgia',serif" }}>プレビュー：静かな朝、窓から差し込む光の中でペンを走らせた。</div>
        </div>
        <div>
          <div style={sectionLabel}>テーマ</div>
          <div style={{ display: "flex", gap: 8 }}>
            {(["focus", "dark", "light", "system"] as const).map(t => (
              <button key={t} onClick={() => setEditorSettings(s => ({ ...s, colorTheme: t }))} style={modeBtn((editorSettings.colorTheme ?? "focus") === t)}>
                {t === "focus" ? "集中" : t === "dark" ? "ダーク" : t === "light" ? "ライト" : "システム"}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 10, color: "#2a4060", marginTop: 6 }}>
            {(editorSettings.colorTheme ?? "focus") === "system" ? "OSの設定に従います" :
             (editorSettings.colorTheme ?? "focus") === "focus" ? "執筆に集中できる超ダークモード" :
             (editorSettings.colorTheme ?? "focus") === "dark" ? "システムUIが読みやすいダークモード" : ""}
          </div>
        </div>

        {/* AI設定 */}
        {hasAnyByok && (
          <div style={{ borderTop: "1px solid #1a2535", paddingTop: 20 }}>
            <div style={sectionLabel}>AI利用モード</div>

            {/* クレジット残量（standard モード時のみ表示）*/}
            {isStandard && credits && (
              <div style={{ padding: "8px 12px", background: "#070a14", border: "1px solid #1a2535", borderRadius: 6, marginBottom: 12, fontSize: 11, color: "#4a6fa5" }}>
                <div>今日: <span style={{ color: atDailyLimit ? "#c06060" : "#c8d8e8" }}>{credits.dailyUsed} / {credits.dailyLimit}</span></div>
                <div>今月: <span style={{ color: "#c8d8e8" }}>{credits.monthlyUsed} / {credits.monthlyLimit}</span></div>
                {atDailyLimit && (
                  <div style={{ marginTop: 6, color: "#c06060" }}>1日の上限に達しました。BYOKモードへの切り替えをご検討ください。</div>
                )}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
              <button onClick={() => setAiMode("standard")} style={modeBtn(aiMode === "standard")}>
                スタンダード（運営サーバー経由）
              </button>
              {featureFlags.byokLocal && (
                <button onClick={() => setAiMode("byok_local")} style={modeBtn(aiMode === "byok_local")}>
                  BYOK ローカル（端末保持）
                </button>
              )}
              {featureFlags.byokCloud && (
                <button onClick={() => setAiMode("byok_cloud")} style={modeBtn(aiMode === "byok_cloud")}>
                  BYOK クラウド（暗号化保存）
                </button>
              )}
            </div>
            <div style={{ fontSize: 10, color: "#2a4060", marginTop: 6 }}>
              {aiMode === "standard" && "運営のAPIキーを使用します。クレジットを消費します。"}
              {aiMode === "byok_local" && "自分のAPIキーを端末にのみ保存します。クレジットを消費しません。"}
              {aiMode === "byok_cloud" && "自分のAPIキーを暗号化してクラウドに保存します。複数端末で利用できます。"}
            </div>
          </div>
        )}

        {/* BYOK ローカルキー入力 */}
        {aiMode === "byok_local" && featureFlags.byokLocal && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={sectionLabel}>Anthropic APIキー</div>
            {byokLocalKey ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontSize: 11, color: "#4a6fa5" }}>設定済み（{"..." + byokLocalKey.slice(-4)}）</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={handleTestByok} disabled={testStatus === "testing"} style={{ ...modeBtn(false), flex: "none", padding: "6px 12px" }}>
                    {testStatus === "testing" ? "確認中..." : "接続テスト"}
                  </button>
                  <button onClick={handleRemoveByokLocal} style={{ ...modeBtn(false), flex: "none", padding: "6px 12px", color: "#a05050", borderColor: "#5a2030" }}>削除</button>
                </div>
                {testStatus === "ok" && <div style={{ fontSize: 10, color: "#5a9060" }}>接続成功</div>}
                {testStatus === "error" && <div style={{ fontSize: 10, color: "#c06060" }}>{testError}</div>}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", gap: 4 }}>
                  <input
                    type={showKey ? "text" : "password"}
                    value={byokInput}
                    onChange={e => setByokInput(e.target.value)}
                    placeholder="sk-ant-..."
                    style={{ flex: 1, padding: "6px 8px", background: "#070a14", border: "1px solid #1e2d42", borderRadius: 4, color: "#c8d8e8", fontSize: 12, fontFamily: "monospace" }}
                  />
                  <button onClick={() => setShowKey(v => !v)} style={{ ...modeBtn(false), flex: "none", padding: "6px 10px" }}>{showKey ? "隠す" : "表示"}</button>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={handleTestByok} disabled={!byokInput || testStatus === "testing"} style={{ ...modeBtn(false), flex: "none", padding: "6px 12px" }}>
                    {testStatus === "testing" ? "確認中..." : "接続テスト"}
                  </button>
                  <button onClick={handleSaveByokLocal} disabled={!byokInput || testStatus !== "ok"} style={{ ...modeBtn(testStatus === "ok"), flex: "none", padding: "6px 12px" }}>保存</button>
                </div>
                {testStatus === "ok" && <div style={{ fontSize: 10, color: "#5a9060" }}>接続成功。「保存」を押して確定してください。</div>}
                {testStatus === "error" && <div style={{ fontSize: 10, color: "#c06060" }}>{testError}</div>}
                <div style={{ fontSize: 10, color: "#2a4060" }}>このキーはこの端末にのみ保存されます。サーバーには送信・保存されません。</div>
              </div>
            )}
          </div>
        )}

        {/* BYOK クラウドキー UI */}
        {aiMode === "byok_cloud" && featureFlags.byokCloud && (
          <ByokCloudSection profile={profile} />
        )}

      </div>
    </div>
  );
};

function ByokCloudSection({ profile }: { profile: ReturnType<typeof useUserProfile> }) {
  const { user } = useStudio();
  const [cloudInput, setCloudInput] = useState("");
  const [showCloudKey, setShowCloudKey] = useState(false);
  const [cloudKeyHint, setCloudKeyHint] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "deleting" | "ok" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");

  // 初期ロード: key_hint 取得
  React.useEffect(() => {
    if (!user) return;
    import("../../supabase").then(({ supabase }) => {
      supabase.from("user_byok_key_hints").select("key_hint").eq("user_id", user.id).single()
        .then(({ data }) => { if (data?.key_hint) setCloudKeyHint(data.key_hint); });
    });
  }, [user]);

  async function getAuthHeader(): Promise<Record<string, string>> {
    const { supabase } = await import("../../supabase");
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    return token ? { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
  }

  async function handleSaveCloud() {
    if (!cloudInput) return;
    setStatus("saving");
    setErrMsg("");
    try {
      const headers = await getAuthHeader();
      const res = await fetch("/api/byok-save", { method: "POST", headers, body: JSON.stringify({ apiKey: cloudInput }) });
      const data = await res.json() as { keyHint?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "保存に失敗しました");
      setCloudKeyHint(data.keyHint ?? null);
      setCloudInput("");
      setStatus("ok");
    } catch (e) {
      setStatus("error");
      setErrMsg(e instanceof Error ? e.message : "エラーが発生しました");
    }
  }

  async function handleDeleteCloud() {
    setStatus("deleting");
    setErrMsg("");
    try {
      const headers = await getAuthHeader();
      const res = await fetch("/api/byok-delete", { method: "DELETE", headers });
      if (!res.ok) throw new Error("削除に失敗しました");
      setCloudKeyHint(null);
      setStatus("idle");
    } catch (e) {
      setStatus("error");
      setErrMsg(e instanceof Error ? e.message : "エラーが発生しました");
    }
  }

  void profile; // 将来的なPro判定に使用

  const sectionLabelStyle: React.CSSProperties = { fontSize: 11, letterSpacing: 2, color: "#4a6fa5", marginBottom: 10 };
  const btn = (active: boolean): React.CSSProperties => ({
    flex: "none", padding: "6px 12px",
    background: active ? "rgba(74,111,165,0.2)" : "transparent",
    border: "1px solid", borderColor: active ? "#4a6fa5" : "#1e2d42",
    color: active ? "#7ab3e0" : "#3a5570",
    cursor: "pointer", fontSize: 12, borderRadius: 4, fontFamily: "inherit",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={sectionLabelStyle}>Anthropic APIキー（クラウド保存）</div>
      {cloudKeyHint ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 11, color: "#4a6fa5" }}>登録済み（{cloudKeyHint}）</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={handleDeleteCloud} disabled={status === "deleting"} style={{ ...btn(false), color: "#a05050", borderColor: "#5a2030" }}>
              {status === "deleting" ? "削除中..." : "削除"}
            </button>
          </div>
          {status === "error" && <div style={{ fontSize: 10, color: "#c06060" }}>{errMsg}</div>}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", gap: 4 }}>
            <input
              type={showCloudKey ? "text" : "password"}
              value={cloudInput}
              onChange={e => setCloudInput(e.target.value)}
              placeholder="sk-ant-..."
              style={{ flex: 1, padding: "6px 8px", background: "#070a14", border: "1px solid #1e2d42", borderRadius: 4, color: "#c8d8e8", fontSize: 12, fontFamily: "monospace" }}
            />
            <button onClick={() => setShowCloudKey(v => !v)} style={btn(false)}>{showCloudKey ? "隠す" : "表示"}</button>
          </div>
          <button onClick={handleSaveCloud} disabled={!cloudInput || status === "saving"} style={btn(false)}>
            {status === "saving" ? "保存中..." : "暗号化して保存"}
          </button>
          {status === "ok" && <div style={{ fontSize: 10, color: "#5a9060" }}>保存しました</div>}
          {status === "error" && <div style={{ fontSize: 10, color: "#c06060" }}>{errMsg}</div>}
          <div style={{ fontSize: 10, color: "#2a4060" }}>キーはサーバー側でAES-256-GCM暗号化されます。登録後は内容を表示できません。</div>
        </div>
      )}
    </div>
  );
}
