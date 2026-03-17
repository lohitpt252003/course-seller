import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { uploadFile } from '../../api/upload';
import { useAuth } from '../../context/AuthContext';
import LessonComposer, { INITIAL_LESSON_FORM, buildLessonPayload } from '../../components/LessonComposer';
import './index.css';
import './light.css';
import './dark.css';
import './mlight.css';
import './mdark.css';

const TABS = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'courses', label: '📚 Courses' },
    { id: 'students', label: '👥 Students' },
    { id: 'revenue', label: '💰 Revenue' },
    { id: 'reviews', label: '⭐ Reviews' },
];

const INITIAL_COURSE_FORM = {
    title: '',
    description: '',
    category_id: '',
    thumbnail_url: '',
    demo_video_url: '',
};

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
    return <span className="teacherdash-reviewstars">{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</span>;
}

export default function TeacherDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [tab, setTab] = useState('overview');
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);

    // Course management state
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(INITIAL_COURSE_FORM);
    const [editingId, setEditingId] = useState(null);
    const [lessonForm, setLessonForm] = useState(INITIAL_LESSON_FORM);
    const [showLessonForm, setShowLessonForm] = useState(null);
    const [uploading, setUploading] = useState(false);

    // Student & review filters
    const [selectedCourseId, setSelectedCourseId] = useState('all');

    // File upload handler
    const handleFileUpload = async (file, folder, onSuccess) => {
        if (!file) return;
        setUploading(true);
        try {
            const result = await uploadFile(file, folder);
            onSuccess(result.url);
        } catch (err) {
            alert(err.response?.data?.message || 'File upload failed');
        } finally {
            setUploading(false);
        }
    };

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
        const data = { ...form, category_id: form.category_id ? parseInt(form.category_id) : null };
        try {
            if (editingId) {
                await api.put(`/courses/${editingId}`, data);
            } else {
                await api.post('/courses/', data);
            }
            setShowForm(false);
            setEditingId(null);
            setForm(INITIAL_COURSE_FORM);
            fetchAnalytics();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this course?')) return;
        await api.delete(`/courses/${id}`);
        fetchAnalytics();
    };

    const handleLessonSubmit = async (e, courseId) => {
        e.preventDefault();
        try {
            const data = buildLessonPayload(lessonForm);
            await api.post(`/courses/${courseId}/lessons`, data);
            setShowLessonForm(null);
            setLessonForm(INITIAL_LESSON_FORM);
            fetchAnalytics();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed');
        }
    };

    if (loading) return <div className="teacherdash-root">Loading dashboard...</div>;
    if (!analytics) return <div className="teacherdash-root">Failed to load analytics.</div>;

    const { overview, courses, recent_activity } = analytics;

    // Filtered data for Students / Reviews tabs
    const filteredCourses = selectedCourseId === 'all' ? courses : courses.filter(c => c.id === parseInt(selectedCourseId));
    const allStudents = filteredCourses.flatMap(c => c.students.map(s => ({ ...s, course_title: c.title, course_id: c.id })));
    const allReviews = filteredCourses.flatMap(c => c.reviews.map(r => ({ ...r, course_title: c.title, course_id: c.id })));

    return (
        <div className="teacherdash-root fade-in">
            {/* Header */}
            <div className="teacherdash-header">
                <h1>Teacher Dashboard 🎓</h1>
                <p>Welcome back, {user?.name || 'Teacher'}! Here's your performance overview.</p>
            </div>

            {/* Stats Cards */}
            <div className="teacherdash-stats">
                <div className="teacherdash-statcard blue">
                    <span className="teacherdash-statnum">{overview.total_courses}</span>
                    <span className="teacherdash-statlabel">📚 Courses ({overview.published_courses} published)</span>
                </div>
                <div className="teacherdash-statcard rose">
                    <span className="teacherdash-statnum">{overview.total_students}</span>
                    <span className="teacherdash-statlabel">👥 Total Students</span>
                </div>
                <div className="teacherdash-statcard green">
                    <span className="teacherdash-statnum">${overview.total_revenue.toFixed(2)}</span>
                    <span className="teacherdash-statlabel">💰 Total Revenue</span>
                </div>
                <div className="teacherdash-statcard amber">
                    <span className="teacherdash-statnum">{overview.avg_rating > 0 ? overview.avg_rating.toFixed(1) : '—'}</span>
                    <span className="teacherdash-statlabel">⭐ Avg Rating ({overview.total_reviews} reviews)</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="teacherdash-tabs">
                {TABS.map(t => (
                    <button key={t.id} className={`teacherdash-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ===== OVERVIEW TAB ===== */}
            {tab === 'overview' && (
                <div className="teacherdash-section">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {/* Quick Stats */}
                        <div>
                            <h2>📈 Quick Stats</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
                                <div className="teacherdash-listitem">
                                    <span>📝 Total Lessons</span><strong>{overview.total_lessons}</strong>
                                </div>
                                <div className="teacherdash-listitem">
                                    <span>✅ Published Courses</span><strong>{overview.published_courses}</strong>
                                </div>
                                <div className="teacherdash-listitem">
                                    <span>📋 Draft Courses</span><strong>{overview.draft_courses}</strong>
                                </div>
                                <div className="teacherdash-listitem">
                                    <span>💵 Revenue per Student</span>
                                    <strong>${overview.total_students > 0 ? (overview.total_revenue / overview.total_students).toFixed(2) : '0.00'}</strong>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div>
                            <h2>🔔 Recent Activity</h2>
                            <div className="teacherdash-activityfeed" style={{ marginTop: '0.75rem' }}>
                                {recent_activity.length === 0 && (
                                    <div className="teacherdash-empty" style={{ padding: '1.5rem' }}>
                                        <span className="teacherdash-emptyicon" style={{ fontSize: '2rem' }}>🔕</span>
                                        No recent activity yet.
                                    </div>
                                )}
                                {recent_activity.map((a, i) => (
                                    <div key={i} className="teacherdash-activityitem">
                                        <div className="teacherdash-activityavatar">{a.student_name?.[0] || '?'}</div>
                                        <div className="teacherdash-activitytext">
                                            <strong>{a.student_name}</strong> enrolled in <strong>{a.course_title}</strong>
                                        </div>
                                        <span className="teacherdash-activitytime">{timeAgo(a.enrolled_at)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Top Courses */}
                    {courses.length > 0 && (
                        <div style={{ marginTop: '2rem' }}>
                            <h2>🏆 Top Performing Courses</h2>
                            <div className="teacherdash-grid" style={{ marginTop: '0.75rem' }}>
                                {[...courses].sort((a, b) => b.revenue - a.revenue).slice(0, 3).map(c => (
                                    <div key={c.id} className="teacherdash-coursecard">
                                        <div className="teacherdash-courseheader">
                                            <span className="teacherdash-coursetitle">{c.title}</span>
                                            <span className={`teacherdash-badge ${c.status}`}>{c.status}</span>
                                        </div>
                                        <div className="teacherdash-coursestats">
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
                <div className="teacherdash-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2>Your Courses</h2>
                        <button className="btn-primary" style={{ padding: '0.6rem 1rem', borderRadius: '8px' }} onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(INITIAL_COURSE_FORM); }}>
                            {showForm ? '✕ Cancel' : '+ New Course'}
                        </button>
                    </div>

                    {showForm && (
                        <form onSubmit={handleSubmit} className="teacherdash-form fade-in">
                            <div className="teacherdash-formgroup"><label>Title</label><input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
                            <div className="teacherdash-formgroup"><label>Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                                <div className="teacherdash-formgroup"><label>Category</label>
                                    <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                                        <option value="">None</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="teacherdash-formgroup"><label>📷 Thumbnail</label>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <input type="file" onChange={e => handleFileUpload(e.target.files[0], 'thumbnails', url => setForm({ ...form, thumbnail_url: url }))} disabled={uploading} style={{ flex: 1 }} />
                                    {uploading && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>⏳ Uploading...</span>}
                                </div>
                                <input type="text" placeholder="Or paste URL manually" value={form.thumbnail_url} onChange={e => setForm({ ...form, thumbnail_url: e.target.value })} style={{ marginTop: '0.4rem', fontSize: '0.85rem' }} />
                                {form.thumbnail_url && <img src={form.thumbnail_url} alt="preview" style={{ width: 80, height: 50, objectFit: 'cover', borderRadius: 6, marginTop: '0.4rem', border: '1px solid var(--border)' }} />}
                            </div>
                            <div className="teacherdash-formgroup"><label>🎬 Demo Lecture</label>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <input type="file" accept="video/*" onChange={e => handleFileUpload(e.target.files[0], 'materials', url => setForm({ ...form, demo_video_url: url }))} disabled={uploading} style={{ flex: 1 }} />
                                    {uploading && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>⏳ Uploading...</span>}
                                </div>
                                <input type="text" placeholder="Or paste demo video URL" value={form.demo_video_url} onChange={e => setForm({ ...form, demo_video_url: e.target.value })} style={{ marginTop: '0.4rem', fontSize: '0.85rem' }} />
                                <p style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    This preview is visible before purchase.
                                </p>
                            </div>
                            <button type="submit" className="btn-primary" style={{ padding: '0.6rem 1.2rem', borderRadius: '8px' }}>{editingId ? '✅ Update' : '🚀 Create'} Course</button>
                        </form>
                    )}

                    {courses.length === 0 && !showForm && (
                        <div className="teacherdash-empty">
                            <span className="teacherdash-emptyicon">📚</span>
                            You haven't created any courses yet. Click "+ New Course" to get started!
                        </div>
                    )}

                    {courses.map(course => (
                        <div key={course.id} className="teacherdash-coursecard" style={{ marginBottom: '0.75rem' }}>
                            <div className="teacherdash-courseheader">
                                <div>
                                    <Link to={`/courses/${course.id}`} className="teacherdash-coursetitle">
                                        {course.title}
                                    </Link>
                                    <span className={`teacherdash-badge ${course.status}`} style={{ marginLeft: '0.75rem' }}>{course.status}</span>
                                </div>
                            </div>
                            {course.description && (
                                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
                                    {course.description.length > 120 ? course.description.slice(0, 120) + '...' : course.description}
                                </p>
                            )}
                            <div className="teacherdash-coursestats">
                                <span>💲 {course.price.toFixed(2)}</span>
                                <span>👥 {course.total_students} students</span>
                                <span>💰 ${course.revenue.toFixed(2)} revenue</span>
                                <span>🛒 {course.sales} sales</span>
                                <span>⭐ {course.avg_rating > 0 ? course.avg_rating.toFixed(1) : '—'}</span>
                                <span>📝 {course.lesson_count} lessons</span>
                            </div>
                            <div className="teacherdash-courseactions">
                                <button className="teacherdash-actionbtn" onClick={() => navigate(`/courses/${course.id}?manage=1`)}>✏️ Manage</button>
                                <button
                                    className="teacherdash-actionbtn"
                                    onClick={() => {
                                        const nextValue = showLessonForm === course.id ? null : course.id;
                                        setShowLessonForm(nextValue);
                                        if (nextValue) {
                                            setLessonForm({ ...INITIAL_LESSON_FORM, order_index: (course.lesson_count || 0) + 1 });
                                        }
                                    }}
                                >
                                    {showLessonForm === course.id ? '✕ Close' : '📝 Add Lesson'}
                                </button>
                                <button className="teacherdash-actionbtn danger" onClick={() => handleDelete(course.id)}>🗑️ Delete</button>
                            </div>
                            {showLessonForm === course.id && (
                                <LessonComposer
                                    value={lessonForm}
                                    onChange={setLessonForm}
                                    onSubmit={(e) => handleLessonSubmit(e, course.id)}
                                    onFileUpload={handleFileUpload}
                                    uploading={uploading}
                                    heading="Add Course Item"
                                    subheading="Create lessons, DPPs, quizzes, and assignments with type-specific fields."
                                    submitLabel="Add Item"
                                />
                            )}
                        </div>
                    ))}
                </div>
            )
            }

            {/* ===== STUDENTS TAB ===== */}
            {
                tab === 'students' && (
                    <div className="teacherdash-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                            <h2>👥 Enrolled Students</h2>
                            <select className="teacherdash-select" value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)}>
                                <option value="all">All Courses</option>
                                {courses.map(c => <option key={c.id} value={c.id}>{c.title} ({c.total_students})</option>)}
                            </select>
                        </div>

                        {allStudents.length === 0 ? (
                            <div className="teacherdash-empty">
                                <span className="teacherdash-emptyicon">👥</span>
                                No students enrolled yet.
                            </div>
                        ) : (
                            <div className="teacherdash-tablecontainer">
                                <table className="teacherdash-table">
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
                                                        <div className="teacherdash-activityavatar" style={{ width: 30, height: 30, fontSize: '0.75rem' }}>{s.name?.[0] || '?'}</div>
                                                        <span style={{ fontWeight: 500 }}>{s.name}</span>
                                                    </div>
                                                </td>
                                                <td style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{s.email}</td>
                                                <td style={{ fontSize: '0.88rem' }}>{s.course_title}</td>
                                                <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{s.enrolled_at ? new Date(s.enrolled_at).toLocaleDateString() : '—'}</td>
                                                <td>
                                                    <span className={`teacherdash-badge ${s.completed ? 'completed' : 'in-progress'}`}>
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
                )
            }

            {/* ===== REVENUE TAB ===== */}
            {
                tab === 'revenue' && (
                    <div className="teacherdash-section">
                        <h2>💰 Revenue</h2>
                        <div className="teacherdash-revenuetotal">${overview.total_revenue.toFixed(2)}</div>
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Total lifetime revenue</p>

                        {courses.length === 0 ? (
                            <div className="teacherdash-empty">
                                <span className="teacherdash-emptyicon">💰</span>
                                No revenue data yet. Create and publish courses to start earning!
                            </div>
                        ) : (
                            <div className="teacherdash-tablecontainer">
                                <table className="teacherdash-table">
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
                                                        <span className={`teacherdash-badge ${c.status}`}>{c.status}</span>
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
                )
            }

            {/* ===== REVIEWS TAB ===== */}
            {
                tab === 'reviews' && (
                    <div className="teacherdash-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                            <h2>⭐ Student Reviews</h2>
                            <select className="teacherdash-select" value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)}>
                                <option value="all">All Courses</option>
                                {courses.map(c => <option key={c.id} value={c.id}>{c.title} ({c.reviews.length} reviews)</option>)}
                            </select>
                        </div>

                        {allReviews.length === 0 ? (
                            <div className="teacherdash-empty">
                                <span className="teacherdash-emptyicon">⭐</span>
                                No reviews yet. Reviews will appear here when students rate your courses.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {allReviews.map((r, i) => (
                                    <div key={`${r.id}-${i}`} className="teacherdash-reviewcard">
                                        <div className="teacherdash-reviewheader">
                                            <div className="teacherdash-activityavatar" style={{ width: 34, height: 34, fontSize: '0.8rem' }}>{r.user_name?.[0] || '?'}</div>
                                            <div>
                                                <strong style={{ fontSize: '0.95rem' }}>{r.user_name}</strong>
                                                <div><Stars rating={r.rating} /></div>
                                            </div>
                                        </div>
                                        {r.comment && <p className="teacherdash-reviewcomment">{r.comment}</p>}
                                        <div className="teacherdash-reviewmeta">
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
                )
            }
        </div >
    );
}
