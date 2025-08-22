import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store';
import './AdminDashboard.css';

interface EmailEntry {
  email: string;
  timestamp: string;
  source: string;
}

interface NewsletterStats {
  totalSubscribers: number;
  latestSignups: EmailEntry[];
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<NewsletterStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { setCurrentPage } = useAppStore();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/newsletter/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        setError('Failed to fetch stats');
      }
    } catch (err) {
      setError('Error connecting to server');
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
      <div className="admin-container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="admin-card"
        >
          <div className="admin-header">
            <h1>📧 Newsletter Dashboard</h1>
            <button 
              onClick={() => setCurrentPage('newsletter')}
              className="back-button"
            >
              ← Back to Newsletter
            </button>
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
                  <div className="stat-label">Total Subscribers</div>
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
                          <div className="email">{entry.email}</div>
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
    </div>
  );
};

export default AdminDashboard;
