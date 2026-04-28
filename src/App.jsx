import { useEffect, useMemo, useState, useCallback } from "react";
import "./styles.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://web-production-a7ba9.up.railway.app";

const PERIODS = ["최근 1개월", "최근 3개월", "최근 6개월", "최근 1년"];

function fmt(v) { return Number(v || 0).toLocaleString("ko-KR"); }
function getToken() { return localStorage.getItem("ai_token") || ""; }
function saveToken(t) { localStorage.setItem("ai_token", t); }
function clearToken() { localStorage.removeItem("ai_token"); }

export default function App() {
  const [token, setToken]       = useState(getToken());
  const [email, setEmail]       = useState("zetarise@gmail.com");
  const [password, setPassword] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [merchants, setMerchants]     = useState([]);
  const [merchantId, setMerchantId]   = useState("");
  const [period, setPeriod]           = useState("최근 6개월");
  const [report, setReport]           = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  const [crawlStatus, setCrawlStatus]   = useState("idle");
  const [crawlMessage, setCrawlMessage] = useState("");
  const [crawlJobId, setCrawlJobId]     = useState(null);
  const [crawlElapsed, setCrawlElapsed] = useState(0);
  const [crawlStart, setCrawlStart]     = useState(null);

  const [activeTab, setActiveTab] = useState("monthly"); // monthly | daily | claude | chatgpt
  const [claudeHtml, setClaudeHtml] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // 가맹점 관리 모달
  const [showMerchantModal, setShowMerchantModal] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState(null);
  const [merchantForm, setMerchantForm] = useState({
    name:"", region:"", address:"",
    naver_place_url:"", blog_keywords:"",
    instagram_hashtags:"", instagram_channel:"", youtube_keywords:"",
  });
  const [savingMerchant, setSavingMerchant] = useState(false);

  const headers = useMemo(() => token ? { Authorization: `Bearer ${token}` } : {}, [token]);

  // ── 로그인 ──
  async function login(e) {
    e.preventDefault();
    setLoginLoading(true); setLoginErr("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "로그인 실패");
      saveToken(data.access_token);
      setToken(data.access_token);
    } catch (err) {
      setLoginErr(err.message);
    } finally {
      setLoginLoading(false);
    }
  }

  function logout() {
    clearToken(); setToken(""); setMerchants([]); setMerchantId(""); setReport(null);
    setCrawlStatus("idle"); setCrawlMessage("");
  }

  // ── 가맹점 목록 ──
  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/merchants`, { headers })
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setMerchants(list);
        if (list.length > 0 && !merchantId) setMerchantId(list[0].id);
      })
      .catch(() => setMsg("가맹점 목록 조회 실패"));
  }, [token]);

  // ── 리포트 조회 ──
  const loadReport = useCallback(async (id = merchantId) => {
    if (!id || !token) return;
    setReportLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/reports/${id}?period=${encodeURIComponent(period)}`, { headers });
      const data = await res.json();
      setReport(data);
    } catch {
      setMsg("리포트 조회 실패");
    } finally {
      setReportLoading(false);
    }
  }, [merchantId, period, token, headers]);

  useEffect(() => { if (token && merchantId) loadReport(merchantId); }, [merchantId, period, token]);

  // ── 수집 진행 타이머 ──
  useEffect(() => {
    if (crawlStatus !== "running" || !crawlStart) return;
    const t = setInterval(() => setCrawlElapsed(Math.floor((Date.now() - crawlStart) / 1000)), 1000);
    return () => clearInterval(t);
  }, [crawlStatus, crawlStart]);

  // ── 수집 상태 폴링 ──
  useEffect(() => {
    if (!crawlJobId || crawlStatus !== "running") return;
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/crawl-jobs/${crawlJobId}`, { headers });
        const job = await res.json();
        setCrawlMessage(job.message || "");
        if (["success", "warning", "timeout", "error"].includes(job.status)) {
          setCrawlStatus(job.status);
          clearInterval(poll);
          if (job.status === "success" || job.status === "warning") {
            await loadReport(merchantId);
          }
        }
      } catch { clearInterval(poll); }
    }, 2000);
    return () => clearInterval(poll);
  }, [crawlJobId, crawlStatus, headers]);

  // ── 수집 시작 ──
  async function startCrawl() {
    if (!merchantId) return;
    setCrawlStatus("running"); setCrawlMessage("수집 작업 요청 중...");
    setCrawlStart(Date.now()); setCrawlElapsed(0); setCrawlJobId(null);
    try {
      const res = await fetch(`${API_BASE}/api/crawl-jobs`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ merchant_id: merchantId, period }),
      });
      const job = await res.json();
      setCrawlJobId(job.job_id);
      setCrawlMessage(job.message || "수집 중...");
    } catch (err) {
      setCrawlStatus("error"); setCrawlMessage("수집 요청 실패: " + err.message);
    }
  }

  // ── Claude 리포트 보기 ──
  async function loadClaudeReport() {
    if (!merchantId) return;
    setActiveTab("claude");
    try {
      const res = await fetch(`${API_BASE}/api/reports/${merchantId}/claude-report`, { headers });
      if (!res.ok) { setClaudeHtml("<p style='padding:24px;color:#f87171'>수집 완료 후 리포트가 생성됩니다.</p>"); return; }
      const html = await res.text();
      setClaudeHtml(html);
    } catch {
      setClaudeHtml("<p style='padding:24px;color:#f87171'>리포트 로딩 실패</p>");
    }
  }

  // ── PDF 다운로드 ──
  async function downloadPdf() {
    if (!merchantId) return;
    setPdfLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/reports/${merchantId}/pdf`, { headers });
      if (!res.ok) { setMsg("PDF 없음: 수집 완료 후 생성됩니다."); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${report?.merchant_name || merchantId}_리포트.pdf`;
      a.click(); URL.revokeObjectURL(url);
    } catch { setMsg("PDF 다운로드 실패"); }
    finally { setPdfLoading(false); }
  }

  // ── ChatGPT JSON 다운로드 ──
  async function downloadChatgptJson() {
    if (!merchantId) return;
    try {
      const res = await fetch(`${API_BASE}/api/reports/${merchantId}/chatgpt-json`, { headers });
      if (!res.ok) { setMsg("JSON 없음: 수집 완료 후 생성됩니다."); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${report?.merchant_name || merchantId}_ChatGPT분석용.json`;
      a.click(); URL.revokeObjectURL(url);
    } catch { setMsg("JSON 다운로드 실패"); }
  }


  // ── 엑셀 다운로드 3종 ──
  async function downloadExcel(type) {
    if (!merchantId) return;
    const labels = { raw: "원시데이터", daily: "일별집계", monthly: "월별집계" };
    try {
      const res = await fetch(`${API_BASE}/api/reports/${merchantId}/excel/${type}`, { headers });
      if (!res.ok) { setMsg("수집 완료 후 엑셀이 생성됩니다."); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report?.merchant_name || merchantId}_${labels[type]}.xlsx`;
      a.click(); URL.revokeObjectURL(url);
    } catch { setMsg("엑셀 다운로드 실패"); }
  }

  // ── 가맹점 모달 열기 ──
  function openAddMerchant() {
    setEditingMerchant(null);
    setMerchantForm({ name:"", region:"", address:"", naver_place_url:"",
      blog_keywords:"", instagram_hashtags:"", instagram_channel:"", youtube_keywords:"" });
    setShowMerchantModal(true);
  }

  function openEditMerchant(m) {
    setEditingMerchant(m);
    setMerchantForm({
      name: m.name, region: m.region || "", address: m.address || "",
      naver_place_url: m.naver_place_url || "",
      blog_keywords: (m.blog_keywords || []).join(", "),
      instagram_hashtags: (m.instagram_hashtags || []).join(", "),
      instagram_channel: m.instagram_channel || "",
      youtube_keywords: (m.youtube_keywords || []).join(", "),
    });
    setShowMerchantModal(true);
  }

  async function saveMerchant() {
    setSavingMerchant(true);
    const body = {
      ...merchantForm,
      blog_keywords: merchantForm.blog_keywords.split(",").map(s=>s.trim()).filter(Boolean),
      instagram_hashtags: merchantForm.instagram_hashtags.split(",").map(s=>s.trim()).filter(Boolean),
      youtube_keywords: merchantForm.youtube_keywords.split(",").map(s=>s.trim()).filter(Boolean),
    };
    try {
      const url = editingMerchant
        ? `${API_BASE}/api/merchants/${editingMerchant.id}`
        : `${API_BASE}/api/merchants`;
      const res = await fetch(url, {
        method: editingMerchant ? "PUT" : "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "저장 실패");
      setMsg(editingMerchant ? "가맹점 정보가 수정되었습니다." : "가맹점이 등록되었습니다.");
      setShowMerchantModal(false);
      // 가맹점 목록 새로고침
      const r2 = await fetch(`${API_BASE}/api/merchants`, { headers });
      setMerchants(await r2.json());
    } catch(err) { setMsg("저장 실패: " + err.message); }
    finally { setSavingMerchant(false); }
  }

  async function deleteMerchant(id) {
    if (!window.confirm("이 가맹점을 삭제하시겠습니까?")) return;
    const res = await fetch(`${API_BASE}/api/merchants/${id}`, { method:"DELETE", headers });
    if (res.ok) {
      setMerchants(merchants.filter(m => m.id !== id));
      if (merchantId === id) setMerchantId(merchants[0]?.id || "");
      setMsg("삭제되었습니다.");
    }
  }

  // ── 로그인 화면 ──
  if (!token) {
    return (
      <div className="login-wrap">
        <div className="login-card">
          <div className="brand-badge">AI매출업</div>
          <h1>가맹점 분석 시스템</h1>
          <p>먼키 · AI매출업 관리자 전용</p>
          {loginErr && <div className="err-box">{loginErr}</div>}
          <form onSubmit={login}>
            <label>이메일</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            <label>비밀번호</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="submit" className="btn-primary" disabled={loginLoading}>
              {loginLoading ? "로그인 중..." : "로그인"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const monthly = report?.monthly_summary || [];
  const daily   = report?.daily_summary || [];
  const summary = report?.summary || {};
  const isSample = report?.is_sample;

  // ── 메인 대시보드 ──
  return (
    <div className="layout">
      {/* 사이드바 */}
      <aside>
        <div className="logo">AI매출업</div>
        <div className="logo-sub">가맹점 분석 시스템</div>
        <nav>
          {merchants.map(m => (
            <div key={m.id} className="nav-item-wrap">
              <button className={`nav-item ${merchantId === m.id ? "active" : ""}`}
                onClick={() => { setMerchantId(m.id); setActiveTab("monthly"); }}>
                {m.name}
                <span className="nav-region">{m.region}</span>
              </button>
              {merchantId === m.id && (
                <button className="nav-edit-btn" onClick={() => openEditMerchant(m)} title="편집">✎</button>
              )}
            </div>
          ))}
        </nav>
        <button className="btn-add-merchant" onClick={openAddMerchant}>+ 가맹점 추가</button>
        <button className="btn-logout" onClick={logout}>로그아웃</button>
      </aside>

      {/* 메인 */}
      <main>
        {/* 헤더 */}
        <div className="main-header">
          <div>
            <h1>{report?.merchant_name || "가맹점 선택"}</h1>
            <p>{report?.region} {isSample && <span className="sample-badge">샘플 데이터</span>}</p>
          </div>
          <div className="header-controls">
            <select value={period} onChange={e => setPeriod(e.target.value)}>
              {PERIODS.map(p => <option key={p}>{p}</option>)}
            </select>
            <button className="btn-primary" onClick={startCrawl} disabled={crawlStatus === "running" || !merchantId}>
              {crawlStatus === "running" ? `수집 중... ${crawlElapsed}초` : "📡 수집 시작"}
            </button>
            <div className="dropdown-wrap">
              <button className="btn-outline">📊 엑셀 다운로드 ▾</button>
              <div className="dropdown-menu">
                <button onClick={() => downloadExcel("raw")} disabled={isSample}>① 원시 데이터 엑셀</button>
                <button onClick={() => downloadExcel("daily")} disabled={isSample}>② 일별 집계 엑셀</button>
                <button onClick={() => downloadExcel("monthly")} disabled={isSample}>③ 월별 집계 엑셀</button>
              </div>
            </div>
            <button className="btn-outline" onClick={downloadPdf} disabled={pdfLoading || isSample}>
              {pdfLoading ? "생성 중..." : "📄 PDF 다운로드"}
            </button>
          </div>
        </div>

        {/* 수집 상태 바 */}
        {crawlStatus !== "idle" && (
          <div className={`crawl-bar ${crawlStatus}`}>
            <span className="crawl-dot" />
            <span>{crawlMessage}</span>
            {crawlStatus === "running" && <span className="crawl-timer">{crawlElapsed}초 경과</span>}
          </div>
        )}

        {/* 메시지 */}
        {msg && <div className="msg-box" onClick={() => setMsg("")}>{msg} ✕</div>}

        {/* KPI 카드 */}
        <div className="kpi-grid">
          {[
            { label: "총 언급 수",       val: summary.total_mentions,        unit: "건", color: "#00d4ff" },
            { label: "영수증 리뷰",       val: summary.place_receipt_count,   unit: "건", color: "#00e5a0" },
            { label: "플레이스 블로그",   val: summary.place_blog_count,      unit: "건", color: "#ffd166" },
            { label: "네이버 블로그",     val: summary.naver_blog_count,      unit: "건", color: "#ff6b35" },
            { label: "인스타그램",        val: summary.instagram_count,       unit: "건", color: "#a78bfa" },
            { label: "유튜브 조회수",     val: summary.youtube_total_views,   unit: "회", color: "#f472b6" },
          ].map(k => (
            <div key={k.label} className="kpi-card">
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-val" style={{ color: k.color }}>{fmt(k.val)}</div>
              <div className="kpi-unit">{k.unit}</div>
            </div>
          ))}
        </div>

        {/* 탭 */}
        <div className="tab-bar">
          {[
            { id: "monthly", label: "📊 월별 집계" },
            { id: "daily",   label: "📅 일별 집계" },
            { id: "claude",  label: "🧠 AI 분석 리포트" },
            { id: "chatgpt", label: "🤖 ChatGPT 연동" },
          ].map(t => (
            <button key={t.id}
              className={`tab-btn ${activeTab === t.id ? "active" : ""}`}
              onClick={() => { setActiveTab(t.id); if (t.id === "claude") loadClaudeReport(); }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── 월별 집계 탭 ── */}
        {activeTab === "monthly" && (
          <div className="panel">
            <div className="panel-title">월별 채널별 집계</div>
            {reportLoading ? <div className="loading">불러오는 중...</div> : (
              <table>
                <thead>
                  <tr>
                    <th>월</th><th>네이버 블로그</th><th>인스타그램</th>
                    <th>영수증 리뷰</th><th>플레이스 블로그</th><th>유튜브</th><th>합계</th>
                  </tr>
                </thead>
                <tbody>
                  {monthly.map(r => (
                    <tr key={r.month_key}>
                      <td>{r.month}</td>
                      <td>{fmt(r.blog_count)}</td>
                      <td>{fmt(r.instagram_count)}</td>
                      <td>{fmt(r.place_receipt_count)}</td>
                      <td>{fmt(r.place_blog_count)}</td>
                      <td>{fmt(r.youtube_count)}</td>
                      <td><strong>{fmt(r.total_count)}</strong></td>
                    </tr>
                  ))}
                  {monthly.length === 0 && <tr><td colSpan={7} className="empty">데이터 없음</td></tr>}
                </tbody>
                {monthly.length > 0 && (
                  <tfoot>
                    <tr className="total-row">
                      <td>합계</td>
                      {["blog_count","instagram_count","place_receipt_count","place_blog_count","youtube_count","total_count"]
                        .map(k => <td key={k}><strong>{fmt(monthly.reduce((s,r)=>s+(r[k]||0),0))}</strong></td>)}
                    </tr>
                  </tfoot>
                )}
              </table>
            )}
          </div>
        )}

        {/* ── 일별 집계 탭 ── */}
        {activeTab === "daily" && (
          <div className="panel">
            <div className="panel-title">일별 채널별 집계 <span className="panel-note">(작성일 기준)</span></div>
            {daily.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📅</div>
                <div>수집 완료 후 일별 데이터가 표시됩니다.</div>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>날짜</th><th>블로그</th><th>인스타</th>
                    <th>영수증 리뷰</th><th>플레이스 블로그</th><th>유튜브</th><th>합계</th><th>누적</th>
                  </tr>
                </thead>
                <tbody>
                  {daily.map(r => (
                    <tr key={r.date}>
                      <td>{r.date}</td>
                      <td>{fmt(r.blog)}</td>
                      <td>{fmt(r.instagram)}</td>
                      <td>{fmt(r.place_receipt)}</td>
                      <td>{fmt(r.place_blog)}</td>
                      <td>{fmt(r.youtube)}</td>
                      <td><strong>{fmt(r.total)}</strong></td>
                      <td className="cumulative">{fmt(r.cumulative)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Claude AI 분석 리포트 탭 ── */}
        {activeTab === "claude" && (
          <div className="panel">
            <div className="panel-title-row">
              <div className="panel-title">🧠 Claude AI 자체분석 리포트</div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button className="btn-outline" onClick={loadClaudeReport}>🔄 새로 고침</button>
                <button className="btn-primary" onClick={downloadPdf} disabled={pdfLoading || isSample}>
                  {pdfLoading ? "생성 중..." : "📄 PDF 다운로드"}
                </button>
              </div>
            </div>
            {claudeHtml ? (
              <iframe
                srcDoc={claudeHtml}
                style={{ width: "100%", height: "800px", border: "none", borderRadius: "8px" }}
                title="Claude 분석 리포트"
              />
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🧠</div>
                <div>수집 완료 후 Claude AI가 자동으로 분석 리포트를 생성합니다.</div>
                <div style={{ marginTop: "8px", fontSize: "12px", color: "#5a6278" }}>
                  ANTHROPIC_API_KEY 환경변수 설정 필요
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ChatGPT 연동 탭 ── */}
        {activeTab === "chatgpt" && (
          <div className="panel">
            <div className="panel-title">🤖 ChatGPT 분석용 JSON</div>
            <div className="chatgpt-desc">
              아래 JSON 파일을 다운로드하여 ChatGPT에 업로드하면, 분석 프롬프트가 자동으로 포함되어 있어 바로 리포트 생성이 가능합니다.
            </div>
            <button className="btn-primary btn-large" onClick={downloadChatgptJson} disabled={isSample}>
              📥 ChatGPT 분석용 JSON 다운로드
            </button>
            {report?.chatgpt_payload?.auto_prompt && (
              <div className="prompt-preview">
                <div className="prompt-label">자동 생성된 분석 프롬프트</div>
                <div className="prompt-text">{report.chatgpt_payload.auto_prompt}</div>
                <button className="btn-copy" onClick={() => {
                  navigator.clipboard.writeText(report.chatgpt_payload.auto_prompt);
                  setMsg("프롬프트가 클립보드에 복사되었습니다.");
                }}>📋 프롬프트 복사</button>
              </div>
            )}
            <div className="chatgpt-steps">
              <div className="step"><span className="step-num">1</span> 위 버튼으로 JSON 파일 다운로드</div>
              <div className="step"><span className="step-num">2</span> ChatGPT 대화창에 파일 첨부</div>
              <div className="step"><span className="step-num">3</span> 프롬프트 복사 후 붙여넣기</div>
              <div className="step"><span className="step-num">4</span> 가맹점 분석 리포트 자동 생성</div>
            </div>
          </div>
        )}

        {/* 유튜브 TOP 영상 */}
        {report?.top_videos?.length > 0 && activeTab === "monthly" && (
          <div className="panel">
            <div className="panel-title">🎬 유튜브 TOP 영상</div>
            {report.top_videos.map((v, i) => (
              <div key={i} className="video-card">
                <div className="video-rank">#{i+1}</div>
                <div className="video-info">
                  <div className="video-title">{v.title}</div>
                  <div className="video-meta">{v.channel} · {v.published}</div>
                </div>
                <div className="video-views">{fmt(v.views)}<span>회</span></div>
              </div>
            ))}
          </div>
        )}

        {/* 데이터 출처 */}
        {report?.source_status && activeTab === "monthly" && (
          <div className="panel source-panel">
            <div className="panel-title">📡 수집 상태</div>
            {Object.entries(report.source_status).map(([k, v]) => (
              <div key={k} className="source-row">
                <span className="source-key">{k}</span>
                <span className={`source-status ${typeof v === 'object' ? (v.status || 'ok') : 'ok'}`}>
                  {typeof v === 'object' ? (v.status || '') : ''}
                </span>
                <span className="source-note">
                  {typeof v === 'object' ? (v.count !== undefined ? `${v.count}건` : v.note || '') : String(v)}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── 가맹점 추가/편집 모달 ── */}
      {showMerchantModal && (
        <div className="modal-backdrop" onClick={() => setShowMerchantModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-title">{editingMerchant ? "가맹점 정보 수정" : "신규 가맹점 등록"}</div>
            <div className="modal-body">
              {[
                ["name", "매장명 *", "예: 배포차"],
                ["region", "지역", "예: 서울 강남구"],
                ["address", "주소", "예: 서울 강남구 도산대로1길 16"],
                ["naver_place_url", "네이버 플레이스 URL", "https://naver.me/..."],
                ["blog_keywords", "블로그 검색 키워드 (쉼표 구분)", "예: 신사역 배포차, 신사동 배포차"],
                ["instagram_hashtags", "인스타 해시태그 (쉼표 구분)", "예: 배포차, 신사맛집"],
                ["instagram_channel", "인스타 공식 계정", "예: bae_po_cha"],
                ["youtube_keywords", "유튜브 검색 키워드 (쉼표 구분)", "예: 신사역 배포차"],
              ].map(([field, label, placeholder]) => (
                <div key={field} className="form-group">
                  <label>{label}</label>
                  <input
                    value={merchantForm[field]}
                    placeholder={placeholder}
                    onChange={e => setMerchantForm(f => ({...f, [field]: e.target.value}))}
                  />
                </div>
              ))}
            </div>
            <div className="modal-footer">
              {editingMerchant && (
                <button className="btn-danger" onClick={() => { deleteMerchant(editingMerchant.id); setShowMerchantModal(false); }}>
                  삭제
                </button>
              )}
              <button className="btn-outline" onClick={() => setShowMerchantModal(false)}>취소</button>
              <button className="btn-primary" onClick={saveMerchant} disabled={savingMerchant || !merchantForm.name}>
                {savingMerchant ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
