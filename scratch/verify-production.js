/**
 * Full production verification test:
 * - /health
 * - /stats for all 4 roles (admin, sales, warehouse, accounts)
 * - /customers, /products, /challans 10x each
 * - Customer creation: 1 click → 1 POST → verify DB count
 */

const BASE = 'https://opsflow-erp.onrender.com';

const USERS = [
  { email: 'admin@opsflow.com',     password: 'opsflow2026', role: 'admin'    },
  { email: 'sales@opsflow.com',     password: 'opsflow2026', role: 'sales'    },
  { email: 'warehouse@opsflow.com', password: 'opsflow2026', role: 'warehouse' },
  { email: 'accounts@opsflow.com',  password: 'opsflow2026', role: 'accounts'  },
];

async function login(email, password) {
  const r = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) throw new Error(`Login failed for ${email}: ${r.status} ${await r.text()}`);
  const { token } = await r.json();
  return token;
}

async function get(path, token) {
  const r = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return { status: r.status, body: await r.json().catch(() => null) };
}

async function repeat(label, fn, n = 10) {
  let pass = 0, fail = 0;
  for (let i = 1; i <= n; i++) {
    try {
      const result = await fn(i);
      if (result.status >= 200 && result.status < 300) {
        pass++;
      } else {
        fail++;
        console.error(`  [FAIL] ${label} req ${i}: ${result.status}`, JSON.stringify(result.body).slice(0, 200));
      }
    } catch (e) {
      fail++;
      console.error(`  [ERROR] ${label} req ${i}:`, e.message);
    }
  }
  const symbol = fail === 0 ? '✅' : '❌';
  console.log(`${symbol} ${label}: ${pass}/${n} OK`);
  return fail === 0;
}

async function main() {
  console.log('='.repeat(60));
  console.log('PRODUCTION VERIFICATION TEST');
  console.log('='.repeat(60));
  
  // 1. Health check
  console.log('\n--- /health ---');
  const health = await fetch(`${BASE}/health`);
  const healthBody = await health.json();
  console.log(`${health.ok ? '✅' : '❌'} /health: ${health.status}`, JSON.stringify(healthBody));

  // 2. Stats for all roles
  console.log('\n--- /stats (all roles) ---');
  for (const user of USERS) {
    try {
      const token = await login(user.email, user.password);
      const { status, body } = await get('/stats', token);
      if (status === 200) {
        const stats = body.stats;
        const forbidden = Object.entries(stats).filter(([k, v]) => v !== null && typeof v !== 'number').map(([k]) => k);
        if (forbidden.length > 0) {
          console.log(`⚠️  ${user.role} /stats: 200 but unexpected non-null/non-number values: ${forbidden.join(', ')}`);
        } else {
          console.log(`✅ ${user.role} /stats: 200 | customers=${stats.customers} products=${stats.products} lowStock=${stats.lowStock} challans=${stats.challans}`);
        }
      } else {
        console.log(`❌ ${user.role} /stats: ${status}`, JSON.stringify(body).slice(0, 200));
      }
    } catch (e) {
      console.log(`❌ ${user.role}: could not login - ${e.message}`);
    }
  }

  // 3. Get admin token for repeated tests
  console.log('\n--- Repeated endpoint tests (admin, 10x each) ---');
  const adminToken = await login(USERS[0].email, USERS[0].password);
  
  await repeat('/stats (admin)',     (i) => get('/stats',      adminToken));
  await repeat('/customers',         (i) => get('/customers',  adminToken));
  await repeat('/products',          (i) => get('/products',   adminToken));
  await repeat('/challans',          (i) => get('/challans',   adminToken));

  // 4. Customer creation: verify exactly 1 POST creates 1 record
  console.log('\n--- Customer creation (1 click = 1 POST = 1 DB record) ---');
  const beforeRes = await get('/customers?pageSize=100', adminToken);
  const beforeCount = beforeRes.body?.items?.length ?? beforeRes.body?.pagination?.total ?? 'unknown';
  
  const testName = `TEST-${Date.now()}`;
  const createRes = await fetch(`${BASE}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ name: testName, mobile: '9999999999', email: 'test@test.com', customerType: 'RETAIL', status: 'LEAD' }),
  });
  const createBody = await createRes.json();
  
  if (createRes.status !== 201 && createRes.status !== 200) {
    console.log(`❌ POST /customers failed: ${createRes.status}`, JSON.stringify(createBody).slice(0, 200));
  } else {
    const afterRes = await get(`/customers?pageSize=100&search=${testName}`, adminToken);
    const matches = afterRes.body?.items?.filter(c => c.name === testName) ?? [];
    if (matches.length === 1) {
      console.log(`✅ Customer creation: 1 POST → 1 DB record (total found with name="${testName}": ${matches.length})`);
    } else {
      console.log(`❌ Customer creation: Expected 1 record, found ${matches.length} for name="${testName}"`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('VERIFICATION COMPLETE');
  console.log('='.repeat(60));
}

main().catch(console.error);
