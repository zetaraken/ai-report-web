import { useState, useEffect, useRef } from "react";

const API = import.meta.env.VITE_API_BASE_URL || "";

// ── 유틸 ──────────────────────────────────────────────────────────
const adColor = (type) => {
  if (type === "광고") return "var(--ad)";
  if (type === "내돈내산") return "var(--organic)";
  return "var(--unknown)";
};
const adBadge = (type) => {
  if (type === "광고") return "🔴 광고";
  if (type === "내돈내산") return "🟢 내돈내산";
  return "⚪ 판별불가";
};

// ── 가맹점 등록 모달 ──────────────────────────────────────────────
function MerchantModal({ onClose, onSave, editing }) {
  const [form, setForm] = useState(
    editing || { name: "", region: "", place_id: "", instagram_tag: "" }
  );
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name || !form.place_id) {
      alert("가맹점명과 네이버 플레이스 ID는 필수입니다.");
      return;
    }
    await onSave(form);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editing ? "가맹점 수정" : "가맹점 등록"}</h2>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        <div className="form-group">
          <label>가맹점명 *</label>
          <input value={form.name} onChange={set("name")} placeholder="예: 온빈 신정호" />
        </div>
        <div className="form-group">
          <label>지역</label>
          <input value={form.region} onChange={set("region")} placeholder="예: 충남 아산" />
        </div>
        <div className="form-group">
          <label>네이버 플레이스 ID *</label>
          <input value={form.place_id} onChange={set("place_id")} placeholder="예: 1164939221" />
          <small>
            네이버 지도에서 가맹점 검색 → URL의 숫자 부분<br />
            https://m.place.naver.com/restaurant/<strong>1164939221</strong>/home
          </small>
        </div>
        <div className="form-group">
          <label>인스타그램 해시태그 (선택)</label>
          <input value={form.instagram_tag} onChange={set("instagram_tag")} placeholder="예: 온빈신정호 (# 없이 입력)" />
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>취소</button>
          <button className="btn-primary" onClick={handleSubmit}>저장</button>
        </div>
      </div>
    </div>
  );
}

// ── 진행 상태 오버레이 ─────────────────────────────────────────────
function ProgressOverlay({ job }) {
  const pct = job.progress || 0;

  const hint =
    pct >= 10 && pct < 40 ? "📋 더보기 버튼을 반복 클릭하며 영수증리뷰를 수집합니다" :
    pct >= 43 && pct < 57 ? "📝 블로그리뷰 목록을 불러오는 중입니다" :
    pct >= 57 && pct < 75 ? "🔍 블로그 원문을 하나씩 방문해 광고 문구를 확인합니다\n건당 약 8초 소요 · 잠시 기다려 주세요" :
    null;

  return (
    <div className="progress-overlay">
      <div className="progress-card">
        <div className="progress-icon">🔍</div>
        <h3>{job.merchant_name} 분석 중</h3>
        <p className="progress-msg">{job.message}</p>
        <div className="progress-bar-wrap">
          <div className="progress-bar" style={{ width: `${pct}%` }} />
        </div>
        <span className="progress-pct">{pct}%</span>
        {hint && (
          <p className="progress-hint">
            {hint.split("\n").map((line, i) => <span key={i}>{line}<br/></span>)}
          </p>
        )}
      </div>
    </div>
  );
}

