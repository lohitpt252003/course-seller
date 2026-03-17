import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { uploadFile } from '../../api/upload';
import LessonComposer, { INITIAL_LESSON_FORM, buildLessonPayload, mapLessonToForm } from '../LessonComposer';
import './index.css';
import './light.css';
import './dark.css';
import './mlight.css';
import './mdark.css';

export default function CourseEditor({ course, onSave, onCancel }) {
    const [form, setForm] = useState({
        title: course.title,
        description: course.description || '',
        category_id: course.category_id || '',
        thumbnail_url: course.thumbnail_url || '',
        demo_video_url: course.demo_video_url || '',
    });
    const [lessons, setLessons] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showLessonForm, setShowLessonForm] = useState(false);
    const [lessonForm, setLessonForm] = useState(INITIAL_LESSON_FORM);
    const [editingLessonId, setEditingLessonId] = useState(null);

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

    useEffect(() => {
        api.get('/categories/').then(r => setCategories(r.data)).catch(() => { });
        fetchLessons();
    }, [course.id]);

    const fetchLessons = () => {
        api.get(`/courses/${course.id}/lessons`).then(r => {
            setLessons(r.data);
            const maxOrder = r.data.length > 0 ? Math.max(...r.data.map(l => l.order_index)) : 0;
            setLessonForm(prev => ({ ...prev, order_index: maxOrder + 1 }));
        });
    };

    const handleCourseSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = {
                ...form,
                category_id: form.category_id ? parseInt(form.category_id) : null,
            };
            const res = await api.put(`/courses/${course.id}`, data);
            onSave(res.data);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update course');
            setLoading(false);
        }
    };

    const handleLessonSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = buildLessonPayload(lessonForm);

            if (editingLessonId) {
                await api.put(`/lessons/${editingLessonId}`, data);
            } else {
                await api.post(`/courses/${course.id}/lessons`, data);
            }

            setShowLessonForm(false);
            setEditingLessonId(null);
            setLessonForm({ ...INITIAL_LESSON_FORM, order_index: lessons.length + 1 });
            fetchLessons();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to save lesson.');
        }
    };

    const deleteLesson = async (id) => {
        if (!window.confirm('Delete this lesson?')) return;
        try {
            await api.delete(`/lessons/${id}`);
            fetchLessons();
        } catch {
            alert('Failed to delete lesson');
        }
    };

    const startEditLesson = (lesson) => {
        setLessonForm(mapLessonToForm(lesson));
        setEditingLessonId(lesson.id);
        setShowLessonForm(true);
    };

    return (
        <div className="courseeditor-root fade-in">
            <div className="courseeditor-header">
                <h2>✏️ Edit Course</h2>
                <div className="courseeditor-actions">
                    <button className="btn-secondary" onClick={onCancel} style={{ padding: '0.5rem 1rem', borderRadius: '8px' }}>
                        Cancel
                    </button>
                    <button className="btn-primary" onClick={handleCourseSubmit} style={{ padding: '0.5rem 1rem', borderRadius: '8px' }} disabled={loading}>
                        {loading ? 'Saving...' : '💾 Save Changes'}
                    </button>
                </div>
            </div>

            <form onSubmit={handleCourseSubmit}>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text)' }}>Course Title</label>
                    <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text)' }}>Description</label>
                    <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', minHeight: '120px' }} />
                </div>

                <div className="courseeditor-formrow" style={{ marginBottom: '1rem' }}>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text)' }}>Category</label>
                        <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}>
                            <option value="">Uncategorized</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text)' }}>📷 Thumbnail</label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input type="file" onChange={e => handleFileUpload(e.target.files[0], 'thumbnails', url => setForm({ ...form, thumbnail_url: url }))} disabled={uploading} style={{ flex: 1, padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
                        {uploading && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>⏳ Uploading...</span>}
                    </div>
                    <input type="text" placeholder="Or paste URL manually" value={form.thumbnail_url} onChange={e => setForm({ ...form, thumbnail_url: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.4rem', fontSize: '0.85rem' }} />
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text)' }}>🎬 Demo Lecture</label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input type="file" accept="video/*" onChange={e => handleFileUpload(e.target.files[0], 'materials', url => setForm({ ...form, demo_video_url: url }))} disabled={uploading} style={{ flex: 1, padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
                        {uploading && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>⏳ Uploading...</span>}
                    </div>
                    <input type="text" placeholder="Or paste demo video URL" value={form.demo_video_url} onChange={e => setForm({ ...form, demo_video_url: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.4rem', fontSize: '0.85rem' }} />
                </div>
            </form>

            <hr style={{ margin: '2rem 0', borderColor: 'var(--border)' }} />

            <div className="courseeditor-formsection">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>📚 Lessons</h3>
                    <button
                        className="btn-primary"
                        onClick={() => {
                            setShowLessonForm(!showLessonForm);
                            setEditingLessonId(null);
                            setLessonForm({ ...INITIAL_LESSON_FORM, order_index: lessons.length + 1 });
                        }}
                        style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem', borderRadius: '6px' }}
                    >
                        {showLessonForm ? '✕ Close Form' : '+ Add Lesson'}
                    </button>
                </div>

                {showLessonForm && (
                    <LessonComposer
                        value={lessonForm}
                        onChange={setLessonForm}
                        onSubmit={handleLessonSubmit}
                        onFileUpload={handleFileUpload}
                        uploading={uploading}
                        heading={editingLessonId ? 'Edit Course Item' : 'New Course Item'}
                        subheading="Create lessons, DPPs, quizzes, and assignments with a dedicated builder for each type."
                        submitLabel={editingLessonId ? 'Update Item' : 'Add Item'}
                    />
                )}

                <div className="courseeditor-lessonslist">
                    {lessons.map(l => (
                        <div key={l.id} className="courseeditor-lessonitem">
                            <div className="courseeditor-lessonmeta">
                                <span style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>{l.order_index}</span>
                                <span>{l.title}</span>
                                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'var(--hover-bg)', borderRadius: '4px', border: '1px solid var(--border)' }}>{l.content_type}</span>
                            </div>
                            <div className="courseeditor-lessonactions">
                                <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }} onClick={() => startEditLesson(l)}>✏️</button>
                                <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }} onClick={() => deleteLesson(l.id)}>🗑️</button>
                            </div>
                        </div>
                    ))}
                    {lessons.length === 0 && <p className="text-muted">No lessons yet.</p>}
                </div>
            </div>
        </div>
    );
}
