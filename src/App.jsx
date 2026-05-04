// ai-report-web / src/App.jsx 핵심 출력 부분

{selectedMerchant ? (
  <div style={styles.reportCard}>
    <h2 style={{marginBottom:'30px'}}>{selectedMerchant.merchant_name} 분석 결과</h2>
    
    {/* 상단 6개 카드 섹션 */}
    <div style={styles.statsGrid}>
      <div style={styles.statBox}><span>총 언급 수</span><strong>{selectedMerchant.summary.total_mentions}건</strong></div>
      <div style={styles.statBox}><span>영수증 리뷰</span><strong>{selectedMerchant.summary.receipt_reviews}건</strong></div>
      <div style={styles.statBox}><span>플레이스 블로그</span><strong>{selectedMerchant.summary.place_blogs}건</strong></div>
      <div style={styles.statBox}><span>네이버 블로그</span><strong>{selectedMerchant.summary.naver_blogs}건</strong></div>
      <div style={styles.statBox}><span>인스타그램</span><strong>{selectedMerchant.summary.instagram}건</strong></div>
      <div style={styles.statBox}><span>유튜브 조회수</span><strong>{selectedMerchant.summary.youtube_views}회</strong></div>
    </div>

    {/* 하단 월별 채널별 집계 표 섹션 */}
    <h3 style={{marginTop:'40px', color:'#ccc'}}>월별 채널별 집계</h3>
    <table style={styles.table}>
      <thead>
        <tr>
          <th>월</th><th>네이버 블로그</th><th>인스타그램</th><th>영수증 리뷰</th><th>플레이스 블로그</th><th>유튜브</th><th>합계</th>
        </tr>
      </thead>
      <tbody>
        {selectedMerchant.monthly_data.map((row, idx) => (
          <tr key={idx}>
            <td>{row.month}</td><td>{row.naver}</td><td>{row.insta}</td><td>{row.receipt}</td><td>{row.place}</td><td>{row.youtube}</td><td>{row.total}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
) : (
  <div style={styles.emptyMain}>매장을 선택하고 수집을 시작해주세요.</div>
)}
