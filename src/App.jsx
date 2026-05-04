import React, { useState, useEffect } from 'react';
import './App.css';

// 기획자님의 실제 Railway API 주소
const RAILWAY_API_URL = "https://web-production-a7ba9.up.railway.app";

function App() {
  const [merchants, setMerchants] = useState([]);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMerchant, setNewMerchant] = useState({ name: '', region: '' });

  // 매장 목록 가져오기
  const fetchMerchants = async () => {
    try {
      const response = await fetch(`${RAILWAY_API_URL}/api/merchants`);
      if (response.ok) {
        const data = await response.json();
        setMerchants(data);
      }
    } catch (error) {
      console.error("목록 로드 에러:", error);
    }
  };

  useEffect(() => {
    fetchMerchants();
  }, []);

  // [저장하기] 버튼 클릭 시 동작
  const handleSaveMerchant = async () => {
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
          blog_keywords: newMerchant.name
        }),
      });

      if (response.ok) {
        alert("성공적으로 등록되었습니다!");
        setIsModalOpen(false);
        setNewMerchant({ name: '', region: '' });
        fetchMerchants(); // 목록 갱신
      } else {
        const errorMsg = await response.text();
        alert("서버 응답 오류: " + errorMsg);
      }
    } catch (error) {
      alert("연결 오류: 백엔드 서버(Railway)가 켜져 있는지 확인하세요. " + error.message);
    }
  };

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
        // 3초 후 결과 조회
        setTimeout(async () => {
          const res = await fetch(`${RAILWAY_API_URL}/api/crawl-jobs/${job.job_id}`);
          const result = await res.json();
          setReportData(result.result);
          setLoading(false);
        }, 3000);
      }
    } catch (error) {
      alert("리포트 생성 실패: " + error.message);
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>AI매출업 <span>가맹점 분석 시스템</span></h1>
        <button onClick={() => setIsModalOpen(true)} className="add-btn">+ 새 매장 등록</button>
      </header>

      <main className="app-content">
        <aside className="sidebar">
          <h3>가맹점 리스트</h3>
          <ul>
            {merchants.map(m => (
              <li 
                key={m.id} 
                onClick={() => handleMerchantClick(m)}
                className={selectedMerchant?.id === m.id ? 'active' : ''}
              >
                <strong>{m.name}</strong> <span>{m.region}</span>
              </li>
            ))}
          </ul>
        </aside>

        <section className="dashboard">
          {loading ? (
            <div className="status-msg">데이터를 실시간 수집 및 분석 중입니다...</div>
          ) : reportData ? (
            <div className="report-container">
              <h2>{reportData.merchant_name} 평판 분석</h2>
              <div className="cards">
                <div className="card"><span>네이버 블로그</span><strong>{reportData.summary.naver_blogs}</strong></div>
                <div className="card"><span>인스타그램</span><strong>{reportData.summary.instagram}</strong></div>
                <div className="card"><span>총 언급 수</span><strong>{reportData.summary.total_mentions}</strong></div>
              </div>
            </div>
          ) : (
            <div className="status-msg">가맹점을 선택하면 분석이 시작됩니다.</div>
          )}
        </section>
      </main>

      {isModalOpen && (
        <div className="modal">
          <div className="modal-box">
            <h3>신규 매장 등록</h3>
            <input 
              placeholder="매장명" 
              value={newMerchant.name} 
              onChange={e => setNewMerchant({...newMerchant, name: e.target.value})} 
            />
            <input 
              placeholder="지역" 
              value={newMerchant.region} 
              onChange={e => setNewMerchant({...newMerchant, region: e.target.value})} 
            />
            <button onClick={handleSaveMerchant} className="save-btn">저장하기</button>
            <button onClick={() => setIsModalOpen(false)}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
