import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import './index.css';
import './light.css';
import './dark.css';
import './mlight.css';
import './mdark.css';

function isDirectVideoUrl(url) {
    return /\.(mp4|mkv|mov|webm|avi)(\?.*)?$/i.test(url || '');
}

function parseJson(value, fallback) {
    try {
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
}

export default function CoursePlayer() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [currentLesson, setCurrentLesson] = useState(null);
    const [progress, setProgress] = useState({});
    const [submissions, setSubmissions] = useState([]);
    const [quizAnswers, setQuizAnswers] = useState([]);
    const [submissionForm, setSubmissionForm] = useState({ submission_text: '', submission_code: '' });
    const [submitting, setSubmitting] = useState(false);
    const isAdmin = user?.role === 'admin';
    const isOwner = user?.id === course?.teacher_id;
    const hasDirectAccess = isAdmin || isOwner;

    useEffect(() => {
        api.get(`/courses/${courseId}`).then(r => setCourse(r.data)).catch(() => navigate('/courses'));
        api.get(`/courses/${courseId}/lessons`).then(r => {
            setLessons(r.data);
            if (r.data.length > 0) setCurrentLesson(r.data[0]);
        });

        if (hasDirectAccess) return;

        api.get('/enrollments/my').then(r => {
            const enr = r.data.find(e => e.course_id === parseInt(courseId));
            if (!enr) {
                navigate(`/courses/${courseId}`);
                return;
            }

            api.get(`/enrollments/${enr.id}/progress`).then(p => {
                const map = {};
                p.data.forEach(pr => { map[pr.lesson_id] = pr.completed; });
                setProgress(map);
            });
        });
    }, [courseId, hasDirectAccess, navigate]);

    useEffect(() => {
        if (!currentLesson || !user) return;
        api.get(`/lessons/${currentLesson.id}/my-submissions`).then(r => setSubmissions(r.data)).catch(() => setSubmissions([]));
        setQuizAnswers([]);
        setSubmissionForm({ submission_text: '', submission_code: currentLesson.code_template || '' });
    }, [currentLesson, user]);

    const latestSubmission = submissions[0] || null;
    const quizPayload = useMemo(() => parseJson(currentLesson?.quiz_data, { questions: [] }), [currentLesson?.quiz_data]);

    const markComplete = async (lessonId) => {
        if (hasDirectAccess) return;
        try {
            await api.patch('/enrollments/progress', { lesson_id: lessonId, completed: true });
            setProgress(prev => ({ ...prev, [lessonId]: true }));
        } catch { }
    };

    const submitLesson = async () => {
        if (!currentLesson) return;
        setSubmitting(true);
        try {
            let payload = {};
            if (currentLesson.content_type === 'quiz') {
                payload.answer_data = JSON.stringify({ answers: quizAnswers });
            } else {
                payload = { ...submissionForm };
            }

            const res = await api.post(`/lessons/${currentLesson.id}/submit`, payload);
            setSubmissions(prev => [res.data, ...prev]);
            if (!progress[currentLesson.id] && !hasDirectAccess) {
                markComplete(currentLesson.id);
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Submission failed');
        } finally {
            setSubmitting(false);
        }
    };

    const completedCount = Object.values(progress).filter(Boolean).length;
    const totalLessons = lessons.length;
    const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    if (!course) return <div className="checkout-spinner">Loading...</div>;

    return (
        <div className="courseplayer-root fade-in">
            <div className="courseplayer-sidebar">
                <div className="courseplayer-sidebartop">
                    <h3>{course.title}</h3>
                    {!hasDirectAccess && (
                        <>
                            <div className="courseplayer-pbcontainer">
                                <div className="courseplayer-progress" style={{ width: `${progressPercent}%` }} />
                            </div>
                            <span className="courseplayer-progresstext">{progressPercent}% complete</span>
                        </>
                    )}
                    {hasDirectAccess && <span className="courseplayer-adminbadge">{isAdmin ? 'Admin Access' : 'Owner Access'}</span>}
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
                            isDirectVideoUrl(currentLesson.video_url) ? (
                                <video controls src={currentLesson.video_url} style={{ width: '100%', borderRadius: '16px', background: '#000' }} />
                            ) : (
                                <div className="courseplayer-videocontainer">
                                    <iframe src={currentLesson.video_url} title={currentLesson.title} allowFullScreen />
                                </div>
                            )
                        )}

                        {['pdf', 'dpp'].includes(currentLesson.content_type) && currentLesson.pdf_url && (
                            <div className="courseplayer-pdfcontainer">
                                <iframe src={currentLesson.pdf_url} title={currentLesson.title} />
                            </div>
                        )}

                        {currentLesson.content_type === 'ppt' && currentLesson.ppt_url && (
                            <div className="courseplayer-pdfcontainer">
                                <iframe src={currentLesson.ppt_url} title={currentLesson.title} />
                            </div>
                        )}

                        {['text', 'dpp', 'assignment_manual', 'assignment_autograded'].includes(currentLesson.content_type) && currentLesson.content && (
                            <div className="courseplayer-textcontent">{currentLesson.content}</div>
                        )}

                        {currentLesson.content_type === 'markdown_code' && (
                            <div className="courseplayer-textcontent">
                                {currentLesson.content && <p style={{ marginBottom: '1rem' }}>{currentLesson.content}</p>}
                                {currentLesson.code_template && <pre style={{ padding: '1rem', borderRadius: '12px', overflowX: 'auto', background: 'var(--surface)' }}><code>{currentLesson.code_template}</code></pre>}
                            </div>
                        )}

                        {currentLesson.content_type === 'quiz' && (
                            <div className="courseplayer-textcontent">
                                {quizPayload.questions?.map((question, index) => (
                                    <div key={index} style={{ marginBottom: '1.5rem' }}>
                                        <strong>{index + 1}. {question.prompt}</strong>
                                        <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.5rem' }}>
                                            {(question.options || []).map((option, optionIndex) => (
                                                <label key={optionIndex} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                    <input
                                                        type="radio"
                                                        name={`question-${index}`}
                                                        checked={quizAnswers[index] === optionIndex}
                                                        onChange={() => {
                                                            const next = [...quizAnswers];
                                                            next[index] = optionIndex;
                                                            setQuizAnswers(next);
                                                        }}
                                                    />
                                                    <span>{option}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                <button className="courseplayer-btn" onClick={submitLesson} disabled={submitting}>
                                    {submitting ? 'Submitting...' : 'Submit Quiz'}
                                </button>
                            </div>
                        )}

                        {['assignment_manual', 'assignment_autograded'].includes(currentLesson.content_type) && (
                            <div className="courseplayer-textcontent">
                                {currentLesson.code_template && (
                                    <>
                                        <h3>Starter Code</h3>
                                        <pre style={{ padding: '1rem', borderRadius: '12px', overflowX: 'auto', background: 'var(--surface)', marginBottom: '1rem' }}><code>{currentLesson.code_template}</code></pre>
                                    </>
                                )}
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    {currentLesson.content_type === 'assignment_manual' && (
                                        <textarea
                                            value={submissionForm.submission_text}
                                            onChange={e => setSubmissionForm({ ...submissionForm, submission_text: e.target.value })}
                                            placeholder="Write your submission"
                                            style={{ minHeight: '140px', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                                        />
                                    )}
                                    <textarea
                                        value={submissionForm.submission_code}
                                        onChange={e => setSubmissionForm({ ...submissionForm, submission_code: e.target.value })}
                                        placeholder={currentLesson.content_type === 'assignment_autograded' ? 'Write your code here' : 'Optional code submission'}
                                        style={{ minHeight: '220px', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'monospace' }}
                                    />
                                    <button className="courseplayer-btn" onClick={submitLesson} disabled={submitting}>
                                        {submitting ? 'Submitting...' : currentLesson.content_type === 'assignment_autograded' ? 'Run Autograder' : 'Submit Assignment'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {latestSubmission && ['quiz', 'assignment_manual', 'assignment_autograded'].includes(currentLesson.content_type) && (
                            <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--surface)' }}>
                                <h3 style={{ marginBottom: '0.5rem' }}>Latest Submission</h3>
                                <p><strong>Status:</strong> {latestSubmission.status}</p>
                                {latestSubmission.score !== null && latestSubmission.score !== undefined && (
                                    <p><strong>Score:</strong> {latestSubmission.score}{latestSubmission.max_score ? ` / ${latestSubmission.max_score}` : ''}</p>
                                )}
                                {latestSubmission.feedback && <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}><code>{latestSubmission.feedback}</code></pre>}
                            </div>
                        )}

                        <div className="courseplayer-actions">
                            {!progress[currentLesson.id] && !hasDirectAccess && !['quiz', 'assignment_manual', 'assignment_autograded'].includes(currentLesson.content_type) && (
                                <button className="courseplayer-btn" onClick={() => markComplete(currentLesson.id)}>
                                    Mark as Complete
                                </button>
                            )}
                            {hasDirectAccess && (
                                <span className="courseplayer-textmuted">{isAdmin ? 'Admin View Mode' : 'Owner Preview Mode'}</span>
                            )}
                            {progress[currentLesson.id] && (
                                <span className="courseplayer-completedbadge">Completed</span>
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
