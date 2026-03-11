import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import './index.css';
import './light.css';
import './dark.css';
import './mlight.css';
import './mdark.css';

const ALL_TABS = [
    { id: 'overview', label: '📊 Overview', perm: null }, // Overview always visible to anyone who can access dashboard
    { id: 'users', label: '👥 Users', perm: 'can_manage_users' },
    { id: 'courses', label: '📚 Courses', perm: 'can_manage_courses' },
    { id: 'categories', label: '🏷️ Categories', perm: 'can_manage_categories' },
    { id: 'applications', label: '📝 Applications', perm: 'can_manage_applications' },
    { id: 'coupons', label: '🎟️ Coupons', perm: 'admin_only' },
    { id: 'alumni', label: '🎓 Alumni', perm: 'can_manage_users' },
    { id: 'placement', label: '📈 Placements', perm: 'admin_only' },
];

export default function AdminDashboard() {
    const authUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = authUser.role === 'admin';
    const permissions = authUser.permissions || {};

    // Filter tabs based on role and permissions
    const visibleTabs = ALL_TABS.filter(tab => {
        if (isAdmin) return true; // Admins see all
        if (tab.perm === 'admin_only') return false; // Coupons are admin only
        if (!tab.perm) return true; // Overview visible to all managers
        return permissions[tab.perm] === true;
    });

    const [tab, setTab] = useState(visibleTabs.length > 0 ? visibleTabs[0].id : 'overview');
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [courses, setCourses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [applications, setApplications] = useState([]);
    const [coupons, setCoupons] = useState([]);
    const [expandedApp, setExpandedApp] = useState(null);

    // New Coupon Form State
    const [newCoupon, setNewCoupon] = useState({ code: '', discount_percentage: '', expires_at: '' });

    // Alumni/Testimonials State
    const [testimonials, setTestimonials] = useState([]);
    const [newTestimonial, setNewTestimonial] = useState({ name: '', role: '', quote: '', photo_url: '' });
    const [placementStats, setPlacementStats] = useState({
        highest_package: '0 LPA',
        average_package: '0 LPA',
        placement_percentage: '0%',
        total_hiring_partners: 0
    });
    const [newPlacementStats, setNewPlacementStats] = useState({
        highest_package: '0 LPA',
        average_package: '0 LPA',
        placement_percentage: '0%',
        total_hiring_partners: 0
    });

    // Filters & Pagination
    const [userSearch, setUserSearch] = useState('');
    const [userRole, setUserRole] = useState('');
    const [courseSearch, setCourseSearch] = useState('');
    const [courseStatus, setCourseStatus] = useState('');
    const [categoryName, setCategoryName] = useState('');
    const [appStatus, setAppStatus] = useState('pending');

    // Manager Permissions State
    const [editingPermissionsId, setEditingPermissionsId] = useState(null);
    const [currentPermissions, setCurrentPermissions] = useState(null);

    const [loading, setLoading] = useState(false);

    const fetchStats = () => api.get('/admin/stats').then(r => setStats(r.data)).catch(console.error);
    const fetchCategories = () => api.get('/categories/').then(r => setCategories(r.data)).catch(console.error);

    const fetchUsers = () => {
        setLoading(true);
        let url = `/admin/users?limit=50`;
        if (userSearch) url += `&search=${userSearch}`;
        if (userRole) url += `&role=${userRole}`;
        api.get(url).then(r => {
            console.log('Admin Users Response:', r.data);
            setUsers(r.data);
            setLoading(false);
        }).catch((err) => {
            console.error('Admin Users Error:', err);
            setLoading(false);
        });
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

    const fetchTestimonials = async () => {
        try {
            const res = await api.get('/testimonials/');
            setTestimonials(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchPlacementStats = async () => {
        try {
            const res = await api.get('/placement-stats/');
            setPlacementStats(res.data);
            setNewPlacementStats(res.data); // Initialize form with current stats
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchStats();
        if (tab === 'users') fetchUsers();
        if (tab === 'courses') fetchCourses();
        if (tab === 'categories') fetchCategories();
        if (tab === 'applications') fetchApplications();
        if (tab === 'coupons') fetchCoupons();
        if (tab === 'alumni') fetchTestimonials();
        if (tab === 'placement') fetchPlacementStats();
    }, [tab, userRole, userSearch, courseStatus, courseSearch, appStatus]);

    const toggleActive = async (userId) => {
        await api.patch(`/admin/users/${userId}/toggle-active`);
        fetchUsers();
    };

    const changeRole = async (userId, role) => {
        if (!window.confirm(`Change role to ${role}?`)) return;
        await api.patch(`/admin/users/${userId}/role?role=${role}`);
        fetchUsers();
    };

    const openPermissionsManager = async (userId) => {
        try {
            const res = await api.get(`/admin/users/${userId}/permissions`);
            setCurrentPermissions(res.data);
            setEditingPermissionsId(userId);
        } catch (err) {
            alert('Failed to load permissions: ' + (err.response?.data?.message || err.message));
        }
    };

    const togglePermission = (permField) => {
        setCurrentPermissions(prev => ({
            ...prev,
            [permField]: !prev[permField]
        }));
    };

    const savePermissions = async () => {
        try {
            await api.put(`/admin/users/${editingPermissionsId}/permissions`, currentPermissions);
            alert('Permissions updated successfully!');
            setEditingPermissionsId(null);
            setCurrentPermissions(null);
        } catch (err) {
            alert('Failed to save permissions: ' + (err.response?.data?.message || err.message));
        }
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
                <div className="admindash-userbadge admin">{isAdmin ? 'Admin' : 'Manager'}</div>
            </div>

            <div className="admindash-tabs">
                {visibleTabs.map(t => (
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
                                                    <option value="manager">Manager</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                                {u.role === 'manager' && isAdmin && (
                                                    <div style={{ marginTop: '0.5rem' }}>
                                                        <button
                                                            className="admindash-btnsm admindash-btnprimary"
                                                            onClick={() => openPermissionsManager(u.id)}
                                                            style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                                                        >
                                                            ⚙️ Permissions
                                                        </button>
                                                    </div>
                                                )}
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

                        {/* Permissions Modal overlay */}
                        {editingPermissionsId && currentPermissions && (
                            <div style={{
                                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                                background: 'rgba(0,0,0,0.5)', zIndex: 1000,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <div style={{
                                    background: 'var(--surface)', padding: '2rem', borderRadius: '8px',
                                    width: '400px', maxWidth: '90vw', border: '1px solid var(--border)'
                                }}>
                                    <h3 style={{ marginTop: 0 }}>Manager Permissions</h3>
                                    <p className="admindash-textmuted" style={{ marginBottom: '1.5rem' }}>Configure what this manager can access.</p>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={currentPermissions.can_manage_users} onChange={() => togglePermission('can_manage_users')} />
                                            <span>👥 Can Manage Users</span>
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={currentPermissions.can_manage_courses} onChange={() => togglePermission('can_manage_courses')} />
                                            <span>📚 Can Manage Courses</span>
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={currentPermissions.can_manage_categories} onChange={() => togglePermission('can_manage_categories')} />
                                            <span>🏷️ Can Manage Categories</span>
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={currentPermissions.can_manage_applications} onChange={() => togglePermission('can_manage_applications')} />
                                            <span>📝 Can Manage Teacher Applications</span>
                                        </label>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                        <button className="admindash-btnsm danger-outline" onClick={() => { setEditingPermissionsId(null); setCurrentPermissions(null); }}>Cancel</button>
                                        <button className="admindash-btnsm success-outline" onClick={savePermissions}>Save</button>
                                    </div>
                                </div>
                            </div>
                        )}
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

                {tab === 'alumni' && (
                    <div className="admindash-section">
                        <div className="admindash-categoryheader">
                            <h3>🎓 Manage Alumni Testimonials</h3>
                        </div>

                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            try {
                                const payload = { ...newTestimonial };
                                if (!payload.photo_url) delete payload.photo_url;
                                await api.post('/testimonials/', payload);
                                setNewTestimonial({ name: '', role: '', quote: '', photo_url: '' });
                                fetchTestimonials();
                                alert('Testimonial added!');
                            } catch (err) {
                                alert(err.response?.data?.detail || 'Failed to add testimonial');
                            }
                        }} className="admindash-addform" style={{ flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
                                <input
                                    type="text"
                                    placeholder="Alumni Name"
                                    value={newTestimonial.name}
                                    onChange={e => setNewTestimonial({ ...newTestimonial, name: e.target.value })}
                                    required
                                    className="admindash-input"
                                    style={{ flex: 1 }}
                                />
                                <input
                                    type="text"
                                    placeholder="Role (e.g. Software Engineer at Google)"
                                    value={newTestimonial.role}
                                    onChange={e => setNewTestimonial({ ...newTestimonial, role: e.target.value })}
                                    required
                                    className="admindash-input"
                                    style={{ flex: 1 }}
                                />
                            </div>
                            <textarea
                                placeholder="Testimonial quote..."
                                value={newTestimonial.quote}
                                onChange={e => setNewTestimonial({ ...newTestimonial, quote: e.target.value })}
                                required
                                className="admindash-input"
                                style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}
                            />
                            <div style={{ display: 'flex', gap: '0.75rem', width: '100%', alignItems: 'center' }}>
                                <input
                                    type="url"
                                    placeholder="Photo URL (optional)"
                                    value={newTestimonial.photo_url}
                                    onChange={e => setNewTestimonial({ ...newTestimonial, photo_url: e.target.value })}
                                    className="admindash-input"
                                    style={{ flex: 1 }}
                                />
                                <button type="submit" className="admindash-btn">Add Testimonial</button>
                            </div>
                        </form>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                            {testimonials.map(t => (
                                <div key={t.id} style={{
                                    background: 'var(--surface)', border: '1px solid var(--border)',
                                    borderRadius: '12px', padding: '1.5rem', position: 'relative'
                                }}>
                                    <button
                                        className="admindash-btnicon"
                                        style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', color: 'var(--danger)' }}
                                        title="Delete"
                                        onClick={async () => {
                                            if (!window.confirm('Delete this testimonial?')) return;
                                            await api.delete(`/testimonials/${t.id}`);
                                            fetchTestimonials();
                                        }}
                                    >🗑️</button>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                        {t.photo_url ? (
                                            <img src={t.photo_url} alt={t.name} style={{
                                                width: '56px', height: '56px', borderRadius: '50%',
                                                objectFit: 'cover', border: '2px solid var(--border)'
                                            }} />
                                        ) : (
                                            <div style={{
                                                width: '56px', height: '56px', borderRadius: '50%',
                                                background: 'var(--primary)', color: '#fff',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '1.4rem', fontWeight: 700
                                            }}>{t.name[0]}</div>
                                        )}
                                        <div>
                                            <div className="admindash-fontmedium">{t.name}</div>
                                            <div className="admindash-textsm admindash-textmuted">{t.role}</div>
                                        </div>
                                    </div>
                                    <p style={{ fontStyle: 'italic', color: 'var(--text-muted)', lineHeight: 1.6 }}>"{t.quote}"</p>
                                </div>
                            ))}
                            {testimonials.length === 0 && !loading && (
                                <p className="admindash-textmuted">No testimonials yet. Add your first alumni testimonial above!</p>
                            )}
                        </div>
                    </div>
                )}
                {tab === 'placement' && (
                    <div className="admindash-section fade-in">
                        <div className="admindash-categoryheader" style={{ marginBottom: '2.5rem' }}>
                            <h3>📈 Manage Placement Stats</h3>
                            <p className="admindash-textmuted" style={{ margin: 0 }}>
                                Update the placement metrics shown on the Home page.
                            </p>
                        </div>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            try {
                                await api.put('/placement-stats/', placementStats);
                                alert('Placement stats updated successfully!');
                            } catch (err) {
                                alert(err.response?.data?.detail || 'Failed to update stats');
                            }
                        }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Highest Package</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 50 LPA"
                                        value={placementStats.highest_package}
                                        onChange={e => setPlacementStats({ ...placementStats, highest_package: e.target.value })}
                                        required
                                        className="admindash-input"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Average Package</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 12 LPA"
                                        value={placementStats.average_package}
                                        onChange={e => setPlacementStats({ ...placementStats, average_package: e.target.value })}
                                        required
                                        className="admindash-input"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Placement %</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 95%"
                                        value={placementStats.placement_percentage}
                                        onChange={e => setPlacementStats({ ...placementStats, placement_percentage: e.target.value })}
                                        required
                                        className="admindash-input"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Hiring Partners</label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 500"
                                        value={placementStats.total_hiring_partners}
                                        onChange={e => setPlacementStats({ ...placementStats, total_hiring_partners: parseInt(e.target.value) || 0 })}
                                        required
                                        min="0"
                                        className="admindash-input"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>
                            <button type="submit" className="admindash-btnprimary" style={{ alignSelf: 'flex-start', padding: '0.75rem 2rem' }}>
                                Save Placement Stats
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div >
    );
}
