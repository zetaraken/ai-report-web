import React, { useState, useEffect } from "react";
import "./styles.css";

// 1. [수정] 환경변수 우선 적용 및 방어 코드를 포함한 상수 정의
// import.meta.env가 Vite 환경에서 정의되지 않았을 때를 대비합니다.
const viteApiUrl = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_BASE_URL : null;
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || viteApiUrl || "https://web-production-a7ba9.up.railway.app").replace(/\/$/, "");

// 2. [추가] "API_URL is not defined" 에러 방지를 위한 호환성 설정
// 기존 코드 어딘가에서 API_URL을 쓰고 있다면, API_BASE 값을 할당해 줍니다.
const API_URL = API_BASE; 

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [email, setEmail] = useState("zetarise@gmail.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [report, setReport] = useState(null);
  
  // 3. [추가] 가맹점 등록을 위한 상태값 관리
  const [merchantForm, setMerchantForm] = useState({
    name: "", region: "", address: "", naver_place_url: "", blog_keywords: "",
    instagram_hashtags: "", instagram_channel: "", youtube_keywords: ""
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // 4. [핵심 수정] 로그인 경로 불일치 해결
      // 백엔드 main.py의 @app.post("/api/auth/login") 경로와 일치시킵니다.
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.access_token);
        setIsLoggedIn(true);
      } else {
        alert(`로그인 실패: ${data.detail || "정보를 확인하세요."}`);
      }
    } catch (err) {
      alert("서버 연결 오류가 발생했습니다.");
    }
  };

  // 5. [추가] 가맹점 등록 함수 (image_4c39f5.jpg의 POST /api/merchants 호출 해결)
  const handleAddMerchant = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    
    // 쉼표로 구분된 키워드를 배열로 변환하는 유틸리티
    const toArray = (str) => str ? str.split(",").map(s => s.trim()).filter(Boolean) : [];

    // 서버 Pydantic 모델에 맞게 데이터 가공
    const payload = {
      ...merchantForm,
      blog_keywords: toArray(merchantForm.blog_keywords),
      instagram_hashtags: toArray(merchantForm.instagram_hashtags),
      youtube_keywords: toArray(merchantForm.youtube_keywords)
    };

    try {
      const res = await fetch(`${API_URL}/api/merchants`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok) {
        alert("가맹점이 성공적으로 등록되었습니다.");
        setShowMerchantModal(false); // 모달 닫기 로직 (필요시 추가 구현)
      } else {
        alert(`등록 오류: ${result.detail || "Not Found"}`);
      }
    } catch (err) {
      alert("가맹점 등록 중 서버 오류가 발생했습니다.");
    }
  };

  const startCrawl = async (merchantId) => {
    setLoading(true);
    setStatusMsg("수집 요청 중...");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${API_URL}/api/reports`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ merchant_id: merchantId }),
      });
      
      if (!res.ok) throw new Error("요청 실패");
      const { job_id } = await res.json();

      const timer = setInterval(async () => {
        const statusRes = await fetch(`${API_URL}/api/crawl-jobs/${job_id}`, {
          headers: { "Authorization": `Bearer ${token}` },
        });
        const job = await statusRes.json();

        if (job.status === "done") {
          clearInterval(timer);
          setReport(job.result);
          setLoading(false);
          setStatusMsg("수집 완료!");
        } else if (job.status === "error") {
          clearInterval(timer);
          setLoading(false);
          alert(job.message);
        } else {
          setStatusMsg(`데이터 수집 중... (${job.progress || 0}%)`);
        }
      }, 3000);
    } catch (err) {
      setLoading(false);
      alert("서버 연결 오류");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="loginWrap">
        <form className="loginCard" onSubmit={handleLogin}>
          <h1>AI매출업 로그인</h1>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호" />
          <button type="submit" className="primary">로그인</button>
        </form>
      </div>
    );
  }

  return (
    <div className="container">
      <header>
        <h2>경영진단 시스템</h2>
        <button onClick={() => { localStorage.removeItem("token"); setIsLoggedIn(false); }}>로그아웃</button>
      </header>
      
      <main style={{ display: "flex", gap: "20px" }}>
        {/* 6. [추가] 가맹점 등록 섹션 */}
        <div className="panel" style={{ flex: 1, padding: "20px" }}>
          <h3>신규 가맹점 등록</h3>
          <form onSubmit={handleAddMerchant} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <input placeholder="가맹점명" onChange={e => setMerchantForm({...merchantForm, name: e.target.value})} required />
            <input placeholder="지역" onChange={e => setMerchantForm({...merchantForm, region: e.target.value})} required />
            <input placeholder="주소" onChange={e => setMerchantForm({...merchantForm, address: e.target.value})} required />
            <input placeholder="네이버 플레이스 URL" onChange={e => setMerchantForm({...merchantForm, naver_place_url: e.target.value})} />
            <button type="submit" className="primary">저장</button>
          </form>
        </div>

        {/* 리포트 생성 섹션 */}
        <div className="panel" style={{ flex: 1, padding: "20px" }}>
          <h3>리포트 생성</h3>
          <button onClick={() => startCrawl("98도씨국밥 보라매점")} disabled={loading} className="primary">
            {loading ? statusMsg : "98도씨국밥 수집 시작"}
          </button>
          {report && (
            <div className="report-view" style={{ marginTop: "20px" }}>
              <h4>{report.merchant_name} 결과</h4>
              <p>총 언급량: {report.summary.total_mentions}건</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
