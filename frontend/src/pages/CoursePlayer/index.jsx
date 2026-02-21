import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import './index.css';

export default function CoursePlayer() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [currentLesson, setCurrentLesson] = useState(null);
    const [progress, setProgress] = useState({});
    const [enrollmentId, setEnrollmentId] = useState(null);
    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        api.get(`/courses/${courseId}`).then(r => setCourse(r.data)).catch(() => navigate('/courses'));
        api.get(`/courses/${courseId}/lessons`).then(r => {
            setLessons(r.data);
            if (r.data.length > 0) setCurrentLesson(r.data[0]);
        });

        // Skip enrollment check for admins
        if (isAdmin) return;

        api.get('/enrollments/my').then(r => {
            const enr = r.data.find(e => e.course_id === parseInt(courseId));
            if (!enr) { navigate(`/courses/${courseId}`); return; }
            setEnrollmentId(enr.id);
            api.get(`/enrollments/${enr.id}/progress`).then(p => {
                const map = {};
                p.data.forEach(pr => { map[pr.lesson_id] = pr.completed; });
                setProgress(map);
            });
        });
    }, [courseId, isAdmin, navigate]);

    const markComplete = async (lessonId) => {
        // Admins can't track progress (or maybe they can, but let's disable strictly marking for now to avoid errors if no enrollment exists)
        if (isAdmin) return;

        try {
            await api.patch('/enrollments/progress', { lesson_id: lessonId, completed: true });
            setProgress(prev => ({ ...prev, [lessonId]: true }));
        } catch { }
    };

    const completedCount = Object.values(progress).filter(Boolean).length;
    const totalLessons = lessons.length;
    const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    if (!course) return <div className="loading-spinner">Loading...</div>;

    return (
        <div className="player-page">
            <div className="player-sidebar">
                <div className="sidebar-top">
                    <h3>{course.title}</h3>
                    {!isAdmin && (
                        <>
                            <div className="progress-bar-container">
                                <div className="progress-bar" style={{ width: `${progressPercent}%` }} />
                            </div>
                            <span className="progress-text">{progressPercent}% complete</span>
                        </>
                    )}
                    {isAdmin && <span className="admin-badge">Admin Access</span>}
                </div>
                <div className="lessons-nav">
                    {lessons.map((lesson, i) => (
                        <button key={lesson.id} className={`lesson-nav-item ${currentLesson?.id === lesson.id ? 'active' : ''}`} onClick={() => setCurrentLesson(lesson)}>
                            <span className={`lesson-check ${progress[lesson.id] ? 'done' : ''}`}>
                                {progress[lesson.id] ? '✓' : i + 1}
                            </span>
                            <span className="lesson-nav-title">{lesson.title}</span>
                        </button>
                    ))}
                </div>
            </div>
            <div className="player-content">
                {currentLesson ? (
                    <>
                        <h2>{currentLesson.title}</h2>
                        {currentLesson.content_type === 'video' && currentLesson.video_url && (
                            <div className="video-container">
                                <iframe src={currentLesson.video_url} title={currentLesson.title} allowFullScreen />
                            </div>
                        )}
                        {currentLesson.content_type === 'pdf' && currentLesson.pdf_url && (
                            <div className="pdf-container">
                                <iframe src={currentLesson.pdf_url} title={currentLesson.title} />
                            </div>
                        )}
                        {currentLesson.content && (
                            <div className="text-content">{currentLesson.content}</div>
                        )}
                        <div className="lesson-actions">
                            {!progress[currentLesson.id] && !isAdmin && (
                                <button className="btn-primary" onClick={() => markComplete(currentLesson.id)}>
                                    ✅ Mark as Complete
                                </button>
                            )}
                            {isAdmin && (
                                <span className="text-muted">Admin View Mode</span>
                            )}
                            {progress[currentLesson.id] && (
                                <span className="completed-badge">✅ Completed</span>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="empty-state">
                        <h3>No lessons available</h3>
                    </div>
                )}
            </div>
        </div>
    );
}
