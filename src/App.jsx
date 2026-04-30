import React, { useState } from "react";
import "./styles.css";

// 백엔드 Railway 주소 확인 (사용자님의 실제 주소로 유지)
const API_URL = "https://web-production-a7ba9.up.railway.app";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [email, setEmail] = useState("zetarise@gmail.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [report, setReport] = useState(null);
  const [selectedMerchant, setSelectedMerchant] = useState("순자매감자탕");

  // 로그인 처리 함수
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("token", data.access_token);
        setIsLoggedIn(true);
      } else {
        alert("로그인 정보가 올바르지 않습니다.");
      }
    } catch (err) {
      alert("서버 연결 오류");
    }
  };

  // 실제 크롤링 실행 함수
  const handleStartCrawl = async () => {
    setLoading(true);
    setStatusMsg("데이터 수집 요청 중...");
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_URL}/api/reports`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ merchant_id: selectedMerchant }),
      });

      const { job_id } = await response.json();

      const checkStatus = setInterval(async () => {
        const statusRes = await fetch(`${API_URL}/api/crawl-jobs/${job_id}`, {
          headers: { "Authorization": `Bearer ${token}` },
        });
        const job = await statusRes.json();

        if (job.status === "done") {
          clearInterval(checkStatus);
          setReport(job.result);
          setLoading(false);
        } else {
          setStatusMsg(`수집 중... (${job.progress || 0}%)`);
        }
      }, 3000);
    } catch (error) {
      setLoading(false);
      alert("수집 시작 실패");
    }
  };

  // 1. 로그인이 안 되어 있을 때 보여줄 화면
  if (!isLoggedIn) {
    return (
      <div className="loginWrap">
        <form className="loginCard" onSubmit={handleLogin}>
          <div className="badge">AI매출업</div>
          <h1>가맹점 분석 시스템</h1>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호" />
          <button type="submit" className="run-btn">로그인</button>
        </form>
      </div>
    );
  }

  // 2. 로그인 후 대시보드 화면
  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-logo">AI매출업</div>
        <nav>
          <div className="nav-item active">가맹점 리포트</div>
          <div className="nav-item">수집 실행</div>
          <div className="nav-item">PDF 다운로드</div>
        </nav>
      </aside>

      <main className="main-content">
        <header className="content-header">
          <div className="header-left">
            <h1>가맹점 소셜 빅데이터 분석 리포트</h1>
            <p>네이버 플레이스, 블로그, 인스타그램 데이터를 실제 수집합니다.</p>
          </div>
          <div className="user-info">
            <span>{email}</span>
            <button className="logout-btn" onClick={() => {localStorage.clear(); setIsLoggedIn(false);}}>로그아웃</button>
          </div>
        </header>

        <section className="filter-bar card">
          <div className="filter-group">
            <label>가맹점 선택</label>
            <select value={selectedMerchant} onChange={(e) => setSelectedMerchant(e.target.value)}>
              <option value="순자매감자탕">순자매감자탕</option>
              <option value="98도씨국밥 보라매점">98도씨국밥 보라매점</option>
            </select>
          </div>
          <div className="filter-group">
            <label>기간</label>
            <select><option>최근 1개월</option></select>
          </div>
          <div className="button-group">
            <button className="run-btn" onClick={handleStartCrawl} disabled={loading} style={{width: 'auto', padding: '10px 30px'}}>
              {loading ? statusMsg : "수집 시작"}
            </button>
          </div>
        </section>

        {report ? (
          <div className="report-container">
            <div className="report-title-area">
              <h2>{report.merchant_name} 리포트</h2>
              <span className="location-tag">분석완료: {new Date().toLocaleString()}</span>
            </div>
            <div className="stats-grid">
              <div className="stat-card"><span>전체 언급 수</span><strong>{report.summary.total_mentions}건</strong></div>
              <div className="stat-card"><span>네이버 블로그</span><strong>{report.summary.blog_count || 0}</strong></div>
              <div className="stat-card"><span>인스타그램</span><strong>{report.summary.insta_count || 0}</strong></div>
              <div className="stat-card"><span>영수증 리뷰</span><strong>{report.summary.review_count || 0}</strong></div>
            </div>
          </div>
        ) : (
          !loading && <div className="card" style={{textAlign: 'center', color: '#888'}}>수집 시작 버튼을 눌러 데이터를 불러오세요.</div>
        )}
      </main>
    </div>
  );
}
