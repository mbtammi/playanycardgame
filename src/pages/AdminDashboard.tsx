import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store';
import { getEmailStats } from '../utils/firebase';
import './AdminDashboard.css';

interface EmailEntry {
  id: string;
  timestamp: string;
  source: string;
}

interface NewsletterStats {
  totalSubscribers: number;
  latestSignups: EmailEntry[];
}

const AdminDashboard: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [stats, setStats] = useState<NewsletterStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authError, setAuthError] = useState('');
  const { setCurrentPage } = useAppStore();

  // Check if already authenticated
  useEffect(() => {
    const isAuth = sessionStorage.getItem('admin_authenticated') === 'true';
    setIsAuthenticated(isAuth);
    if (isAuth) {
      fetchStats();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
    
    if (password === adminPassword) {
      setIsAuthenticated(true);
      setAuthError('');
      sessionStorage.setItem('admin_authenticated', 'true');
      fetchStats();
    } else {
      setAuthError('Invalid password');
    }
    setPassword('');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_authenticated');
    setStats(null);
  };

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Try Firebase first
      try {
        const firebaseStats = await getEmailStats();
        setStats(firebaseStats);
        setLoading(false);
        return;
      } catch (firebaseError) {
        console.log('Firebase not available, trying backend...');
      }

      // Try backend server
      try {
        const response = await fetch('/api/newsletter/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
          setLoading(false);
          return;
        }
      } catch (serverError) {
        console.log('Server not available, using localStorage...');
      }

      // Final fallback: localStorage
      const localEmails = JSON.parse(localStorage.getItem('gameEmails') || '[]');
      const emailEntries = localEmails.map((email: string, index: number) => ({
        id: `local_${index}`,
        timestamp: new Date(Date.now() - (localEmails.length - index) * 60000).toISOString(),
        source: 'localStorage'
      }));

      setStats({
        totalSubscribers: localEmails.length,
        latestSignups: emailEntries.slice(-10).reverse()
      });
      
    } catch (err) {
      setError('Error loading email data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading newsletter stats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {!isAuthenticated ? (
        <motion.div 
          className="admin-login"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="login-card">
            <h1>🔐 Admin Access</h1>
            <p>Enter password to view newsletter dashboard</p>
            
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Admin password"
                  className="password-input"
                  required
                />
              </div>
              
              {authError && (
                <motion.div 
                  className="error-message"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {authError}
                </motion.div>
              )}
              
              <button type="submit" className="login-button">
                Access Dashboard
              </button>
            </form>
            
            <button 
              onClick={() => setCurrentPage('newsletter')}
              className="back-button"
            >
              ← Back to Newsletter
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="admin-container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="admin-card"
          >
            <div className="admin-header">
              <h1>📧 Newsletter Dashboard</h1>
              <div className="header-actions">
                <button onClick={handleLogout} className="logout-button">
                  Logout
                </button>
                <button 
                  onClick={() => setCurrentPage('newsletter')}
                  className="back-button"
                >
                  ← Back to Newsletter
                </button>
              </div>
            </div>

          {error ? (
            <div className="error-message">
              <p>❌ {error}</p>
              <button onClick={fetchStats} className="retry-button">
                🔄 Retry
              </button>
            </div>
          ) : stats ? (
            <>
              <div className="stats-overview">
                <div className="stat-card">
                  <div className="stat-number">{stats.totalSubscribers}</div>
                  <div className="stat-label-admin">Total Subscribers</div>
                </div>
              </div>

              <div className="recent-signups">
                <h2>Recent Signups</h2>
                {stats.latestSignups.length > 0 ? (
                  <div className="signups-list">
                    {stats.latestSignups.map((entry, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="signup-item"
                      >
                        <div className="email-info">
                          <div className="email">Subscriber #{stats.totalSubscribers - index}</div>
                          <div className="timestamp">{formatDate(entry.timestamp)}</div>
                        </div>
                        <div className="source-badge">{entry.source}</div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="no-signups">No signups yet</p>
                )}
              </div>

              <div className="admin-actions">
                <button onClick={fetchStats} className="refresh-button">
                  🔄 Refresh Data
                </button>
              </div>
            </>
          ) : null}
        </motion.div>
      </div>
      )}
    </div>
  );
};

export default AdminDashboard;
