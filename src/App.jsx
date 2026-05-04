import React, { useState } from "react";
import "./styles.css";

// 실제 백엔드 주소 (Railway)
const API_URL = "https://web-production-a7ba9.up.railway.app";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [activeTab, setActiveTab] = useState("report"); 
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [report, setReport] = useState(null);

  // 복구된 가맹점 5개 데이터
  const [merchants, setMerchants] = useState([
    { id: "baepocha", name: "배포차", address: "서울 강남구 도산대로1길 16", placeUrl: "https://naver.me/xv6tlDW3", blogKeyword: "신사역 배포차", instaHashtag: "배포차", youtubeKeyword: "신사역 배포차" },
    { id: "soyo", name: "소요", address: "경기 고양시 일산동구", placeUrl: "https://naver.me/F0AHoPtm", blogKeyword: "일산 소요", instaHashtag: "일산 소요", youtubeKeyword: "일산 소요" },
    { id: "sunjamae", name: "순자매감자탕", address: "경기 화성시 동탄구", placeUrl: "https://naver.me/GNRzS59C", blogKeyword: "순자매감자탕", instaHashtag: "순자매감자탕", youtubeKeyword: "순자매감자탕" },
    { id: "yeon_tan", name: "연탄김평선", address: "서울 강남구 선릉로90길 64", placeUrl: "https://naver.me/xNLZbjfI", blogKeyword: "연탄김평선", instaHashtag: "연탄김평선", youtubeKeyword: "연탄김평선" },
    { id: "liveball", name: "라이브볼", address: "서울 강남구 테헤란로 147", placeUrl: "https://naver.me/5bVsye2y", blogKeyword: "라이브볼 역삼점", instaHashtag: "라이브볼 역삼점", youtubeKeyword: "라이브볼 역삼점" }
  ]);

  const [selectedId, setSelectedId] = useState("baepocha");

  // 수집 시작 로직
  const startAnalysis = async () => {
    setLoading(true);
    setStatusMsg("수집 시작 (플레이스 더보기 클릭 및 스크롤 중...)");
    const token = localStorage.getItem("token");
    const target = merchants.find(m => m.id === selectedId);

    try {
      const res = await fetch(`${API_URL}/api/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ ...target, period: "1year" }),
      });
      const { job_id } = await res.json();

      const timer = setInterval(async () => {
        const sRes = await fetch(`${API_URL}/api/crawl-jobs/${job_id}`, {
          headers: { "Authorization": `Bearer ${token}` },
        });
        const job = await sRes.json();
        if (job.status === "done") {
          clearInterval(timer);
          setReport(job.result);
          setLoading(false);
          setActiveTab("report");
        } else {
          setStatusMsg(`데이터 수집 중... ${job.progress || 0}% 완료`);
        }
      }, 3000);
    } catch (e) { setLoading(false); alert("서버 연결 실패"); }
  };

  if (!isLoggedIn) return (
    <div className="login-wrap">
      <div className="login-card">
        <h1>AI매출업 관리자</h1>
        <button className="run-btn" onClick={() => setIsLoggedIn(true)}>로그인</button>
      </div>
    </div>
  );

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-logo">AI매출업</div>
        <nav>
          <div className={`nav-item ${activeTab === 'report' ? 'active' : ''}`} onClick={() => setActiveTab('report')}>가맹점 리포트</div>
          <div className={`nav-item ${activeTab === 'setup' ? 'active' : ''}`} onClick={() => setActiveTab('setup')}>가맹점 등록·관리</div>
        </nav>
      </aside>

      <main className="main-content">
        <header className="content-header">
          <h1>{activeTab === 'report' ? '분석 리포트' : '가맹점 설정'}</h1>
          <button className="logout-btn" onClick={() => setIsLoggedIn(false)}>로그아웃</button>
        </header>

        {activeTab === 'setup' ? (
          <section className="setup-container card animated-up">
            <h3>신규 가맹점 등록</h3>
            <div className="input-grid">
              <input placeholder="매장명" className="custom-input" />
              <input placeholder="네이버 플레이스 URL" className="custom-input" />
              <input placeholder="블로그 키워드" className="custom-input" />
              <input placeholder="인스타 해시태그" className="custom-input" />
              <input placeholder="유튜브 키워드" className="custom-input" />
            </div>
            <button className="run-btn" style={{marginTop:'15px'}}>가맹점 저장</button>
          </section>
        ) : (
          <>
            <section className="filter-bar card">
              <select value={selectedId} onChange={e => setSelectedId(e.target.value)}>
                {merchants.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <button className="run-btn" onClick={startAnalysis} disabled={loading}>
                {loading ? statusMsg : "데이터 수집 시작"}
              </button>
            </section>
            {report && (
              <div className="report-view card animated-up">
                <h2>{report.merchant_name} 분석 데이터</h2>
                <div className="stats-grid">
                  <div className="stat-card"><span>전체 언급</span><strong>{report.summary.total_mentions}</strong></div>
                  <div className="stat-card"><span>블로그</span><strong>{report.summary.naver_blog_count}</strong></div>
                  <div className="stat-card"><span>인스타</span><strong>{report.summary.instagram_count}</strong></div>
                  <div className="stat-card"><span>리뷰</span><strong>{report.summary.place_receipt_count}</strong></div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
