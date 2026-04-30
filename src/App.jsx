import React, { useState, useEffect } from "react";
import "./styles.css";

// [중요] 실제 Railway 서버 주소를 입력하세요
const API_URL = "https://web-production-a7ba9.up.railway.app";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [report, setReport] = useState(null);
  
  // 가맹점 정보 (히스토리 기반 실제 가맹점 리스트)
  const [merchants] = useState([
    { id: "배포차", name: "배포차", region: "서울 강남구" },
    { id: "소요", name: "소요", region: "경기 고양시" },
    { id: "순자매감자탕", name: "순자매감자탕", region: "경기 화성시" },
    { id: "연탄김평선", name: "연탄김평선", region: "서울 강남구" },
    { id: "라이브볼", name: "라이브볼", region: "서울 강남구" }
  ]);
  const [selectedId, setSelectedId] = useState("순자매감자탕");
  const [period, setPeriod] = useState("1month");

  // 실제 크롤링 실행 및 상태 추적 (Polling)
  const startAnalysis = async () => {
    setLoading(true);
    setStatusMsg("수집 엔진 가동 중...");
    const token = localStorage.getItem("token");

    try {
      // 1. 백엔드에 수집 명령 (POST)
      const res = await fetch(`${API_URL}/api/reports`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ merchant_id: selectedId, period: period }),
      });

      const { job_id } = await res.json();

      // 2. 3초마다 상태 확인 (더보기 버튼 클릭/스크롤 대기 포함)
      const timer = setInterval(async () => {
        const sRes = await fetch(`${API_URL}/api/crawl-jobs/${job_id}`, {
          headers: { "Authorization": `Bearer ${token}` },
        });
        const job = await sRes.json();

        if (job.status === "done") {
          clearInterval(timer);
          setReport(job.result);
          setLoading(false);
          setStatusMsg("수집 완료");
        } else if (job.status === "error") {
          clearInterval(timer);
          setLoading(false);
          alert("크롤링 실패: " + job.message);
        } else {
          // 크롤링 진행 상황 실시간 업데이트
          setStatusMsg(`데이터 수집 중... (${job.progress || 0}%)`);
        }
      }, 3000);
    } catch (err) {
      setLoading(false);
      alert("서버 연결 실패");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h2>AI매출업 로그인</h2>
          <button className="run-btn" onClick={() => {localStorage.setItem("token", "dummy"); setIsLoggedIn(true);}}>
            대시보드 접속하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-logo">AI매출업</div>
        <nav>
          <div className="nav-item active">가맹점 리포트</div>
          <div className="nav-item">수집 실행 내역</div>
          <div className="nav-item">PDF 내보내기</div>
        </nav>
      </aside>

      <main className="main-content">
        <header className="content-header">
          <h1>가맹점 소셜 빅데이터 분석 리포트</h1>
          <button className="logout-btn" onClick={() => {localStorage.clear(); setIsLoggedIn(false);}}>로그아웃</button>
        </header>

        {/* 가맹점 선택 및 실행 섹션 */}
        <section className="filter-bar card">
          <div className="filter-group">
            <label>가맹점 등록/선택</label>
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
              {merchants.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>분석 기간</label>
            <select value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="1month">최근 1개월</option>
              <option value="1year">최근 1년</option>
            </select>
          </div>
          <button className="run-btn" onClick={startAnalysis} disabled={loading}>
            {loading ? statusMsg : "데이터 수집 시작"}
          </button>
        </section>

        {/* 결과 리포트 영역 */}
        {report && (
          <div className="report-view animated-up">
            <div className="report-header">
              <h2>{report.merchant_name} 리포트</h2>
              <p>지역: {report.region} | 생성일시: {report.generated_at}</p>
            </div>

            <div className="stats-grid">
              <div className="stat-card"><span>총 언급량</span><strong>{report.summary.total_mentions}</strong></div>
              <div className="stat-card"><span>블로그</span><strong>{report.summary.naver_blog_count}</strong></div>
              <div className="stat-card"><span>인스타그램</span><strong>{report.summary.instagram_count}</strong></div>
              <div className="stat-card"><span>플레이스 리뷰</span><strong>{report.summary.place_receipt_count}</strong></div>
            </div>

            <div className="data-table card">
              <h3>월별 상세 데이터</h3>
              <table>
                <thead>
                  <tr><th>월</th><th>블로그</th><th>인스타</th><th>영수증</th><th>유튜브</th></tr>
                </thead>
                <tbody>
                  {report.monthly_summary.map((m, i) => (
                    <tr key={i}>
                      <td>{m.month}</td><td>{m.blog_count}</td><td>{m.instagram_count}</td><td>{m.place_receipt_count}</td><td>{m.youtube_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
