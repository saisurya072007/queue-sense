import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminAPI, analyticsAPI, officesAPI } from '../services/api';
import toast from 'react-hot-toast';
import { LogOut, Users, Building2, Activity, BarChart3, Bell, Download, RefreshCw, Plus, Key, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TABS = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'employees', icon: '👥', label: 'Employees' },
  { id: 'offices', icon: '🏛️', label: 'Live Queues' },
  { id: 'analytics', icon: '📈', label: 'Analytics' },
  { id: 'logs', icon: '📋', label: 'Audit Logs' },
];

const AdminPanelPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [offices, setOffices] = useState([]);
  const [liveQueues, setLiveQueues] = useState([]);
  const [allAnalytics, setAllAnalytics] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ employeeId: '', username: '', password: 'Employee@123', fullName: '', email: '', officeId: '', role: 'employee', designation: '' });
  const [resetPasswordId, setResetPasswordId] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const [dashRes, empRes, queueRes, analyticsRes, logsRes, officesRes] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getEmployees(),
        adminAPI.getLiveQueues(),
        analyticsAPI.getAllOffices(),
        analyticsAPI.getLogs({ limit: 50 }),
        officesAPI.getAll(),
      ]);
      setDashboard(dashRes.data.data);
      setEmployees(empRes.data.data);
      setLiveQueues(queueRes.data.data);
      setAllAnalytics(analyticsRes.data.data);
      setAuditLogs(logsRes.data.data);
      setOffices(officesRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmployee = async () => {
    if (!newEmployee.employeeId || !newEmployee.fullName || !newEmployee.username) {
      toast.error('Please fill required fields (ID, Name, Username)');
      return;
    }
    if (!newEmployee.officeId) {
      toast.error('Please select an Assigned Office');
      return;
    }
    try {
      await adminAPI.createEmployee(newEmployee);
      toast.success('Employee created successfully!');
      setShowAddEmployee(false);
      setNewEmployee({ employeeId: '', username: '', password: 'Employee@123', fullName: '', email: '', officeId: '', role: 'employee', designation: '' });
      const empRes = await adminAPI.getEmployees();
      setEmployees(empRes.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create employee');
    }
  };

  const handleResetPassword = async (id) => {
    if (!newPassword) { toast.error('Enter new password'); return; }
    try {
      await adminAPI.resetPassword(id, { newPassword });
      toast.success('Password reset successfully!');
      setResetPasswordId(null);
      setNewPassword('');
    } catch { toast.error('Failed to reset password'); }
  };

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Deactivate employee ${name}?`)) return;
    try {
      await adminAPI.deactivateEmployee(id);
      toast.success('Employee deactivated');
      const empRes = await adminAPI.getEmployees();
      setEmployees(empRes.data.data);
    } catch { toast.error('Failed to deactivate'); }
  };

  const handleLogout = () => { logout(); navigate('/admin/login'); };

  const downloadReport = () => {
    const csv = [
      ['Employee', 'Employee ID', 'Office', 'Action', 'Category', 'Old Value', 'New Value', 'Date & Time', 'IP'],
      ...auditLogs.map(l => [l.actor_name, l.actor_employee_id || '', l.office_name || '', l.action, l.action_category, l.old_value || '', l.new_value || '', new Date(l.created_at).toLocaleString('en-IN'), l.ip_address || ''])
    ].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Admin Topbar */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div className="flex items-center gap-3">
          <div style={{ width: 40, height: 40, background: 'var(--gradient-gold)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>🛡️</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem' }}>Super Admin Panel</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SmartGov AI – Kakinada • {user?.fullName}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-outline btn-sm" onClick={fetchDashboard}><RefreshCw size={14} /> Refresh</button>
          <button className="btn btn-danger btn-sm" onClick={handleLogout}><LogOut size={14} /> Logout</button>
        </div>
      </div>

      <div className="admin-layout">
        {/* Sidebar */}
        <nav className="admin-sidebar">
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '0.75rem', padding: '0 0.5rem' }}>NAVIGATION</div>
          {TABS.map(tab => (
            <button key={tab.id} className={`admin-nav-item ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>

        {/* Main Content */}
        <div className="admin-content">
          {loading ? (
            <div className="flex items-center justify-center" style={{ height: 400 }}>
              <div className="loading-spinner" />
            </div>
          ) : (
            <>
              {/* DASHBOARD */}
              {activeTab === 'dashboard' && dashboard && (
                <div>
                  <h2 style={{ marginBottom: '1.5rem' }}>📊 Dashboard Overview</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    <div className="stat-card">
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🏛️</div>
                      <div className="stat-value">{dashboard.offices.active}</div>
                      <div className="stat-label">Active Offices <span style={{ color: 'var(--text-muted)' }}>/ {dashboard.offices.total}</span></div>
                    </div>
                    <div className="stat-card">
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>👥</div>
                      <div className="stat-value">{dashboard.employees.active}</div>
                      <div className="stat-label">Active Employees <span style={{ color: 'var(--text-muted)' }}>/ {dashboard.employees.total}</span></div>
                    </div>
                    <div className="stat-card">
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🎫</div>
                      <div className="stat-value">{dashboard.todayTokens}</div>
                      <div className="stat-label">Today's Tokens</div>
                    </div>
                    <div className="stat-card">
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>✅</div>
                      <div className="stat-value">{dashboard.todayServed}</div>
                      <div className="stat-label">Served Today</div>
                    </div>
                  </div>

                  <div className="card">
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>🔔 Recent Activity</h3>
                    <table className="data-table">
                      <thead><tr><th>Action</th><th>By</th><th>Office</th><th>Time</th></tr></thead>
                      <tbody>
                        {dashboard.recentActivity?.map(log => (
                          <tr key={log.id}>
                            <td><span className="badge badge-teal">{log.action}</span></td>
                            <td>{log.actor_name || 'System'}</td>
                            <td>{log.office_name || '—'}</td>
                            <td style={{ whiteSpace: 'nowrap' }}>{new Date(log.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* EMPLOYEES */}
              {activeTab === 'employees' && (
                <div>
                  <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <h2>👥 Employee Management</h2>
                    <button className="btn btn-secondary" onClick={() => setShowAddEmployee(true)}>
                      <Plus size={16} /> Add Employee
                    </button>
                  </div>

                  {/* Add Employee Modal */}
                  {showAddEmployee && (
                    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowAddEmployee(false)}>
                      <div className="modal">
                        <h3 style={{ marginBottom: '1.5rem' }}>➕ Create New Employee</h3>
                        <div className="grid-2">
                          <div className="form-group"><label className="form-label">Employee ID *</label><input className="form-input" placeholder="EMP005" value={newEmployee.employeeId} onChange={e => setNewEmployee(p => ({ ...p, employeeId: e.target.value }))} /></div>
                          <div className="form-group"><label className="form-label">Full Name *</label><input className="form-input" placeholder="Full name" value={newEmployee.fullName} onChange={e => setNewEmployee(p => ({ ...p, fullName: e.target.value }))} /></div>
                          <div className="form-group"><label className="form-label">Username *</label><input className="form-input" placeholder="username" value={newEmployee.username} onChange={e => setNewEmployee(p => ({ ...p, username: e.target.value }))} /></div>
                          <div className="form-group"><label className="form-label">Password</label><input className="form-input" type="password" value={newEmployee.password} onChange={e => setNewEmployee(p => ({ ...p, password: e.target.value }))} /></div>
                          <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" placeholder="email@gov.in" value={newEmployee.email} onChange={e => setNewEmployee(p => ({ ...p, email: e.target.value }))} /></div>
                          <div className="form-group"><label className="form-label">Designation</label><input className="form-input" placeholder="Counter Operator" value={newEmployee.designation} onChange={e => setNewEmployee(p => ({ ...p, designation: e.target.value }))} /></div>
                          <div className="form-group"><label className="form-label">Assigned Office *</label>
                            <select className="form-select" value={newEmployee.officeId} onChange={e => setNewEmployee(p => ({ ...p, officeId: e.target.value }))}>
                              <option value="">-- Select Office / Bank --</option>
                              <optgroup label="🏛️ Government">
                                {offices.filter(o => o.type === 'government').map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                              </optgroup>
                              <optgroup label="🏦 Banks">
                                {offices.filter(o => o.type === 'bank').map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                              </optgroup>
                            </select>
                          </div>
                          <div className="form-group"><label className="form-label">Role</label>
                            <select className="form-select" value={newEmployee.role} onChange={e => setNewEmployee(p => ({ ...p, role: e.target.value }))}>
                              <option value="employee">Employee</option><option value="manager">Manager</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-2" style={{ marginTop: '1rem' }}>
                          <button className="btn btn-secondary" onClick={handleCreateEmployee}>Create Employee</button>
                          <button className="btn btn-outline" onClick={() => setShowAddEmployee(false)}>Cancel</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reset Password Modal */}
                  {resetPasswordId && (
                    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setResetPasswordId(null)}>
                      <div className="modal">
                        <h3 style={{ marginBottom: '1rem' }}>🔑 Reset Password</h3>
                        <div className="form-group"><label className="form-label">New Password</label>
                          <input className="form-input" type="password" placeholder="New password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                        </div>
                        <div className="flex gap-2">
                          <button className="btn btn-primary" onClick={() => handleResetPassword(resetPasswordId)}>Reset</button>
                          <button className="btn btn-outline" onClick={() => setResetPasswordId(null)}>Cancel</button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="card" style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead><tr><th>ID</th><th>Name</th><th>Username</th><th>Office</th><th>Role</th><th>Status</th><th>Last Login</th><th>Actions</th></tr></thead>
                      <tbody>
                        {employees.map(emp => (
                          <tr key={emp.id}>
                            <td><code>{emp.employee_id}</code></td>
                            <td><strong>{emp.full_name}</strong></td>
                            <td style={{ color: 'var(--text-muted)' }}>{emp.username}</td>
                            <td>{emp.office_name || '—'}</td>
                            <td><span className="badge badge-teal">{emp.role}</span></td>
                            <td><span className={`badge ${emp.is_active ? 'badge-success' : 'badge-danger'}`}>{emp.is_active ? 'Active' : 'Inactive'}</span></td>
                            <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{emp.last_login ? new Date(emp.last_login).toLocaleDateString('en-IN') : 'Never'}</td>
                            <td>
                              <div className="flex gap-1">
                                <button className="btn btn-outline btn-sm" onClick={() => setResetPasswordId(emp.id)} title="Reset Password"><Key size={13} /></button>
                                {emp.is_active && <button className="btn btn-danger btn-sm" onClick={() => handleDeactivate(emp.id, emp.full_name)} title="Deactivate"><Trash2 size={13} /></button>}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* LIVE QUEUES */}
              {activeTab === 'offices' && (
                <div>
                  <h2 style={{ marginBottom: '1.5rem' }}>🏛️ Live Queue Monitor – All Offices</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                    {liveQueues.map(q => (
                      <div key={q.id} className="card">
                        <div className="flex justify-between items-start" style={{ marginBottom: '0.75rem' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{q.office_name}</div>
                          <span className={`badge ${q.is_paused ? 'badge-danger' : 'badge-success'}`}>{q.is_paused ? '⏸ Paused' : '✅ Active'}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                          <div style={{ textAlign: 'center', flex: 1 }}>
                            <div style={{ fontSize: '1.75rem', fontWeight: 800, background: 'var(--gradient-gold)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{q.current_token || 0}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Current Token</div>
                          </div>
                          <div style={{ textAlign: 'center', flex: 1 }}>
                            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ef4444' }}>{q.waiting_count || 0}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Waiting</div>
                          </div>
                          <div style={{ textAlign: 'center', flex: 1 }}>
                            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>{q.completed_count || 0}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Served</div>
                          </div>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Type: <span className="badge badge-info">{q.office_type}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ANALYTICS */}
              {activeTab === 'analytics' && (
                <div>
                  <h2 style={{ marginBottom: '1.5rem' }}>📈 Office Performance (Last 30 Days)</h2>
                  <div className="card" style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead><tr><th>Office</th><th>Type</th><th>Total Visitors (30d)</th><th>Avg Wait (min)</th><th>Employees</th></tr></thead>
                      <tbody>
                        {allAnalytics.map(a => (
                          <tr key={a.id}>
                            <td><strong>{a.name}</strong></td>
                            <td><span className={`badge ${a.type === 'bank' ? 'badge-info' : 'badge-teal'}`}>{a.type}</span></td>
                            <td>{parseInt(a.total_visitors_30d) || 0}</td>
                            <td>{Math.round(parseFloat(a.avg_wait_30d)) || 0} min</td>
                            <td>{a.employee_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* AUDIT LOGS */}
              {activeTab === 'logs' && (
                <div>
                  <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <h2>📋 Audit Logs</h2>
                    <button className="btn btn-outline" onClick={downloadReport}><Download size={15} /> Download CSV</button>
                  </div>
                  <div className="card" style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead><tr><th>Employee</th><th>ID</th><th>Office</th><th>Action</th><th>Category</th><th>Old Value</th><th>New Value</th><th>Date & Time</th><th>IP</th></tr></thead>
                      <tbody>
                        {auditLogs.map(log => (
                          <tr key={log.id}>
                            <td>{log.actor_name || 'System'}</td>
                            <td><code style={{ fontSize: '0.75rem' }}>{log.actor_employee_id || '—'}</code></td>
                            <td>{log.office_name || '—'}</td>
                            <td><span className="badge badge-teal" style={{ fontSize: '0.7rem' }}>{log.action}</span></td>
                            <td><span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>{log.action_category}</span></td>
                            <td style={{ color: '#ef4444', fontSize: '0.8rem' }}>{log.old_value || '—'}</td>
                            <td style={{ color: '#10b981', fontSize: '0.8rem' }}>{log.new_value || '—'}</td>
                            <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{new Date(log.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                            <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.ip_address || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanelPage;
