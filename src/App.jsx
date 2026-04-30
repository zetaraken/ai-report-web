// src/App.jsx
import React, { useState } from "react";
import "./styles.css";

const API_URL = "https://web-production-a7ba9.up.railway.app";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [report, setReport] = useState(null);

  const startCrawl = async (merchantId) => {
    setLoading(true);
    setStatusMsg("분석 데이터 수집 중...");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${API_URL}/api/reports`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ merchant_id: merchantId }),
      });
      const { job_id } = await res.json();

      const timer = setInterval(async () => {
        const statusRes = await fetch(`${API_URL}/api/crawl-jobs/${job_id}`, {
          headers: { "Authorization": `Bearer ${token}` },
        });
        const job = await statusRes.json();

        if (job.status === "done") {
          clearInterval(timer);
          setReport(job.result);
          setLoading(false);
        } else {
          setStatusMsg(`진행 중... (${job.progress || 0}%)`);
        }
      }, 3000);
    } catch (err) {
      setLoading(false);
      alert("서버 통신 오류");
    }
  };

  if (!isLoggedIn) {
    // 로그인 폼 생략 (기존과 동일)
  }

  return (
    <div className="container">
      <header className="main-header">
        <div className="logo-area">
          <span className="badge">AI매출업</span>
          <h2>가맹점 분석 시스템</h2>
        </div>
        <button className="logout-btn" onClick={() => { localStorage.removeItem("token"); setIsLoggedIn(false); }}>로그아웃</button>
      </header>

      <main className="content">
        <section className="action-panel">
          <div className="card">
            <h3>분석 대상: 98도씨국밥 보라매점</h3>
            <p className="description">최근 리뷰 및 매출 트렌드를 분석하여 경영 리포트를 생성합니다.</p>
            <button onClick={() => startCrawl("98도씨국밥 보라매점")} disabled={loading} className="run-btn">
              {loading ? statusMsg : "리포트 생성 시작"}
            </button>
          </div>
        </section>

        {report && (
          <section className="report-panel">
            <div className="report-card">
              <div className="report-header">
                <h4>📊 분석 결과 리포트</h4>
                <span className="date">{new Date().toLocaleDateString()} 기준</span>
              </div>
              <div className="report-body">
                <div className="stat-item">
                  <span className="label">가맹점명</span>
                  <span className="value">{report.merchant_name}</span>
                </div>
                <div className="stat-item">
                  <span className="label">총 언급량(리뷰)</span>
                  <span className="value primary">{report.summary.total_mentions}건</span>
                </div>
                <div className="summary-box">
                  <p>위 데이터는 AI 분석을 통해 산출된 결과이며, 경영 전략 수립의 참고 자료로 활용하시기 바랍니다.</p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
