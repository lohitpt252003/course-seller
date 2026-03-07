import { useState } from 'react';
import './index.css';
import './light.css';
import './dark.css';
import './mlight.css';
import './mdark.css';

export default function CourseLanding({
    course,
    lessons = [],
    reviews = [],
    user,
    enrolled,
    onEnrollFree,
    onBuy,
    onLearn,
    onApprove,
    onReject,
    onDelete,
    isAdmin,
    isOwner,
    onEdit,
    reviewForm
}) {
    const [expandedLesson, setExpandedLesson] = useState(null);
    const canViewContent = isAdmin || isOwner || enrolled;

    const toggleLesson = (id) => {
        if (!canViewContent) return;
        setExpandedLesson(expandedLesson === id ? null : id);
    };

    if (!course) return null;

    const renderActionButtons = () => {
        // Admin Actions
        if (isAdmin) {
            return (
                <div className="courselanding-actions">
                    <div className="courselanding-rolebadge admin">Admin Controls</div>
                    {course.status === 'draft' && (
                        <button className="courselanding-btn success" onClick={onApprove}>
                            ✅ Approve & Publish
                        </button>
                    )}
                    {course.status !== 'archived' && (
                        <button className="courselanding-btn danger" onClick={onReject}>
                            🚫 Reject / Archive
                        </button>
                    )}
                    <button className="courselanding-btn danger" onClick={onDelete} style={{ marginTop: '0.5rem' }}>
                        🗑️ Delete Course
                    </button>
                    <button className="courselanding-btn primary" onClick={onLearn} style={{ marginTop: '0.5rem' }}>
                        👁️ Preview Content
                    </button>
                </div>
            );
        }

        // Teacher (Owner) Actions
        if (isOwner) {
            return (
                <div className="courselanding-actions">
                    <div className="courselanding-rolebadge teacher">Owner Controls</div>
                    <button className="courselanding-btn secondary" onClick={onEdit}>
                        ✏️ Edit Course
                    </button>
                    <button className="courselanding-btn primary" onClick={onLearn} style={{ marginTop: '0.5rem' }}>
                        👁️ View Content
                    </button>
                    <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        <strong>Stats:</strong> {course.total_students} students, {course.avg_rating?.toFixed(1) || '0.0'} rating
                    </div>
                </div>
            );
        }

        // Student Enrolled
        if (enrolled) {
            return (
                <div className="courselanding-actions">
                    <button className="courselanding-btn success" onClick={onLearn}>
                        ▶ Continue Learning
                    </button>
                </div>
            );
        }

        // Guest / Not Enrolled
        return (
            <div className="courselanding-actions">
                <div className="courselanding-price">
                    {course.price === 0 ? 'Free' : `$${course.price}`}
                </div>
                {course.price === 0 ? (
                    <button className="courselanding-btn primary" onClick={onEnrollFree}>
                        Enroll for Free
                    </button>
                ) : (
                    <button className="courselanding-btn primary" onClick={onBuy}>
                        Buy Now
                    </button>
                )}
                {!user && (
                    <small className="text-muted" style={{ display: 'block', textAlign: 'center', marginTop: '0.5rem' }}>
                        Login required to enroll
                    </small>
                )}
            </div>
        );
    };

    return (
        <div className="courselanding-wrapper fade-in">
            <div className="courselanding-hero">
                <div className="courselanding-info">
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                        {course.category && (
                            <span className="courselanding-categorybadge">{course.category.name}</span>
                        )}
                        <span className={`dash-badge ${course.status}`} style={{ textTransform: 'capitalize' }}>{course.status}</span>
                    </div>

                    <h1 className="courselanding-title">{course.title}</h1>
                    <p className="courselanding-desc">{course.description}</p>

                    <div className="courselanding-meta">
                        <span>⭐ {course.avg_rating?.toFixed(1) || '0.0'} ({reviews.length} reviews)</span>
                        <span>👥 {course.total_students} students</span>
                        <span>📚 {lessons.length} lessons</span>
                    </div>

                    <p className="courselanding-teacher">
                        Created by <strong>{course.teacher?.name || 'Unknown Teacher'}</strong>
                    </p>
                </div>

                <div className="courselanding-sidebar">
                    <div className="courselanding-card">
                        <div className="courselanding-imgcontainer">
                            {course.thumbnail_url ? (
                                <img src={course.thumbnail_url} alt={course.title} className="courselanding-img" />
                            ) : (
                                <span className="courselanding-imgplaceholder">📚</span>
                            )}
                        </div>
                        <div className="courselanding-cardbody">
                            {renderActionButtons()}
                        </div>
                    </div>
                </div>
            </div>

            <div className="courselanding-content">
                <section className="courselanding-section">
                    <h2>📋 Course Content</h2>
                    <div className="courselanding-lessons">
                        {lessons.map((lesson, i) => (
                            <div key={lesson.id} className={`courselanding-lessonitemcontainer ${expandedLesson === lesson.id ? 'expanded' : ''}`}>
                                <div
                                    className={`courselanding-lessonitem ${canViewContent ? 'clickable' : ''}`}
                                    onClick={() => toggleLesson(lesson.id)}
                                >
                                    <span className="courselanding-lessonnum">{i + 1}</span>
                                    <span className="courselanding-lessontitle">{lesson.title}</span>
                                    <span className="courselanding-lessontype">
                                        {lesson.content_type === 'video' ? '🎥' : lesson.content_type === 'pdf' ? '📄' : '📝'}
                                    </span>
                                    {canViewContent && (
                                        <span className="courselanding-lessontoggle">
                                            {expandedLesson === lesson.id ? '🔼' : '🔽'}
                                        </span>
                                    )}
                                </div>
                                {expandedLesson === lesson.id && canViewContent && (
                                    <div className="courselanding-lessonpreview fade-in">
                                        {lesson.content_type === 'video' && lesson.video_url && (
                                            <div className="courselanding-videocontainer">
                                                <iframe src={lesson.video_url} title={lesson.title} allowFullScreen />
                                            </div>
                                        )}
                                        {lesson.content_type === 'pdf' && lesson.pdf_url && (
                                            <div className="courselanding-pdfcontainer">
                                                <iframe src={lesson.pdf_url} title={lesson.title} />
                                            </div>
                                        )}
                                        {lesson.content && (
                                            <div className="courselanding-textcontent">{lesson.content}</div>
                                        )}
                                        {lesson.content_type === 'video' && !lesson.video_url && <p className="text-muted">No video URL provided.</p>}
                                        {lesson.content_type === 'pdf' && !lesson.pdf_url && <p className="text-muted">No PDF URL provided.</p>}
                                    </div>
                                )}
                            </div>
                        ))}
                        {lessons.length === 0 && <p className="text-muted">No lessons available yet.</p>}
                    </div>
                </section>

                <section className="courselanding-section">
                    <h2 style={{ justifyContent: 'space-between' }}>
                        <span>⭐ Reviews</span>
                        <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>{reviews.length} total</span>
                    </h2>

                    {reviewForm && (
                        <div style={{ marginBottom: '2rem' }}>
                            {reviewForm}
                        </div>
                    )}

                    <div className="courselanding-reviewsgrid">
                        {reviews.map(r => (
                            <div key={r.id} className="courselanding-reviewcard">
                                <div className="courselanding-reviewheader">
                                    <span className="courselanding-reviewauthor">{r.user?.name || 'User'}</span>
                                    <span style={{ color: '#f59e0b' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                                </div>
                                <p className="courselanding-reviewmsg">{r.comment}</p>
                                <small className="text-muted">{new Date(r.created_at).toLocaleDateString()}</small>
                            </div>
                        ))}
                        {reviews.length === 0 && <p className="text-muted">No reviews yet.</p>}
                    </div>
                </section>
            </div>
        </div>
    );
}
