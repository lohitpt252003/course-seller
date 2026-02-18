import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import './index.css';

export default function CourseDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [enrolled, setEnrolled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [reviewText, setReviewText] = useState('');
    const [reviewRating, setReviewRating] = useState(5);

    useEffect(() => {
        Promise.all([
            api.get(`/courses/${id}`),
            api.get(`/courses/${id}/lessons`),
            api.get(`/reviews/course/${id}`),
        ]).then(([courseRes, lessonsRes, reviewsRes]) => {
            setCourse(courseRes.data);
            setLessons(lessonsRes.data);
            setReviews(reviewsRes.data);
        }).catch(() => navigate('/courses'))
            .finally(() => setLoading(false));

        if (user) {
            api.get('/enrollments/my').then(r => {
                setEnrolled(r.data.some(e => e.course_id === parseInt(id)));
            }).catch(() => { });
        }
    }, [id]);

    const handleBuy = () => navigate(`/checkout/${id}`);
    const handleLearn = () => navigate(`/learn/${id}`);

    const handleReview = async (e) => {
        e.preventDefault();
        try {
            await api.post('/reviews/', { course_id: parseInt(id), rating: reviewRating, comment: reviewText });
            const r = await api.get(`/reviews/course/${id}`);
            setReviews(r.data);
            setReviewText('');
            const c = await api.get(`/courses/${id}`);
            setCourse(c.data);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to submit review');
        }
    };

    if (loading) return <div className="loading-spinner">Loading...</div>;
    if (!course) return null;

    return (
        <div className="course-detail">
            <div className="detail-hero">
                <div className="detail-info">
                    {course.category && <span className="detail-category">{course.category.name}</span>}
                    <h1>{course.title}</h1>
                    <p className="detail-desc">{course.description}</p>
                    <div className="detail-meta">
                        <span>⭐ {course.avg_rating?.toFixed(1) || '0.0'}</span>
                        <span>👥 {course.total_students} students</span>
                        <span>📚 {lessons.length} lessons</span>
                    </div>
                    <p className="detail-teacher">Created by <strong>{course.teacher?.name}</strong></p>
                </div>
                <div className="detail-sidebar">
                    <div className="sidebar-card">
                        {course.thumbnail_url ? (
                            <img src={course.thumbnail_url} alt={course.title} className="sidebar-img" />
                        ) : (
                            <div className="sidebar-img-placeholder">📚</div>
                        )}
                        <div className="sidebar-price">
                            {course.price === 0 ? 'Free' : `$${course.price}`}
                        </div>
                        {!user ? (
                            <Link to="/login" className="btn-primary sidebar-btn">Login to Enroll</Link>
                        ) : enrolled ? (
                            <button className="btn-primary sidebar-btn" onClick={handleLearn}>Continue Learning</button>
                        ) : course.price === 0 ? (
                            <button className="btn-primary sidebar-btn" onClick={async () => {
                                await api.post('/enrollments/', { course_id: parseInt(id) });
                                setEnrolled(true);
                            }}>Enroll for Free</button>
                        ) : (
                            <button className="btn-primary sidebar-btn" onClick={handleBuy}>Buy Now</button>
                        )}
                    </div>
                </div>
            </div>

            <div className="detail-content">
                <section className="detail-section">
                    <h2>📋 Course Content</h2>
                    <div className="lessons-list">
                        {lessons.map((lesson, i) => (
                            <div key={lesson.id} className="lesson-item">
                                <span className="lesson-num">{i + 1}</span>
                                <span className="lesson-title">{lesson.title}</span>
                                <span className="lesson-type">{lesson.content_type === 'video' ? '🎥' : lesson.content_type === 'pdf' ? '📄' : '📝'}</span>
                            </div>
                        ))}
                        {lessons.length === 0 && <p className="empty-text">No lessons yet</p>}
                    </div>
                </section>

                <section className="detail-section">
                    <h2>⭐ Reviews ({reviews.length})</h2>
                    {enrolled && user && (
                        <form onSubmit={handleReview} className="review-form">
                            <div className="rating-input">
                                {[1, 2, 3, 4, 5].map(n => (
                                    <button key={n} type="button" className={`star ${reviewRating >= n ? 'active' : ''}`} onClick={() => setReviewRating(n)}>★</button>
                                ))}
                            </div>
                            <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="Write a review..." rows={3} />
                            <button type="submit" className="btn-primary">Submit Review</button>
                        </form>
                    )}
                    <div className="reviews-list">
                        {reviews.map(r => (
                            <div key={r.id} className="review-item">
                                <div className="review-header">
                                    <strong>{r.user?.name || 'User'}</strong>
                                    <span className="review-stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                                </div>
                                {r.comment && <p className="review-text">{r.comment}</p>}
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
