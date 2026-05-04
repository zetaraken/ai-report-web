import React, { useState, useEffect } from "react";

// 기획자님의 실제 Railway 주소를 적용했습니다.
const API_URL = "https://web-production-a7ba9.up.railway.app"; 

export default function App() {
  const [token, setToken] = useState(null);
  const [merchants, setMerchants] = useState([]);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // 1. 서비스 접속 시 자동 로그인 (zetarise@gmail.com / 4858)
  useEffect(() => {
    const autoLogin = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "zetarise@gmail.com", password: "4858" })
        });
        if (!res.ok) throw new Error("로그인 실패");
        const data = await res.json();
        setToken(data.access_token);
        fetchMerchants(data.access_token);
      } catch (e) {
        console.error("연결 오류: 백엔드 서버 상태를 확인하세요.");
      }
    };
    autoLogin();
  }, []);

  // 2. 가맹점 목록 불러오기
  const fetchMerchants = async (authToken) => {
    try {
      const res = await fetch(`${API_URL}/api/merchants`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      setMerchants(data);
    } catch (e) {
      console.error("목록 불러오기 실패");
    }
  };

  // 3. 리포트 생성 및 수집 (5초 시뮬레이션)
  const startCrawl = async (merchant) => {
    if (!token) return;
    setIsLoading(true);
    setSelectedMerchant(null);
    setStatusMessage("데이터를 수집하고 있습니다...");

    try {
      const res = await fetch(`${API_URL}/api/reports`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ merchant_id: merchant.id })
      });
      const { job_id } = await res.json();

      // 작업 완료 여부를 확인하기 위해 5초 대기
      setTimeout(async () => {
        const statusRes = await fetch(`${API_URL}/api/crawl-jobs/${job_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const jobResult = await statusRes.json();
        
        if (jobResult.status === "done") {
          setSelectedMerchant(jobResult.result);
        } else {
          setStatusMessage("수집 중 오류가 발생했습니다.");
        }
        setIsLoading(false);
      }, 5000);
    } catch (e) {
      setIsLoading(false);
      setStatusMessage("서버 연결에 실패했습니다.");
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.logo}>AI매출업</div>
        <div style={styles.status}>{token ? "● 서버 연결됨" : "○ 연결 중..."}</div>
      </header>

      <div style={styles.content}>
        <aside style={styles.sidebar}>
          <h3 style={styles.sideTitle}>가맹점 관리</h3>
          {merchants.length > 0 ? (
            merchants.map(m => (
              <div key={m.id} onClick={() => !isLoading && startCrawl(m)} style={styles.merchantItem}>
                📍 {m.name}
              </div>
            ))
          ) : (
            <p style={styles.emptyText}>등록된 가맹점이 없습니다.<br/>(API에서 가맹점을 추가해주세요)</p>
          )}
        </aside>

        <main style={styles.main}>
          {isLoading ? (
            <div style={styles.loadingBox}>
              <div style={styles.spinner}></div>
              <p>{statusMessage}</p>
            </div>
          ) : selectedMerchant ? (
            <div style={styles.reportCard}>
              <h2 style={styles.merchantName}>{selectedMerchant.merchant_name} 분석 결과</h2>
              <div style={styles.statsGrid}>
                <div style={styles.statBox}><span>네이버 블로그</span><strong>{selectedMerchant.stats.naver}</strong></div>
                <div style={styles.statBox}><span>인스타그램</span><strong>{selectedMerchant.stats.insta}</strong></div>
                <div style={styles.statBox}><span>영수증 리뷰</span><strong>{selectedMerchant.stats.receipt}</strong></div>
                <div style={styles.statBox}><span>유튜브 언급</span><strong>{selectedMerchant.stats.youtube}</strong></div>
              </div>
            </div>
          ) : (
            <div style={styles.emptyMain}>왼쪽 리스트에서 매장을 선택하면<br/>실시간 평판 분석 리포트가 생성됩니다.</div>
          )}
        </main>
      </div>
    </div>
  );
}

const styles = {
  container: { background: '#000', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', padding: '20px 40px', borderBottom: '1px solid #1a1a1a' },
  logo: { fontSize: '20px', fontWeight: 'bold', color: '#00e5ff' },
  status: { fontSize: '12px', color: '#666' },
  content: { display: 'flex', padding: '40px' },
  sidebar: { width: '250px', borderRight: '1px solid #1a1a1a', paddingRight: '20px' },
  sideTitle: { fontSize: '14px', color: '#444', marginBottom: '20px' },
  merchantItem: { padding: '15px', background: '#080808', marginBottom: '10px', borderRadius: '8px', cursor: 'pointer', border: '1px solid #111', transition: '0.3s' },
  emptyText: { color: '#333', fontSize: '13px', lineHeight: '1.6' },
  main: { flex: 1, paddingLeft: '60px' },
  loadingBox: { textAlign: 'center', marginTop: '100px', color: '#00e5ff' },
  spinner: { width: '40px', height: '40px', border: '3px solid #00e5ff22', borderTop: '3px solid #00e5ff', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 1s linear infinite' },
  reportCard: { background: '#080808', padding: '40px', borderRadius: '20px', border: '1px solid #1a1a1a' },
  merchantName: { fontSize: '28px', marginBottom: '30px', color: '#00e5ff' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' },
  statBox: { background: '#000', padding: '20px', borderRadius: '12px', border: '1px solid #111', display: 'flex', flexDirection: 'column' },
  emptyMain: { textAlign: 'center', marginTop: '150px', color: '#222', fontSize: '18px', lineHeight: '1.6' }
};
