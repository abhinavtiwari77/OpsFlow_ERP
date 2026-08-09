async function runTests() {
  const loginRes = await fetch('https://opsflow-erp.onrender.com/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@opsflow.com', password: 'opsflow2026' })
  });
  
  if (!loginRes.ok) {
    console.error("Login failed", await loginRes.text());
    return;
  }
  
  const { token } = await loginRes.json();
  console.log("Logged in, got token. Running 20 sequential requests to /stats...");
  
  for (let i = 1; i <= 20; i++) {
    const start = Date.now();
    const res = await fetch('https://opsflow-erp.onrender.com/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const time = Date.now() - start;
    
    if (res.ok) {
      console.log(`Req ${i}: 200 OK - ${time}ms`);
    } else {
      console.error(`Req ${i}: ${res.status} FAIL - ${time}ms`);
      const text = await res.text();
      console.error(text);
    }
  }
}

runTests();