// ── 리포트 화면 ───────────────────────────────────────────────────
function Report({ report, onBack }) {
  const [tab, setTab] = useState("summary");
  const s = report.summary;

  const totalBlog = s.total_blog_reviews || 0;
  const totalReceipt = s.total_receipt_reviews || 0;
  const officialReceipt = s.official_receipt_count || 0;
  const officialBlog = s.official_blog_count || 0;

  return (
    <div className="report-page">
      <div className="report-header">
        <button className="back-btn" onClick={onBack}>← 목록으로</button>
        <div>
          <h1>{report.merchant_name}</h1>
          <span className="crawled-at">분석 시각: {new Date(report.crawled_at).toLocaleString("ko-KR")}</span>
        </div>
      </div>

      {/* 공식 수치 배너 */}
      {(officialReceipt > 0 || officialBlog > 0) && (
        <div className="official-banner">
          <span className="banner-icon">📌</span>
          <div className="banner-body">
            <span className="banner-title">네이버 플레이스 공식 수치</span>
            <span className="banner-vals">
              방문자리뷰 <strong>{officialReceipt.toLocaleString()}건</strong>
              &nbsp;·&nbsp;
              블로그리뷰 <strong>{officialBlog.toLocaleString()}건</strong>
            </span>
          </div>
          <div className="banner-collected">
            <span>실제 수집</span>
            <span>영수증 <strong>{totalReceipt}</strong>건 · 블로그 <strong>{totalBlog}</strong>건</span>
          </div>
        </div>
      )}

      {/* 요약 카드 */}
      <div className="summary-grid">
        <div className="stat-card">
          <div className="stat-label">영수증리뷰</div>
          <div className="stat-value">{totalReceipt.toLocaleString()}</div>
          {officialReceipt > 0 && totalReceipt < officialReceipt && (
            <div className="stat-sub">전체 {officialReceipt.toLocaleString()}건 중 수집</div>
          )}
        </div>
        <div className="stat-card">
          <div className="stat-label">블로그리뷰</div>
          <div className="stat-value">{totalBlog.toLocaleString()}</div>
          {officialBlog > 0 && totalBlog < officialBlog && (
            <div className="stat-sub">전체 {officialBlog.toLocaleString()}건 중 수집</div>
          )}
        </div>
        <div className="stat-card">
          <div className="stat-label">네이버 검색 콘텐츠</div>
          <div className="stat-value">{(s.naver_search_count || 0).toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">인스타그램 콘텐츠</div>
          <div className="stat-value">{(s.instagram_count || 0).toLocaleString()}</div>
        </div>
      </div>

      {/* 광고 판별 요약 */}
      <div className="ad-summary">
        <h2>광고 판별 결과</h2>
        <div className="ad-grid">
          <div className="ad-section">
            <h3>📝 블로그리뷰 ({totalBlog}건 원문 분석)</h3>
            <div className="ad-bars">
              <AdBar label="광고"    count={s.blog_ad_count}      total={totalBlog} color="var(--ad)" />
              <AdBar label="내돈내산" count={s.blog_organic_count} total={totalBlog} color="var(--organic)" />
              <AdBar label="판별불가" count={s.blog_unknown_count} total={totalBlog} color="var(--unknown)" />
            </div>
          </div>
          <div className="ad-section">
            <h3>🧾 영수증리뷰 ({totalReceipt}건 분석)</h3>
            <div className="ad-bars">
              <AdBar label="광고"    count={s.receipt_ad_count}      total={totalReceipt} color="var(--ad)" />
              <AdBar label="내돈내산" count={s.receipt_organic_count} total={totalReceipt} color="var(--organic)" />
              <AdBar label="판별불가"
                count={s.receipt_unknown_count ?? (totalReceipt-(s.receipt_ad_count||0)-(s.receipt_organic_count||0))}
                total={totalReceipt} color="var(--unknown)" />
            </div>
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="tab-bar">
        {["summary","receipt","blog"].map((t) => (
          <button key={t} className={`tab-btn ${tab===t?"active":""}`} onClick={()=>setTab(t)}>
            {t==="summary" ? "전체 요약" : t==="receipt" ? `영수증리뷰 (${totalReceipt})` : `블로그리뷰 (${totalBlog})`}
          </button>
        ))}
      </div>

      {tab==="receipt" && <ReviewList reviews={report.naver_receipt_reviews} label="영수증리뷰" />}
      {tab==="blog"    && <ReviewList reviews={report.naver_blog_reviews}    label="블로그리뷰" showLink />}
      {tab==="summary" && (
        <div className="summary-detail">
          <h3>📊 플랫폼별 상세</h3>
          <table className="detail-table">
            <thead>
              <tr>
                <th>플랫폼</th>
                <th>수집 건수</th>
                <th>🔴 광고</th>
                <th>🟢 내돈내산</th>
                <th>⚪ 판별불가</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>네이버 블로그리뷰
                  {officialBlog > 0 && <span className="official-badge">전체 {officialBlog}건</span>}
                </td>
                <td><strong>{totalBlog}</strong></td>
                <td className="ad-cell">{s.blog_ad_count||0}</td>
                <td className="organic-cell">{s.blog_organic_count||0}</td>
                <td className="unknown-cell">{s.blog_unknown_count||0}</td>
              </tr>
              <tr>
                <td>네이버 영수증리뷰
                  {officialReceipt > 0 && <span className="official-badge">전체 {officialReceipt}건</span>}
                </td>
                <td><strong>{totalReceipt}</strong></td>
                <td className="ad-cell">{s.receipt_ad_count||0}</td>
                <td className="organic-cell">{s.receipt_organic_count||0}</td>
                <td className="unknown-cell">
                  {s.receipt_unknown_count ?? (totalReceipt-(s.receipt_ad_count||0)-(s.receipt_organic_count||0))}
                </td>
              </tr>
              <tr>
                <td>네이버 검색결과 (블로그)</td>
                <td colSpan={4}>{(s.naver_search_count||0).toLocaleString()} 건</td>
              </tr>
              <tr>
                <td>인스타그램</td>
                <td colSpan={4}>{(s.instagram_count||0).toLocaleString()} 건</td>
              </tr>
            </tbody>
          </table>
          {(officialReceipt > totalReceipt || officialBlog > totalBlog) && (
            <p className="table-note">
              ※ 네이버의 크롤링 제한으로 인해 전체 건수 중 일부만 수집될 수 있습니다.
              수집 건수는 광고 판별 분석이 완료된 실제 리뷰 수입니다.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function AdBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="ad-bar-row">
      <span className="ad-bar-label">{label}</span>
      <div className="ad-bar-track">
        <div className="ad-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="ad-bar-count">{count}건 ({pct}%)</span>
    </div>
  );
}

function ReviewList({ reviews, label, showLink }) {
  if (!reviews || reviews.length === 0) {
    return <div className="empty">수집된 {label} 데이터가 없습니다.</div>;
  }
  return (
    <div className="review-list">
      <h3>{label} ({reviews.length}건)</h3>
      {reviews.map((r, i) => (
        <div key={i} className="review-card" style={{ borderLeftColor: adColor(r.ad_type) }}>
          <div className="review-top">
            <span className="ad-badge" style={{ background: adColor(r.ad_type) + "22", color: adColor(r.ad_type), border: `1px solid ${adColor(r.ad_type)}` }}>
              {adBadge(r.ad_type)}
            </span>
            {r.ad_basis && <span className="ad-basis">근거: {r.ad_basis}</span>}
          </div>
          {r.title && r.title !== r.text && <div className="review-title">{r.title}</div>}
          <p className="review-text">{r.text || "(내용 없음)"}</p>
          {showLink && r.url && (
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="blog-link">
              원문 보기 →
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

// ── 메인 앱 ───────────────────────────────────────────────────────
export default function App() {
  const [merchants, setMerchants] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [activeJob, setActiveJob] = useState(null);
  const [viewReport, setViewReport] = useState(null);
  const [reports, setReports] = useState({});
  const pollRef = useRef(null);

  // 가맹점 목록 로드
  const loadMerchants = async () => {
    try {
      const res = await fetch(`${API}/api/merchants`);
      const data = await res.json();
      setMerchants(data);
    } catch (e) {
      console.error("가맹점 목록 로드 실패", e);
    }
  };

  useEffect(() => { loadMerchants(); }, []);

  // 가맹점 저장
  const saveMerchant = async (form) => {
    try {
      const method = editing ? "PUT" : "POST";
      const url = editing ? `${API}/api/merchants/${editing.id}` : `${API}/api/merchants`;
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      await loadMerchants();
      setEditing(null);
    } catch (e) {
      alert("저장 실패: " + e.message);
    }
  };

  // 가맹점 삭제
  const deleteMerchant = async (id) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    await fetch(`${API}/api/merchants/${id}`, { method: "DELETE" });
    await loadMerchants();
  };

  // 분석 실행
  const startCrawl = async (merchant) => {
    // 기존 폴링 정리
    if (pollRef.current) clearInterval(pollRef.current);

    try {
      const res = await fetch(`${API}/api/crawl`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchant_id: merchant.id }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `서버 오류 (${res.status})`);
      }

      const { job_id } = await res.json();
      setActiveJob({
        id: job_id,
        merchant_name: merchant.name,
        status: "pending",
        progress: 0,
        message: "분석 시작 중... (서버 준비 중)",
      });

      // ── 서버가 job을 파일에 저장할 시간을 줌 (2초 대기 후 폴링 시작) ──
      await new Promise(r => setTimeout(r, 2000));

      let failCount = 0;
      const MAX_FAIL_INIT = 15;   // 초기 job 생성 대기: 최대 15회(45초) 허용
      const MAX_FAIL_RUN  = 5;    // 실행 중 연속 실패: 최대 5회
      const MAX_POLL = 300;       // 최대 300회 (약 15분)
      let pollCount = 0;
      let jobStarted = false;     // job이 한 번이라도 정상 응답했는지

      pollRef.current = setInterval(async () => {
        pollCount++;

        if (pollCount > MAX_POLL) {
          clearInterval(pollRef.current);
          setActiveJob(null);
          alert("분석 시간이 초과되었습니다 (15분). Railway 서버 로그를 확인해 주세요.");
          return;
        }

        try {
          const statusRes = await fetch(`${API}/api/crawl-jobs/${job_id}`);

          if (statusRes.status === 404) {
            failCount++;
            const maxFail = jobStarted ? MAX_FAIL_RUN : MAX_FAIL_INIT;
            setActiveJob(prev => ({
              ...prev,
              message: jobStarted
                ? `서버 연결 확인 중... (${failCount}/${maxFail})`
                : `서버에서 분석 준비 중... (${failCount}/${maxFail})`,
            }));
            if (failCount >= maxFail) {
              clearInterval(pollRef.current);
              setActiveJob(null);
              alert(
                "분석 작업을 찾을 수 없습니다.\n\n" +
                "원인: Railway 서버가 재시작되었거나 응답이 지연되고 있습니다.\n" +
                "해결: 잠시 후 다시 '분석 실행'을 눌러주세요."
              );
            }
            return;
          }

          if (!statusRes.ok) throw new Error(`HTTP ${statusRes.status}`);

          const job = await statusRes.json();
          failCount = 0;
          jobStarted = true;
          setActiveJob(job);

          if (job.status === "done") {
            clearInterval(pollRef.current);
            const rRes = await fetch(`${API}/api/reports/${merchant.id}`);
            if (!rRes.ok) throw new Error("리포트 로드 실패");
            const rData = await rRes.json();
            setReports(prev => ({ ...prev, [merchant.id]: rData }));
            setTimeout(() => {
              setActiveJob(null);
              setViewReport(rData);
            }, 600);

          } else if (job.status === "error") {
            clearInterval(pollRef.current);
            setActiveJob(null);
            alert("분석 실패: " + job.message);
          }

        } catch (e) {
          failCount++;
          const maxFail = jobStarted ? MAX_FAIL_RUN : MAX_FAIL_INIT;
          console.error("폴링 오류", e);
          setActiveJob(prev => ({
            ...prev,
            message: `서버 연결 재시도 중... (${failCount}/${maxFail})`,
          }));
          if (failCount >= maxFail) {
            clearInterval(pollRef.current);
            setActiveJob(null);
            alert(
              "서버 연결에 실패했습니다.\n\n" +
              "확인 사항:\n" +
              "1. Railway 백엔드가 정상 실행 중인지 확인\n" +
              "2. Vercel 환경변수 VITE_API_BASE_URL이 올바른지 확인\n\n" +
              "잠시 후 다시 시도해 주세요."
            );
          }
        }
      }, 3000);

    } catch (e) {
      alert("분석 시작 실패: " + e.message);
    }
  };

  // 리포트 화면
  if (viewReport) {
    return <Report report={viewReport} onBack={() => setViewReport(null)} />;
  }

  return (
    <div className="app">
      {/* 헤더 */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">📡</span>
            <span className="logo-text">SNS 분석 솔루션</span>
          </div>
          <p className="logo-sub">가맹점 SNS 크롤링 · 광고/내돈내산 자동 판별</p>
        </div>
      </header>

      <main className="main">
        {/* 1단계: 가맹점 등록 */}
        <section className="section">
          <div className="section-header">
            <div>
              <h2>① 가맹점 등록</h2>
              <p>분석할 가맹점의 네이버 플레이스 ID를 등록하세요</p>
            </div>
            <button className="btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>
              + 가맹점 추가
            </button>
          </div>

          {merchants.length === 0 ? (
            <div className="empty-state">
              <span>🏪</span>
              <p>등록된 가맹점이 없습니다<br />'가맹점 추가' 버튼으로 시작하세요</p>
            </div>
          ) : (
            <div className="merchant-list">
              {merchants.map((m) => (
                <div key={m.id} className="merchant-card">
                  <div className="merchant-info">
                    <div className="merchant-name">{m.name}</div>
                    <div className="merchant-meta">
                      <span>📍 {m.region || "지역 미입력"}</span>
                      <span>🔑 플레이스 ID: {m.place_id}</span>
                      {m.instagram_tag && <span>📸 #{m.instagram_tag}</span>}
                    </div>
                    {reports[m.id] && (
                      <div className="report-badge" onClick={() => setViewReport(reports[m.id])}>
                        📊 최근 리포트 보기 →
                      </div>
                    )}
                  </div>
                  <div className="merchant-actions">
                    <button className="btn-run" onClick={() => startCrawl(m)}>
                      🔍 분석 실행
                    </button>
                    <button className="btn-edit" onClick={() => { setEditing(m); setShowModal(true); }}>수정</button>
                    <button className="btn-delete" onClick={() => deleteMerchant(m.id)}>삭제</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 분석 절차 안내 */}
        <section className="section flow-section">
          <h2>분석 절차</h2>
          <div className="flow-steps">
            {[
              { n: "1", icon: "🏪", label: "가맹점 등록", desc: "네이버 플레이스 ID 입력" },
              { n: "2", icon: "▶️", label: "분석 실행", desc: "가맹점 선택 후 분석 시작" },
              { n: "3", icon: "🕷️", label: "크롤링", desc: "영수증리뷰·블로그리뷰·네이버검색·인스타그램 수집" },
              { n: "4", icon: "📊", label: "리포트", desc: "광고/내돈내산/판별불가 분류 결과 확인" },
            ].map((s) => (
              <div key={s.n} className="flow-step">
                <div className="step-num">{s.n}</div>
                <div className="step-icon">{s.icon}</div>
                <div className="step-label">{s.label}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 분석 대상 안내 */}
        <section className="section">
          <h2>분석 대상</h2>
          <div className="target-grid">
            {[
              { icon: "🧾", title: "네이버 영수증리뷰", desc: "실제 방문 영수증 인증 리뷰 수집 및 광고 여부 판별" },
              { icon: "📝", title: "네이버 블로그리뷰", desc: "플레이스 블로그리뷰 → 원문 블로그까지 방문하여 광고 문구 판별" },
              { icon: "🔍", title: "네이버 검색결과", desc: "가맹점 검색 시 노출되는 콘텐츠 총 건수 집계" },
              { icon: "📸", title: "인스타그램", desc: "해시태그 검색 결과 콘텐츠 수 집계" },
            ].map((t) => (
              <div key={t.title} className="target-card">
                <div className="target-icon">{t.icon}</div>
                <div className="target-title">{t.title}</div>
                <div className="target-desc">{t.desc}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {activeJob && <ProgressOverlay job={activeJob} />}
      {showModal && (
        <MerchantModal
          editing={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSave={saveMerchant}
        />
      )}
    </div>
  );
}
