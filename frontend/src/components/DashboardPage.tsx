import React, { useState, useEffect } from 'react';
import { BarChart3, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { ComplianceDashboard, apiClient } from '../services/apiClient';
import styles from './DashboardPage.module.css';

export const DashboardPage: React.FC = () => {
  const [dashboard, setDashboard] = useState<ComplianceDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getDashboard();
      setDashboard(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <h2>Dashboard</h2>
        <p className={styles.loading}>Loading compliance data...</p>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className={styles.container}>
        <h2>Dashboard</h2>
        <div className={styles.alert}>
          <AlertTriangle size={20} />
          <span>{error || 'Failed to load data'}</span>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#16a34a';
    if (score >= 60) return '#eab308';
    return '#dc2626';
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Compliance Dashboard</h2>
        <button className={styles.refreshBtn} onClick={loadDashboard}>
          🔄 Refresh
        </button>
      </div>

      {/* Overall Score */}
      <div className={styles.scoreCard}>
        <div className={styles.scoreContent}>
          <p className={styles.scoreLabel}>Overall Compliance Score</p>
          <div className={styles.scoreValue} style={{ color: getScoreColor(dashboard.overallScore) }}>
            {dashboard.overallScore}%
          </div>
          <div className={styles.scoreBar}>
            <div
              className={styles.scoreBarFill}
              style={{
                width: `${dashboard.overallScore}%`,
                backgroundColor: getScoreColor(dashboard.overallScore)
              }}
            />
          </div>
        </div>
        <div className={styles.scoreIcon}>
          <BarChart3 size={64} style={{ color: getScoreColor(dashboard.overallScore) }} />
        </div>
      </div>

      {/* Key Metrics */}
      <div className={styles.metricsGrid}>
        <MetricCard
          icon={<CheckCircle2 size={32} />}
          label="Pending Tasks"
          value={dashboard.totalPendingTasks}
          color="#eab308"
        />
        <MetricCard
          icon={<Clock size={32} />}
          label="Upcoming Drills"
          value={dashboard.upcomingDrills}
          color="#0ea5e9"
        />
        <MetricCard
          icon={<AlertTriangle size={32} />}
          label="Ships"
          value={dashboard.ships.length}
          color="#0f172a"
        />
      </div>

      {/* Ships Compliance */}
      <div className={styles.shipsSection}>
        <h3>Ships Compliance Status</h3>
        {dashboard.ships.length === 0 ? (
          <p className={styles.empty}>No ships data available</p>
        ) : (
          <div className={styles.shipsList}>
            {dashboard.ships.map((ship) => (
              <ShipComplianceCard key={ship.shipId} ship={ship} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, label, value, color }) => {
  return (
    <div className={styles.metricCard}>
      <div className={styles.metricIcon} style={{ color }}>
        {icon}
      </div>
      <div className={styles.metricContent}>
        <p className={styles.metricLabel}>{label}</p>
        <p className={styles.metricValue}>{value}</p>
      </div>
    </div>
  );
};

interface ShipComplianceCardProps {
  ship: {
    shipId: number;
    complianceScore: number;
    pendingTasks: number;
    completedTasks: number;
    missedDrills: number;
    lastUpdated: string;
  };
}

const ShipComplianceCard: React.FC<ShipComplianceCardProps> = ({ ship }) => {
  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#16a34a';
    if (score >= 60) return '#eab308';
    return '#dc2626';
  };

  return (
    <div className={styles.shipCard}>
      <div className={styles.shipHeader}>
        <h4>Ship #{ship.shipId}</h4>
        <div
          className={styles.shipScore}
          style={{ backgroundColor: getScoreColor(ship.complianceScore) }}
        >
          {ship.complianceScore}%
        </div>
      </div>

      <div className={styles.shipScoreBar}>
        <div
          className={styles.shipScoreFill}
          style={{
            width: `${ship.complianceScore}%`,
            backgroundColor: getScoreColor(ship.complianceScore)
          }}
        />
      </div>

      <div className={styles.shipStats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Completed Tasks</span>
          <span className={styles.statValue}>{ship.completedTasks}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Pending Tasks</span>
          <span className={styles.statValue}>{ship.pendingTasks}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Missed Drills</span>
          <span className={styles.statValue} style={{ color: ship.missedDrills > 0 ? '#dc2626' : '#16a34a' }}>
            {ship.missedDrills}
          </span>
        </div>
      </div>

      <p className={styles.lastUpdated}>
        Last updated: {new Date(ship.lastUpdated).toLocaleDateString()}
      </p>
    </div>
  );
};
