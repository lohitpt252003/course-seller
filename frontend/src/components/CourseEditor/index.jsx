import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { uploadFile } from '../../api/upload';
import './index.css';
import './light.css';
import './dark.css';
import './mlight.css';
import './mdark.css';

export default function CourseEditor({ course, onSave, onCancel }) {
    const [form, setForm] = useState({
        title: course.title,
        description: course.description || '',
        price: course.price,
        category_id: course.category_id || '',
        thumbnail_url: course.thumbnail_url || ''
    });

    const [lessons, setLessons] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

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

    // Lesson Form State
    const [showLessonForm, setShowLessonForm] = useState(false);
    const [lessonForm, setLessonForm] = useState({
        title: '',
        content: '',
        file_url: '',
        order_index: 0
    });
    const [editingLessonId, setEditingLessonId] = useState(null);

    useEffect(() => {
        api.get('/categories/').then(r => setCategories(r.data)).catch(() => { });
        fetchLessons();
    }, [course.id]);

    const fetchLessons = () => {
        api.get(`/courses/${course.id}/lessons`).then(r => {
            setLessons(r.data);
            // Auto-set next order index
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
                price: parseFloat(form.price) || 0,
                category_id: form.category_id ? parseInt(form.category_id) : null
            };
            const res = await api.put(`/courses/${course.id}`, data);
            onSave(res.data); // Notify parent of update
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update course');
            setLoading(false);
        }
    };

    const handleLessonSubmit = async (e) => {
        e.preventDefault();
        try {
            // Auto-detect content_type from what's provided
            let content_type = 'text';
            let video_url = null;
            let pdf_url = null;
            if (lessonForm.file_url) {
                const url = lessonForm.file_url.toLowerCase();
                if (url.match(/\.(mp4|mkv|avi|mov|webm)$/)) {
                    content_type = 'video';
                    video_url = lessonForm.file_url;
                } else {
                    content_type = 'pdf';
                    pdf_url = lessonForm.file_url;
                }
            }
            const data = {
                title: lessonForm.title,
                content_type,
                content: lessonForm.content || null,
                video_url,
                pdf_url,
                order_index: parseInt(lessonForm.order_index) || 0,
            };

            if (editingLessonId) {
                await api.put(`/lessons/${editingLessonId}`, data);
            } else {
                await api.post(`/courses/${course.id}/lessons`, data);
            }

            setShowLessonForm(false);
            setEditingLessonId(null);
            setLessonForm({ title: '', content: '', file_url: '', order_index: lessons.length + 1 });
            fetchLessons();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to save lesson.');
        }
    };

    const deleteLesson = async (id) => {
        if (!window.confirm('Delete this lesson?')) return;
        try {
            await api.delete(`/lessons/${id}`);
            fetchLessons();
        } catch (err) {
            alert('Failed to delete lesson');
        }
    };

    const startEditLesson = (lesson) => {
        setLessonForm({
            title: lesson.title,
            content: lesson.content || '',
            file_url: lesson.video_url || lesson.pdf_url || '',
            order_index: lesson.order_index
        });
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
                    <input
                        type="text"
                        value={form.title}
                        onChange={e => setForm({ ...form, title: e.target.value })}
                        required
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                    />
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text)' }}>Description</label>
                    <textarea
                        value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', minHeight: '120px' }}
                    />
                </div>

                <div className="courseeditor-formrow" style={{ marginBottom: '1rem' }}>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text)' }}>Price ($)</label>
                        <input
                            type="number" step="0.01" min="0"
                            value={form.price}
                            onChange={e => setForm({ ...form, price: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                        />
                    </div>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text)' }}>Category</label>
                        <select
                            value={form.category_id}
                            onChange={e => setForm({ ...form, category_id: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                        >
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
                    {form.thumbnail_url && <img src={form.thumbnail_url} alt="preview" style={{ width: 80, height: 50, objectFit: 'cover', borderRadius: 6, marginTop: '0.4rem', border: '1px solid var(--border)' }} />}
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
                            setLessonForm({ title: '', content: '', file_url: '', order_index: lessons.length + 1 });
                        }}
                        style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem', borderRadius: '6px' }}
                    >
                        {showLessonForm ? '✕ Close Form' : '+ Add Lesson'}
                    </button>
                </div>

                {showLessonForm && (
                    <form onSubmit={handleLessonSubmit} className="courseeditor-addform fade-in">
                        <h4 style={{ marginBottom: '1rem' }}>{editingLessonId ? 'Edit Lesson' : 'New Lesson'}</h4>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text)' }}>Lesson Title</label>
                            <input type="text" value={lessonForm.title} onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })} required style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
                        </div>
                        <div className="courseeditor-formrow" style={{ marginBottom: '1rem' }}>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text)' }}>Order</label>
                                <input type="number" value={lessonForm.order_index} onChange={e => setLessonForm({ ...lessonForm, order_index: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text)' }}>📝 Text Content</label>
                            <textarea value={lessonForm.content} onChange={e => setLessonForm({ ...lessonForm, content: e.target.value })} placeholder="Write lesson content here (optional)" style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', minHeight: '150px' }} />
                        </div>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text)' }}>📎 Upload File</label>
                            <input type="file" onChange={e => handleFileUpload(e.target.files[0], 'materials', url => setLessonForm({ ...lessonForm, file_url: url }))} disabled={uploading} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
                            <input type="text" placeholder="Or paste file URL" value={lessonForm.file_url} onChange={e => setLessonForm({ ...lessonForm, file_url: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.4rem', fontSize: '0.85rem' }} />
                            {uploading && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>⏳ Uploading...</span>}
                        </div>

                        <button type="submit" className="btn-success" style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', color: 'white', background: 'var(--success)', marginTop: '1rem', cursor: 'pointer' }}>
                            {editingLessonId ? 'Update Lesson' : 'Add Lesson'}
                        </button>
                    </form>
                )}

                <div className="courseeditor-lessonslist">
                    {lessons.map((l, i) => (
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
