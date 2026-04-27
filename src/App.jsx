import { useEffect, useMemo, useState } from "react";
import "./styles.css";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.NEXT_PUBLIC_API_URL ||
  "https://web-production-2e3e7.up.railway.app";

const emptyReport = {
  merchant_name: "",
  region: "",
  generated_at: "",
  period_label: "",
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
  channel_share: [],
  top_videos: [],
  insights: [],
  source_status: {},
};

function formatNumber(value) {
  const num = Number(value || 0);
  return num.toLocaleString("ko-KR");
}

function getToken() {
  return localStorage.getItem("token") || "";
}

function setToken(token) {
  localStorage.setItem("token", token);
}

function clearToken() {
  localStorage.removeItem("token");
}

export default function App() {
  const [email, setEmail] = useState("zetarise@gmail.com");
  const [password, setPassword] = useState("");
  const [token, setTokenState] = useState(getToken());
  const [merchants, setMerchants] = useState([]);
  const [merchantId, setMerchantId] = useState("");
  const [period, setPeriod] = useState("최근 6개월");
  const [report, setReport] = useState(emptyReport);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // 수집 상태 전용
  const [crawlStatus, setCrawlStatus] = useState("idle"); // idle | running | success | error
  const [crawlMessage, setCrawlMessage] = useState("");
  const [crawlStartedAt, setCrawlStartedAt] = useState(null);
  const [crawlElapsed, setCrawlElapsed] = useState(0);

  const headers = useMemo(() => {
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }, [token]);

  useEffect(() => {
    if (!token) return;
    loadMerchants();
  }, [token]);

  useEffect(() => {
    if (!merchantId || !token) return;
    loadReport(merchantId);
  }, [merchantId, period, token]);

  useEffect(() => {
    if (crawlStatus !== "running" || !crawlStartedAt) return;

    const timer = setInterval(() => {
      setCrawlElapsed(Math.floor((Date.now() - crawlStartedAt) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [crawlStatus, crawlStartedAt]);

  async function login(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) throw new Error(`로그인 실패: HTTP ${res.status}`);

      const data = await res.json();
      const accessToken = data.access_token || data.token;

      if (!accessToken) throw new Error("로그인 응답에 토큰이 없습니다.");

      setToken(accessToken);
      setTokenState(accessToken);
      setMessage("로그인되었습니다.");
    } catch (err) {
      setMessage(`로그인 실패: ${err.message || "Failed to fetch"}`);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    clearToken();
    setTokenState("");
    setReport(emptyReport);
    setMerchants([]);
    setMerchantId("");
    setMessage("");
    setCrawlStatus("idle");
    setCrawlMessage("");
  }

  async function loadMerchants() {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_BASE}/api/merchants`, { headers });
      if (!res.ok) throw new Error(`가맹점 조회 실패: HTTP ${res.status}`);

      const data = await res.json();
      const list = Array.isArray(data) ? data : data.merchants || [];

      setMerchants(list);

      if (!merchantId && list.length > 0) {
        setMerchantId(list[0].id);
      }
    } catch (err) {
      setMessage(err.message || "가맹점 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function loadReport(id = merchantId) {
    if (!id) return;

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(
        `${API_BASE}/api/reports/${id}?period=${encodeURIComponent(period)}`,
        { headers }
      );

      if (!res.ok) throw new Error(`리포트 조회 실패: HTTP ${res.status}`);

      const data = await res.json();
      setReport(data || emptyReport);
      setMessage("리포트를 불러왔습니다.");
    } catch (err) {
      setReport(emptyReport);
      setMessage(err.message || "리포트가 없습니다. 먼저 수집을 실행하세요.");
    } finally {
      setLoading(false);
    }
  }

  async function runCrawl() {
    if (!merchantId || crawlStatus === "running") return;

    setCrawlStatus("running");
    setCrawlStartedAt(Date.now());
    setCrawlElapsed(0);
    setCrawlMessage("수집 중입니다. 네이버 플레이스/블로그/유튜브 데이터를 수집하고 있습니다.");
    setMessage("수집 작업을 시작합니다.");

    try {
      const res = await fetch(`${API_BASE}/api/crawl-jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ merchant_id: merchantId, period }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`수집 실패: HTTP ${res.status}${errText ? ` / ${errText}` : ""}`);
      }

      const data = await res.json().catch(() => ({}));

      setCrawlStatus("success");
      setCrawlMessage(
        data?.message ||
          "수집 완료되었습니다. 최신 리포트를 자동으로 다시 불러왔습니다."
      );
      setMessage("수집 완료되었습니다. 리포트를 새로고침했습니다.");

      // 수집 완료 후 자동 리포트 갱신
      await loadReport(merchantId);
    } catch (err) {
      setCrawlStatus("error");
      setCrawlMessage(err.message || "수집 중 오류가 발생했습니다.");
      setMessage(err.message || "수집 실패");
    }
  }

  async function downloadPdf() {
    if (!merchantId) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/reports/${merchantId}/pdf?period=${encodeURIComponent(period)}`,
        { headers }
      );

      if (!res.ok) throw new Error(`PDF 다운로드 실패: HTTP ${res.status}`);

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.merchant_name || "report"}_report.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setMessage(err.message || "PDF 다운로드 실패");
    }
  }

  if (!token) {
    return (
      <div className="login-page">
        <form className="login-card" onSubmit={login}>
          <div className="badge">먼키 · AI매출업</div>
          <h1>관리자 로그인</h1>
          <p>가맹점 소셜 빅데이터 분석 리포트 내부 관리자 화면입니다.</p>

          <label>이메일</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} />

          <label>비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {message && <div className="error-message">{message}</div>}

          <button type="submit" disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </button>

          <small>API 서버: {API_BASE}</small>
        </form>
      </div>
    );
  }

  const summary = report.summary || emptyReport.summary;
  const monthly = report.monthly_summary || [];
  const topVideos = report.top_videos || [];
  const insights = report.insights || [];
  const sourceStatus = report.source_status || {};

  return (
    <div className="app">
      <aside>
        <h2>AI매출업</h2>
        <nav>
          <button className="active">가맹점 리포트</button>
          <button>수집 실행</button>
          <button>PDF 다운로드</button>
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
            <select
              value={merchantId}
              disabled={crawlStatus === "running"}
              onChange={(e) => setMerchantId(e.target.value)}
            >
              {merchants.length === 0 && <option value="">가맹점 없음</option>}
              {merchants.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>기간</label>
            <select
              value={period}
              disabled={crawlStatus === "running"}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option>최근 1개월</option>
              <option>최근 3개월</option>
              <option>최근 6개월</option>
              <option>최근 1년</option>
            </select>
          </div>

          <div className="actions">
            <button
              className="primary"
              disabled={loading || !merchantId || crawlStatus === "running"}
              onClick={runCrawl}
            >
              {crawlStatus === "running" ? `수집 중... ${crawlElapsed}s` : "수집 시작"}
            </button>

            <button
              disabled={loading || !merchantId || crawlStatus === "running"}
              onClick={() => loadReport()}
            >
              리포트 새로고침
            </button>

            <button disabled={!merchantId || crawlStatus === "running"} onClick={downloadPdf}>
              PDF
            </button>
          </div>
        </section>

        {message && <div className="message">{message}</div>}

        {crawlStatus !== "idle" && (
          <section className={`crawl-status ${crawlStatus}`}>
            <div>
              <strong>
                {crawlStatus === "running" && "수집 진행 중"}
                {crawlStatus === "success" && "수집 완료"}
                {crawlStatus === "error" && "수집 실패"}
              </strong>
              <p>{crawlMessage}</p>
            </div>
            {crawlStatus === "running" && (
              <div className="progress-wrap">
                <div className="progress-bar">
                  <span />
                </div>
                <small>경과 시간: {crawlElapsed}초</small>
              </div>
            )}
          </section>
        )}

        <section className="report-header">
          <div>
            <h2>{report.merchant_name || "리포트"}</h2>
            <p className="report-period">분석 기간: {report.period_label || period}</p>
            <p>생성 시각: {report.generated_at || "-"}</p>
          </div>
          <span>{report.region || "-"}</span>
        </section>

        <section className="cards">
          <div className="card">
            <span>전체 언급 수</span>
            <strong>{formatNumber(summary.total_mentions)}</strong>
          </div>
          <div className="card">
            <span>네이버 블로그</span>
            <strong>{formatNumber(summary.naver_blog_count)}</strong>
          </div>
          <div className="card">
            <span>인스타그램</span>
            <strong>{formatNumber(summary.instagram_count)}</strong>
          </div>
          <div className="card">
            <span>영수증 리뷰</span>
            <strong>{formatNumber(summary.place_receipt_count)}</strong>
          </div>
          <div className="card">
            <span>플레이스 블로그 리뷰</span>
            <strong>{formatNumber(summary.place_blog_count)}</strong>
          </div>
          <div className="card">
            <span>유튜브 조회수</span>
            <strong>{formatNumber(summary.youtube_total_views)}</strong>
          </div>
          <div className="card">
            <span>광고 비중</span>
            <strong>{formatNumber(summary.ad_ratio)}%</strong>
          </div>
          <div className="card">
            <span>내돈내산 비중</span>
            <strong>{formatNumber(summary.self_ratio)}%</strong>
          </div>
        </section>

        <section className="panel">
          <h3>월별 상세 데이터</h3>
          <table>
            <thead>
              <tr>
                <th>월</th>
                <th>블로그</th>
                <th>인스타</th>
                <th>영수증</th>
                <th>플레이스 블로그</th>
                <th>유튜브</th>
                <th>전체</th>
              </tr>
            </thead>
            <tbody>
              {monthly.map((row) => (
                <tr key={row.month || row.month_key}>
                  <td>{row.month}</td>
                  <td>{formatNumber(row.blog_count)}</td>
                  <td>{formatNumber(row.instagram_count)}</td>
                  <td>{formatNumber(row.place_receipt_count)}</td>
                  <td>{formatNumber(row.place_blog_count)}</td>
                  <td>{formatNumber(row.youtube_count)}</td>
                  <td>{formatNumber(row.total_count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="bottom-grid">
          <div className="panel">
            <h3>핵심 요약</h3>
            <ul>
              {insights.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="panel">
            <h3>유튜브 TOP 콘텐츠</h3>
            <div className="video-list">
              {topVideos.map((video, index) => (
                <div className="video" key={`${video.title}-${index}`}>
                  <strong>
                    {index + 1}. {video.title}
                  </strong>
                  <span>
                    {video.channel || "YouTube"} · 조회수 {formatNumber(video.views)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {Object.keys(sourceStatus).length > 0 && (
          <section className="panel source-status">
            <h3>수집 상태</h3>
            <table>
              <thead>
                <tr>
                  <th>채널</th>
                  <th>상태</th>
                  <th>상세</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(sourceStatus).map(([key, value]) => (
                  <tr key={key}>
                    <td>{key}</td>
                    <td>{value?.status || "-"}</td>
                    <td>{value?.reason || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </main>
    </div>
  );
}
