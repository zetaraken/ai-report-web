import React, { useState } from "react";
import "./styles.css";

// 백엔드 주소 (실제 Railway 주소)
const API_URL = "https://web-production-a7ba9.app.railway.app";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [report, setReport] = useState(null);
  
  // 가맹점 및 기간 선택 상태 (UI용)
  const [selectedMerchant, setSelectedMerchant] = useState("순자매감자탕");

  // [핵심] 실제 크롤링 실행 함수
  const handleStartCrawl = async () => {
    setLoading(true);
    setStatusMsg("데이터 수집 요청 중...");
    const token = localStorage.getItem("token");

    try {
      // 1. 크롤링 작업 시작 요청
      const response = await fetch(`${API_URL}/api/reports`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ merchant_id: selectedMerchant }),
      });

      if (!response.ok) throw new Error("수집 요청 실패");

      const { job_id } = await response.json();
      console.log("작업 ID 생성 완료:", job_id);

      // 2. 3초마다 상태 확인 (Polling)
      const checkStatus = setInterval(async () => {
        try {
          const statusRes = await fetch(`${API_URL}/api/crawl-jobs/${job_id}`, {
            headers: { "Authorization": `Bearer ${token}` },
          });
          const job = await statusRes.json();

          if (job.status === "done") {
            clearInterval(checkStatus);
            setReport(job.result); // 실제 수집된 데이터 저장
            setLoading(false);
            setStatusMsg("수집 완료!");
          } else if (job.status === "error") {
            clearInterval(checkStatus);
            setLoading(false);
            alert("수집 중 오류 발생: " + job.message);
          } else {
            setStatusMsg(`데이터 수집 중... (${job.progress || 0}%)`);
          }
        } catch (err) {
          console.error("상태 확인 중 오류:", err);
        }
      }, 3000);

    } catch (error) {
      setLoading(false);
      alert("서버 연결에 실패했습니다.");
    }
  };

  if (!isLoggedIn) return (/* 로그인 폼 생략 */);

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
            <span>{localStorage.getItem("email") || "admin"}</span>
            <button className="logout-btn" onClick={() => {localStorage.clear(); window.location.reload();}}>로그아웃</button>
          </div>
        </header>

        {/* 상단 검색 및 실행 바 */}
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
            <button className="btn-primary" onClick={handleStartCrawl} disabled={loading}>
              {loading ? statusMsg : "수집 시작"}
            </button>
            <button className="btn-outline" onClick={() => window.location.reload()}>리포트 새로고침</button>
          </div>
        </section>

        {/* 실제 수집된 데이터 출력 영역 */}
        {report ? (
          <div className="report-container animated-fade-in">
            <div className="report-title-area">
              <h2>{report.merchant_name} 리포트</h2>
              <span className="location-tag">수집 시각: {new Date().toLocaleString()}</span>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <span>전체 언급 수</span>
                <strong>{report.summary.total_mentions}건</strong>
              </div>
              <div className="stat-card">
                <span>네이버 블로그</span>
                <strong>{report.summary.blog_count || 0}</strong>
              </div>
              <div className="stat-card">
                <span>인스타그램</span>
                <strong>{report.summary.insta_count || 0}</strong>
              </div>
              <div className="stat-card">
                <span>영수증 리뷰</span>
                <strong>{report.summary.review_count || 0}</strong>
              </div>
            </div>

            <section className="data-section card">
              <h3>데이터 수집 요약</h3>
              <p>해당 가맹점의 소셜 미디어 인지도는 현재 <strong>매우 활발</strong>한 상태입니다.</p>
              {/* 추가 데이터(테이블 등) 배치 */}
            </section>
          </div>
        ) : (
          !loading && <div className="empty-state card">가맹점을 선택하고 '수집 시작' 버튼을 눌러주세요.</div>
        )}
      </main>
    </div>
  );
}
