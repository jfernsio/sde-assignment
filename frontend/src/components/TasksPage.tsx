import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { MaintenanceTask, TaskStatus, apiClient, UserRole } from '../services/apiClient';
import styles from './TasksPage.module.css';

interface TasksPageProps {
  userRole: UserRole;
}

export const TasksPage: React.FC<TasksPageProps> = ({ userRole }) => {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    shipId: 1,
    title: '',
    description: '',
    dueDate: '',
    status: 'PENDING' as TaskStatus
  });

  const isAdmin = userRole === 'ADMIN';

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await apiClient.listTasks(1);
      setTasks(response.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load tasks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiClient.updateTask(editingId, {
          title: formData.title,
          description: formData.description,
          dueDate: formData.dueDate,
          status: formData.status
        });
      } else {
        await apiClient.createTask(
          formData.shipId,
          formData.title,
          formData.description,
          formData.dueDate
        );
      }
      await loadTasks();
      setShowForm(false);
      setEditingId(null);
      setFormData({
        shipId: 1,
        title: '',
        description: '',
        dueDate: '',
        status: 'PENDING'
      });
    } catch (err) {
      setError('Failed to save task');
      console.error(err);
    }
  };

  const handleEdit = (task: MaintenanceTask) => {
    setFormData({
      shipId: task.shipId,
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      status: task.status
    });
    setEditingId(task.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await apiClient.deleteTask(id);
      await loadTasks();
    } catch (err) {
      setError('Failed to delete task');
      console.error(err);
    }
  };

  const getStatusColor = (status: TaskStatus): string => {
    switch (status) {
      case 'COMPLETED':
        return '#16a34a';
      case 'PENDING':
        return '#eab308';
      case 'OVERDUE':
        return '#dc2626';
      default:
        return '#0f172a';
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 size={18} color="#16a34a" />;
      case 'OVERDUE':
        return <AlertCircle size={18} color="#dc2626" />;
      default:
        return <AlertCircle size={18} color="#eab308" />;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2>Maintenance Tasks</h2>
          <p className={styles.subtitle}>
            Manage and track ship maintenance schedules
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
                dueDate: '',
                status: 'PENDING'
              });
            }}
          >
            <Plus size={20} />
            {showForm ? 'Cancel' : 'Create Task'}
          </button>
        )}
      </div>

      {error && (
        <div className={styles.alert}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {showForm && isAdmin && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <h3>{editingId ? 'Edit Task' : 'Create New Task'}</h3>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Engine Inspection"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Due Date *</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
              >
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            </div>

            <div className={styles.formGroupFull}>
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter task description"
                rows={3}
              />
            </div>
          </div>

          <div className={styles.formActions}>
            <button type="submit" className={styles.btnPrimary}>
              {editingId ? 'Update Task' : 'Create Task'}
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

      {loading ? (
        <div className={styles.loading}>Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className={styles.empty}>
          <AlertCircle size={48} />
          <p>No maintenance tasks found</p>
        </div>
      ) : (
        <div className={styles.tasksList}>
          {tasks.map((task) => (
            <div key={task.id} className={styles.taskCard}>
              <div className={styles.taskHeader}>
                <div className={styles.taskMeta}>
                  {getStatusIcon(task.status)}
                  <h3>{task.title}</h3>
                </div>
                <div
                  className={styles.statusBadge}
                  style={{ backgroundColor: getStatusColor(task.status) }}
                >
                  {task.status}
                </div>
              </div>

              <p className={styles.description}>{task.description}</p>

              <div className={styles.taskFooter}>
                <span className={styles.dueDate}>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                {isAdmin && (
                  <div className={styles.actions}>
                    <button
                      className={styles.btnIcon}
                      onClick={() => handleEdit(task)}
                      aria-label="Edit task"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className={styles.btnIcon}
                      onClick={() => handleDelete(task.id)}
                      aria-label="Delete task"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
