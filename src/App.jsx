import React, { useState, useEffect } from "react";

const API_BASE = "https://web-production-2e3e7.up.railway.app";

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [loginError, setLoginError] = useState("");

  const [merchants, setMerchants] = useState([]);
  const [selectedMerchant, setSelectedMerchant] = useState("");
  const [report, setReport] = useState(null);

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleLogin = async () => {
    setLoginError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      localStorage.setItem("token", data.access_token);
      setToken(data.access_token);
    } catch (err) {
      setLoginError("로그인 실패: " + err.message);
    }
  };

  const fetchMerchants = async () => {
    const res = await fetch(`${API_BASE}/api/merchants`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setMerchants(data);
  };

  useEffect(() => {
    if (token) fetchMerchants();
  }, [token]);

  const startCrawl = async () => {
    setLoading(true);
    setStatus("수집 시작");

    try {
      await fetch(`${API_BASE}/api/crawl-jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ merchant_id: selectedMerchant }),
      });

      setStatus("수집 완료");
      await fetchReport();
    } catch (e) {
      setStatus("수집 실패");
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async () => {
    const res = await fetch(`${API_BASE}/api/reports/${selectedMerchant}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setReport(data);
  };

  if (!token) {
    return (
      <div style={{ padding: 40 }}>
        <h2>관리자 로그인</h2>
        <input placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} />
        <br />
        <input type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} />
        <br />
        <button onClick={handleLogin}>로그인</button>
        <div style={{ color: "red" }}>{loginError}</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 40 }}>
      <h2>가맹점 리포트</h2>

      <select value={selectedMerchant} onChange={(e) => setSelectedMerchant(e.target.value)}>
        <option value="">가맹점 선택</option>
        {merchants.map((m) => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </select>

      <button disabled={loading} onClick={startCrawl}>
        {loading ? "수집중..." : "수집 시작"}
      </button>

      <div>{status}</div>
      {loading && <div>경과 시간: {elapsed}초</div>}

      {report && (
        <div>
          <h3>리포트 결과</h3>
          <pre>{JSON.stringify(report, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
