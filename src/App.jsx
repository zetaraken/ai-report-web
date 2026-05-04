import React, { useState } from "react";
import "./styles.css";

export default function App() {
  const [showModal, setShowModal] = useState(false);
  const [merchants, setMerchants] = useState([]);
  const [selectedMerchant, setSelectedMerchant] = useState(null);

  // 이미지(image_b7ae14.jpg) 기반 기본 데이터
  const [formData, setFormData] = useState({
    name: "배포차",
    region: "서울",
    address: "서울 강남구 도산대로1길 16 지상1, 2층",
    placeUrl: "https://naver.me/xv6tlDW3",
    blogKeywords: "신사역 배포차",
    instaHashtags: "배포차",
    instaChannel: "https://www.instagram.com/bae_po_cha?igsh=MWNhazVidW9hcGZjaQ%3D%3D&utm_source=qr",
    youtubeKeywords: "신사역 배포차"
  });

  const handleSave = () => {
    if (formData.name) {
      const newMerchant = { ...formData, id: Date.now() };
      setMerchants([...merchants, newMerchant]);
      setSelectedMerchant(newMerchant);
      setShowModal(false);
    }
  };

  return (
    <div className="container">
      {/* 1. 왼쪽 사이드바 */}
      <aside className="sidebar">
        <div className="logo-section">
          <div className="logo-badge">AI매출업</div>
          <p className="logo-text">가맹점 분석 시스템</p>
        </div>
        <nav className="nav-menu">
          <div className="nav-title">가맹점 선택</div>
          {merchants.length === 0 ? (
            <div className="nav-empty">등록된 가맹점이 없습니다.</div>
          ) : (
            <div className="merchant-list">
              {merchants.map((m) => (
                <div 
                  key={m.id} 
                  className={`merchant-item ${selectedMerchant?.id === m.id ? 'active' : ''}`}
                  onClick={() => setSelectedMerchant(m)}
                >
                  {m.name}
                </div>
              ))}
            </div>
          )}
        </nav>
      </aside>

      {/* 2. 오른쪽 메인 대시보드 */}
      <main className="main-content">
        <header className="header">
          <h2>{selectedMerchant ? selectedMerchant.name : "가맹점 선택"}</h2>
          <div className="header-buttons">
            <button className="btn-rocket" onClick={() => setShowModal(true)}>➕ 가맹점 등록</button>
            <button className="btn-excel">📊 엑셀 다운로드 ▾</button>
          </div>
        </header>

        <section className="stats-grid">
          <div className="stat-item">
            총 언급 수 <strong>{selectedMerchant ? '124' : '0'}</strong>건
          </div>
        </section>

        {/* 탭 및 테이블 영역은 이전과 동일하게 유지 */}
      </main>

      {/* 3. 신규 가맹점 등록 모달 */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>신규 가맹점 등록</h3>
            </div>
            <div className="modal-body">
              {Object.keys(formData).map((key) => (
                <div className="input-group" key={key}>
                  <label>{key.toUpperCase()}</label>
                  <input 
                    type="text" 
                    value={formData[key]} 
                    onChange={(e) => setFormData({...formData, [key]: e.target.value})}
                  />
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>취소</button>
              <button className="btn-save" onClick={handleSave}>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
