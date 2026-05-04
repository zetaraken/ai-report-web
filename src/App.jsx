import React, { useState, useEffect } from "react";

const API_URL = "https://web-production-a7ba9.up.railway.app"; 

export default function App() {
  const [token, setToken] = useState(null);
  const [merchants, setMerchants] = useState([]);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newMerchant, setNewMerchant] = useState({ name: "", region: "", blog_keywords: "" });

  useEffect(() => {
    const autoLogin = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "zetarise@gmail.com", password: "4858" })
        });
        const data = await res.json();
        setToken(data.access_token);
        fetchMerchants(data.access_token);
      } catch (e) { console.error("서버 연결 실패"); }
    };
    autoLogin();
  }, []);

  const fetchMerchants = async (authToken) => {
    const res = await fetch(`${API_URL}/api/merchants`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const data = await res.json();
    setMerchants(data);
  };

  const handleAddMerchant = async () => {
    const res = await fetch(`${API_URL}/api/merchants`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(newMerchant)
    });
    if (res.ok) {
      setShowModal(false);
      fetchMerchants(token);
    }
  };

  const startCrawl = async (merchant) => {
    setIsLoading(true);
    setSelectedMerchant(null);
    const res = await fetch(`${API_URL}/api/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ merchant_id: merchant.id })
    });
    const { job_id } = await res.json();
    
    setTimeout(async () => {
      const statusRes = await fetch(`${API_URL}/api/crawl-jobs/${job_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const jobResult = await statusRes.json();
      setSelectedMerchant(jobResult.result);
      setIsLoading(false);
    }, 3000);
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.logo}>AI매출업 <span style={{fontSize:'12px', color:'#444'}}>가맹점 분석 시스템</span></div>
        <button onClick={() => setShowModal(true)} style={styles.btnAdd}>+ 새 매장 등록</button>
      </header>

      <div style={styles.content}>
        <aside style={styles.sidebar}>
          <h3 style={{fontSize:'12px', color:'#444', marginBottom:'20px'}}>가맹점 리스트</h3>
          {merchants.map(m => (
            <div key={m.id} onClick={() => !isLoading && startCrawl(m)} style={styles.merchantItem}>
              <strong>{m.name}</strong> <span style={{fontSize:'11px', color:'#555'}}>{m.region}</span>
            </div>
          ))}
        </aside>

        <main style={styles.main}>
          {isLoading ? <div style={styles.loading}>📡 데이터를 수집하고 있습니다...</div> : 
           selectedMerchant ? (
            <div style={styles.reportArea}>
              <h2 style={{marginBottom:'30px'}}>{selectedMerchant.merchant_name} 리포트</h2>
              
              {/* 6개 요약 카드 (기획안 반영) */}
              <div style={styles.statsGrid}>
                <div style={styles.statBox}><span style={{color:'#666'}}>총 언급 수</span><strong style={{color:'#00e5ff'}}>{selectedMerchant.summary.total_mentions}</strong></div>
                <div style={styles.statBox}><span>영수증 리뷰</span><strong>{selectedMerchant.summary.receipt_reviews}</strong></div>
                <div style={styles.statBox}><span>플레이스 블로그</span><strong>{selectedMerchant.summary.place_blogs}</strong></div>
                <div style={styles.statBox}><span>네이버 블로그</span><strong>{selectedMerchant.summary.naver_blogs}</strong></div>
                <div style={styles.statBox}><span style={{color:'#ff00e5'}}>인스타그램</span><strong>{selectedMerchant.summary.instagram}</strong></div>
                <div style={styles.statBox}><span style={{color:'#ff4444'}}>유튜브 조회수</span><strong>{selectedMerchant.summary.youtube_views}</strong></div>
              </div>

              {/* 월별 집계 표 (기획안 반영) */}
              <h3 style={{marginTop:'50px', marginBottom:'20px'}}>월별 채널별 집계</h3>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>월</th><th>네이버 블로그</th><th>인스타그램</th><th>영수증 리뷰</th><th>플레이스</th><th>유튜브</th><th>합계</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedMerchant.monthly_data.map((d, i) => (
                    <tr key={i}>
                      <td>{d.month}</td><td>{d.naver}</td><td>{d.insta}</td><td>{d.receipt}</td><td>{d.place}</td><td>{d.youtube}</td><td style={{color:'#00e5ff'}}>{d.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
           ) : <div style={styles.empty}>가맹점을 선택하면 분석이 시작됩니다.</div>}
        </main>
      </div>

      {showModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3>신규 매장 등록</h3>
            <input style={styles.input} placeholder="매장명" onChange={e => setNewMerchant({...newMerchant, name: e.target.value})} />
            <input style={styles.input} placeholder="지역 (예: 서울 신사)" onChange={e => setNewMerchant({...newMerchant, region: e.target.value})} />
            <button onClick={handleAddMerchant} style={styles.btnSave}>저장하기</button>
            <button onClick={() => setShowModal(false)} style={styles.btnCancel}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { background: '#000', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', padding: '20px 40px', borderBottom: '1px solid #111', alignItems: 'center' },
  logo: { color: '#00e5ff', fontWeight: 'bold', fontSize: '20px' },
  btnAdd: { background: '#00e5ff', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  content: { display: 'flex' },
  sidebar: { width: '250px', padding: '30px', borderRight: '1px solid #111' },
  merchantItem: { padding: '15px', background: '#080808', marginBottom: '10px', borderRadius: '10px', cursor: 'pointer', border: '1px solid #111' },
  main: { flex: 1, padding: '40px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '15px' },
  statBox: { background: '#080808', padding: '20px', borderRadius: '12px', border: '1px solid #111', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '14px' },
  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  modal: { background: '#111', padding: '40px', borderRadius: '20px', width: '350px', border: '1px solid #222' },
  input: { width: '100%', padding: '12px', marginBottom: '10px', background: '#000', border: '1px solid #222', color: '#fff', borderRadius: '5px' },
  btnSave: { width: '100%', background: '#00e5ff', border: 'none', padding: '12px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' },
  btnCancel: { width: '100%', background: 'none', border: 'none', color: '#666', cursor: 'pointer' },
  loading: { textAlign: 'center', marginTop: '100px', color: '#00e5ff' },
  empty: { textAlign: 'center', marginTop: '150px', color: '#222' }
};
