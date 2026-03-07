import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import '../StudentDashboard/index.css';
import './index.css';

const TABS = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'users', label: '👥 Users' },
    { id: 'courses', label: '📚 Courses' },
    { id: 'categories', label: '🏷️ Categories' },
    { id: 'applications', label: '📝 Applications' },
];

export default function AdminDashboard() {
    const [tab, setTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [courses, setCourses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [applications, setApplications] = useState([]);
    const [expandedApp, setExpandedApp] = useState(null);

    // Filters & Pagination
    const [userSearch, setUserSearch] = useState('');
    const [userRole, setUserRole] = useState('');
    const [courseSearch, setCourseSearch] = useState('');
    const [courseStatus, setCourseStatus] = useState('');
    const [categoryName, setCategoryName] = useState('');
    const [appStatus, setAppStatus] = useState('pending');

    const [loading, setLoading] = useState(false);

    const fetchStats = () => api.get('/admin/stats').then(r => setStats(r.data)).catch(console.error);
    const fetchCategories = () => api.get('/categories/').then(r => setCategories(r.data)).catch(console.error);

    const fetchUsers = () => {
        setLoading(true);
        let url = `/admin/users?limit=50`;
        if (userSearch) url += `&search=${userSearch}`;
        if (userRole) url += `&role=${userRole}`;
        api.get(url).then(r => {
            setUsers(r.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    };

    const fetchCourses = () => {
        setLoading(true);
        let url = `/admin/courses?limit=50`;
        if (courseSearch) url += `&search=${courseSearch}`;
        if (courseStatus) url += `&status=${courseStatus}`;
        api.get(url).then(r => {
            setCourses(r.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    };

    const fetchApplications = () => {
        setLoading(true);
        let url = `/teacher-applications/?limit=50`;
        if (appStatus) url += `&status=${appStatus}`;
        api.get(url).then(r => {
            setApplications(r.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    };

    useEffect(() => {
        if (tab === 'overview') fetchStats();
        if (tab === 'users') fetchUsers();
        if (tab === 'courses') fetchCourses();
        if (tab === 'categories') fetchCategories();
        if (tab === 'applications') fetchApplications();
    }, [tab, userSearch, userRole, courseSearch, courseStatus, appStatus]);

    const toggleActive = async (userId) => {
        await api.patch(`/admin/users/${userId}/toggle-active`);
        fetchUsers();
    };

    const changeRole = async (userId, role) => {
        if (!window.confirm(`Change role to ${role}?`)) return;
        await api.patch(`/admin/users/${userId}/role?role=${role}`);
        fetchUsers();
    };

    const approveCourse = async (courseId) => {
        if (!window.confirm('Approve and publish this course?')) return;
        await api.patch(`/admin/courses/${courseId}/approve`);
        fetchCourses();
    };

    const rejectCourse = async (courseId) => {
        if (!window.confirm('Reject and archive this course?')) return;
        await api.patch(`/admin/courses/${courseId}/reject`);
        fetchCourses();
    };

    const deleteCourse = async (courseId) => {
        if (!window.confirm('Permanently delete this course?')) return;
        await api.delete(`/admin/courses/${courseId}`);
        fetchCourses();
    };

    const addCategory = async (e) => {
        e.preventDefault();
        if (!categoryName.trim()) return;
        try {
            await api.post('/categories/', { name: categoryName });
            setCategoryName('');
            fetchCategories();
            alert('Category added!');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed');
        }
    };

    const deleteCategory = async (id) => {
        if (!window.confirm('Delete this category?')) return;
        try {
            await api.delete(`/categories/${id}`);
            fetchCategories();
        } catch (err) {
            alert('Failed to delete');
        }
    };

    const approveApplication = async (id) => {
        if (!window.confirm('Approve this teacher application? The user will be promoted to teacher.')) return;
        try {
            await api.patch(`/teacher-applications/${id}/approve`);
            fetchApplications();
            alert('Application approved! User has been promoted to teacher.');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to approve');
        }
    };

    const rejectApplication = async (id) => {
        const notes = window.prompt('Optional: Provide a reason for rejection');
        try {
            let url = `/teacher-applications/${id}/reject`;
            if (notes) url += `?notes=${encodeURIComponent(notes)}`;
            await api.patch(url);
            fetchApplications();
            alert('Application rejected.');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to reject');
        }
    };

    return (
        <div className="dashboard fade-in">
            <div className="dashboard-header">
                <div>
                    <h1>Admin Dashboard 🛡️</h1>
                    <p className="subtitle">Manage users, courses, and platform settings</p>
                </div>
                <div className="user-badge admin">Admin</div>
            </div>

            <div className="dash-tabs">
                {TABS.map(t => (
                    <button
                        key={t.id}
                        className={`dash-tab ${tab === t.id ? 'active' : ''}`}
                        onClick={() => setTab(t.id)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="dash-content">
                {tab === 'overview' && stats && (
                    <>
                        <div className="dash-stats">
                            <div className="dash-stat-card gradient-blue">
                                <span className="dash-stat-num">{stats.total_users}</span>
                                <span className="dash-stat-label">Total Users</span>
                            </div>
                            <div className="dash-stat-card gradient-green">
                                <span className="dash-stat-num">${stats.total_revenue.toFixed(2)}</span>
                                <span className="dash-stat-label">Total Revenue</span>
                            </div>
                            <div className="dash-stat-card gradient-amber">
                                <span className="dash-stat-num">{stats.total_courses}</span>
                                <span className="dash-stat-label">Total Courses</span>
                            </div>
                            <div className="dash-stat-card gradient-rose">
                                <span className="dash-stat-num">{stats.total_enrollments}</span>
                                <span className="dash-stat-label">Enrollments</span>
                            </div>
                        </div>

                        <div className="dash-grid-2">
                            <div className="dash-section">
                                <h3>User Distribution</h3>
                                <div className="stat-row">
                                    <span>Students</span>
                                    <span className="badge-pill">{stats.total_students}</span>
                                </div>
                                <div className="stat-row">
                                    <span>Teachers</span>
                                    <span className="badge-pill">{stats.total_teachers}</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {tab === 'users' && (
                    <div className="dash-section">
                        <div className="table-header-actions">
                            <input
                                type="text"
                                placeholder="Search users..."
                                className="search-input"
                                value={userSearch}
                                onChange={e => setUserSearch(e.target.value)}
                            />
                            <select
                                className="filter-select"
                                value={userRole}
                                onChange={e => setUserRole(e.target.value)}
                            >
                                <option value="">All Roles</option>
                                <option value="student">Student</option>
                                <option value="teacher">Teacher</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        <div className="table-container">
                            <table className="dash-table">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u.id}>
                                            <td>
                                                <div className="user-cell">
                                                    <div className="avatar-placeholder">{u.name[0]}</div>
                                                    <div>
                                                        <div className="font-medium">{u.name}</div>
                                                        <div className="text-sm text-muted">{u.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <select
                                                    value={u.role}
                                                    onChange={e => changeRole(u.id, e.target.value)}
                                                    className="role-select"
                                                >
                                                    <option value="student">Student</option>
                                                    <option value="teacher">Teacher</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            </td>
                                            <td>
                                                <span className={`status-dot ${u.is_active ? 'online' : 'offline'}`}></span>
                                                {u.is_active ? 'Active' : 'Inactive'}
                                            </td>
                                            <td>
                                                <button
                                                    className={`btn-sm ${u.is_active ? 'btn-danger-outline' : 'btn-success-outline'}`}
                                                    onClick={() => toggleActive(u.id)}
                                                >
                                                    {u.is_active ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {users.length === 0 && !loading && (
                                        <tr><td colSpan="4" className="text-center">No users found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {tab === 'courses' && (
                    <div className="dash-section">
                        <div className="table-header-actions">
                            <input
                                type="text"
                                placeholder="Search courses..."
                                className="search-input"
                                value={courseSearch}
                                onChange={e => setCourseSearch(e.target.value)}
                            />
                            <select
                                className="filter-select"
                                value={courseStatus}
                                onChange={e => setCourseStatus(e.target.value)}
                            >
                                <option value="">All Status</option>
                                <option value="published">Published</option>
                                <option value="draft">Draft</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>

                        <div className="table-container">
                            <table className="dash-table">
                                <thead>
                                    <tr>
                                        <th>Course</th>
                                        <th>Teacher</th>
                                        <th>Price</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {courses.map(c => (
                                        <tr key={c.id}>
                                            <td>
                                                <Link to={`/courses/${c.id}`} className="font-medium hover-link" style={{ color: 'inherit', textDecoration: 'none' }}>
                                                    {c.title}
                                                </Link>
                                                <div className="text-sm text-muted">{c.category?.name || 'Uncategorized'}</div>
                                            </td>
                                            <td>{c.teacher?.name}</td>
                                            <td>${c.price}</td>
                                            <td>
                                                <span className={`status-badge ${c.status}`}>{c.status}</span>
                                            </td>
                                            <td className="actions-cell">
                                                {c.status === 'draft' && (
                                                    <button className="btn-icon success" title="Approve" onClick={() => approveCourse(c.id)}>✓</button>
                                                )}
                                                {c.status !== 'archived' && (
                                                    <button className="btn-icon danger" title="Reject/Archive" onClick={() => rejectCourse(c.id)}>✕</button>
                                                )}
                                                <button className="btn-icon danger" title="Delete" onClick={() => deleteCourse(c.id)}>🗑️</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {courses.length === 0 && !loading && (
                                        <tr><td colSpan="5" className="text-center">No courses found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {tab === 'categories' && (
                    <div className="dash-section">
                        <form onSubmit={addCategory} className="add-category-form">
                            <input
                                type="text"
                                value={categoryName}
                                onChange={e => setCategoryName(e.target.value)}
                                placeholder="New category name..."
                                className="search-input"
                            />
                            <button type="submit" className="btn-primary">Add Category</button>
                        </form>

                        <div className="category-list">
                            {categories.map(c => (
                                <div key={c.id} className="category-item">
                                    <span>{c.name}</span>
                                    <button className="btn-icon danger" onClick={() => deleteCategory(c.id)}>🗑️</button>
                                </div>
                            ))}
                            {categories.length === 0 && <p className="text-muted">No categories yet.</p>}
                        </div>
                    </div>
                )}

                {tab === 'applications' && (
                    <div className="dash-section">
                        <div className="table-header-actions">
                            <h2 style={{ margin: 0 }}>📝 Teacher Applications</h2>
                            <select
                                className="filter-select"
                                value={appStatus}
                                onChange={e => setAppStatus(e.target.value)}
                            >
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                                <option value="">All</option>
                            </select>
                        </div>

                        {applications.length === 0 && !loading && (
                            <div className="empty-state">
                                <span className="empty-state-icon">📝</span>
                                No {appStatus || ''} applications found.
                            </div>
                        )}

                        <div className="app-cards">
                            {applications.map(app => (
                                <div key={app.id} className="app-card">
                                    <div className="app-card-header">
                                        <div className="user-cell">
                                            <div className="avatar-placeholder">{app.applicant?.name?.[0] || '?'}</div>
                                            <div>
                                                <div className="font-medium">{app.applicant?.name}</div>
                                                <div className="text-sm text-muted">{app.applicant?.email}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span className={`dash-badge ${app.status}`}>{app.status}</span>
                                            <span className="text-sm text-muted">
                                                {new Date(app.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="app-card-summary">
                                        <div className="app-info-row">
                                            <span>🎬 Expected Lectures:</span>
                                            <strong>{app.expected_lectures}</strong>
                                        </div>
                                        <div className="app-info-row">
                                            <span>🔗 Demo Video:</span>
                                            <a href={app.demo_video_url} target="_blank" rel="noopener noreferrer" className="app-demo-link">
                                                Watch Demo ↗
                                            </a>
                                        </div>
                                    </div>

                                    <button
                                        className="app-expand-btn"
                                        onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)}
                                    >
                                        {expandedApp === app.id ? '▲ Hide Details' : '▼ View Full Application'}
                                    </button>

                                    {expandedApp === app.id && (
                                        <div className="app-card-details">
                                            <div className="app-detail-section">
                                                <h4>📋 Requirements / Motivation</h4>
                                                <p>{app.requirements}</p>
                                            </div>
                                            <div className="app-detail-section">
                                                <h4>📄 CV / Qualifications</h4>
                                                <p>{app.cv}</p>
                                                {app.cv_url && (
                                                    <a href={app.cv_url} target="_blank" rel="noopener noreferrer" className="app-demo-link" style={{ marginTop: '0.5rem', display: 'inline-block' }}>
                                                        📎 Download Resume PDF ↗
                                                    </a>
                                                )}
                                            </div>
                                            <div className="app-detail-section">
                                                <h4>📚 Course Description</h4>
                                                <p>{app.course_description}</p>
                                            </div>
                                            <div className="app-detail-section">
                                                <h4>🗂️ Course Overview</h4>
                                                <p>{app.course_overview}</p>
                                            </div>
                                            {app.admin_notes && (
                                                <div className="app-detail-section">
                                                    <h4>📌 Admin Notes</h4>
                                                    <p>{app.admin_notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {app.status === 'pending' && (
                                        <div className="app-card-actions">
                                            <button className="btn-sm btn-success-outline" onClick={() => approveApplication(app.id)}>
                                                ✓ Approve
                                            </button>
                                            <button className="btn-sm btn-danger-outline" onClick={() => rejectApplication(app.id)}>
                                                ✕ Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
