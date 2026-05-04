import React, { useState } from "react";
import "./styles.css";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true); // 빠른 확인을 위해 true 세팅
  const [activeTab, setActiveTab] = useState("월별 집계");
  const [showModal, setShowModal] = useState(false);

  // 이미지 기반 가맹점 정보 (배포차)
  const [merchantInfo, setMerchantInfo] = useState({
    name: "배포차",
    region: "서울",
    address: "서울 강남구 도산대로1길 16 지상1, 2층",
    placeUrl: "https://naver.me/xv6tlDW3",
    blogKeyword: "신사역 배포차",
    instaHashtag: "배포차",
    instaChannel: "https://www.instagram.com/bae_po_cha?igsh=MWNhazVidW9hcGZjaQ%3D%3D&utm_source=qr",
    youtubeKeyword: "신사역 배포차"
  });

  return (
    <div className="dashboard-root">
      {/* 1. 사이드바 영역 */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <h2 className="brand-logo">AI매출업</h2>
          <p className="brand-sub">가맹점 분석 시스템</p>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-group-title">가맹점 선택</div>
          <div className="nav-empty">등록된 가맹점이 없습니다.</div>
        </nav>
      </aside>

      {/* 2. 메인 콘텐츠 영역 */}
      <main className="main-content">
        {/* 상단 헤더 섹션 */}
        <header className="content-header">
          <h1 className="page-title">가맹점 선택</h1>
          <div className="header-actions">
            <select className="period-select">
              <option>최근 6개월</option>
              <option>최근 1년</option>
            </select>
            <button className="btn-collect" onClick={() => setShowModal(true)}>🚀 수집 시작</button>
            <button className="btn-excel">📊 엑셀 다운로드 ▾</button>
          </div>
        </header>

        {/* 지표 요약 섹션 (이미지상의 세로 나열 구조) */}
        <section className="summary-section">
          <ul className="summary-list">
            <li>총 언급 수 <strong>0</strong>건</li>
            <li>영수증 리뷰 <strong>0</strong>건</li>
            <li>플레이스 블로그 <strong>0</strong>건</li>
            <li>네이버 블로그 <strong>0</strong>건</li>
            <li>인스타그램 <strong>0</strong>건</li>
            <li>유튜브 조회수 <strong>0</strong>회</li>
          </ul>
        </section>

        {/* 탭 버튼 섹션 */}
        <div className="tab-navigation">
          <button className={`tab-btn ${activeTab === '월별 집계' ? 'active' : ''}`} onClick={() => setActiveTab('월별 집계')}>📊 월별 집계</button>
          <button className={`tab-btn ${activeTab === '일별 집계' ? 'active' : ''}`} onClick={() => setActiveTab('일별 집계')}>📅 일별 집계</button>
          <button className={`tab-btn ${activeTab === 'AI 분석 리포트' ? 'active' : ''}`} onClick={() => setActiveTab('AI 분석 리포트')}>💬 AI 분석 리포트</button>
          <button className={`tab-btn ${activeTab === 'ChatGPT 연동' ? 'active' : ''}`} onClick={() => setActiveTab('ChatGPT 연동')}>🤖 ChatGPT 연동</button>
        </div>

        {/* 데이터 테이블 섹션 */}
        <section className="data-table-container">
          <h3 className="section-subtitle">월별 채널별 집계</h3>
          <table className="analysis-table">
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
                <td colSpan="7" className="empty-row">데이터 없음</td>
              </tr>
            </tbody>
          </table>
        </section>
      </main>

      {/* 3. 가맹점 등록 모달 (20260428_175403.png 스타일) */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <header className="modal-header">
              <h3>신규 가맹점 등록</h3>
            </header>
            <div className="modal-body">
              <div className="input-group"><label>NAME</label><input type="text" value={merchantInfo.name} /></div>
              <div className="input-group"><label>REGION</label><input type="text" value={merchantInfo.region} /></div>
              <div className="input-group"><label>ADDRESS</label><input type="text" value={merchantInfo.address} /></div>
              <div className="input-group"><label>NAVER PLACE URL</label><input type="text" value={merchantInfo.placeUrl} /></div>
              <div className="input-group"><label>BLOG KEYWORDS</label><input type="text" value={merchantInfo.blogKeyword} /></div>
              <div className="input-group"><label>INSTAGRAM HASHTAGS</label><input type="text" value={merchantInfo.instaHashtag} /></div>
              <div className="input-group"><label>INSTAGRAM CHANNEL</label><input type="text" value={merchantInfo.instaChannel} /></div>
              <div className="input-group"><label>YOUTUBE KEYWORDS</label><input type="text" value={merchantInfo.youtubeKeyword} /></div>
            </div>
            <footer className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>취소</button>
              <button className="btn-save">저장</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
