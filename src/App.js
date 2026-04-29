import React, { useState, useEffect } from "react";
import "./styles.css";

// [수정] 환경변수 우선 적용 및 기본값 설정
const API_BASE = import.meta.env?.VITE_API_BASE_URL || "https://web-production-a7ba9.up.railway.app";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [email, setEmail] = useState("zetarise@gmail.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [report, setReport] = useState(null);
  
  // [추가] 가맹점 등록을 위한 상태값
  const [merchantData, setMerchantData] = useState({
    name: "",
    region: "",
    address: "",
    naver_place_url: "",
    blog_keywords: "",
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // [수정] 백엔드 main.py의 @app.post("/api/auth/login") 경로와 일치시킴
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("token", data.access_token);
        setIsLoggedIn(true);
      } else {
        const errorData = await res.json();
        alert(`로그인 실패: ${errorData.detail || "정보를 확인하세요."}`);
      }
    } catch (err) {
      alert("서버 연결 오류가 발생했습니다.");
    }
  };

  // [추가] 가맹점 등록 함수 (POST /api/merchants)
  const handleAddMerchant = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    
    try {
      const res = await fetch(`${API_BASE}/api/merchants`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(merchantData),
      });

      if (res.ok) {
        alert("가맹점이 성공적으로 등록되었습니다.");
        // 등록 후 입력창 초기화 로직 등 추가 가능
      } else {
        const err = await res.json();
        alert(`등록 오류: ${err.detail || "Not Found"}`);
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
      const res = await fetch(`${API_BASE}/api/reports`, {
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
        const statusRes = await fetch(`${API_BASE}/api/crawl-jobs/${job_id}`, {
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
        {/* 가맹점 등록 섹션 */}
        <div className="panel" style={{ flex: 1 }}>
          <h3>신규 가맹점 등록</h3>
          <form onSubmit={handleAddMerchant}>
            <input placeholder="가맹점명" onChange={e => setMerchantData({...merchantData, name: e.target.value})} required />
            <input placeholder="지역" onChange={e => setMerchantData({...merchantData, region: e.target.value})} required />
            <input placeholder="주소" onChange={e => setMerchantData({...merchantData, address: e.target.value})} required />
            <button type="submit" className="primary">저장</button>
          </form>
        </div>

        {/* 리포트 생성 섹션 */}
        <div className="panel" style={{ flex: 1 }}>
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
