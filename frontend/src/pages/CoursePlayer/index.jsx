import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import './index.css';
import './light.css';
import './dark.css';
import './mlight.css';
import './mdark.css';

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

    if (!course) return <div className="checkout-spinner">Loading...</div>; // reusing checkout spinner logic

    return (
        <div className="courseplayer-root fade-in">
            <div className="courseplayer-sidebar">
                <div className="courseplayer-sidebartop">
                    <h3>{course.title}</h3>
                    {!isAdmin && (
                        <>
                            <div className="courseplayer-pbcontainer">
                                <div className="courseplayer-progress" style={{ width: `${progressPercent}%` }} />
                            </div>
                            <span className="courseplayer-progresstext">{progressPercent}% complete</span>
                        </>
                    )}
                    {isAdmin && <span className="courseplayer-adminbadge">Admin Access</span>}
                </div>
                <div className="courseplayer-nav">
                    {lessons.map((lesson, i) => (
                        <button key={lesson.id} className={`courseplayer-navitem ${currentLesson?.id === lesson.id ? 'active' : ''}`} onClick={() => setCurrentLesson(lesson)}>
                            <span className={`courseplayer-check ${progress[lesson.id] ? 'done' : ''}`}>
                                {progress[lesson.id] ? '✓' : i + 1}
                            </span>
                            <span className="courseplayer-navtitle">{lesson.title}</span>
                        </button>
                    ))}
                </div>
            </div>
            <div className="courseplayer-content">
                {currentLesson ? (
                    <>
                        <h2>{currentLesson.title}</h2>
                        {currentLesson.content_type === 'video' && currentLesson.video_url && (
                            <div className="courseplayer-videocontainer">
                                <iframe src={currentLesson.video_url} title={currentLesson.title} allowFullScreen />
                            </div>
                        )}
                        {currentLesson.content_type === 'pdf' && currentLesson.pdf_url && (
                            <div className="courseplayer-pdfcontainer">
                                <iframe src={currentLesson.pdf_url} title={currentLesson.title} />
                            </div>
                        )}
                        {currentLesson.content && (
                            <div className="courseplayer-textcontent">{currentLesson.content}</div>
                        )}
                        <div className="courseplayer-actions">
                            {!progress[currentLesson.id] && !isAdmin && (
                                <button className="courseplayer-btn" onClick={() => markComplete(currentLesson.id)}>
                                    ✅ Mark as Complete
                                </button>
                            )}
                            {isAdmin && (
                                <span className="courseplayer-textmuted">Admin View Mode</span>
                            )}
                            {progress[currentLesson.id] && (
                                <span className="courseplayer-completedbadge">✅ Completed</span>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="courseplayer-emptystate">
                        <h3>No lessons available</h3>
                    </div>
                )}
            </div>
        </div>
    );
}
