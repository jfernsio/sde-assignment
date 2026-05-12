import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users } from 'lucide-react';
import { SafeDrill, DrillAttendance, apiClient, UserRole } from '../services/apiClient';
import styles from './DrillsPage.module.css';

interface DrillsPageProps {
  userRole: UserRole;
}

export const DrillsPage: React.FC<DrillsPageProps> = ({ userRole }) => {
  const [drills, setDrills] = useState<SafeDrill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedDrill, setSelectedDrill] = useState<SafeDrill | null>(null);
  const [attendance, setAttendance] = useState<DrillAttendance[]>([]);
  const [showAttendance, setShowAttendance] = useState(false);

  const [formData, setFormData] = useState({
    shipId: 1,
    title: '',
    description: '',
    scheduledDate: '',
    scheduledTime: '10:00'
  });

  const isAdmin = userRole === 'ADMIN';

  useEffect(() => {
    loadDrills();
  }, []);

  const loadDrills = async () => {
    try {
      setLoading(true);
      const response = await apiClient.listDrills();
      setDrills(response.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load drills');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendance = async (drillId: number) => {
    try {
      const response = await apiClient.getAttendance(drillId);
      setAttendance(response.data || []);
    } catch (err) {
      console.error('Failed to load attendance', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const scheduledDateTime = `${formData.scheduledDate}T${formData.scheduledTime}:00Z`;
      
      if (editingId) {
        await apiClient.updateTask(editingId, {
          title: formData.title,
          description: formData.description,
          dueDate: formData.scheduledDate
        });
      } else {
        await apiClient.createDrill(
          formData.shipId,
          formData.title,
          formData.description,
          scheduledDateTime
        );
      }
      
      await loadDrills();
      setShowForm(false);
      setEditingId(null);
      setFormData({
        shipId: 1,
        title: '',
        description: '',
        scheduledDate: '',
        scheduledTime: '10:00'
      });
    } catch (err) {
      setError('Failed to save drill');
      console.error(err);
    }
  };

  const handleEdit = (drill: SafeDrill) => {
    const dateObj = new Date(drill.scheduledDate);
    setFormData({
      shipId: drill.shipId,
      title: drill.title,
      description: drill.description,
      scheduledDate: dateObj.toISOString().split('T')[0],
      scheduledTime: dateObj.toTimeString().slice(0, 5)
    });
    setEditingId(drill.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this drill?')) return;
    try {
      await apiClient.deleteDrill(id);
      await loadDrills();
    } catch (err) {
      setError('Failed to delete drill');
      console.error(err);
    }
  };

  const handleViewAttendance = (drill: SafeDrill) => {
    setSelectedDrill(drill);
    loadAttendance(drill.id);
    setShowAttendance(true);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'COMPLETED':
        return '#16a34a';
      case 'SCHEDULED':
        return '#0ea5e9';
      case 'IN_PROGRESS':
        return '#eab308';
      case 'CANCELLED':
        return '#dc2626';
      default:
        return '#0f172a';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2>Safety Drills</h2>
          <p className={styles.subtitle}>
            Schedule and manage crew safety drills
          </p>
        </div>
        {isAdmin && (
          <button
            className={styles.btnPrimary}
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData({
                shipId: 1,
                title: '',
                description: '',
                scheduledDate: '',
                scheduledTime: '10:00'
              });
            }}
          >
            <Plus size={20} />
            {showForm ? 'Cancel' : 'Schedule Drill'}
          </button>
        )}
      </div>

      {error && (
        <div className={styles.alert}>
          <span>{error}</span>
        </div>
      )}

      {showForm && isAdmin && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <h3>{editingId ? 'Edit Drill' : 'Schedule New Drill'}</h3>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Fire Evacuation Drill"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Date *</label>
              <input
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Time *</label>
              <input
                type="time"
                value={formData.scheduledTime}
                onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                required
              />
            </div>

            <div className={styles.formGroupFull}>
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter drill description and safety procedures"
                rows={3}
              />
            </div>
          </div>

          <div className={styles.formActions}>
            <button type="submit" className={styles.btnPrimary}>
              {editingId ? 'Update Drill' : 'Schedule Drill'}
            </button>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {showAttendance && selectedDrill && (
        <div className={styles.attendanceModal}>
          <div className={styles.attendanceContent}>
            <h3>{selectedDrill.title} - Attendance</h3>
            <button
              className={styles.closeBtn}
              onClick={() => setShowAttendance(false)}
            >
              ✕
            </button>
            
            {attendance.length === 0 ? (
              <p className={styles.noAttendance}>No attendance records yet</p>
            ) : (
              <div className={styles.attendanceList}>
                {attendance.map((record) => (
                  <div key={record.id} className={styles.attendanceItem}>
                    <span>Crew ID: {record.crewId}</span>
                    <span className={record.attended ? styles.attended : styles.absent}>
                      {record.attended ? '✓ Attended' : '✗ Absent'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>Loading drills...</div>
      ) : drills.length === 0 ? (
        <div className={styles.empty}>
          <Users size={48} />
          <p>No safety drills scheduled</p>
        </div>
      ) : (
        <div className={styles.drillsList}>
          {drills.map((drill) => (
            <div key={drill.id} className={styles.drillCard}>
              <div className={styles.drillHeader}>
                <div>
                  <h3>{drill.title}</h3>
                  <p className={styles.description}>{drill.description}</p>
                </div>
                <div
                  className={styles.statusBadge}
                  style={{ backgroundColor: getStatusColor(drill.status) }}
                >
                  {drill.status}
                </div>
              </div>

              <div className={styles.drillMeta}>
                <span>
                  📅 {new Date(drill.scheduledDate).toLocaleDateString()} at{' '}
                  {new Date(drill.scheduledDate).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
                <span>Ship ID: {drill.shipId}</span>
              </div>

              <div className={styles.drillActions}>
                <button
                  className={styles.btnSecondary}
                  onClick={() => handleViewAttendance(drill)}
                >
                  <Users size={16} />
                  View Attendance
                </button>
                {isAdmin && (
                  <>
                    <button
                      className={styles.btnIcon}
                      onClick={() => handleEdit(drill)}
                      aria-label="Edit drill"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className={styles.btnIcon}
                      onClick={() => handleDelete(drill.id)}
                      aria-label="Delete drill"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
