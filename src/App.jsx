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

  const [activeTab, setActiveTab] = useState("monthly"); 
  const [claudeHtml, setClaudeHtml] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const [showMerchantModal, setShowMerchantModal] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState(null);
  const [merchantForm, setMerchantForm] = useState({
    name:"", region:"", address:"",
    naver_place_url:"", blog_keywords:"",
    instagram_hashtags:"", instagram_channel:"", youtube_keywords:"",
  });
  const [savingMerchant, setSavingMerchant] = useState(false);

  // 헤더 메모이제이션: token이 변경될 때만 업데이트
  const headers = useMemo(() => ({
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }), [token]);

  // ── 로그인 ──
  async function login(e) {
    e.preventDefault();
    setLoginLoading(true); setLoginErr("");
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
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

  // ── 가맹점 목록 (검은 화면 방지를 위한 401 예외처리 추가) ──
  useEffect(() => {
    if (!token) return;
    
    // headers 변수에 의존하기보다 여기서 직접 생성해서 안정성 확보
    const fetchHeaders = { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}` 
    };

    fetch(`${API_URL}/api/merchants`, { headers: fetchHeaders })
      .then(r => {
        if (r.status === 401) { logout(); throw new Error("인증 만료"); }
        return r.json();
      })
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setMerchants(list);
        if (list.length > 0 && !merchantId) setMerchantId(list[0].id);
      })
      .catch((err) => {
        console.error(err);
        setMsg("가맹점 목록을 불러오지 못했습니다.");
      });
  }, [token]);

  // ── 리포트 조회 ──
  const loadReport = useCallback(async (id = merchantId) => {
    if (!id || !token) return;
    setReportLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/reports/${id}?period=${encodeURIComponent(period)}`, { headers });
      const data = await res.json();
      setReport(data);
    } catch {
      setMsg("리포트 조회 실패");
    } finally {
      setReportLoading(false);
    }
  }, [merchantId, period, token, headers]);

  useEffect(() => { if (token && merchantId) loadReport(merchantId); }, [merchantId, period, token, loadReport]);

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
        const res = await fetch(`${API_URL}/api/crawl-jobs/${crawlJobId}`, { headers });
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
  }, [crawlJobId, crawlStatus, headers, loadReport, merchantId]);

  // ── 수집 시작 ──
  async function startCrawl() {
    if (!merchantId) return;
    setCrawlStatus("running"); setCrawlMessage("수집 작업 요청 중...");
    setCrawlStart(Date.now()); setCrawlElapsed(0); setCrawlJobId(null);
    try {
      const res = await fetch(`${API_URL}/api/crawl-jobs`, {
        method: "POST",
        headers,
        body: JSON.stringify({ merchant_id: merchantId, period }),
      });
      const job = await res.json();
      if (!res.ok) throw new Error(job.detail || "수집 요청 실패");
      setCrawlJobId(job.job_id);
      setCrawlMessage(job.message || "수집 중...");
    } catch (err) {
      setCrawlStatus("error"); setCrawlMessage("수집 요청 실패: " + err.message);
    }
  }

  // ── Claude 리포트 ──
  async function loadClaudeReport() {
    if (!merchantId) return;
    setActiveTab("claude");
    try {
      const res = await fetch(`${API_URL}/api/reports/${merchantId}/claude-report`, { headers });
      if (!res.ok) { setClaudeHtml("<p style='padding:24px;color:#f87171'>수집 완료 후 리포트가 생성됩니다.</p>"); return; }
      const html = await res.text();
      setClaudeHtml(html);
    } catch {
      setClaudeHtml("<p style='padding:24px;color:#f87171'>리포트 로딩 실패</p>");
    }
  }

  // ── 각종 다운로드 함수들 ──
  async function downloadPdf() {
    if (!merchantId) return;
    setPdfLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/reports/${merchantId}/pdf`, { headers });
      if (!res.ok) { setMsg("PDF 없음: 수집 완료 후 생성됩니다."); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${report?.merchant_name || merchantId}_리포트.pdf`;
      a.click(); URL.revokeObjectURL(url);
    } catch { setMsg("PDF 다운로드 실패"); }
    finally { setPdfLoading(false); }
  }

  async function downloadChatgptJson() {
    if (!merchantId) return;
    try {
      const res = await fetch(`${API_URL}/api/reports/${merchantId}/chatgpt-json`, { headers });
      if (!res.ok) { setMsg("JSON 없음: 수집 완료 후 생성됩니다."); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${report?.merchant_name || merchantId}_ChatGPT분석용.json`;
      a.click(); URL.revokeObjectURL(url);
    } catch { setMsg("JSON 다운로드 실패"); }
  }

  async function downloadExcel(type) {
    if (!merchantId) return;
    const labels = { raw: "원시데이터", daily: "일별집계", monthly: "월별집계" };
    try {
      const res = await fetch(`${API_URL}/api/reports/${merchantId}/excel/${type}`, { headers });
      if (!res.ok) { setMsg("수집 완료 후 엑셀이 생성됩니다."); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report?.merchant_name || merchantId}_${labels[type]}.xlsx`;
      a.click(); URL.revokeObjectURL(url);
    } catch { setMsg("엑셀 다운로드 실패"); }
  }

  // ── 가맹점 관리 핸들러 ──
  const openAddMerchant = () => {
    setEditingMerchant(null);
    setMerchantForm({
      name:"", region:"", address:"", naver_place_url:"", 
      blog_keywords:"", instagram_hashtags:"", instagram_channel:"", youtube_keywords:"",
    });
    setShowMerchantModal(true);
  };

  const openEditMerchant = (m) => {
    setEditingMerchant(m);
    setMerchantForm({
      name: m.name || "",
      region: m.region || "",
      address: m.address || "",
      naver_place_url: m.naver_place_url || "",
      blog_keywords: Array.isArray(m.blog_keywords) ? m.blog_keywords.join(", ") : "",
      instagram_hashtags: Array.isArray(m.instagram_hashtags) ? m.instagram_hashtags.join(", ") : "",
      instagram_channel: m.instagram_channel || "",
      youtube_keywords: Array.isArray(m.youtube_keywords) ? m.youtube_keywords.join(", ") : "",
    });
    setShowMerchantModal(true);
  };

  async function saveMerchant() {
    setSavingMerchant(true);
    const body = {
      ...merchantForm,
      blog_keywords: merchantForm.blog_keywords.split(",").map(s=>s.trim()).filter(Boolean),
      instagram_hashtags: merchantForm.instagram_hashtags.split(",").map(s=>s.trim()).filter(Boolean),
      youtube_keywords: merchantForm.youtube_keywords.split(",").map(s=>s.trim()).filter(Boolean),
    };
    try {
      const url = editingMerchant ? `${API_URL}/api/merchants/${editingMerchant.id}` : `${API_URL}/api/merchants`;
      const res = await fetch(url, {
        method: editingMerchant ? "PUT" : "POST",
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || "저장 실패"); }
      setMsg(editingMerchant ? "수정되었습니다." : "등록되었습니다.");
      setShowMerchantModal(false);
      // 목록 새로고침
      const r2 = await fetch(`${API_URL}/api/merchants`, { headers });
      setMerchants(await r2.json());
    } catch(err) { setMsg("저장 실패: " + err.message); }
    finally { setSavingMerchant(false); }
  }

  async function deleteMerchant(id) {
    if (!window.confirm("이 가맹점을 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`${API_URL}/api/merchants/${id}`, { method:"DELETE", headers });
      if (res.ok) {
        const newList = merchants.filter(m => m.id !== id);
        setMerchants(newList);
        if (merchantId === id) setMerchantId(newList[0]?.id || "");
        setMsg("삭제되었습니다.");
      }
    } catch { setMsg("삭제 실패"); }
  }

  // ── 렌더링 ──
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

  return (
    <div className="layout">
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

      <main>
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
          </div>
        </div>

        {crawlStatus !== "idle" && (
          <div className={`crawl-bar ${crawlStatus}`}>
            <span className="crawl-dot" />
            <span>{crawlMessage}</span>
            {crawlStatus === "running" && <span className="crawl-timer">{crawlElapsed}초 경과</span>}
          </div>
        )}

        {msg && <div className="msg-box" onClick={() => setMsg("")}>{msg} ✕</div>}

        <div className="kpi-grid">
          {[
            { label: "총 언급 수",       val: summary.total_mentions,        unit: "건", color: "#00d4ff" },
            { label: "영수증 리뷰",       val: summary.place_receipt_count,   unit: "건", color: "#00e5a0" },
            { label: "플레이스 블로그",   val: summary.place_blog_count,      unit: "건", color: "#ffd166" },
            { label: "네이버 블로그",     val: summary.naver_blog_count,      unit: "건", color: "#ff6b35" },
            { label: "인스타그램",           val: summary.instagram_count,        unit: "건", color: "#a78bfa" },
            { label: "유튜브 조회수",     val: summary.youtube_total_views,   unit: "회", color: "#f472b6" },
          ].map(k => (
            <div key={k.label} className="kpi-card">
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-val" style={{ color: k.color }}>{fmt(k.val)}</div>
              <div className="kpi-unit">{k.unit}</div>
            </div>
          ))}
        </div>

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
              </table>
            )}
          </div>
        )}

        {activeTab === "daily" && (
          <div className="panel">
            <div className="panel-title">일별 채널별 집계</div>
            {daily.length === 0 ? (
              <div className="empty-state">데이터가 없습니다.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>날짜</th><th>블로그</th><th>인스타</th><th>리뷰</th><th>합계</th>
                  </tr>
                </thead>
                <tbody>
                  {daily.map(r => (
                    <tr key={r.date}>
                      <td>{r.date}</td>
                      <td>{fmt(r.blog)}</td>
                      <td>{fmt(r.instagram)}</td>
                      <td>{fmt(r.place_receipt)}</td>
                      <td><strong>{fmt(r.total)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "claude" && (
          <div className="panel">
            {claudeHtml ? (
              <iframe srcDoc={claudeHtml} style={{ width: "100%", height: "800px", border: "none" }} title="AI Report" />
            ) : <div className="empty-state">리포트가 없습니다.</div>}
          </div>
        )}

        {activeTab === "chatgpt" && (
          <div className="panel">
            <button className="btn-primary" onClick={downloadChatgptJson} disabled={isSample}>JSON 다운로드</button>
          </div>
        )}
      </main>

      {showMerchantModal && (
        <div className="modal-backdrop" onClick={() => setShowMerchantModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-title">{editingMerchant ? "가맹점 수정" : "신규 가맹점 등록"}</div>
            <div className="modal-body">
              {Object.keys(merchantForm).map(field => (
                <div key={field} className="form-group">
                  <label>{field.replace(/_/g, ' ').toUpperCase()}</label>
                  <input
                    value={merchantForm[field]}
                    onChange={e => setMerchantForm(f => ({...f, [field]: e.target.value}))}
                  />
                </div>
              ))}
            </div>
            <div className="modal-footer">
              {editingMerchant && <button className="btn-danger" onClick={() => deleteMerchant(editingMerchant.id)}>삭제</button>}
              <button className="btn-outline" onClick={() => setShowMerchantModal(false)}>취소</button>
              <button className="btn-primary" onClick={saveMerchant} disabled={savingMerchant}>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
