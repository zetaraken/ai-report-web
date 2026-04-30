import React, { useState } from "react";
import "./styles.css";

const API_URL = "https://web-production-a7ba9.up.railway.app";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [activeTab, setActiveTab] = useState("report"); // 'report' 또는 'setup'
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [report, setReport] = useState(null);

  // 1. 가맹점 리스트 데이터 (초기값으로 기획자님이 주신 배포차 정보 세팅)
  const [merchants, setMerchants] = useState([
    { 
      id: "baepocha", 
      name: "배포차", 
      address: "서울 강남구 도산대로1길 16 지상1, 2층",
      placeUrl: "https://naver.me/xv6tlDW3",
      blogKeyword: "신사역 배포차",
      instaHashtag: "배포차",
      instaChannel: "https://www.instagram.com/bae_po_cha",
      youtubeKeyword: "신사역 배포차"
    }
  ]);

  // 2. 신규 가맹점 등록을 위한 임시 상태
  const [newMerchant, setNewMerchant] = useState({
    name: "", address: "", placeUrl: "", blogKeyword: "", instaHashtag: "", instaChannel: "", youtubeKeyword: ""
  });

  const [selectedId, setSelectedId] = useState(merchants[0].id);

  // 가맹점 추가 함수
  const addMerchant = () => {
    if(!newMerchant.name) return alert("매장명을 입력해주세요.");
    const id = Date.now().toString();
    setMerchants([...merchants, { ...newMerchant, id }]);
    setNewMerchant({ name: "", address: "", placeUrl: "", blogKeyword: "", instaHashtag: "", instaChannel: "", youtubeKeyword: "" });
    alert("가맹점이 등록되었습니다.");
  };

  // 실제 크롤링 실행
  const startAnalysis = async () => {
    setLoading(true);
    setStatusMsg("수집 엔진 가동 중 (펼쳐서 더보기 클릭 포함)...");
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
          setStatusMsg(`데이터 수집 및 분석 중... (${job.progress || 0}%)`);
        }
      }, 3000);
    } catch (e) { setLoading(false); alert("연결 실패"); }
  };

  if (!isLoggedIn) return (
    <div className="login-wrap">
      <div className="login-card">
        <h2>AI매출업 관리자</h2>
        <button className="run-btn" onClick={() => setIsLoggedIn(true)}>접속하기</button>
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
          <div className="user-info">
            <span>zetarise@gmail.com</span>
            <button className="logout-btn" onClick={() => setIsLoggedIn(false)}>로그아웃</button>
          </div>
        </header>

        {activeTab === 'setup' ? (
          <section className="setup-container animated-up">
            <div className="card setup-form">
              <h3>신규 가맹점 정보 등록</h3>
              <div className="input-grid">
                <div className="input-group"><label>매장명</label><input value={newMerchant.name} onChange={e => setNewMerchant({...newMerchant, name: e.target.value})} placeholder="배포차" /></div>
                <div className="input-group"><label>주소/지역</label><input value={newMerchant.address} onChange={e => setNewMerchant({...newMerchant, address: e.target.value})} placeholder="서울 강남구..." /></div>
                <div className="input-group"><label>네이버 플레이스 URL</label><input value={newMerchant.placeUrl} onChange={e => setNewMerchant({...newMerchant, placeUrl: e.target.value})} /></div>
                <div className="input-group"><label>블로그 키워드</label><input value={newMerchant.blogKeyword} onChange={e => setNewMerchant({...newMerchant, blogKeyword: e.target.value})} /></div>
                <div className="input-group"><label>인스타 해시태그</label><input value={newMerchant.instaHashtag} onChange={e => setNewMerchant({...newMerchant, instaHashtag: e.target.value})} /></div>
                <div className="input-group"><label>유튜브 키워드</label><input value={newMerchant.youtubeKeyword} onChange={e => setNewMerchant({...newMerchant, youtubeKeyword: e.target.value})} /></div>
              </div>
              <button className="run-btn" onClick={addMerchant} style={{marginTop: '20px'}}>가맹점 저장</button>
            </div>

            <div className="card">
              <h3>등록된 가맹점 리스트</h3>
              <table className="data-table">
                <thead><tr><th>매장명</th><th>지역</th><th>플레이스</th><th>작업</th></tr></thead>
                <tbody>
                  {merchants.map(m => (
                    <tr key={m.id}><td>{m.name}</td><td>{m.address}</td><td>연결됨</td><td><button className="btn-small">수정</button></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <>
            <section className="filter-bar card">
              <div className="filter-group">
                <label>분석 대상 선택</label>
                <select value={selectedId} onChange={e => setSelectedId(e.target.value)}>
                  {merchants.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <button className="run-btn" onClick={startAnalysis} disabled={loading}>{loading ? statusMsg : "리포트 생성 시작"}</button>
            </section>

            {report && (
              <div className="report-view card animated-up">
                <h2>{report.merchant_name} 분석 결과</h2>
                <div className="stats-grid">
                  <div className="stat-card"><span>전체 언급량</span><strong>{report.summary.total_mentions}</strong></div>
                  <div className="stat-card"><span>네이버 블로그</span><strong>{report.summary.naver_blog_count}</strong></div>
                  <div className="stat-card"><span>인스타그램</span><strong>{report.summary.instagram_count}</strong></div>
                  <div className="stat-card"><span>영수증 리뷰</span><strong>{report.summary.place_receipt_count}</strong></div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
