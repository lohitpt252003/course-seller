import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import '../StudentDashboard/index.css';

export default function TeacherDashboard() {
    const { user } = useAuth();
    const [courses, setCourses] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [categories, setCategories] = useState([]);
    const [form, setForm] = useState({ title: '', description: '', price: 0, category_id: '', thumbnail_url: '' });
    const [editingId, setEditingId] = useState(null);
    const [lessonForm, setLessonForm] = useState({ title: '', content_type: 'text', content: '', video_url: '', pdf_url: '', order_index: 0 });
    const [showLessonForm, setShowLessonForm] = useState(null);

    const fetchCourses = () => {
        api.get('/courses/').then(r => {
            setCourses(r.data.filter(c => c.teacher_id === user.id));
        });
    };

    useEffect(() => {
        fetchCourses();
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
            fetchCourses();
        } catch (err) {
            alert(err.response?.data?.detail || 'Failed');
        }
    };

    const handleEdit = (course) => {
        setForm({ title: course.title, description: course.description || '', price: course.price, category_id: course.category_id || '', thumbnail_url: course.thumbnail_url || '' });
        setEditingId(course.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this course?')) return;
        await api.delete(`/courses/${id}`);
        fetchCourses();
    };

    const handleLessonSubmit = async (e, courseId) => {
        e.preventDefault();
        try {
            await api.post(`/courses/${courseId}/lessons`, { ...lessonForm, order_index: parseInt(lessonForm.order_index) || 0 });
            setShowLessonForm(null);
            setLessonForm({ title: '', content_type: 'text', content: '', video_url: '', pdf_url: '', order_index: 0 });
            alert('Lesson added!');
        } catch (err) {
            alert(err.response?.data?.detail || 'Failed');
        }
    };

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Teacher Dashboard 🎓</h1>
                <p>Manage your courses and lessons</p>
            </div>
            <div className="dash-stats">
                <div className="dash-stat-card"><span className="dash-stat-num">{courses.length}</span><span className="dash-stat-label">Total Courses</span></div>
                <div className="dash-stat-card"><span className="dash-stat-num">{courses.filter(c => c.status === 'published').length}</span><span className="dash-stat-label">Published</span></div>
                <div className="dash-stat-card"><span className="dash-stat-num">{courses.reduce((s, c) => s + (c.total_students || 0), 0)}</span><span className="dash-stat-label">Total Students</span></div>
            </div>

            <div className="dash-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2>Your Courses</h2>
                    <button className="btn-primary" onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ title: '', description: '', price: 0, category_id: '', thumbnail_url: '' }); }}>
                        {showForm ? 'Cancel' : '+ New Course'}
                    </button>
                </div>

                {showForm && (
                    <form onSubmit={handleSubmit} className="dash-form" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                        <div className="form-group"><label>Title</label><input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
                        <div className="form-group"><label>Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                        <div className="form-group"><label>Price ($)</label><input type="number" step="0.01" min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
                        <div className="form-group"><label>Category</label>
                            <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                                <option value="">None</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group"><label>Thumbnail URL</label><input type="text" value={form.thumbnail_url} onChange={e => setForm({ ...form, thumbnail_url: e.target.value })} /></div>
                        <button type="submit" className="btn-primary">{editingId ? 'Update' : 'Create'} Course</button>
                    </form>
                )}

                {courses.map(course => (
                    <div key={course.id} className="dash-list-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <strong>{course.title}</strong>
                                <span className={`dash-badge ${course.status}`} style={{ marginLeft: '0.5rem' }}>{course.status}</span>
                            </div>
                            <div>
                                <button className="action-btn" onClick={() => handleEdit(course)}>✏️ Edit</button>
                                <button className="action-btn" onClick={() => setShowLessonForm(showLessonForm === course.id ? null : course.id)}>📝 Add Lesson</button>
                                <button className="action-btn danger" onClick={() => handleDelete(course.id)}>🗑️ Delete</button>
                            </div>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            ${course.price} · ⭐ {course.avg_rating?.toFixed(1)} · 👥 {course.total_students} students
                        </div>
                        {showLessonForm === course.id && (
                            <form onSubmit={(e) => handleLessonSubmit(e, course.id)} className="dash-form" style={{ marginTop: '0.5rem', padding: '1rem', background: 'var(--hover-bg)', borderRadius: '10px' }}>
                                <div className="form-group"><label>Lesson Title</label><input type="text" value={lessonForm.title} onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })} required /></div>
                                <div className="form-group"><label>Content Type</label>
                                    <select value={lessonForm.content_type} onChange={e => setLessonForm({ ...lessonForm, content_type: e.target.value })}>
                                        <option value="text">Text</option>
                                        <option value="video">Video</option>
                                        <option value="pdf">PDF</option>
                                    </select>
                                </div>
                                {lessonForm.content_type === 'text' && <div className="form-group"><label>Content</label><textarea value={lessonForm.content} onChange={e => setLessonForm({ ...lessonForm, content: e.target.value })} /></div>}
                                {lessonForm.content_type === 'video' && <div className="form-group"><label>Video URL</label><input type="text" value={lessonForm.video_url} onChange={e => setLessonForm({ ...lessonForm, video_url: e.target.value })} /></div>}
                                {lessonForm.content_type === 'pdf' && <div className="form-group"><label>PDF URL</label><input type="text" value={lessonForm.pdf_url} onChange={e => setLessonForm({ ...lessonForm, pdf_url: e.target.value })} /></div>}
                                <div className="form-group"><label>Order</label><input type="number" value={lessonForm.order_index} onChange={e => setLessonForm({ ...lessonForm, order_index: e.target.value })} /></div>
                                <button type="submit" className="btn-primary">Add Lesson</button>
                            </form>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
