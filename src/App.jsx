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
    editing || { name: "", place_id: "", addr_keyword: "", instagram_tag: "" }
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
          <label>네이버 플레이스 ID *</label>
          <input value={form.place_id} onChange={set("place_id")} placeholder="예: 1164939221" />
          <small>
            네이버 지도에서 가맹점 검색 → URL의 숫자 부분<br />
            https://m.place.naver.com/restaurant/<strong>1164939221</strong>/home
          </small>
        </div>
        <div className="form-group">
          <label>동네명 (블로그 검색 필터용)</label>
          <input value={form.addr_keyword || ""} onChange={set("addr_keyword")} placeholder="예: 방교동, 역삼동, 신정호동" />
          <small>네이버 플레이스 주소의 읍면동명 — 입력 시 블로그 검색 정확도가 높아집니다</small>
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
    pct >= 10 && pct < 40 ? `📋 더보기 버튼을 반복 클릭하며 영수증리뷰를 수집합니다\n(리뷰 239건 기준 약 24회 클릭 · 5~8분 소요)` :
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
// ── 리포트 화면 ───────────────────────────────────────────────────
function Report({ report, onBack }) {
  const [tab, setTab] = useState("summary");
  const s = report.summary;

  const totalBlog    = s.total_blog_reviews || 0;
  const totalReceipt = s.total_receipt_reviews || 0;
  const officialReceipt     = s.official_receipt_count || 0;
  const officialTextReceipt = s.official_receipt_text_count || officialReceipt;
  const officialKwReceipt   = s.official_receipt_keyword || 0;
  const officialBlog        = s.official_blog_count || 0;
  const igCount    = s.instagram_count || 0;
  const naverCount = s.naver_search_count || 0;
  const totalAll   = totalReceipt + totalBlog + igCount + naverCount;

  const adCount  = s.blog_ad_count || 0;
  const orgCount = s.blog_organic_count || 0;
  const unkCount = s.blog_unknown_count || 0;
  const adPct    = totalBlog > 0 ? Math.round(adCount  / totalBlog * 100) : 0;
  const orgPct   = totalBlog > 0 ? Math.round(orgCount / totalBlog * 100) : 0;

  const sent    = s.sentiment || {};
  const monthly = s.monthly_blog_stats || [];
  const monthlyReceipt = s.monthly_receipt_stats || [];
  const kwBlog  = s.top_keywords_blog || [];
  const kwAnalysis = s.keyword_analysis || null;
  const insights = s.insights || [];

  const crawledAt = new Date(report.crawled_at).toLocaleDateString("ko-KR", {year:"numeric",month:"long",day:"numeric"});

  return (
    <div className="rpt-page">
      {/* ── 헤더 ── */}
      <div className="rpt-header">
        <button className="back-btn" onClick={onBack}>← 목록으로</button>
        <h1 className="rpt-title">{report.merchant_name} 소셜 빅데이터 분석 리포트</h1>
        <p className="rpt-subtitle">온라인 평판 · 광고 판별 · 감성 분석</p>
        <div className="rpt-pills">
          <span className="rpt-pill">분석일 {crawledAt}</span>
          <span className="rpt-pill">영수증 {totalReceipt}건 수집</span>
          <span className="rpt-pill">블로그 {totalBlog}건 분석</span>
          {igCount > 0 && <span className="rpt-pill">인스타 {igCount}건</span>}
          <span className="rpt-pill">광고 {adPct}% · 내돈내산 {orgPct}%</span>
        </div>
      </div>

      {/* ── 공식 수치 배너 (기존 유지) ── */}
      {(officialReceipt > 0 || officialBlog > 0) && (
        <div className="official-banner">
          <span className="banner-icon">📌</span>
          <div className="banner-body">
            <span className="banner-title">네이버 플레이스 공식 수치</span>
            <div className="banner-vals">
              <span>방문자리뷰 <strong>{officialReceipt.toLocaleString()}건</strong></span>
              <span className="banner-sub-row">
                <span className="banner-sub">📷 사진·영상 <b>{officialTextReceipt.toLocaleString()}건</b></span>
                <span className="banner-sub">🏷️ 키워드·별점 <b>{officialKwReceipt.toLocaleString()}건</b></span>
              </span>
              <span>블로그리뷰 <strong>{officialBlog.toLocaleString()}건</strong></span>
            </div>
          </div>
          <div className="banner-collected">
            <span>실제 수집</span>
            <span>영수증 <strong>{totalReceipt}</strong>건 · 블로그 <strong>{totalBlog}</strong>건</span>
          </div>
        </div>
      )}

      {/* ── 요약 카드 4개 (기존 유지) ── */}
      <div className="summary-grid">
        <div className="stat-card">
          <div className="stat-label">방문자리뷰 (전체)</div>
          <div className="stat-value">{officialReceipt.toLocaleString()}</div>
          {officialKwReceipt > 0 && (
            <div className="stat-breakdown">
              <span>📷 사진·영상 {officialTextReceipt}건</span>
              <span>🏷️ 키워드·별점 {officialKwReceipt}건</span>
            </div>
          )}
          <div className="stat-sub">수집 {totalReceipt}건</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">블로그리뷰</div>
          <div className="stat-value">{(officialBlog || totalBlog).toLocaleString()}</div>
          {officialBlog > 0 && <div className="stat-sub">수집 {totalBlog}건</div>}
        </div>
        <div className="stat-card">
          <div className="stat-label">네이버 검색 콘텐츠</div>
          <div className="stat-value">{naverCount.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">인스타그램 콘텐츠</div>
          <div className="stat-value">{igCount.toLocaleString()}</div>
        </div>
      </div>


      {/* ── Executive Summary ── */}
      <div className="rpt-exec">
        <h2>Executive Summary (종합 요약)</h2>
        {sent.positive_pct != null ? (
          <>
            <p>수집된 전체 리뷰의 <strong>{sent.positive_pct}%가 긍정 반응</strong>으로, 방문 고객의 전반적인 만족도가 높은 상태입니다. 부정 반응은 {sent.negative_pct}%로 {sent.negative_pct < 20 ? "낮은 수준이며 주로 대기·혼잡 관련 의견" : "주요 불만 요인에 대한 개선이 필요"}합니다.</p>
            <p>블로그 리뷰 {totalBlog}건을 원문 분석한 결과, <strong>내돈내산 {orgPct}%({orgCount}건)</strong>으로 실제 고객의 자발적 후기 비중이 {orgPct >= 60 ? "높습니다" : "개선이 필요합니다"}. 광고성 게시글은 {adPct}%({adCount}건)입니다.</p>
            {kwBlog.length > 0 && <p>고객들이 가장 많이 언급한 키워드는 <strong>'{kwBlog[0]?.word}'</strong>이며, 이 키워드를 중심으로 온라인 마케팅 전략을 강화하면 검색 노출과 방문 전환율을 높일 수 있습니다.</p>}
          </>
        ) : (
          <p>총 수집 데이터 {totalBlog + totalReceipt}건(블로그 {totalBlog}건 + 영수증 {totalReceipt}건)을 분석한 결과입니다. 광고 판별: 내돈내산 {orgPct}%, 광고 {adPct}%.</p>
        )}
      </div>

      {/* ── 플랫폼별 + 광고판별 ── */}
      <div className="rpt-2col">
        <div className="rpt-card">
          <div className="rpt-card-header">
            <div className="rpt-en-title">Platform Data</div>
            <h2>플랫폼별 수집 현황</h2>
          </div>
          <table className="rpt-table">
            <thead><tr><th>플랫폼</th><th>공식</th><th>수집</th><th>점유율</th></tr></thead>
            <tbody>
              <tr><td>🧾 영수증리뷰</td><td>{officialReceipt.toLocaleString()}</td><td><strong>{totalReceipt}</strong></td><td>{totalAll>0?Math.round(totalReceipt/totalAll*100):0}%</td></tr>
              <tr><td>📝 블로그리뷰</td><td>{(officialBlog||totalBlog).toLocaleString()}</td><td><strong>{totalBlog}</strong></td><td>{totalAll>0?Math.round(totalBlog/totalAll*100):0}%</td></tr>
              <tr><td>📸 인스타그램</td><td>-</td><td><strong>{igCount}</strong></td><td>{totalAll>0?Math.round(igCount/totalAll*100):0}%</td></tr>
              <tr><td>🔍 네이버 검색</td><td>-</td><td><strong>{naverCount}</strong></td><td>-</td></tr>
              <tr className="rpt-table-total"><td>합계</td><td>-</td><td><strong>{(totalReceipt+totalBlog+igCount).toLocaleString()}</strong></td><td>100%</td></tr>
            </tbody>
          </table>
        </div>

        <div className="rpt-card">
          <div className="rpt-card-header">
            <div className="rpt-en-title">Ad Detection</div>
            <h2>블로그 광고 판별</h2>
          </div>
          <div className="rpt-ad-donut">
            <svg viewBox="0 0 120 120" width="130" height="130">
              {(() => {
                const r=45; const cx=60; const cy=60; const circ=2*Math.PI*r;
                const slices=[{pct:adPct,color:"#e74c6f"},{pct:orgPct,color:"#27c98f"},{pct:100-adPct-orgPct,color:"#8890a4"}];
                let offset=0;
                return slices.map((sl,i)=>{
                  const len=circ*sl.pct/100;
                  const el=<circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={sl.color} strokeWidth="22" strokeDasharray={`${len} ${circ-len}`} strokeDashoffset={-offset} transform={`rotate(-90 ${cx} ${cy})`}/>;
                  offset+=len; return el;
                });
              })()}
              <text x="60" y="56" textAnchor="middle" fontSize="14" fontWeight="700" fill="#334155">{orgPct}%</text>
              <text x="60" y="70" textAnchor="middle" fontSize="8" fill="#64748b">내돈내산</text>
            </svg>
            <div className="rpt-ad-legend">
              <div className="rpt-ad-leg-item"><span style={{background:"#e74c6f"}}></span>광고 {adPct}% ({adCount}건)</div>
              <div className="rpt-ad-leg-item"><span style={{background:"#27c98f"}}></span>내돈내산 {orgPct}% ({orgCount}건)</div>
              <div className="rpt-ad-leg-item"><span style={{background:"#8890a4"}}></span>판별불가 {100-adPct-orgPct}% ({unkCount}건)</div>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"8px",marginTop:"12px"}}>
            <AdBar label="광고"    count={adCount}  total={totalBlog} color="#e74c6f" />
            <AdBar label="내돈내산" count={orgCount} total={totalBlog} color="#27c98f" />
            <AdBar label="판별불가" count={unkCount} total={totalBlog} color="#8890a4" />
          </div>
        </div>
      </div>

      {/* ── 감성분석 + 키워드 ── */}
      {sent.positive_pct != null && (
        <div className="rpt-2col">
          {/* 감성 분석 */}
          <div className="rpt-card">
            <div className="rpt-card-header">
              <div className="rpt-en-title">SENTIMENT ANALYSIS</div>
              <h2>감성 분석</h2>
            </div>

            {/* 긍정 카드 */}
            <div className="rpt-sent-v2 rpt-sent-v2--pos">
              <div className="rpt-sent-v2-head">
                <span className="rpt-sent-v2-icon">👍</span>
                <span className="rpt-sent-v2-label">긍정</span>
                <span className="rpt-sent-v2-pct">({sent.positive_pct}%)</span>
              </div>
              {(s.pos_keywords||[]).length > 0 && (
                <p className="rpt-sent-v2-kw">
                  <b>대표 키워드:</b> {(s.pos_keywords||[]).slice(0,5).map(k=>k.word).join(", ")}
                </p>
              )}
              {sent.pos_voc?.length > 0 && (
                <p className="rpt-sent-v2-voc">
                  <b>주요 의견:</b> {sent.pos_voc.slice(0,3).map(v => `"${v.replace(/이전다음.*/,"").trim().slice(0,25)}"`).join(", ")}
                </p>
              )}
            </div>

            {/* 중립 카드 */}
            <div className="rpt-sent-v2 rpt-sent-v2--neu">
              <div className="rpt-sent-v2-head">
                <span className="rpt-sent-v2-icon">➖</span>
                <span className="rpt-sent-v2-label">중립</span>
                <span className="rpt-sent-v2-pct">({sent.neutral_pct}%)</span>
              </div>
              <p className="rpt-sent-v2-kw">
                <b>대표 키워드:</b> 위치·영업시간·예약링크·정보공유 등 정보 전달형 언급 ({sent.neutral_count}건)
              </p>
            </div>

            {/* 부정 카드 */}
            <div className="rpt-sent-v2 rpt-sent-v2--neg">
              <div className="rpt-sent-v2-head">
                <span className="rpt-sent-v2-icon">👎</span>
                <span className="rpt-sent-v2-label">부정</span>
                <span className="rpt-sent-v2-pct">({sent.negative_pct}%)</span>
              </div>
              {(s.neg_keywords||[]).length > 0
                ? <p className="rpt-sent-v2-kw"><b>대표 키워드:</b> {(s.neg_keywords||[]).slice(0,4).map(k=>k.word).join(", ")}</p>
                : <p className="rpt-sent-v2-kw"><b>대표 키워드:</b> 특이 불만 키워드 없음</p>
              }
              <p className="rpt-sent-v2-note"><b>비고:</b> {
                sent.negative_pct <= 5 ? "인기 매장에서 공통적으로 나타나는 수준으로, 지속적 모니터링을 권장합니다."
                : sent.negative_pct <= 15 ? "반복 언급 불만 요소를 중심으로 운영 개선 방안을 마련하세요."
                : "부정 반응 비중이 높습니다. 주요 불만 키워드를 중심으로 즉각적인 운영 점검이 필요합니다."
              }</p>
            </div>

            {/* 감성 분석 인사이트 */}
            <div className="rpt-sent-v2-insight">
              <div className="rpt-sent-v2-insight-title">💡 감성 분석 인사이트</div>
              <p>
                <b>긍정 감성 {sent.positive_pct}%는 {
                  sent.positive_pct >= 85 ? "매우 우수한" :
                  sent.positive_pct >= 70 ? "양호한" : "개선이 필요한"
                } 지표입니다.</b>
                {(s.pos_keywords||[]).length >= 2
                  ? ` 고객 리뷰에서 "${(s.pos_keywords||[])[0]?.word}", "${(s.pos_keywords||[])[1]?.word}" 등의 표현이 반복적으로 확인되며, 이는 매장의 핵심 경쟁력으로 작동하고 있습니다.`
                  : " 고객의 전반적인 만족도가 높게 유지되고 있습니다."}
                {` 부정 반응 ${sent.negative_pct}%(${sent.negative_count}건)${
                  sent.negative_pct <= 5 ? "는 매우 낮은 수준으로 주요 불만 요인이 제한적입니다."
                  : sent.negative_pct <= 15 ? " — 반복되는 불만 키워드를 선제적으로 모니터링하세요."
                  : "은 개선이 시급합니다. 주요 불만 요인에 대한 즉각적인 운영 조치가 필요합니다."
                }`}
              </p>
            </div>
          </div>

                    ))}
                  </div>
                </div>

                {/* 카테고리별 카드 */}
                {kwAnalysis && (kwAnalysis.menu.length > 0 || kwAnalysis.location.length > 0 || kwAnalysis.experience.length > 0) && (
                  <div className="rpt-kw-cat-grid">
                    <div className="rpt-kw-cat rpt-kw-cat--menu">
                      <div className="rpt-kw-cat-title">🍽️ 메뉴 키워드</div>
                      {kwAnalysis.menu.length > 0 ? (
                        <ul className="rpt-kw-cat-list">
                          {kwAnalysis.menu.map((k,i)=>(
                            <li key={i}>
                              <span className="rpt-kw-cat-word">{k.word}</span>
                              <span className="rpt-kw-cat-count">({k.count}회 언급)</span>
                            </li>
                          ))}
                        </ul>
                      ) : <p className="rpt-kw-cat-empty">해당 없음</p>}
                    </div>
                    <div className="rpt-kw-cat rpt-kw-cat--loc">
                      <div className="rpt-kw-cat-title">📍 위치 키워드</div>
                      {kwAnalysis.location.length > 0 ? (
                        <ul className="rpt-kw-cat-list">
                          {kwAnalysis.location.map((k,i)=>(
                            <li key={i}>
                              <span className="rpt-kw-cat-word">{k.word}</span>
                              <span className="rpt-kw-cat-count">({k.count}회 언급)</span>
                            </li>
                          ))}
                        </ul>
                      ) : <p className="rpt-kw-cat-empty">해당 없음</p>}
                    </div>
                    <div className="rpt-kw-cat rpt-kw-cat--exp">
                      <div className="rpt-kw-cat-title">👥 경험 키워드</div>
                      {kwAnalysis.experience.length > 0 ? (
                        <ul className="rpt-kw-cat-list">
                          {kwAnalysis.experience.map((k,i)=>(
                            <li key={i}>
                              <span className="rpt-kw-cat-word">{k.word}</span>
                              <span className="rpt-kw-cat-count">({k.count}회 언급)</span>
                            </li>
                          ))}
                        </ul>
                      ) : <p className="rpt-kw-cat-empty">해당 없음</p>}
                    </div>
                  </div>
                )}

                {/* 주요 분석 키워드 Top 5 — 카테고리 균형 선정 */}
                {(() => {
                  const top5 = kwAnalysis?.top5 || (kwAnalysis?.top_all || kwBlog).slice(0,5).map((k,i)=>({...k,category:"핵심 키워드"}));
                  const catDesc = {
                    "메뉴 키워드": (w,c) => `${c}회 언급. 고객이 가장 자주 언급하는 메뉴 키워드로, 방문 동기와 주문 결정에 직접적으로 영향을 주는 핵심 표현입니다.`,
                    "위치 키워드": (w,c) => `${c}회 언급. 매장 위치·접근성과 연결되는 지역 기반 키워드로, 네이버 검색 노출과 로컬 발견 가능성을 높입니다.`,
                    "경험 키워드": (w,c) => `${c}회 언급. 방문 경험·서비스·예약 등 고객 이용 맥락이 반복 언급되는 키워드로, 재방문 유도에 유리합니다.`,
                    "핵심 키워드": (w,c) => `${c}회 언급. 블로그·영수증 리뷰 전체에서 반복 등장하는 핵심 표현으로, 온라인 마케팅 콘텐츠 기획 시 우선 활용을 권장합니다.`,
                  };
                  return (
                    <div className="rpt-kw-top5-wrap">
                      <div className="rpt-kw-top5-title">주요 분석 키워드 Top 5</div>
                      <ol className="rpt-kw-top5-list">
                        {top5.map((kw,i) => (
                          <li key={i}>
                            <span className="rpt-kw-top5-cat">{kw.category || "핵심 키워드"}</span>
                            <strong> #{kw.word}</strong>: {(catDesc[kw.category] || catDesc["핵심 키워드"])(kw.word, kw.count)}
                          </li>
                        ))}
                      </ol>
                    </div>
                  );
                })()}
              </>
            ) : <p style={{color:"#64748b",fontSize:"13px"}}>재분석 후 키워드 데이터가 표시됩니다.</p>}
          </div>
        </div>
      )}



      {/* ── 월별 트렌드 + 상세 데이터 ── */}
      {(() => {
        // 날짜 확인된 블로그+영수증 합산
        const datedBlog    = monthly.reduce((s, m) => s + m.total, 0);
        const datedReceipt = monthlyReceipt.reduce((s, m) => s + m.count, 0);
        const undatedBlog  = totalBlog - datedBlog;
        if (datedBlog === 0 && datedReceipt === 0 && undatedBlog === 0) return null;

        // 블로그+영수증 월 목록 합산
        const allMonths = [...new Set([
          ...monthly.map(m => m.month),
          ...monthlyReceipt.map(m => m.month),
        ])].sort();

        const trendData = allMonths.map(month => {
          const blog    = monthly.find(m => m.month === month) || {total:0,ad:0,organic:0,unknown:0};
          const receipt = monthlyReceipt.find(m => m.month === month) || {count:0};
          return {
            month:    month.slice(2).replace("-", "."),
            fullMonth: month,
            naverBlog: blog.total,
            receipt:   receipt.count,
            ad:        blog.ad,
            organic:   blog.organic,
            unknown:   blog.unknown || 0,
            total:     blog.total + receipt.count,
          };
        });
        const maxTotal  = Math.max(...trendData.map(d => d.total), 1);
        const peakIdx   = trendData.reduce((pi, d, i, arr) => d.total > arr[pi].total ? i : pi, 0);
        const W = Math.max(trendData.length * 90 + 60, 300);

        return (
          <>
            {/* 월별 트렌드 라인차트 */}
            <div className="rpt-card">
              <div className="rpt-card-header">
                <div className="rpt-en-title">MONTHLY TREND</div>
                <h2>월별 트렌드 분석</h2>
              </div>
              {trendData.length > 0 ? (
                <div className="rpt-trend-chart">
                  <svg viewBox={`0 0 ${W} 210`} className="rpt-trend-svg">
                    {/* 그리드 */}
                    {[0,25,50,75,100].map(pct => (
                      <g key={pct}>
                        <line x1="36" y1={185 - pct*1.6} x2={W-10} y2={185 - pct*1.6}
                          stroke="#2a3145" strokeWidth="1"/>
                        <text x="32" y={189 - pct*1.6} textAnchor="end" fontSize="9" fill="#64748b">
                          {Math.round(maxTotal * pct / 100)}
                        </text>
                      </g>
                    ))}
                    {/* 라인 */}
                    {trendData.length > 1 && (
                      <polyline fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinejoin="round"
                        points={trendData.map((d,i) =>
                          `${i*90+65},${185-(d.total/maxTotal)*160}`
                        ).join(" ")}
                      />
                    )}
                    {/* 점 + 라벨 */}
                    {trendData.map((d, i) => {
                      const cx = i*90+65;
                      const cy = 185-(d.total/maxTotal)*160;
                      const isPeak = i === peakIdx;
                      return (
                        <g key={i}>
                          <circle cx={cx} cy={cy} r={isPeak?7:5}
                            fill={isPeak?"#1d4ed8":"#3b82f6"} stroke="white" strokeWidth="2"/>
                          <text x={cx} y={cy-13} textAnchor="middle"
                            fontSize="12" fontWeight="700"
                            fill={isPeak?"#93c5fd":"#e2e8f0"}>{d.total}</text>
                          {isPeak && trendData.length > 1 && (
                            <g>
                              <rect x={cx-46} y={cy-36} width={92} height={18}
                                rx="4" fill="#1d4ed8" opacity="0.95"/>
                              <text x={cx} y={cy-23} textAnchor="middle"
                                fontSize="9" fill="white">▲ 최고 기록 월</text>
                            </g>
                          )}
                          <text x={cx} y={202} textAnchor="middle"
                            fontSize="10" fontWeight={isPeak?"700":"400"}
                            fill={isPeak?"#60a5fa":"#64748b"}>{d.month}</text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              ) : (
                <p className="rpt-trend-note" style={{padding:"20px 0"}}>
                  날짜가 확인된 블로그 게시글이 없어 트렌드를 표시할 수 없습니다.
                </p>
              )}
              <p className="rpt-trend-note">
                * 날짜가 확인된 블로그 {datedBlog}건 / 영수증 {datedReceipt}건 기준 /
                날짜 미확인 {undatedBlog}건은 월별 집계에서 제외됨
                {trendData.length >= 2 && (() => {
                  const last = trendData[trendData.length-1];
                  const prev = trendData[trendData.length-2];
                  if (prev.total > 0 && last.total > prev.total) {
                    const growPct = Math.round((last.total - prev.total) / prev.total * 100);
                    return ` / ${prev.month} → ${last.month} +${growPct}% 성장`;
                  }
                  return "";
                })()}
              </p>
            </div>

            {/* 월별 상세 데이터 테이블 */}
            <div className="rpt-card">
              <div className="rpt-card-header">
                <div className="rpt-en-title">RAW DATA</div>
                <h2>월별 상세 데이터</h2>
              </div>
              <div className="rpt-monthly-table-wrap">
                <table className="rpt-monthly-table">
                  <thead>
                    <tr>
                      <th>월 구분</th>
                      <th>영수증<br/>리뷰</th>
                      <th>블로그<br/>합계</th>
                      <th>광고</th>
                      <th>내돈내산</th>
                      <th>합계</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trendData.map((d, i) => (
                      <tr key={i} className={i === peakIdx ? "rpt-table-peak" : ""}>
                        <td><strong>{d.month}</strong></td>
                        <td>{d.receipt > 0 ? d.receipt : "-"}</td>
                        <td><strong>{d.naverBlog}</strong></td>
                        <td style={{color:"#e74c6f"}}>{d.ad}</td>
                        <td style={{color:"#27c98f"}}>{d.organic}</td>
                        <td><strong>{d.total}</strong></td>
                      </tr>
                    ))}
                    {undatedBlog > 0 && (
                      <tr style={{opacity:0.5}}>
                        <td><em>날짜 미확인</em></td>
                        <td>-</td>
                        <td><em>{undatedBlog}</em></td>
                        <td colSpan="3" style={{fontSize:"11px",color:"#64748b"}}>월별 집계 제외</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td><strong>누적 합계</strong></td>
                      <td><strong>{datedReceipt}</strong></td>
                      <td><strong>{totalBlog}</strong></td>
                      <td style={{color:"#e74c6f"}}><strong>{adCount}</strong></td>
                      <td style={{color:"#27c98f"}}><strong>{orgCount}</strong></td>
                      <td><strong>{datedReceipt + totalBlog}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        );
      })()}

      {/* ── 마케팅 인사이트 ── */}
      {insights.length > 0 && (
        <div className="rpt-card">
          <div className="rpt-card-header">
            <div className="rpt-en-title">Actionable Insights</div>
            <h2>마케팅 인사이트 및 전략 제안</h2>
          </div>
          <div className="rpt-insight-grid">
            {insights.map((ins,i)=>(
              <div key={i} className={`rpt-insight-card rpt-insight-${ins.type}`}>
                <h3>{String(i+1).padStart(2,"0")}. {ins.title}</h3>
                <p>{ins.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 상세 데이터 탭 ── */}
      <div className="rpt-card">
        <div className="rpt-card-header">
          <div className="rpt-en-title">Raw Data</div>
          <h2>수집 리뷰 상세</h2>
        </div>
        <div className="tab-bar">
          {["summary","receipt","blog"].map((t)=>(
            <button key={t} className={`tab-btn ${tab===t?"active":""}`} onClick={()=>setTab(t)}>
              {t==="summary"?"전체 요약":t==="receipt"?`영수증리뷰 (${totalReceipt})`:`블로그리뷰 (${totalBlog})`}
            </button>
          ))}
        </div>
        {tab==="receipt" && <ReviewList reviews={report.naver_receipt_reviews} label="영수증리뷰" />}
        {tab==="blog"    && <ReviewList reviews={report.naver_blog_reviews}    label="블로그리뷰" showLink />}
        {tab==="summary" && (
          <div className="summary-detail">
            <table className="detail-table">
              <thead><tr><th>플랫폼</th><th>공식 전체</th><th>수집 건수</th><th>🔴 광고</th><th>🟢 내돈내산</th><th>⚪ 판별불가</th></tr></thead>
              <tbody>
                <tr><td>네이버 블로그리뷰</td><td>{(officialBlog||totalBlog).toLocaleString()}</td><td><strong>{totalBlog}</strong></td><td className="ad-cell">{adCount}</td><td className="organic-cell">{orgCount}</td><td className="unknown-cell">{unkCount}</td></tr>
                <tr><td>네이버 방문자리뷰</td><td>{officialReceipt.toLocaleString()}</td><td><strong>{totalReceipt}</strong></td><td colSpan={3} className="unknown-cell">해당 없음</td></tr>
                {officialKwReceipt > 0 && <>
                <tr className="sub-row"><td>&nbsp;&nbsp;└ 📷 사진·영상</td><td>{officialTextReceipt}</td><td>{totalReceipt}</td><td colSpan={3} className="unknown-cell">수집 대상</td></tr>
                <tr className="sub-row"><td>&nbsp;&nbsp;└ 🏷️ 키워드·별점</td><td>{officialKwReceipt}</td><td>-</td><td colSpan={3} className="unknown-cell">텍스트 없음</td></tr>
                </>}
                <tr><td>네이버 검색결과</td><td colSpan={5}>{naverCount.toLocaleString()} 건</td></tr>
                <tr><td>인스타그램</td><td colSpan={5}>{igCount.toLocaleString()} 건</td></tr>
              </tbody>
            </table>
            {(officialReceipt > totalReceipt || officialBlog > totalBlog) && (
              <p className="table-note">※ 네이버 크롤링 제한으로 전체 건수 중 일부만 수집됩니다.</p>
            )}
          </div>
        )}
      </div>

      {/* ── 푸터 ── */}
      <div className="rpt-footer">
        <div>※ 본 리포트는 실제 크롤링 데이터 기반으로 자동 생성된 분석 문서입니다.</div>
        <div>※ 블로그 광고 판별은 협찬 배지(reviewnote 등) 및 광고 키워드 자동 감지 방식으로 이루어집니다.</div>
        <div>※ 감성 분석은 수집된 리뷰 텍스트의 긍정/부정 키워드 빈도 기반 해석 지수입니다.</div>
      </div>
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
      // 가맹점 로드 직후 기존 리포트 자동 복원
      await loadAllReports(data);
    } catch (e) {
      console.error("가맹점 목록 로드 실패", e);
    }
  };

  // 전체 가맹점의 기존 리포트를 백엔드에서 일괄 로드
  const loadAllReports = async (merchantList) => {
    if (!merchantList || merchantList.length === 0) return;
    const settled = await Promise.allSettled(
      merchantList.map((m) =>
        fetch(`${API}/api/reports/${m.id}`).then((r) => (r.ok ? r.json() : null))
      )
    );
    const loaded = {};
    settled.forEach((result, i) => {
      if (result.status === "fulfilled" && result.value) {
        loaded[merchantList[i].id] = result.value;
      }
    });
    if (Object.keys(loaded).length > 0) {
      setReports((prev) => ({ ...prev, ...loaded }));
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
                      <span>📍 {m.addr_keyword || m.region || "동네명 미입력"}</span>
                      <span>🔑 플레이스 ID: {m.place_id}</span>
                      {m.instagram_tag && <span>📸 #{m.instagram_tag}</span>}
                    </div>
                    {reports[m.id] && (() => {
                      const rpt = reports[m.id];
                      const s = rpt.summary || {};
                      const crawledAt = rpt.crawled_at
                        ? new Date(rpt.crawled_at).toLocaleDateString("ko-KR", { month: "long", day: "numeric" })
                        : "";
                      const blogTotal = s.total_blog_reviews || 0;
                      const receiptTotal = s.total_receipt_reviews || 0;
                      const adPct = blogTotal > 0 ? Math.round((s.blog_ad_count || 0) / blogTotal * 100) : 0;
                      const orgPct = blogTotal > 0 ? Math.round((s.blog_organic_count || 0) / blogTotal * 100) : 0;
                      return (
                        <div className="report-badge" onClick={() => setViewReport(rpt)}>
                          <div className="report-badge-top">
                            <span>📊 최근 리포트 보기 →</span>
                            {crawledAt && <span className="report-badge-date">분석일 {crawledAt}</span>}
                          </div>
                          <div className="report-badge-stats">
                            <span>영수증 {receiptTotal}건</span>
                            <span>블로그 {blogTotal}건</span>
                            <span style={{color:"#27c98f"}}>내돈내산 {orgPct}%</span>
                            <span style={{color:"#e74c6f"}}>광고 {adPct}%</span>
                          </div>
                        </div>
                      );
                    })()}
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
