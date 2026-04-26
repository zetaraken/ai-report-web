import React, { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

function number(value) {
  if (value === null || value === undefined || value === "") return "-";
  return typeof value === "number" ? value.toLocaleString("ko-KR") : value;
}

const emptyReport = {
  merchant_name: "-",
  generated_at: "-",
  summary: {
    total_mentions: 0,
    naver_blog_count: 0,
    instagram_count: 0,
    place_receipt_count: 0,
    place_blog_count: 0,
    youtube_total_views: 0,
    ad_ratio: 0,
    self_ratio: 0,
  },
  monthly_summary: [],
  top_videos: [],
  insights: [],
};

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("admin_access_token") || "");
  const [email, setEmail] = useState(() => localStorage.getItem("admin_email") || "");
  const [login, setLogin] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [merchants, setMerchants] = useState([]);
  const [merchantId, setMerchantId] = useState("");
  const [period, setPeriod] = useState("최근 6개월");
  const [report, setReport] = useState(emptyReport);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const headers = useMemo(() => token ? { Authorization: `Bearer ${token}` } : {}, [token]);
  const selectedMerchant = merchants.find((m) => m.id === merchantId);

  async function handleLogin() {
    setLoginError("");
    if (!API_BASE) {
      setLoginError("API 서버 주소가 아직 설정되지 않았습니다.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(login),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      localStorage.setItem("admin_access_token", data.access_token);
      localStorage.setItem("admin_email", data.admin_email || login.email);
      setToken(data.access_token);
      setEmail(data.admin_email || login.email);
    } catch {
      setLoginError("로그인 실패: 이메일/비밀번호 또는 API 서버 상태를 확인하세요.");
    }
  }

  function logout() {
    localStorage.removeItem("admin_access_token");
    localStorage.removeItem("admin_email");
    setToken("");
    setEmail("");
    setMerchants([]);
    setMerchantId("");
    setReport(emptyReport);
  }

  async function loadMerchants() {
    if (!API_BASE) {
      setMessage("API 서버 주소가 아직 설정되지 않았습니다.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${API_BASE}/api/merchants`, { headers });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMerchants(data);
      if (data.length && !merchantId) setMerchantId(data[0].id);
    } catch {
      setMessage("가맹점 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function loadReport(id = merchantId) {
    if (!id) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${API_BASE}/api/reports/${id}?period=${encodeURIComponent(period)}`, { headers });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setReport(data);
      setMessage("리포트를 불러왔습니다.");
    } catch {
      setReport(emptyReport);
      setMessage("리포트가 없습니다. 먼저 수집을 실행하세요.");
    } finally {
      setLoading(false);
    }
  }

  async function runCrawl() {
    if (!merchantId) return;
    setLoading(true);
    setMessage("수집 작업을 시작합니다.");
    try {
      const res = await fetch(`${API_BASE}/api/crawl-jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ merchant_id: merchantId, period }),
      });
      if (!res.ok) throw new Error();
      const job = await res.json();
      setMessage(`수집 작업 생성 완료: ${job.id || "-"}`);
      setTimeout(() => loadReport(merchantId), 5000);
    } catch {
      setMessage("수집 작업 생성 실패: API/워커 연결 상태를 확인하세요.");
    } finally {
      setLoading(false);
    }
  }

  function downloadPdf() {
    if (!merchantId || !API_BASE) return;
    window.open(`${API_BASE}/api/reports/${merchantId}/pdf?period=${encodeURIComponent(period)}`, "_blank");
  }

  useEffect(() => {
    if (token) loadMerchants();
  }, [token]);

  useEffect(() => {
    if (merchantId) loadReport(merchantId);
  }, [merchantId]);

  if (!token) {
    return (
      <div className="loginWrap">
        <div className="loginCard">
          <div className="badge">먼키 · AI매출업</div>
          <h1>관리자 로그인</h1>
          <p>가맹점 소셜 빅데이터 분석 리포트 내부 관리자 화면입니다.</p>
          <label>이메일</label>
          <input value={login.email} onChange={(e)=>setLogin({...login,email:e.target.value})} placeholder="admin@monki.ai" />
          <label>비밀번호</label>
          <input type="password" value={login.password} onChange={(e)=>setLogin({...login,password:e.target.value})} onKeyDown={(e)=>{if(e.key==="Enter")handleLogin()}} placeholder="비밀번호" />
          {loginError && <div className="error">{loginError}</div>}
          <button className="primary" onClick={handleLogin}>로그인</button>
          <div className="hint">API 서버: {API_BASE || "미설정"}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="layout">
      <aside>
        <div className="logo">AI매출업</div>
        <nav>
          <button className="nav active">가맹점 리포트</button>
          <button className="nav">수집 실행</button>
          <button className="nav">PDF 다운로드</button>
        </nav>
      </aside>
      <main>
        <header>
          <div>
            <h1>가맹점 소셜 빅데이터 분석 리포트</h1>
            <p>네이버 플레이스, 블로그, 인스타그램, 유튜브 데이터를 통합 분석합니다.</p>
          </div>
          <div className="user">
            <span>{email}</span>
            <button onClick={logout}>로그아웃</button>
          </div>
        </header>
        <section className="panel controls">
          <div>
            <label>가맹점</label>
            <select value={merchantId} onChange={(e)=>setMerchantId(e.target.value)}>
              {merchants.length === 0 && <option value="">가맹점 없음</option>}
              {merchants.map((m)=><option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label>기간</label>
            <select value={period} onChange={(e)=>setPeriod(e.target.value)}>
              <option>최근 6개월</option>
              <option>최근 3개월</option>
              <option>최근 1개월</option>
            </select>
          </div>
          <div className="actions">
            <button className="primary" disabled={loading || !merchantId} onClick={runCrawl}>수집 시작</button>
            <button disabled={loading || !merchantId} onClick={()=>loadReport()}>리포트 새로고침</button>
            <button disabled={!merchantId} onClick={downloadPdf}>PDF</button>
          </div>
        </section>
        {message && <div className="msg">{message}</div>}
        <section className="titleBox">
          <div>
            <h2>{report.merchant_name} 리포트</h2>
            <p>생성 시각: {report.generated_at}</p>
          </div>
          <span>{selectedMerchant?.region || "-"}</span>
        </section>
        <section className="kpis">
          <Kpi title="전체 언급 수" value={report.summary.total_mentions}/>
          <Kpi title="네이버 블로그" value={report.summary.naver_blog_count}/>
          <Kpi title="인스타그램" value={report.summary.instagram_count}/>
          <Kpi title="영수증 리뷰" value={report.summary.place_receipt_count}/>
          <Kpi title="플레이스 블로그 리뷰" value={report.summary.place_blog_count}/>
          <Kpi title="유튜브 조회수" value={report.summary.youtube_total_views}/>
          <Kpi title="광고 비중" value={`${report.summary.ad_ratio || 0}%`}/>
          <Kpi title="내돈내산 비중" value={`${report.summary.self_ratio || 0}%`}/>
        </section>
        <section className="panel">
          <h3>월별 상세 데이터</h3>
          <table>
            <thead><tr><th>월</th><th>블로그</th><th>인스타</th><th>영수증</th><th>플레이스 블로그</th><th>유튜브</th><th>전체</th></tr></thead>
            <tbody>
              {report.monthly_summary.length === 0 && <tr><td colSpan="7">데이터가 없습니다.</td></tr>}
              {report.monthly_summary.map((r)=>(
                <tr key={r.month}>
                  <td>{r.month}</td><td>{number(r.blog_count)}</td><td>{number(r.instagram_count)}</td><td>{number(r.place_receipt_count)}</td><td>{number(r.place_blog_count)}</td><td>{number(r.youtube_count)}</td><td>{number(r.total_count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="grid2">
          <div className="panel">
            <h3>핵심 요약</h3>
            {report.insights.length === 0 ? <p className="empty">요약 데이터가 없습니다.</p> : <ul>{report.insights.map((x,i)=><li key={i}>{x}</li>)}</ul>}
          </div>
          <div className="panel">
            <h3>유튜브 TOP 콘텐츠</h3>
            {report.top_videos.length === 0 ? <p className="empty">유튜브 데이터가 없습니다.</p> : report.top_videos.map((v,i)=>(
              <div className="video" key={i}><b>{i+1}. {v.title}</b><span>{v.channel || "-"} · 조회수 {number(v.views)}</span></div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function Kpi({title,value}) {
  return <div className="kpi"><span>{title}</span><strong>{number(value)}</strong></div>;
}
