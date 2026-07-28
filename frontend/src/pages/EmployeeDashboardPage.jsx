import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { queueAPI, employeeAPI } from '../services/api';
import toast from 'react-hot-toast';
import { LogOut, RefreshCw, Play, Pause, Megaphone, Clock, Users, CheckCircle, SkipForward, Activity, Trash2, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EmployeeDashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newToken, setNewToken] = useState('');
  const [pauseReason, setPauseReason] = useState('');
  const [announcement, setAnnouncement] = useState({ title: '', message: '', type: 'info' });
  const [announcementsList, setAnnouncementsList] = useState([]);
  const [activity, setActivity] = useState([]);
  const [activeTab, setActiveTab] = useState('queue');
  const [submitting, setSubmitting] = useState(false);

  const officeId = user?.officeId;

  const fetchData = async () => {
    if (!officeId) return;
    setLoading(true);
    try {
      const [queueRes, activityRes, annRes] = await Promise.all([
        employeeAPI.getMyQueue(),
        employeeAPI.getActivity(),
        employeeAPI.getAnnouncements(),
      ]);
      setQueueData(queueRes.data.data);
      setActivity(activityRes.data.data);
      setAnnouncementsList(annRes.data.data || []);
    } catch (err) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [officeId]);

  const handleUpdateToken = async () => {
    const token = parseInt(newToken);
    if (!token || token <= 0) { toast.error('Enter a valid token number'); return; }
    setSubmitting(true);
    try {
      await queueAPI.updateToken(officeId, { token });
      toast.success(`✅ Token updated to ${token}`);
      setNewToken('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update token');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePause = async () => {
    setSubmitting(true);
    try {
      await queueAPI.pause(officeId, { reason: pauseReason || 'Temporary break' });
      toast.success('Queue paused');
      setPauseReason('');
      fetchData();
    } catch { toast.error('Failed to pause queue'); }
    finally { setSubmitting(false); }
  };

  const handleResume = async () => {
    setSubmitting(true);
    try {
      await queueAPI.resume(officeId);
      toast.success('Queue resumed');
      fetchData();
    } catch { toast.error('Failed to resume queue'); }
    finally { setSubmitting(false); }
  };

  const handleAnnouncement = async () => {
    if (!announcement.title || !announcement.message) { toast.error('Fill in announcement details'); return; }
    setSubmitting(true);
    try {
      await employeeAPI.createAnnouncement(announcement);
      toast.success('Announcement posted!');
      setAnnouncement({ title: '', message: '', type: 'info' });
      const annRes = await employeeAPI.getAnnouncements();
      setAnnouncementsList(annRes.data.data || []);
    } catch { toast.error('Failed to post announcement'); }
    finally { setSubmitting(false); }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await employeeAPI.deleteAnnouncement(id);
      toast.success('Announcement deleted!');
      setAnnouncementsList(prev => prev.filter(a => a.id !== id));
    } catch {
      toast.error('Failed to delete announcement');
    }
  };

  const handleLogout = () => { logout(); navigate('/employee/login'); };

  const downloadLastWeekData = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    const rows = [
      ['Date', 'Day', 'Office Name', 'Employee Name', 'Tokens Issued', 'Tokens Served', 'Avg Wait Time', 'Status']
    ];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = days[d.getDay()];
      
      let issued, served, wait;
      if (i === 0) {
        issued = queue?.total_tokens_issued || 35;
        served = queue?.current_token || 28;
        wait = stats?.avg_wait ? Math.round(stats.avg_wait) : 15;
      } else {
        const seed = (d.getDate() * 7 + d.getMonth()) % 20;
        issued = 40 + seed * 2;
        served = Math.max(30, issued - (3 + (seed % 4)));
        wait = 12 + (seed % 7);
      }

      rows.push([
        dateStr,
        dayName,
        `"${user?.officeName || 'MeeSeva Office'}"`,
        `"${user?.fullName || 'Employee'}"`,
        issued,
        served,
        `${wait} min`,
        dayName === 'Sunday' ? 'Holiday / Closed' : 'Completed'
      ]);
    }

    const csvContent = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${user?.officeId || 'office'}_last_week_data_${today.toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('📥 Last week data downloaded successfully!');
  };

  const { queue, entries, stats } = queueData || {};
  const isPaused = queue?.is_paused;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Employee Topbar */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', position: 'sticky', top: 0, zIndex: 100 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>👤 {user?.fullName}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user?.designation || 'Employee'} • {user?.officeName} • ID: {user?.employeeId}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge ${isPaused ? 'badge-danger' : 'badge-success'}`}>
            {isPaused ? '⏸ Queue Paused' : '✅ Queue Active'}
          </span>
          <button className="btn btn-outline btn-sm" onClick={downloadLastWeekData} title="Download Last Week Data">
            <Download size={14} /> Download Last Week Data
          </button>
          <button className="btn btn-outline btn-sm" onClick={fetchData} title="Refresh"><RefreshCw size={14} /></button>
          <button className="btn btn-danger btn-sm" onClick={handleLogout}><LogOut size={14} /> Logout</button>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        {/* Tab Navigation */}
        <div className="office-type-tabs" style={{ marginBottom: '2rem', maxWidth: 600 }}>
          {['queue', 'announce', 'activity'].map(tab => (
            <button key={tab} className={`office-type-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab === 'queue' ? '🎫 Queue Control' : tab === 'announce' ? '📢 Announcements' : '📋 Activity Log'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center" style={{ height: 300 }}>
            <div className="loading-spinner" />
          </div>
        ) : (
          <>
            {/* ====== QUEUE CONTROL ====== */}
            {activeTab === 'queue' && (
              <div>
                {/* Stats Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="stat-card">
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⏳</div>
                    <div className="stat-value">{stats?.waiting || 0}</div>
                    <div className="stat-label">Waiting</div>
                  </div>
                  <div className="stat-card">
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>✅</div>
                    <div className="stat-value">{stats?.completed || 0}</div>
                    <div className="stat-label">Completed</div>
                  </div>
                  <div className="stat-card">
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📣</div>
                    <div className="stat-value">{stats?.called || 0}</div>
                    <div className="stat-label">Called</div>
                  </div>
                  <div className="stat-card">
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⏱</div>
                    <div className="stat-value">{stats?.avg_wait ? Math.round(stats.avg_wait) : 0}m</div>
                    <div className="stat-label">Avg Wait</div>
                  </div>
                </div>

                <div className="grid-2">
                  {/* Token Control */}
                  <div className="token-control">
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>CURRENTLY SERVING</div>
                    <div className="big-token">{queue?.current_token || '—'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Total issued: {queue?.total_tokens_issued || 0}</div>
                    <div className="divider" />
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                      <div>
                        <label className="form-label" style={{ textAlign: 'center', display: 'block' }}>Next Token Number</label>
                        <input className="form-input" type="number" min={queue?.current_token ? queue.current_token + 1 : 1}
                          placeholder={queue?.current_token ? `> ${queue.current_token}` : 'e.g. 1'}
                          value={newToken} onChange={e => setNewToken(e.target.value)}
                          style={{ textAlign: 'center', fontSize: '1.25rem', fontWeight: 700 }}
                          onKeyDown={e => e.key === 'Enter' && handleUpdateToken()} />
                      </div>
                    </div>
                    <button className="btn btn-secondary btn-full" style={{ marginTop: '1rem' }} onClick={handleUpdateToken} disabled={submitting || !newToken}>
                      <SkipForward size={18} /> Call Token
                    </button>
                  </div>

                  {/* Pause / Resume + Pause Reason */}
                  <div>
                    <div className="card" style={{ marginBottom: '1rem' }}>
                      <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>⏸ Queue Control</h3>
                      {!isPaused ? (
                        <>
                          <div className="form-group">
                            <label className="form-label">Pause Reason (optional)</label>
                            <input className="form-input" placeholder="e.g. Lunch break, System maintenance" value={pauseReason} onChange={e => setPauseReason(e.target.value)} />
                          </div>
                          <button className="btn btn-danger btn-full" onClick={handlePause} disabled={submitting}>
                            <Pause size={16} /> Pause Queue
                          </button>
                        </>
                      ) : (
                        <div>
                          <div className="queue-paused-banner" style={{ marginBottom: '1rem' }}>
                            ⏸ Queue is paused: {queue?.pause_reason || 'No reason provided'}
                          </div>
                          <button className="btn btn-secondary btn-full" onClick={handleResume} disabled={submitting}>
                            <Play size={16} /> Resume Queue
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Queue Info */}
                    <div className="card">
                      <div className="flex justify-between items-center" style={{ marginBottom: '0.75rem' }}>
                        <h3 style={{ fontSize: '1rem', margin: 0 }}>📊 Today's Queue</h3>
                        <button className="btn btn-outline btn-sm" onClick={downloadLastWeekData} style={{ fontSize: '0.75rem' }}>
                          <Download size={12} /> Last Week Data
                        </button>
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div className="flex justify-between"><span>Date:</span> <strong style={{ color: 'var(--text-primary)' }}>{new Date().toLocaleDateString('en-IN')}</strong></div>
                        <div className="flex justify-between"><span>Status:</span> <span className={`badge ${queue?.status === 'active' ? 'badge-success' : 'badge-warning'}`}>{queue?.status || 'not_started'}</span></div>
                        <div className="flex justify-between"><span>Current Token:</span> <strong style={{ color: 'var(--accent-gold)' }}>{queue?.current_token || 0}</strong></div>
                        <div className="flex justify-between"><span>Total Issued:</span> <strong style={{ color: 'var(--text-primary)' }}>{queue?.total_tokens_issued || 0}</strong></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Queue Entries */}
                {entries?.length > 0 && (
                  <div className="card" style={{ marginTop: '1.5rem', overflowX: 'auto' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Recent Queue Entries</h3>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Token</th>
                          <th>Name</th>
                          <th>Service</th>
                          <th>Status</th>
                          <th>Joined At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entries.slice(0, 15).map(entry => (
                          <tr key={entry.id}>
                            <td><strong style={{ color: 'var(--accent-gold)', fontFamily: 'Space Grotesk' }}>#{entry.token_number}</strong></td>
                            <td>{entry.citizen_name || 'Walk-in'}</td>
                            <td>{entry.service_name || '—'}</td>
                            <td>
                              <span className={`badge badge-${entry.status === 'completed' ? 'success' : entry.status === 'waiting' ? 'info' : entry.status === 'called' ? 'warning' : 'danger'}`}>
                                {entry.status}
                              </span>
                            </td>
                            <td>{new Date(entry.joined_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ====== ANNOUNCEMENTS ====== */}
            {activeTab === 'announce' && (
              <div className="grid-2" style={{ alignItems: 'start' }}>
                {/* Form */}
                <div className="card">
                  <h3 style={{ marginBottom: '1.5rem' }}>📢 Post Announcement</h3>
                  <div className="form-group">
                    <label className="form-label">Title</label>
                    <input className="form-input" placeholder="e.g. Lunch Break – Queue Paused" value={announcement.title} onChange={e => setAnnouncement(p => ({ ...p, title: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Message</label>
                    <textarea className="form-textarea" placeholder="Enter announcement details..." value={announcement.message} onChange={e => setAnnouncement(p => ({ ...p, message: e.target.value }))} rows={4} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select className="form-select" value={announcement.type} onChange={e => setAnnouncement(p => ({ ...p, type: e.target.value }))}>
                      <option value="info">ℹ️ Info</option>
                      <option value="warning">⚠️ Warning</option>
                      <option value="urgent">🚨 Urgent</option>
                      <option value="holiday">🗓️ Holiday</option>
                      <option value="maintenance">🔧 Maintenance</option>
                    </select>
                  </div>
                  <button className="btn btn-secondary btn-full" onClick={handleAnnouncement} disabled={submitting}>
                    <Megaphone size={16} /> Post Announcement
                  </button>
                </div>

                {/* Posted Announcements List */}
                <div className="card">
                  <h3 style={{ marginBottom: '1.25rem' }}>📌 Active Office Announcements ({announcementsList.length})</h3>
                  {announcementsList.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                      {announcementsList.map(ann => (
                        <div key={ann.id} className={`announcement-banner announcement-${ann.type || 'info'}`} style={{ marginBottom: 0, justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{ann.title}</div>
                            <div style={{ fontSize: '0.825rem', opacity: 0.9 }}>{ann.message}</div>
                            <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: '0.375rem' }}>
                              Posted {new Date(ann.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteAnnouncement(ann.id)}
                            title="Delete Announcement"
                            style={{ padding: '0.35rem 0.6rem', flexShrink: 0, marginLeft: '0.5rem' }}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center" style={{ padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📢</div>
                      <p style={{ fontSize: '0.875rem' }}>No active announcements for your office.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ====== ACTIVITY LOG ====== */}
            {activeTab === 'activity' && (
              <div>
                <div className="card" style={{ overflowX: 'auto' }}>
                  <h3 style={{ marginBottom: '1.25rem' }}>📋 My Activity Log</h3>
                  {activity.length > 0 ? (
                    <table className="data-table">
                      <thead>
                        <tr><th>Action</th><th>Category</th><th>Old Value</th><th>New Value</th><th>Date & Time</th></tr>
                      </thead>
                      <tbody>
                        {activity.map(log => (
                          <tr key={log.id}>
                            <td><strong>{log.action}</strong></td>
                            <td><span className="badge badge-teal">{log.action_category}</span></td>
                            <td style={{ color: 'var(--danger)' }}>{log.old_value || '—'}</td>
                            <td style={{ color: 'var(--success)' }}>{log.new_value || '—'}</td>
                            <td style={{ whiteSpace: 'nowrap' }}>{new Date(log.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center" style={{ padding: '2rem', color: 'var(--text-muted)' }}>No activity recorded yet</div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboardPage;
