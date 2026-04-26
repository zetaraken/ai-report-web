업로드 방법

1. 이 ZIP 파일 압축을 풉니다.
2. GitHub의 ai-report-web 저장소로 이동합니다.
3. Add file > Upload files 클릭
4. 압축 푼 파일 전체를 다시 업로드합니다.
5. 같은 이름 파일은 덮어쓰기됩니다.
6. Commit changes 클릭
7. Vercel이 자동으로 다시 배포합니다.

중요:
- Vercel 환경변수 VITE_API_BASE_URL에는 FastAPI 서버 주소가 들어가야 합니다.
- 아직 FastAPI 서버가 없으면 로그인/리포트 조회는 작동하지 않지만, 화면은 정상 표시됩니다.
