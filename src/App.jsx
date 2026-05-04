import React, { useState } from "react";
import "./styles.css";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("최근 6개월");
  
  // 이미지의 '신규 가맹점 등록' 필드를 반영한 상태 관리
  const [merchantData, setMerchantData] = useState({
    name: "배포차",
    region: "서울",
    address: "서울 강남구 도산대로1길 16 지상1, 2층",
    placeUrl: "https://naver.me/xv6tlDW3",
    blogKeywords: "신사역 배포차",
    instaHashtags: "배포차",
    instaChannel: "https://www.instagram.com/bae_po_cha?igsh=MWNhazVidW9hcGZjaQ%3D%3D&utm_source=qr",
    youtubeKeywords: "신사역 배포차"
  });

  if (!isLoggedIn) {
    return (
      <div className="auth-container">
        <div className="login-box">
          <div className="badge">AI매출업</div>
          <h1>가맹점 분석 시스템</h1>
          <p className="subtitle">먼키 · AI매출업 관리자 전용</p>
          <div className="form-group">
            <label>이메일</label>
            <input type="text" defaultValue="zetarise@gmail.com" />
          </div>
          <div className="form-group">
            <label>비밀번호</label>
            <input type="password" defaultValue="****" />
          </div>
          <button className="login-btn" onClick={() => setIsLoggedIn(true)}>로그인</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* 사이드바 */}
      <aside className="sidebar">
        <div className="brand">AI매출업</div>
        <div className="sub-brand">가맹점 분석 시스템</div>
        <nav className="menu">
          <div className="menu-item active">가맹점 선택</div>
          <p className="empty-msg">등록된 가맹점이 없습니다.</p>
        </nav>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="main-content">
        <header className="main-header">
          <h2>가맹점 선택</h2>
          <div className="header-controls">
            <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)}>
              <option>최근 1개월</option>
              <option>최근 6개월</option>
              <option>최근 1년</option>
            </select>
            <button className="btn-collect" onClick={() => setShowModal(true)}>🚀 수집 시작</button>
            <button className="btn-excel">📊 엑셀 다운로드 ▾</button>
          </div>
        </header>

        {/* 상단 요약 카드 */}
        <section className="stats-container">
          <div className="stat-card"><span>총 언급 수</span><strong>0</strong><small>건</small></div>
          <div className="stat-card"><span>영수증 리뷰</span><strong>0</strong><small>건</small></div>
          <div className="stat-card"><span>플레이스 블로그</span><strong>0</strong><small>건</small></div>
          <div className="stat-card"><span>네이버 블로그</span><strong>0</strong><small>건</small></div>
          <div className="stat-card"><span>인스타그램</span><strong>0</strong><small>건</small></div>
          <div className="stat-card"><span>유튜브 조회수</span><strong className="pink-text">0</strong><small>회</small></div>
        </section>

        {/* 탭 메뉴 */}
        <div className="tab-container">
          <button className="tab active">📊 월별 집계</button>
          <button className="tab">📅 일별 집계</button>
          <button className="tab">💬 AI 분석 리포트</button>
          <button className="tab">🤖 ChatGPT 연동</button>
        </div>

        {/* 데이터 테이블 섹션 */}
        <div className="data-section card">
          <h3>월별 채널별 집계</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>월</th>
                <th>네이버 블로그</th>
                <th>인스타그램</th>
                <th>영수증 리뷰</th>
                <th>플레이스 블로그</th>
                <th>유튜브</th>
                <th>합계</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan="7" className="no-data">데이터 없음</td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>

      {/* 가맹점 등록 모달 (이미지 기반 복구) */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>신규 가맹점 등록</h3>
            <div className="modal-body">
              <div className="input-field"><label>NAME</label><input type="text" value={merchantData.name} /></div>
              <div className="input-field"><label>REGION</label><input type="text" value={merchantData.region} /></div>
              <div className="input-field"><label>ADDRESS</label><input type="text" value={merchantData.address} /></div>
              <div className="input-field"><label>NAVER PLACE URL</label><input type="text" value={merchantData.placeUrl} /></div>
              <div className="input-field"><label>BLOG KEYWORDS</label><input type="text" value={merchantData.blogKeywords} /></div>
              <div className="input-field"><label>INSTAGRAM HASHTAGS</label><input type="text" value={merchantData.instaHashtags} /></div>
              <div className="input-field"><label>INSTAGRAM CHANNEL</label><input type="text" value={merchantData.instaChannel} /></div>
              <div className="input-field"><label>YOUTUBE KEYWORDS</label><input type="text" value={merchantData.youtubeKeywords} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>취소</button>
              <button className="btn-save">저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
