import React, { useState, useEffect } from "react";
import "./styles.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://web-production-2e3e7.up.railway.app";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [email, setEmail] = useState("zetarise@gmail.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [report, setReport] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("token", data.access_token);
      setIsLoggedIn(true);
    } else {
      alert("로그인 실패");
    }
  };

  const startCrawl = async (merchantId) => {
    setLoading(true);
    setStatusMsg("수집 요청 중...");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${API_BASE}/api/reports`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ merchant_id: merchantId }),
      });
      const { job_id } = await res.json();

      // 완료될 때까지 3초마다 체크 (Polling)
      const timer = setInterval(async () => {
        const statusRes = await fetch(`${API_BASE}/api/crawl-jobs/${job_id}`, {
          headers: { "Authorization": `Bearer ${token}` },
        });
        const job = await statusRes.json();

        if (job.status === "done") {
          clearInterval(timer);
          setReport(job.result);
          setLoading(false);
          setStatusMsg("수집 완료!");
        } else if (job.status === "error") {
          clearInterval(timer);
          setLoading(false);
          alert(job.message);
        } else {
          setStatusMsg(`데이터 수집 중... (${job.progress || 0}%)`);
        }
      }, 3000);
    } catch (err) {
      setLoading(false);
      alert("서버 연결 오류");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="loginWrap">
        <form className="loginCard" onSubmit={handleLogin}>
          <h1>AI매출업 로그인</h1>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호" />
          <button type="submit" className="primary">로그인</button>
        </form>
      </div>
    );
  }

  return (
    <div className="container">
      <header>
        <h2>경영진단 리포트 생성</h2>
        <button onClick={() => { localStorage.removeItem("token"); setIsLoggedIn(false); }}>로그아웃</button>
      </header>
      <main>
        <div className="panel">
          <button onClick={() => startCrawl("98도씨국밥 보라매점")} disabled={loading} className="primary">
            {loading ? statusMsg : "리포트 생성 시작"}
          </button>
        </div>
        {report && (
          <div className="panel report-view">
            <h3>{report.merchant_name} 분석 결과</h3>
            <p>총 언급량: {report.summary.total_mentions}건</p>
            {/* 추가 리포트 데이터 렌더링 */}
          </div>
        )}
      </main>
    </div>
  );
}