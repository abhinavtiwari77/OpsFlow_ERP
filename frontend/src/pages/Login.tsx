import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-left-content">
          <h1 style={{ display: 'flex', alignItems: 'center', margin: '0 0 40px 0' }}>
            <div style={{ width: '48px', height: '48px', overflow: 'hidden', position: 'relative', borderRadius: '6px' }}>
              <img src="https://idurar-prod.ams3.digitaloceanspaces.com/public/uploads/setting/cloud/idurar-app-large-3brl7.png" alt="Logo" style={{ position: 'absolute', top: 0, left: 0, height: '48px' }} />
            </div>
            <span style={{ fontSize: '32px', fontWeight: 700, color: '#0056D2', marginLeft: '16px' }}>OpsFlow ERP</span>
          </h1>
          <h2>Manage Your Company With :</h2>
          
          <ul className="feature-list">
            <li>
              <h3>
                <svg width="20" height="20" fill="none" stroke="#0056D2" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                All In One Tool
              </h3>
              <p>Run And Scale Your Erp Crm Apps</p>
            </li>
            <li>
              <h3>
                <svg width="20" height="20" fill="none" stroke="#0056D2" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                Easily Add And Manage Your Services
              </h3>
              <p>It Brings Together Your Invoice Clients And Leads</p>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="login-right">
        <div className="login-card">
          <h2>Sign In</h2>
          <form onSubmit={handleSubmit}>
            {error && <div className="error-banner">{error}</div>}
            
            <div className="form-group">
              <label>
                <span className="req">*</span> Email
              </label>
              <input 
                type="email" 
                placeholder="Email"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            
            <div className="form-group">
              <label>
                <span className="req">*</span> Password
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  style={{ paddingRight: '40px' }}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>
            
            <div className="login-options">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', margin: 0 }}>
                <input type="checkbox" style={{ width: 'auto', margin: 0 }} /> Remember Me
              </label>
              <a href="#">Forgot Password</a>
            </div>
            
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Logging in..." : "Log In"}
            </button>
            
            <div className="login-footer">
              Don't have an account? <a href="#">Register Now</a>
            </div>
            
            <div className="test-accounts" style={{ marginTop: '32px', padding: '16px', background: '#f8f9fc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#475569' }}>
              <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>Test Accounts (Password: opsflow2026)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b' }}>Admin</span>
                  <strong>admin@opsflow.com</strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b' }}>Sales</span>
                  <strong>sales@opsflow.com</strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b' }}>Warehouse</span>
                  <strong>warehouse@opsflow.com</strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b' }}>Accounts</span>
                  <strong>accounts@opsflow.com</strong>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
