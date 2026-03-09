import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import './index.css';
import './light.css';
import './dark.css';
import './mlight.css';
import './mdark.css';

const TABS = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'users', label: '👥 Users' },
    { id: 'courses', label: '📚 Courses' },
    { id: 'categories', label: '🏷️ Categories' },
    { id: 'applications', label: '📝 Applications' },
    { id: 'coupons', label: '🎟️ Coupons' },
];

export default function AdminDashboard() {
    const [tab, setTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [courses, setCourses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [applications, setApplications] = useState([]);
    const [coupons, setCoupons] = useState([]);
    const [expandedApp, setExpandedApp] = useState(null);

    // New Coupon Form State
    const [newCoupon, setNewCoupon] = useState({ code: '', discount_percentage: '', expires_at: '' });

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

    const fetchCoupons = () => {
        setLoading(true);
        api.get('/coupons/').then(r => {
            setCoupons(r.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    };

    useEffect(() => {
        if (tab === 'overview') fetchStats();
        if (tab === 'users') fetchUsers();
        if (tab === 'courses') fetchCourses();
        if (tab === 'categories') fetchCategories();
        if (tab === 'applications') fetchApplications();
        if (tab === 'coupons') fetchCoupons();
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

    const createCoupon = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                code: newCoupon.code,
                discount_percentage: parseInt(newCoupon.discount_percentage)
            };
            if (newCoupon.expires_at) {
                payload.expires_at = new Date(newCoupon.expires_at).toISOString();
            }

            await api.post('/coupons/', payload);
            setNewCoupon({ code: '', discount_percentage: '', expires_at: '' });
            fetchCoupons();
        } catch (err) {
            alert(err.response?.data?.detail || 'Failed to create coupon');
        }
    };

    const deleteCoupon = async (couponId) => {
        if (!window.confirm('Are you sure you want to delete this coupon?')) return;
        try {
            await api.delete(`/coupons/${couponId}`);
            fetchCoupons();
        } catch (err) {
            alert(err.response?.data?.detail || 'Failed to delete coupon');
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
        <div className="admindash-root fade-in">
            <div className="admindash-header">
                <div>
                    <h1>Admin Dashboard 🛡️</h1>
                    <p className="admindash-subtitle">Manage users, courses, and platform settings</p>
                </div>
                <div className="admindash-userbadge admin">Admin</div>
            </div>

            <div className="admindash-tabs">
                {TABS.map(t => (
                    <button
                        key={t.id}
                        className={`admindash-tab ${tab === t.id ? 'active' : ''}`}
                        onClick={() => setTab(t.id)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="admindash-content">
                {tab === 'coupons' && (
                    <div className="admindash-section">
                        <div className="admindash-categoryheader">
                            <h3>Manage Coupons</h3>
                            <form onSubmit={createCoupon} className="admindash-addform">
                                <input
                                    type="text"
                                    placeholder="Coupon Code (e.g. SUMMER50)"
                                    value={newCoupon.code}
                                    onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                                    required
                                    className="admindash-input"
                                    style={{ textTransform: 'uppercase' }}
                                />
                                <input
                                    type="number"
                                    placeholder="Discount %"
                                    value={newCoupon.discount_percentage}
                                    onChange={e => setNewCoupon({ ...newCoupon, discount_percentage: e.target.value })}
                                    required
                                    min="1"
                                    max="100"
                                    className="admindash-input"
                                    style={{ width: '120px' }}
                                />
                                <input
                                    type="datetime-local"
                                    value={newCoupon.expires_at}
                                    onChange={e => setNewCoupon({ ...newCoupon, expires_at: e.target.value })}
                                    className="admindash-input"
                                    style={{ width: '200px' }}
                                    title="Optional Expiry Date"
                                />
                                <button type="submit" className="admindash-btn">Add Coupon</button>
                            </form>
                        </div>

                        <div className="admindash-tablecontainer">
                            <table className="admindash-table">
                                <thead>
                                    <tr>
                                        <th>Code</th>
                                        <th>Discount</th>
                                        <th>Created Date</th>
                                        <th>Expires At</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {coupons.map(c => (
                                        <tr key={c.id}>
                                            <td className="admindash-fontbold">{c.code}</td>
                                            <td>
                                                <span className="admindash-badgepill" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                                                    {c.discount_percentage}% OFF
                                                </span>
                                            </td>
                                            <td>{new Date(c.created_at).toLocaleDateString()}</td>
                                            <td>
                                                {c.expires_at ? new Date(c.expires_at).toLocaleString() : <span className="admindash-textmuted">Never</span>}
                                            </td>
                                            <td className="admindash-actionscell">
                                                <button className="admindash-btnicon" style={{ color: 'var(--danger)' }} title="Delete" onClick={() => deleteCoupon(c.id)}>🗑️</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {coupons.length === 0 && !loading && (
                                        <tr><td colSpan="4" className="admindash-textcenter">No coupons found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                {tab === 'overview' && stats && (
                    <>
                        <div className="admindash-stats">
                            <div className="admindash-statcard blue">
                                <span className="admindash-statnum">{stats.total_users}</span>
                                <span className="admindash-statlabel">Total Users</span>
                            </div>
                            <div className="admindash-statcard green">
                                <span className="admindash-statnum">${stats.total_revenue.toFixed(2)}</span>
                                <span className="admindash-statlabel">Total Revenue</span>
                            </div>
                            <div className="admindash-statcard amber">
                                <span className="admindash-statnum">{stats.total_courses}</span>
                                <span className="admindash-statlabel">Total Courses</span>
                            </div>
                            <div className="admindash-statcard rose">
                                <span className="admindash-statnum">{stats.total_enrollments}</span>
                                <span className="admindash-statlabel">Enrollments</span>
                            </div>
                        </div>

                        <div className="admindash-grid2">
                            <div className="admindash-section">
                                <h3>User Distribution</h3>
                                <div className="admindash-statrow">
                                    <span>Students</span>
                                    <span className="admindash-badgepill">{stats.total_students}</span>
                                </div>
                                <div className="admindash-statrow">
                                    <span>Teachers</span>
                                    <span className="admindash-badgepill">{stats.total_teachers}</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {tab === 'users' && (
                    <div className="admindash-section">
                        <div className="admindash-tableactions">
                            <input
                                type="text"
                                placeholder="Search users..."
                                className="admindash-input"
                                value={userSearch}
                                onChange={e => setUserSearch(e.target.value)}
                            />
                            <select
                                className="admindash-select"
                                value={userRole}
                                onChange={e => setUserRole(e.target.value)}
                            >
                                <option value="">All Roles</option>
                                <option value="student">Student</option>
                                <option value="teacher">Teacher</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        <div className="admindash-tablecontainer">
                            <table className="admindash-table">
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
                                                <div className="admindash-usercell">
                                                    <div className="admindash-avatar">{u.name[0]}</div>
                                                    <div>
                                                        <div className="admindash-fontmedium">{u.name}</div>
                                                        <div className="admindash-textsm admindash-textmuted">{u.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <select
                                                    value={u.role}
                                                    onChange={e => changeRole(u.id, e.target.value)}
                                                    className="admindash-select"
                                                    style={{ padding: '0.2rem 0.5rem' }}
                                                >
                                                    <option value="student">Student</option>
                                                    <option value="teacher">Teacher</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            </td>
                                            <td>
                                                <span className={`admindash-statusdot ${u.is_active ? 'online' : 'offline'}`}></span>
                                                {u.is_active ? 'Active' : 'Inactive'}
                                            </td>
                                            <td>
                                                <button
                                                    className={`admindash-btnsm ${u.is_active ? 'danger-outline' : 'success-outline'}`}
                                                    onClick={() => toggleActive(u.id)}
                                                >
                                                    {u.is_active ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {users.length === 0 && !loading && (
                                        <tr><td colSpan="4" className="admindash-textcenter">No users found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {tab === 'courses' && (
                    <div className="admindash-section">
                        <div className="admindash-tableactions">
                            <input
                                type="text"
                                placeholder="Search courses..."
                                className="admindash-input"
                                value={courseSearch}
                                onChange={e => setCourseSearch(e.target.value)}
                            />
                            <select
                                className="admindash-select"
                                value={courseStatus}
                                onChange={e => setCourseStatus(e.target.value)}
                            >
                                <option value="">All Status</option>
                                <option value="published">Published</option>
                                <option value="draft">Draft</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>

                        <div className="admindash-tablecontainer">
                            <table className="admindash-table">
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
                                                <Link to={`/courses/${c.id}`} className="admindash-fontmedium" style={{ color: 'inherit', textDecoration: 'none' }}>
                                                    {c.title}
                                                </Link>
                                                <div className="admindash-textsm admindash-textmuted">{c.category?.name || 'Uncategorized'}</div>
                                            </td>
                                            <td>{c.teacher?.name}</td>
                                            <td>${c.price}</td>
                                            <td>
                                                <span className={`admindash-statusbadge ${c.status}`}>{c.status}</span>
                                            </td>
                                            <td className="admindash-actionscell">
                                                {c.status === 'draft' && (
                                                    <button className="admindash-btnicon" style={{ color: 'var(--success)' }} title="Approve" onClick={() => approveCourse(c.id)}>✓</button>
                                                )}
                                                {c.status !== 'archived' && (
                                                    <button className="admindash-btnicon" style={{ color: 'var(--danger)' }} title="Reject/Archive" onClick={() => rejectCourse(c.id)}>✕</button>
                                                )}
                                                <button className="admindash-btnicon" style={{ color: 'var(--danger)' }} title="Delete" onClick={() => deleteCourse(c.id)}>🗑️</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {courses.length === 0 && !loading && (
                                        <tr><td colSpan="5" className="admindash-textcenter">No courses found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {tab === 'categories' && (
                    <div className="admindash-section">
                        <form onSubmit={addCategory} className="admindash-addform" style={{ marginBottom: '1.5rem' }}>
                            <input
                                type="text"
                                value={categoryName}
                                onChange={e => setCategoryName(e.target.value)}
                                placeholder="New category name..."
                                className="admindash-input"
                                style={{ flex: 1, maxWidth: '300px' }}
                            />
                            <button type="submit" className="admindash-btn">Add Category</button>
                        </form>

                        <div className="admindash-categorylist">
                            {categories.map(c => (
                                <div key={c.id} className="admindash-categoryitem">
                                    <span>{c.name}</span>
                                    <button className="admindash-btnicon" style={{ color: 'var(--danger)' }} onClick={() => deleteCategory(c.id)}>🗑️</button>
                                </div>
                            ))}
                            {categories.length === 0 && <p className="admindash-textmuted">No categories yet.</p>}
                        </div>
                    </div>
                )}

                {tab === 'applications' && (
                    <div className="admindash-section">
                        <div className="admindash-tableactions">
                            <h2 style={{ margin: 0 }}>📝 Teacher Applications</h2>
                            <select
                                className="admindash-select"
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
                            <div className="admindash-emptystate">
                                <span className="admindash-emptyicon">📝</span>
                                No {appStatus || ''} applications found.
                            </div>
                        )}

                        <div className="admindash-appcards">
                            {applications.map(app => (
                                <div key={app.id} className="admindash-appcard">
                                    <div className="admindash-appheader">
                                        <div className="admindash-usercell">
                                            <div className="admindash-avatar">{app.applicant?.name?.[0] || '?'}</div>
                                            <div>
                                                <div className="admindash-fontmedium">{app.applicant?.name}</div>
                                                <div className="admindash-textsm admindash-textmuted">{app.applicant?.email}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span className={`admindash-statusbadge ${app.status}`}>{app.status}</span>
                                            <span className="admindash-textsm admindash-textmuted">
                                                {new Date(app.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="admindash-appsummary">
                                        <div className="admindash-inforow">
                                            <span>🎬 Expected Lectures:</span>
                                            <strong>{app.expected_lectures}</strong>
                                        </div>
                                        <div className="admindash-inforow">
                                            <span>🔗 Demo Video:</span>
                                            <a href={app.demo_video_url} target="_blank" rel="noopener noreferrer" className="admindash-demolink">
                                                Watch Demo ↗
                                            </a>
                                        </div>
                                    </div>

                                    <button
                                        className="admindash-expandbtn"
                                        onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)}
                                    >
                                        {expandedApp === app.id ? '▲ Hide Details' : '▼ View Full Application'}
                                    </button>

                                    {expandedApp === app.id && (
                                        <div className="admindash-appdetails">
                                            <div className="admindash-detailsection">
                                                <h4>📋 Requirements / Motivation</h4>
                                                <p>{app.requirements}</p>
                                            </div>
                                            <div className="admindash-detailsection">
                                                <h4>📄 CV / Qualifications</h4>
                                                <p>{app.cv}</p>
                                                {app.cv_url && (
                                                    <a href={app.cv_url} target="_blank" rel="noopener noreferrer" className="admindash-demolink" style={{ marginTop: '0.5rem', display: 'inline-block' }}>
                                                        📎 Download Resume PDF ↗
                                                    </a>
                                                )}
                                            </div>
                                            <div className="admindash-detailsection">
                                                <h4>📚 Course Description</h4>
                                                <p>{app.course_description}</p>
                                            </div>
                                            <div className="admindash-detailsection">
                                                <h4>🗂️ Course Overview</h4>
                                                <p>{app.course_overview}</p>
                                            </div>
                                            {app.admin_notes && (
                                                <div className="admindash-detailsection">
                                                    <h4>📌 Admin Notes</h4>
                                                    <p>{app.admin_notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {app.status === 'pending' && (
                                        <div className="admindash-appactions">
                                            <button className="admindash-btnsm success-outline" onClick={() => approveApplication(app.id)}>
                                                ✓ Approve
                                            </button>
                                            <button className="admindash-btnsm danger-outline" onClick={() => rejectApplication(app.id)}>
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
