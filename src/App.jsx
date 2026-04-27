// App.jsx (UI 복구 및 수집 상태 강화 버전)
import React, { useState, useEffect } from 'react';
import './styles.css';

function App() {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const handleStartCrawl = async () => {
    setLoading(true);
    setStatusMessage("네이버 플레이스 리뷰를 수집 중입니다... (더보기 클릭 중)");
    
    // API 호출 로직 (생략)
    
    setLoading(false);
    setStatusMessage("수집이 완료되었습니다.");
  };

  return (
    <div className="admin-container">
      <header className="report-header">
        <h1>AI매출업 경영진단 시스템</h1>
      </header>
      
      <main className="content-area">
        <div className="control-panel">
          <button 
            className={`crawl-btn ${loading ? 'loading' : ''}`}
            onClick={handleStartCrawl}
            disabled={loading}
          >
            {loading ? "데이터 수집 중..." : "실시간 수집 시작"}
          </button>
          {statusMessage && <p className="status-info">{statusMessage}</p>}
        </div>

        {/* 리포트 결과 화면 레이아웃 */}
        <section className="report-view">
          {/* 그래프 및 표 레이아웃 영역 */}
        </section>
      </main>
    </div>
  );
}

export default App;
