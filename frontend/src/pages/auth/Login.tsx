import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Replace with actual API call
    localStorage.setItem('authToken', 'mock-token');
    localStorage.setItem('userRole', 'ADMIN'); // or CREW based on response
    localStorage.setItem('userEmail', email);
    navigate('/dashboard');
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--color-slate)' }}>
      <div style={{ padding: '2rem', backgroundColor: 'var(--color-navy)', borderRadius: '8px', color: 'var(--color-ivory)', width: '100%', maxWidth: '400px' }}>
        <h2>Maritime Login</h2>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <input 
            type="email" 
            placeholder="Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: '0.5rem', borderRadius: '4px' }}
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ padding: '0.5rem', borderRadius: '4px' }}
          />
          <button type="submit" style={{ padding: '0.5rem', backgroundColor: 'var(--color-info-blue)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Login
          </button>
        </form>
        <p style={{ marginTop: '1rem', textAlign: 'center' }}>
          Need an account? <Link to="/signup" style={{ color: 'var(--color-info-blue)' }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
};