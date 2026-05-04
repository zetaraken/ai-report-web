import React, { useState } from "react";
import "./styles.css";

export default function App() {
  const [showModal, setShowModal] = useState(false);
  const [merchants, setMerchants] = useState([
    {
      id: 1,
      name: "배포차",
      region: "서울",
      address: "서울 강남구 도산대로1길 16 지상1, 2층",
      placeUrl: "https://naver.me/xv6tlDW3",
      blogKeywords: "신사역 배포차",
      instaHashtags: "배포차",
      instaChannel: "https://www.instagram.com/bae_po_cha?igsh=MWNhazVidW9hcGZjaQ%3D%3D&utm_source=qr",
      youtubeKeywords: "신사역 배포차"
    }
  ]);
  const [selectedMerchant, setSelectedMerchant] = useState(null);

  // 모달 입력 데이터 상태
  const [formData, setFormData] = useState({
    name: "",
    region: "",
    address: "",
    placeUrl: "",
    blogKeywords: "",
    instaHashtags: "",
    instaChannel: "",
    youtubeKeywords: ""
  });

  const handleSave = () => {
    if (formData.name) {
      const newMerchant = { ...formData, id: Date.now() };
      setMerchants([...merchants, newMerchant]);
      setSelectedMerchant(newMerchant);
      setShowModal(false);
      // 폼 초기화
      setFormData({ name: "", region: "", address: "", placeUrl: "", blogKeywords: "", instaHashtags: "", instaChannel: "", youtubeKeywords: "" });
    }
  };

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

      {/* 오른쪽 메인 콘텐츠 */}
      <main className="main-content">
        <header className="header">
          <h2>{selectedMerchant ? selectedMerchant.name : "가맹점 선택"}</h2>
          <div className="header-buttons">
            <button className="btn-add" onClick={() => setShowModal(true)}>➕ 가맹점 등록</button>
            <button className="btn-excel">📊 엑셀 다운로드 ▾</button>
          </div>
        </header>

        {/* 대시보드 지표 */}
        <section className="stats-grid">
          <div className="stat-item">
            총 언급 수 <strong>{selectedMerchant ? '124' : '0'}</strong>건
          </div>
          <div className="stat-item">영수증 리뷰 <strong>0</strong>건</div>
          <div className="stat-item">플레이스 블로그 <strong>0</strong>건</div>
          <div className="stat-item">네이버 블로그 <strong>0</strong>건</div>
          <div className="stat-item">인스타그램 <strong>0</strong>건</div>
          <div className="stat-item">유튜브 조회수 <strong>0</strong>회</div>
        </section>

        <div className="tabs">
          <button className="tab active">월별 집계</button>
          <button className="tab">일별 집계</button>
          <button className="tab">AI 분석 리포트</button>
        </div>

        <div className="table-wrapper">
          <p style={{color: '#888', textAlign: 'center', padding: '40px'}}>
            {selectedMerchant ? `${selectedMerchant.name}의 데이터를 분석 중입니다...` : "가맹점을 선택하거나 등록해 주세요."}
          </p>
        </div>
      </main>

      {/* 가맹점 등록 모달 */}
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
                    placeholder={`${key} 입력`}
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
