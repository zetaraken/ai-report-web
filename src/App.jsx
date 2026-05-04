import React, { useState, useEffect } from "react";

// 기획자님의 Railway 주소
const API_URL = "https://web-production-a7ba9.up.railway.app"; 

export default function App() {
  const [token, setToken] = useState(null);
  const [merchants, setMerchants] = useState([]);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // 매장 등록을 위한 입력 상태
  const [newMerchant, setNewMerchant] = useState({
    name: "", region: "", address: "", naver_place_url: "", blog_keywords: ""
  });

  // 1. 자동 로그인
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
      } catch (e) { console.error("로그인 실패"); }
    };
    autoLogin();
  }, []);

  // 2. 가맹점 목록 조회
  const fetchMerchants = async (authToken) => {
    const res = await fetch(`${API_URL}/api/merchants`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const data = await res.json();
    setMerchants(data);
  };

  // 3. 신규 매장 등록 (서버 전송)
  const handleAddMerchant = async () => {
    if (!newMerchant.name) return alert("매장 이름을 입력해주세요.");
    try {
      const res = await fetch(`${API_URL}/api/merchants`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(newMerchant)
      });
      if (res.ok) {
        alert("매장이 등록되었습니다!");
        setShowModal(false);
        setNewMerchant({ name: "", region: "", address: "", naver_place_url: "", blog_keywords: "" });
        fetchMerchants(token); // 목록 새로고침
      }
    } catch (e) { alert("등록 실패"); }
  };

  // 4. 리포트 생성 요청
  const startCrawl = async (merchant) => {
    setIsLoading(true);
    setSelectedMerchant(null);
    try {
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
        if (jobResult.status === "done") setSelectedMerchant(jobResult.result);
        setIsLoading(false);
      }, 5000);
    } catch (e) { setIsLoading(false); }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.logo}>AI매출업 관리자</div>
        <button onClick={() => setShowModal(true)} style={styles.btnAdd}>+ 새 매장 등록</button>
      </header>

      <div style={styles.content}>
        <aside style={styles.sidebar}>
          <h3 style={{color:'#444', fontSize:'12px'}}>가맹점 리스트</h3>
          {merchants.map(m => (
            <div key={m.id} onClick={() => !isLoading && startCrawl(m)} style={styles.merchantItem}>
              {m.name} <span style={{fontSize:'10px', color:'#555'}}>{m.region}</span>
            </div>
          ))}
        </aside>

        <main style={styles.main}>
          {isLoading ? <div style={styles.loading}>데이터 수집 중...</div> : 
           selectedMerchant ? (
             <div style={styles.report}>
               <h2>{selectedMerchant.merchant_name} 리포트</h2>
               <div style={styles.grid}>
                 <div style={styles.card}>네이버 블로그: {selectedMerchant.stats.naver}</div>
                 <div style={styles.card}>인스타그램: {selectedMerchant.stats.insta}</div>
               </div>
             </div>
           ) : <div style={styles.empty}>매장을 선택하거나 새로 등록해주세요.</div>}
        </main>
      </div>

      {/* 매장 등록 모달 */}
      {showModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={{marginTop:0}}>신규 매장 등록</h3>
            <input style={styles.input} placeholder="매장명 (필수)" onChange={e => setNewMerchant({...newMerchant, name: e.target.value})} />
            <input style={styles.input} placeholder="지역 (예: 서울 신사)" onChange={e => setNewMerchant({...newMerchant, region: e.target.value})} />
            <input style={styles.input} placeholder="네이버 플레이스 URL" onChange={e => setNewMerchant({...newMerchant, naver_place_url: e.target.value})} />
            <input style={styles.input} placeholder="블로그 검색 키워드" onChange={e => setNewMerchant({...newMerchant, blog_keywords: e.target.value})} />
            <div style={{display:'flex', gap:'10px', marginTop:'20px'}}>
              <button onClick={handleAddMerchant} style={styles.btnSave}>등록하기</button>
              <button onClick={() => setShowModal(false)} style={styles.btnCancel}>취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { background: '#000', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', padding: '20px 40px', borderBottom: '1px solid #1a1a1a', alignItems: 'center' },
  logo: { color: '#00e5ff', fontWeight: 'bold', fontSize: '18px' },
  btnAdd: { background: '#00e5ff', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  content: { display: 'flex', padding: '20px' },
  sidebar: { width: '250px', padding: '20px', borderRight: '1px solid #111' },
  merchantItem: { padding: '15px', background: '#0a0a0a', marginBottom: '10px', borderRadius: '8px', cursor: 'pointer', border: '1px solid #1a1a1a' },
  main: { flex: 1, padding: '40px' },
  report: { background: '#0a0a0a', padding: '30px', borderRadius: '15px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' },
  card: { background: '#000', padding: '20px', border: '1px solid #222', borderRadius: '10px' },
  overlay: { position: 'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.8)', display:'flex', justifyContent:'center', alignItems:'center' },
  modal: { background: '#111', padding: '30px', borderRadius: '15px', width: '400px', border: '1px solid #333' },
  input: { width: '100%', padding: '12px', marginBottom: '10px', background: '#000', border: '1px solid #222', color: '#fff', borderRadius: '5px', boxSizing: 'border-box' },
  btnSave: { flex: 1, background: '#00e5ff', border: 'none', padding: '12px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' },
  btnCancel: { background: 'none', border: 'none', color: '#666', cursor: 'pointer' },
  loading: { color: '#00e5ff', textAlign: 'center', marginTop: '100px' },
  empty: { color: '#333', textAlign: 'center', marginTop: '100px' }
};
