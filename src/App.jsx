import React, { useState, useEffect } from 'react';

// 백엔드 URL
const API_BASE_URL = 'https://web-production-a7ba9.up.railway.app/api';

function App() {
  const [merchants, setMerchants] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  // 1. 매장 리스트 불러오기
  const fetchMerchants = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/merchants`);
      const data = await res.json();
      setMerchants(data);
    } catch (err) {
      console.error("매장 목록 로드 실패", err);
    }
  };

  useEffect(() => { fetchMerchants(); }, []);

  // 2. 분석 시작 (리포트 생성)
  const handleAnalyze = async (id) => {
    setSelectedId(id);
    setLoading(true);
    setReport(null);
    try {
      const res = await fetch(`${API_BASE_URL}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId: id })
      });
      const data = await res.json();
      
      if (data.status === 'completed') {
        setReport(data);
        setLoading(false);
      } else {
        checkStatus(id);
      }
    } catch (err) {
      alert("분석 요청 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  // 3. 상태 체크 (Polling)
  const checkStatus = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/crawl-jobs/${id}`);
      const data = await res.json();
      if (data.status === 'completed') {
        setReport(data);
        setLoading(false);
      } else {
        setTimeout(() => checkStatus(id), 2000);
      }
    } catch (err) {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#000', color: '#fff', fontFamily: 'sans-serif' }}>
      {/* 사이드바 */}
      <div style={{ width: '250px', borderRight: '1px solid #333', padding: '20px' }}>
        <h2 style={{ color: '#00f2ff' }}>AI매출업</h2>
        <p style={{ fontSize: '12px', color: '#888' }}>가맹점 분석 시스템</p>
        <div style={{ marginTop: '40px' }}>
          <p style={{ fontSize: '13px', marginBottom: '10px' }}>가맹점 리스트</p>
          {merchants.map(m => (
            <div 
              key={m.id} 
              onClick={() => handleAnalyze(m.id)}
              style={{ 
                padding: '15px', borderRadius: '8px', backgroundColor: selectedId === m.id ? '#111' : 'transparent',
                cursor: 'pointer', border: selectedId === m.id ? '1px solid #00f2ff' : '1px solid #333', marginBottom: '10px'
              }}
            >
              <strong>{m.name}</strong> <span style={{ fontSize: '11px', color: '#888' }}>{m.region}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        {!selectedId && <p style={{ color: '#888' }}>가맹점을 선택하면 분석이 시작됩니다.</p>}
        
        {loading && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '40px', height: '40px', border: '4px solid #333', borderTop: '4px solid #00f2ff', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }}></div>
            <p>데이터를 수집하고 있습니다...</p>
          </div>
        )}

        {report && !loading && (
          <div style={{ width: '100%', maxWidth: '600px', backgroundColor: '#111', padding: '30px', borderRadius: '15px', border: '1px solid #333' }}>
            <h3 style={{ color: '#00f2ff', marginBottom: '20px' }}>분석 리포트</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div style={{ padding: '15px', backgroundColor: '#222', borderRadius: '10px' }}>
                <p style={{ fontSize: '12px', color: '#888' }}>언급 횟수</p>
                <h4 style={{ fontSize: '24px', margin: '5px 0' }}>{report.mentionCount}건</h4>
              </div>
              <div style={{ padding: '15px', backgroundColor: '#222', borderRadius: '10px' }}>
                <p style={{ fontSize: '12px', color: '#888' }}>긍정 비율</p>
                <h4 style={{ fontSize: '24px', margin: '5px 0', color: '#00f2ff' }}>{report.positiveRate}%</h4>
              </div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '12px', color: '#888' }}>주요 키워드</p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                {(report.keywords || []).map(kw => <span key={kw} style={{ padding: '4px 10px', backgroundColor: '#333', borderRadius: '15px', fontSize: '12px' }}>#{kw}</span>)}
              </div>
            </div>
            <p style={{ lineHeight: '1.6', color: '#ccc' }}>{report.summary}</p>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default App;
