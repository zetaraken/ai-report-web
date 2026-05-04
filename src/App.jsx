import React, { useState, useEffect } from 'react';
import './App.css';

// 1. 본인의 Railway 주소로 설정하세요. (끝에 /는 붙이지 마세요)
const RAILWAY_API_URL = "https://web-production-a7ba9.up.railway.app";

function App() {
  const [merchants, setMerchants] = useState([]);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 신규 매장 입력 상태
  const [newMerchant, setNewMerchant] = useState({ name: '', region: '' });

  // 2. 매장 목록 불러오기 함수
  const fetchMerchants = async () => {
    try {
      const response = await fetch(`${RAILWAY_API_URL}/api/merchants`);
      if (response.ok) {
        const data = await response.json();
        setMerchants(data);
      }
    } catch (error) {
      console.error("매장 목록 로드 실패:", error);
    }
  };

  useEffect(() => {
    fetchMerchants();
  }, []);

  // 3. 매장 클릭 시 리포트 수집 시작
  const handleMerchantClick = async (merchant) => {
    setSelectedMerchant(merchant);
    setLoading(true);
    setReportData(null);

    try {
      const response = await fetch(`${RAILWAY_API_URL}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchant_id: merchant.id }),
      });

      if (response.ok) {
        const job = await response.json();
        // 실제 크롤링 시간이 걸리므로 결과를 가져올 때까지 대기 (간이 폴링)
        setTimeout(async () => {
          const res = await fetch(`${RAILWAY_API_URL}/api/crawl-jobs/${job.job_id}`);
          const result = await res.json();
          setReportData(result.result);
          setLoading(false);
        }, 3000); // 3초 후 결과 확인
      }
    } catch (error) {
      console.error("리포트 수집 실패:", error);
      setLoading(false);
    }
  };

  // 4. [저장하기] 버튼 클릭 시 작동하는 핵심 함수
  const handleSaveMerchant = async () => {
    console.log("저장 버튼 클릭됨", newMerchant); // 작동 확인용 로그

    if (!newMerchant.name) {
      alert("매장 이름을 입력해주세요.");
      return;
    }

    try {
      const response = await fetch(`${RAILWAY_API_URL}/api/merchants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newMerchant.name,
          region: newMerchant.region,
          blog_keywords: newMerchant.name // 기본값으로 매장명 사용
        }),
      });

      if (response.ok) {
        alert("매장이 성공적으로 등록되었습니다.");
        setIsModalOpen(false); // 팝업 닫기
        setNewMerchant({ name: '', region: '' }); // 입력란 초기화
        fetchMerchants(); // 목록 새로고침
      } else {
        const errorData = await response.json();
        alert(`저장 실패: ${errorData.detail || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error("저장 에러:", error);
      alert("백엔드 서버와 통신할 수 없습니다. Railway 서버 상태를 확인하세요.");
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>AI매출업 <span>가맹점 분석 시스템</span></h1>
        <button className="add-btn" onClick={() => setIsModalOpen(true)}>+ 새 매장 등록</button>
      </header>

      <main className="app-content">
        <aside className="sidebar">
          <h3>가맹점 리스트</h3>
          <ul>
            {merchants.map(m => (
              <li 
                key={m.id} 
                className={selectedMerchant?.id === m.id ? 'active' : ''}
                onClick={() => handleMerchantClick(m)}
              >
                <strong>{m.name}</strong> <span>{m.region}</span>
              </li>
            ))}
          </ul>
        </aside>

        <section className="dashboard">
          {loading ? (
            <div className="loading-state">데이터를 수집하고 분석 중입니다...</div>
          ) : reportData ? (
            <div className="report-view">
              <h2>{reportData.merchant_name} 리포트</h2>
              <div className="summary-cards">
                <div className="card"><span>총 언급 수</span><strong>{reportData.summary.total_mentions}</strong></div>
                <div className="card"><span>영수증 리뷰</span><strong>{reportData.summary.receipt_reviews}</strong></div>
                <div className="card"><span>네이버 블로그</span><strong>{reportData.summary.naver_blogs}</strong></div>
                <div className="card"><span>인스타그램</span><strong>{reportData.summary.instagram}</strong></div>
              </div>
              {/* 추가 테이블 등 레이아웃 구성 */}
            </div>
          ) : (
            <div className="empty-state">가맹점을 선택하면 분석이 시작됩니다.</div>
          )}
        </section>
      </main>

      {/* 신규 매장 등록 모달 */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>신규 매장 등록</h2>
            <input 
              type="text" 
              placeholder="매장명" 
              value={newMerchant.name} 
              onChange={(e) => setNewMerchant({...newMerchant, name: e.target.value})}
            />
            <input 
              type="text" 
              placeholder="지역 (예: 서울 신사)" 
              value={newMerchant.region} 
              onChange={(e) => setNewMerchant({...newMerchant, region: e.target.value})}
            />
            <button className="save-btn" onClick={handleSaveMerchant}>저장하기</button>
            <button className="close-btn" onClick={() => setIsModalOpen(false)}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
