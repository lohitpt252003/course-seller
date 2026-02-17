import { useState, useEffect } from 'react';
import api from '../../api/axios';
import '../StudentDashboard/index.css';

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [courses, setCourses] = useState([]);
    const [tab, setTab] = useState('overview');
    const [categoryName, setCategoryName] = useState('');

    const fetchData = () => {
        api.get('/admin/stats').then(r => setStats(r.data)).catch(() => { });
        api.get('/admin/users').then(r => setUsers(r.data)).catch(() => { });
        api.get('/courses/').then(r => setCourses(r.data)).catch(() => { });
    };

    useEffect(() => { fetchData(); }, []);

    const toggleActive = async (userId) => {
        await api.patch(`/admin/users/${userId}/toggle-active`);
        fetchData();
    };

    const changeRole = async (userId, role) => {
        await api.patch(`/admin/users/${userId}/role?role=${role}`);
        fetchData();
    };

    const approveCourse = async (courseId) => {
        await api.patch(`/admin/courses/${courseId}/approve`);
        fetchData();
    };

    const rejectCourse = async (courseId) => {
        await api.patch(`/admin/courses/${courseId}/reject`);
        fetchData();
    };

    const addCategory = async (e) => {
        e.preventDefault();
        if (!categoryName.trim()) return;
        try {
            await api.post('/categories/', { name: categoryName });
            setCategoryName('');
            alert('Category added!');
        } catch (err) {
            alert(err.response?.data?.detail || 'Failed');
        }
    };

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Admin Dashboard 🛡️</h1>
                <p>Manage your platform</p>
            </div>

            {stats && (
                <div className="dash-stats">
                    <div className="dash-stat-card"><span className="dash-stat-num">{stats.total_users}</span><span className="dash-stat-label">Total Users</span></div>
                    <div className="dash-stat-card"><span className="dash-stat-num">{stats.total_courses}</span><span className="dash-stat-label">Total Courses</span></div>
                    <div className="dash-stat-card"><span className="dash-stat-num">{stats.total_enrollments}</span><span className="dash-stat-label">Enrollments</span></div>
                    <div className="dash-stat-card"><span className="dash-stat-num">${stats.total_revenue.toFixed(2)}</span><span className="dash-stat-label">Revenue</span></div>
                    <div className="dash-stat-card"><span className="dash-stat-num">{stats.total_teachers}</span><span className="dash-stat-label">Teachers</span></div>
                    <div className="dash-stat-card"><span className="dash-stat-num">{stats.total_students}</span><span className="dash-stat-label">Students</span></div>
                </div>
            )}

            <div className="dash-tabs">
                <button className={`dash-tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>📊 Overview</button>
                <button className={`dash-tab ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>👥 Users</button>
                <button className={`dash-tab ${tab === 'courses' ? 'active' : ''}`} onClick={() => setTab('courses')}>📚 Courses</button>
                <button className={`dash-tab ${tab === 'categories' ? 'active' : ''}`} onClick={() => setTab('categories')}>🏷️ Categories</button>
            </div>

            {tab === 'users' && (
                <div className="dash-section">
                    <h2>All Users</h2>
                    <table className="dash-table">
                        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id}>
                                    <td>{u.name}</td>
                                    <td>{u.email}</td>
                                    <td>
                                        <select value={u.role} onChange={e => changeRole(u.id, e.target.value)} style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px', padding: '0.25rem' }}>
                                            <option value="student">Student</option>
                                            <option value="teacher">Teacher</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                    <td><span className={`dash-badge ${u.is_active ? 'completed' : 'pending'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                                    <td><button className={`action-btn ${u.is_active ? 'danger' : 'success'}`} onClick={() => toggleActive(u.id)}>{u.is_active ? 'Deactivate' : 'Activate'}</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {tab === 'courses' && (
                <div className="dash-section">
                    <h2>All Courses</h2>
                    <table className="dash-table">
                        <thead><tr><th>Title</th><th>Teacher</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                            {courses.map(c => (
                                <tr key={c.id}>
                                    <td>{c.title}</td>
                                    <td>{c.teacher?.name}</td>
                                    <td>${c.price}</td>
                                    <td><span className={`dash-badge ${c.status}`}>{c.status}</span></td>
                                    <td>
                                        {c.status === 'draft' && <button className="action-btn success" onClick={() => approveCourse(c.id)}>✅ Approve</button>}
                                        {c.status !== 'archived' && <button className="action-btn danger" onClick={() => rejectCourse(c.id)}>❌ Reject</button>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {tab === 'categories' && (
                <div className="dash-section">
                    <h2>Add Category</h2>
                    <form onSubmit={addCategory} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                        <input type="text" value={categoryName} onChange={e => setCategoryName(e.target.value)} placeholder="Category name" className="search-input" style={{ flex: 1 }} />
                        <button type="submit" className="btn-primary">Add</button>
                    </form>
                </div>
            )}

            {tab === 'overview' && (
                <div className="dash-section">
                    <div className="empty-state">
                        <span className="empty-icon">📊</span>
                        <h3>Platform Overview</h3>
                        <p>Use the tabs above to manage users, courses, and categories.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
