import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'CREW'>('CREW');
  const navigate = useNavigate();

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Replace with actual API call
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--color-slate)' }}>
      <div style={{ padding: '2rem', backgroundColor: 'var(--color-navy)', borderRadius: '8px', color: 'var(--color-ivory)', width: '100%', maxWidth: '400px' }}>
        <h2>Maritime Sign Up</h2>
        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
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
          <select 
            value={role} 
            onChange={(e) => setRole(e.target.value as 'ADMIN' | 'CREW')}
            style={{ padding: '0.5rem', borderRadius: '4px' }}
          >
            <option value="CREW">Crew</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button type="submit" style={{ padding: '0.5rem', backgroundColor: 'var(--color-status-green)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Sign Up
          </button>
        </form>
        <p style={{ marginTop: '1rem', textAlign: 'center' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--color-info-blue)' }}>Login</Link>
        </p>
      </div>
    </div>
  );
};