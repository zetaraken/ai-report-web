import React, { useState } from "react";
import "./styles.css";

export default function App() {
  const [activeTab, setActiveTab] = useState("월별 집계");

  return (
    <div className="container">
      {/* 왼쪽 사이드바 */}
      <aside className="sidebar">
        <div className="logo-section">
          <div className="logo-badge">AI매출업</div>
          <p className="logo-text">가맹점 분석 시스템</p>
        </div>
        <nav className="nav-menu">
          <div className="nav-title">가맹점 선택</div>
          <div className="nav-empty">등록된 가맹점이 없습니다.</div>
        </nav>
      </aside>

      {/* 오른쪽 메인 콘텐츠 */}
      <main className="main-content">
        <header className="header">
          <h2>가맹점 선택</h2>
          <div className="header-buttons">
            <select className="select-period">
              <option>최근 6개월</option>
            </select>
            <button className="btn-rocket">🚀 수집 시작</button>
            <button className="btn-excel">📊 엑셀 다운로드 ▾</button>
          </div>
        </header>

        {/* 지표 요약 카드 */}
        <section className="stats-grid">
          <div className="stat-item">총 언급 수 <strong>0</strong>건</div>
          <div className="stat-item">영수증 리뷰 <strong>0</strong>건</div>
          <div className="stat-item">플레이스 블로그 <strong>0</strong>건</div>
          <div className="stat-item">네이버 블로그 <strong>0</strong>건</div>
          <div className="stat-item">인스타그램 <strong>0</strong>건</div>
          <div className="stat-item">유튜브 조회수 <strong>0</strong>회</div>
        </section>

        {/* 탭 메뉴 */}
        <div className="tabs">
          <button className="tab active">📊 월별 집계</button>
          <button className="tab">📅 일별 집계</button>
          <button className="tab">💬 AI 분석 리포트</button>
          <button className="tab">🤖 ChatGPT 연동</button>
        </div>

        {/* 데이터 테이블 */}
        <div className="table-wrapper">
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
              <tr><td colSpan="7">데이터 없음</td></tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
