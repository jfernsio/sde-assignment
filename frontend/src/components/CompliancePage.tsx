import React, { useState, useEffect } from 'react';
import { ShipCompliance, apiClient } from '../services/apiClient';
import styles from './CompliancePage.module.css';

export const CompliancePage: React.FC = () => {
  const [ships, setShips] = useState<ShipCompliance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedShip, setSelectedShip] = useState<number>(1);

  useEffect(() => {
    loadComplianceData();
  }, [selectedShip]);

  const loadComplianceData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getShipCompliance(selectedShip);
      setShips([response.data]);
      setError(null);
    } catch (err) {
      setError('Failed to load compliance data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreStatus = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Improvement';
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#16a34a';
    if (score >= 60) return '#eab308';
    return '#dc2626';
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Compliance Management</h2>
        <p className={styles.subtitle}>Monitor and track maritime compliance</p>
      </div>

      <div className={styles.shipSelector}>
        <label htmlFor="ship-select">Select Ship:</label>
        <select
          id="ship-select"
          value={selectedShip}
          onChange={(e) => setSelectedShip(parseInt(e.target.value))}
        >
          <option value={1}>Ship #1</option>
          <option value={2}>Ship #2</option>
          <option value={3}>Ship #3</option>
          <option value={4}>Ship #4</option>
          <option value={5}>Ship #5</option>
        </select>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading compliance data...</div>
      ) : error ? (
        <div className={styles.alert}>{error}</div>
      ) : ships.length > 0 ? (
        <div className={styles.content}>
          {ships.map((ship) => (
            <div key={ship.shipId} className={styles.complianceCard}>
              <div className={styles.cardHeader}>
                <div>
                  <h3>Ship #{ship.shipId}</h3>
                  <p className={styles.cardSubtitle}>Compliance Status</p>
                </div>
                <div className={styles.scoreBox} style={{ backgroundColor: getScoreColor(ship.complianceScore) }}>
                  <div className={styles.scoreNumber}>{ship.complianceScore}</div>
                  <div className={styles.scorePercent}>%</div>
                </div>
              </div>

              <div className={styles.statusBadge} style={{ backgroundColor: getScoreColor(ship.complianceScore) }}>
                {getScoreStatus(ship.complianceScore)}
              </div>

              <div className={styles.scoreVisualization}>
                <div className={styles.scoreBar}>
                  <div
                    className={styles.scoreBarFill}
                    style={{
                      width: `${ship.complianceScore}%`,
                      backgroundColor: getScoreColor(ship.complianceScore)
                    }}
                  />
                </div>
                <div className={styles.scoreLabels}>
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              <div className={styles.metricsGrid}>
                <div className={styles.metricItem}>
                  <div className={styles.metricIcon}>✓</div>
                  <div>
                    <p className={styles.metricLabel}>Completed Tasks</p>
                    <p className={styles.metricValue}>{ship.completedTasks}</p>
                  </div>
                </div>

                <div className={styles.metricItem}>
                  <div className={styles.metricIcon} style={{ color: '#eab308' }}>⏳</div>
                  <div>
                    <p className={styles.metricLabel}>Pending Tasks</p>
                    <p className={styles.metricValue}>{ship.pendingTasks}</p>
                  </div>
                </div>

                <div className={styles.metricItem}>
                  <div className={styles.metricIcon} style={{ color: ship.missedDrills > 0 ? '#dc2626' : '#16a34a' }}>
                    {ship.missedDrills > 0 ? '✗' : '✓'}
                  </div>
                  <div>
                    <p className={styles.metricLabel}>Missed Drills</p>
                    <p className={styles.metricValue}>{ship.missedDrills}</p>
                  </div>
                </div>
              </div>

              <div className={styles.detailedMetrics}>
                <div className={styles.metricRow}>
                  <span className={styles.metricName}>Compliance Score</span>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{
                        width: `${ship.complianceScore}%`,
                        backgroundColor: getScoreColor(ship.complianceScore)
                      }}
                    />
                  </div>
                  <span className={styles.metricNumber}>{ship.complianceScore}%</span>
                </div>

                <div className={styles.metricRow}>
                  <span className={styles.metricName}>Task Completion Rate</span>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{
                        width: `${
                          ship.completedTasks + ship.pendingTasks > 0
                            ? (ship.completedTasks / (ship.completedTasks + ship.pendingTasks)) * 100
                            : 0
                        }%`,
                        backgroundColor: '#16a34a'
                      }}
                    />
                  </div>
                  <span className={styles.metricNumber}>
                    {ship.completedTasks + ship.pendingTasks > 0
                      ? Math.round((ship.completedTasks / (ship.completedTasks + ship.pendingTasks)) * 100)
                      : 0}%
                  </span>
                </div>

                <div className={styles.metricRow}>
                  <span className={styles.metricName}>Safety Record</span>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{
                        width: `${Math.max(0, 100 - ship.missedDrills * 10)}%`,
                        backgroundColor: ship.missedDrills === 0 ? '#16a34a' : '#eab308'
                      }}
                    />
                  </div>
                  <span className={styles.metricNumber}>{Math.max(0, 100 - ship.missedDrills * 10)}%</span>
                </div>
              </div>

              <div className={styles.lastUpdated}>
                Last updated: {new Date(ship.lastUpdated).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>No compliance data available</div>
      )}
    </div>
  );
};
