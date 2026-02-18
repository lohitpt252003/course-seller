import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import '../StudentDashboard/index.css';

const TABS = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'courses', label: '📚 Courses' },
    { id: 'students', label: '👥 Students' },
    { id: 'revenue', label: '💰 Revenue' },
    { id: 'reviews', label: '⭐ Reviews' },
];

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
}

function Stars({ rating }) {
    return <span className="review-stars">{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</span>;
}

export default function TeacherDashboard() {
    const { user } = useAuth();
    const [tab, setTab] = useState('overview');
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);

    // Course management state
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ title: '', description: '', price: 0, category_id: '', thumbnail_url: '' });
    const [editingId, setEditingId] = useState(null);
    const [lessonForm, setLessonForm] = useState({ title: '', content_type: 'text', content: '', video_url: '', pdf_url: '', order_index: 0 });
    const [showLessonForm, setShowLessonForm] = useState(null);

    // Student & review filters
    const [selectedCourseId, setSelectedCourseId] = useState('all');

    const fetchAnalytics = () => {
        setLoading(true);
        api.get('/courses/my/analytics').then(r => {
            setAnalytics(r.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    };

    useEffect(() => {
        fetchAnalytics();
        api.get('/categories/').then(r => setCategories(r.data)).catch(() => { });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = { ...form, price: parseFloat(form.price) || 0, category_id: form.category_id ? parseInt(form.category_id) : null };
        try {
            if (editingId) {
                await api.put(`/courses/${editingId}`, data);
            } else {
                await api.post('/courses/', data);
            }
            setShowForm(false);
            setEditingId(null);
            setForm({ title: '', description: '', price: 0, category_id: '', thumbnail_url: '' });
            fetchAnalytics();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed');
        }
    };

    const handleEdit = (course) => {
        setForm({ title: course.title, description: course.description || '', price: course.price, category_id: course.category_id || '', thumbnail_url: course.thumbnail_url || '' });
        setEditingId(course.id);
        setShowForm(true);
        setTab('courses');
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this course?')) return;
        await api.delete(`/courses/${id}`);
        fetchAnalytics();
    };

    const handleLessonSubmit = async (e, courseId) => {
        e.preventDefault();
        try {
            await api.post(`/courses/${courseId}/lessons`, { ...lessonForm, order_index: parseInt(lessonForm.order_index) || 0 });
            setShowLessonForm(null);
            setLessonForm({ title: '', content_type: 'text', content: '', video_url: '', pdf_url: '', order_index: 0 });
            fetchAnalytics();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed');
        }
    };

    if (loading) return <div className="loading-screen">Loading dashboard...</div>;
    if (!analytics) return <div className="loading-screen">Failed to load analytics.</div>;

    const { overview, courses, recent_activity } = analytics;

    // Filtered data for Students / Reviews tabs
    const filteredCourses = selectedCourseId === 'all' ? courses : courses.filter(c => c.id === parseInt(selectedCourseId));
    const allStudents = filteredCourses.flatMap(c => c.students.map(s => ({ ...s, course_title: c.title, course_id: c.id })));
    const allReviews = filteredCourses.flatMap(c => c.reviews.map(r => ({ ...r, course_title: c.title, course_id: c.id })));

    return (
        <div className="dashboard">
            {/* Header */}
            <div className="dashboard-header">
                <h1>Teacher Dashboard 🎓</h1>
                <p>Welcome back, {user?.name || 'Teacher'}! Here's your performance overview.</p>
            </div>

            {/* Stats Cards */}
            <div className="dash-stats">
                <div className="dash-stat-card gradient-blue">
                    <span className="dash-stat-num">{overview.total_courses}</span>
                    <span className="dash-stat-label">📚 Courses ({overview.published_courses} published)</span>
                </div>
                <div className="dash-stat-card gradient-rose">
                    <span className="dash-stat-num">{overview.total_students}</span>
                    <span className="dash-stat-label">👥 Total Students</span>
                </div>
                <div className="dash-stat-card gradient-green">
                    <span className="dash-stat-num">${overview.total_revenue.toFixed(2)}</span>
                    <span className="dash-stat-label">💰 Total Revenue</span>
                </div>
                <div className="dash-stat-card gradient-amber">
                    <span className="dash-stat-num">{overview.avg_rating > 0 ? overview.avg_rating.toFixed(1) : '—'}</span>
                    <span className="dash-stat-label">⭐ Avg Rating ({overview.total_reviews} reviews)</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="dash-tabs">
                {TABS.map(t => (
                    <button key={t.id} className={`dash-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ===== OVERVIEW TAB ===== */}
            {tab === 'overview' && (
                <div className="dash-section">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {/* Quick Stats */}
                        <div>
                            <h2>📈 Quick Stats</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
                                <div className="dash-list-item">
                                    <span>📝 Total Lessons</span><strong>{overview.total_lessons}</strong>
                                </div>
                                <div className="dash-list-item">
                                    <span>✅ Published Courses</span><strong>{overview.published_courses}</strong>
                                </div>
                                <div className="dash-list-item">
                                    <span>📋 Draft Courses</span><strong>{overview.draft_courses}</strong>
                                </div>
                                <div className="dash-list-item">
                                    <span>💵 Revenue per Student</span>
                                    <strong>${overview.total_students > 0 ? (overview.total_revenue / overview.total_students).toFixed(2) : '0.00'}</strong>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div>
                            <h2>🔔 Recent Activity</h2>
                            <div className="activity-feed" style={{ marginTop: '0.75rem' }}>
                                {recent_activity.length === 0 && (
                                    <div className="empty-state">
                                        <span className="empty-state-icon">🔕</span>
                                        No recent activity yet.
                                    </div>
                                )}
                                {recent_activity.map((a, i) => (
                                    <div key={i} className="activity-item">
                                        <div className="activity-avatar">{a.student_name?.[0] || '?'}</div>
                                        <div className="activity-text">
                                            <strong>{a.student_name}</strong> enrolled in <strong>{a.course_title}</strong>
                                        </div>
                                        <span className="activity-time">{timeAgo(a.enrolled_at)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Top Courses */}
                    {courses.length > 0 && (
                        <div style={{ marginTop: '2rem' }}>
                            <h2>🏆 Top Performing Courses</h2>
                            <div className="dash-grid" style={{ marginTop: '0.75rem' }}>
                                {[...courses].sort((a, b) => b.revenue - a.revenue).slice(0, 3).map(c => (
                                    <div key={c.id} className="teacher-course-card">
                                        <div className="teacher-course-header">
                                            <span className="teacher-course-title">{c.title}</span>
                                            <span className={`dash-badge ${c.status}`}>{c.status}</span>
                                        </div>
                                        <div className="teacher-course-stats">
                                            <span>👥 {c.total_students} students</span>
                                            <span>💰 ${c.revenue.toFixed(2)}</span>
                                            <span>⭐ {c.avg_rating > 0 ? c.avg_rating.toFixed(1) : '—'}</span>
                                            <span>📝 {c.lesson_count} lessons</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ===== COURSES TAB ===== */}
            {tab === 'courses' && (
                <div className="dash-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2>Your Courses</h2>
                        <button className="btn-primary" onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ title: '', description: '', price: 0, category_id: '', thumbnail_url: '' }); }}>
                            {showForm ? '✕ Cancel' : '+ New Course'}
                        </button>
                    </div>

                    {showForm && (
                        <form onSubmit={handleSubmit} className="dash-form" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                            <div className="form-group"><label>Title</label><input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} /></div>
                            <div className="form-group"><label>Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', minHeight: '100px' }} /></div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group"><label>Price ($)</label><input type="number" step="0.01" min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} /></div>
                                <div className="form-group"><label>Category</label>
                                    <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}>
                                        <option value="">None</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group"><label>Thumbnail URL</label><input type="text" value={form.thumbnail_url} onChange={e => setForm({ ...form, thumbnail_url: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} /></div>
                            <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>{editingId ? '✅ Update' : '🚀 Create'} Course</button>
                        </form>
                    )}

                    {courses.length === 0 && !showForm && (
                        <div className="empty-state">
                            <span className="empty-state-icon">📚</span>
                            You haven't created any courses yet. Click "+ New Course" to get started!
                        </div>
                    )}

                    {courses.map(course => (
                        <div key={course.id} className="teacher-course-card" style={{ marginBottom: '0.75rem' }}>
                            <div className="teacher-course-header">
                                <div>
                                    <span className="teacher-course-title">{course.title}</span>
                                    <span className={`dash-badge ${course.status}`} style={{ marginLeft: '0.75rem' }}>{course.status}</span>
                                </div>
                            </div>
                            {course.description && (
                                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
                                    {course.description.length > 120 ? course.description.slice(0, 120) + '...' : course.description}
                                </p>
                            )}
                            <div className="teacher-course-stats">
                                <span>💲 {course.price.toFixed(2)}</span>
                                <span>👥 {course.total_students} students</span>
                                <span>💰 ${course.revenue.toFixed(2)} revenue</span>
                                <span>🛒 {course.sales} sales</span>
                                <span>⭐ {course.avg_rating > 0 ? course.avg_rating.toFixed(1) : '—'}</span>
                                <span>📝 {course.lesson_count} lessons</span>
                            </div>
                            <div className="teacher-course-actions">
                                <button className="action-btn" onClick={() => handleEdit(course)}>✏️ Edit</button>
                                <button className="action-btn" onClick={() => setShowLessonForm(showLessonForm === course.id ? null : course.id)}>
                                    {showLessonForm === course.id ? '✕ Close' : '📝 Add Lesson'}
                                </button>
                                <button className="action-btn danger" onClick={() => handleDelete(course.id)}>🗑️ Delete</button>
                            </div>
                            {showLessonForm === course.id && (
                                <form onSubmit={(e) => handleLessonSubmit(e, course.id)} style={{ marginTop: '0.5rem', padding: '1rem', background: 'var(--hover-bg)', borderRadius: '10px' }}>
                                    <div className="form-group"><label>Lesson Title</label><input type="text" value={lessonForm.title} onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })} required style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} /></div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div className="form-group"><label>Content Type</label>
                                            <select value={lessonForm.content_type} onChange={e => setLessonForm({ ...lessonForm, content_type: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}>
                                                <option value="text">Text</option>
                                                <option value="video">Video</option>
                                                <option value="pdf">PDF</option>
                                            </select>
                                        </div>
                                        <div className="form-group"><label>Order</label><input type="number" value={lessonForm.order_index} onChange={e => setLessonForm({ ...lessonForm, order_index: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} /></div>
                                    </div>
                                    {lessonForm.content_type === 'text' && <div className="form-group"><label>Content</label><textarea value={lessonForm.content} onChange={e => setLessonForm({ ...lessonForm, content: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', minHeight: '80px' }} /></div>}
                                    {lessonForm.content_type === 'video' && <div className="form-group"><label>Video URL</label><input type="text" value={lessonForm.video_url} onChange={e => setLessonForm({ ...lessonForm, video_url: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} /></div>}
                                    {lessonForm.content_type === 'pdf' && <div className="form-group"><label>PDF URL</label><input type="text" value={lessonForm.pdf_url} onChange={e => setLessonForm({ ...lessonForm, pdf_url: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} /></div>}
                                    <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>✅ Add Lesson</button>
                                </form>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* ===== STUDENTS TAB ===== */}
            {tab === 'students' && (
                <div className="dash-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <h2>👥 Enrolled Students</h2>
                        <select className="course-select" value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)}>
                            <option value="all">All Courses</option>
                            {courses.map(c => <option key={c.id} value={c.id}>{c.title} ({c.total_students})</option>)}
                        </select>
                    </div>

                    {allStudents.length === 0 ? (
                        <div className="empty-state">
                            <span className="empty-state-icon">👥</span>
                            No students enrolled yet.
                        </div>
                    ) : (
                        <div className="students-table-container">
                            <table className="dash-table">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Email</th>
                                        <th>Course</th>
                                        <th>Enrolled</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allStudents.map((s, i) => (
                                        <tr key={`${s.id}-${s.course_id}-${i}`}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div className="activity-avatar" style={{ width: 30, height: 30, fontSize: '0.75rem' }}>{s.name?.[0] || '?'}</div>
                                                    <span style={{ fontWeight: 500 }}>{s.name}</span>
                                                </div>
                                            </td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{s.email}</td>
                                            <td style={{ fontSize: '0.88rem' }}>{s.course_title}</td>
                                            <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{s.enrolled_at ? new Date(s.enrolled_at).toLocaleDateString() : '—'}</td>
                                            <td>
                                                <span className={`dash-badge ${s.completed ? 'completed' : 'in-progress'}`}>
                                                    {s.completed ? '✅ Completed' : '🔄 In Progress'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Showing {allStudents.length} student{allStudents.length !== 1 ? 's' : ''} across {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''}
                    </p>
                </div>
            )}

            {/* ===== REVENUE TAB ===== */}
            {tab === 'revenue' && (
                <div className="dash-section">
                    <h2>💰 Revenue</h2>
                    <div className="revenue-total">${overview.total_revenue.toFixed(2)}</div>
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Total lifetime revenue</p>

                    {courses.length === 0 ? (
                        <div className="empty-state">
                            <span className="empty-state-icon">💰</span>
                            No revenue data yet. Create and publish courses to start earning!
                        </div>
                    ) : (
                        <div className="students-table-container">
                            <table className="dash-table">
                                <thead>
                                    <tr>
                                        <th>Course</th>
                                        <th>Price</th>
                                        <th>Sales</th>
                                        <th>Students</th>
                                        <th>Revenue</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...courses].sort((a, b) => b.revenue - a.revenue).map(c => (
                                        <tr key={c.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span style={{ fontWeight: 600 }}>{c.title}</span>
                                                    <span className={`dash-badge ${c.status}`}>{c.status}</span>
                                                </div>
                                            </td>
                                            <td>${c.price.toFixed(2)}</td>
                                            <td>{c.sales}</td>
                                            <td>{c.total_students}</td>
                                            <td style={{ fontWeight: 700, color: 'var(--success)' }}>${c.revenue.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ===== REVIEWS TAB ===== */}
            {tab === 'reviews' && (
                <div className="dash-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <h2>⭐ Student Reviews</h2>
                        <select className="course-select" value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)}>
                            <option value="all">All Courses</option>
                            {courses.map(c => <option key={c.id} value={c.id}>{c.title} ({c.reviews.length} reviews)</option>)}
                        </select>
                    </div>

                    {allReviews.length === 0 ? (
                        <div className="empty-state">
                            <span className="empty-state-icon">⭐</span>
                            No reviews yet. Reviews will appear here when students rate your courses.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {allReviews.map((r, i) => (
                                <div key={`${r.id}-${i}`} className="review-card">
                                    <div className="review-header">
                                        <div className="activity-avatar" style={{ width: 34, height: 34, fontSize: '0.8rem' }}>{r.user_name?.[0] || '?'}</div>
                                        <div>
                                            <strong style={{ fontSize: '0.95rem' }}>{r.user_name}</strong>
                                            <div><Stars rating={r.rating} /></div>
                                        </div>
                                    </div>
                                    {r.comment && <p className="review-comment">{r.comment}</p>}
                                    <div className="review-meta">
                                        <span>📚 {r.course_title}</span>
                                        <span>{r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Showing {allReviews.length} review{allReviews.length !== 1 ? 's' : ''}
                    </p>
                </div>
            )}
        </div>
    );
}
