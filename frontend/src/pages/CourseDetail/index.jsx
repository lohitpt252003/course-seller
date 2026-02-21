import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import CourseLanding from '../../components/CourseLanding';
import CourseEditor from '../../components/CourseEditor';
import './index.css';

export default function CourseDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [enrollment, setEnrollment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetchCourseData();
    }, [id, user]); // Reload if user changes (login/logout)

    const fetchCourseData = () => {
        setLoading(true);
        // Fetch course details
        api.get(`/courses/${id}`)
            .then(res => {
                setCourse(res.data);
                // Fetch lessons
                return api.get(`/courses/${id}/lessons`);
            })
            .then(res => {
                setLessons(res.data);
                // Fetch reviews
                return api.get(`/courses/${id}/reviews`);
            })
            .then(res => {
                setReviews(res.data);
                // Check enrollment if user is logged in
                if (user) {
                    return api.get('/enrollments/my');
                }
                return { data: [] };
            })
            .then(res => {
                if (user) {
                    const found = res.data.find(e => e.course_id === parseInt(id));
                    setEnrollment(found);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load course", err);
                setLoading(false);
                // Handle 404 or other errors if needed
            });
    };

    const handleEnrollFree = async () => {
        if (!user) return navigate('/login');
        try {
            await api.post('/enrollments/', { course_id: parseInt(id) });
            // Refresh data to show "Continue Learning"
            fetchCourseData();
            alert('Enrolled successfully!');
        } catch (err) {
            alert(err.response?.data?.message || 'Enrollment failed');
        }
    };

    const handleBuy = () => {
        if (!user) return navigate('/login');
        // Redirect to a checkout page or handle payment logic
        navigate(`/checkout/${id}`);
    };

    const handleLearn = () => {
        navigate(`/learn/${id}`);
    };

    // Admin Actions
    const handleApprove = async () => {
        if (!window.confirm('Approve this course?')) return;
        try {
            await api.patch(`/admin/courses/${id}/approve`);
            fetchCourseData();
        } catch (e) { alert('Failed to approve'); }
    };

    const handleReject = async () => {
        if (!window.confirm('Reject this course?')) return;
        try {
            await api.patch(`/admin/courses/${id}/reject`);
            fetchCourseData();
        } catch (e) { alert('Failed to reject'); }
    };

    const handleDelete = async () => {
        if (!window.confirm('Delete this course permanently?')) return;
        try {
            await api.delete(`/admin/courses/${id}`);
            navigate('/admin'); // Redirect to admin dashboard
        } catch (e) { alert('Failed to delete'); }
    };

    // Review Submission
    const submitReview = async (e) => {
        e.preventDefault();
        try {
            await api.post('/reviews/', { ...reviewForm, course_id: parseInt(id) });
            setReviewForm({ rating: 5, comment: '' });
            fetchCourseData(); // Reload reviews
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to submit review');
        }
    };

    // Edit Handlers
    const handleEditSave = (updatedCourse) => {
        setCourse(updatedCourse);
        setIsEditing(false);
        fetchCourseData(); // Refresh everything including lessons
    };

    if (authLoading || loading) return <div className="loading-screen">Loading course...</div>;
    if (!course) return <div className="loading-screen">Course not found.</div>;

    const isAdmin = user?.role === 'admin';
    const isOwner = user?.id === course.teacher_id;
    const isEnrolled = !!enrollment;

    // Render Editor if in edit mode
    if (isEditing) {
        return (
            <div className="course-detail-page">
                <CourseEditor
                    course={course}
                    onSave={handleEditSave}
                    onCancel={() => setIsEditing(false)}
                />
            </div>
        );
    }

    // Render Landing Page
    return (
        <div className="course-detail-page">
            <CourseLanding
                course={course}
                lessons={lessons}
                reviews={reviews}
                user={user}
                enrolled={isEnrolled}
                isAdmin={isAdmin}
                isOwner={isOwner}
                onEnrollFree={handleEnrollFree}
                onBuy={handleBuy}
                onLearn={handleLearn}
                onApprove={handleApprove}
                onReject={handleReject}
                onDelete={handleDelete}
                onEdit={() => setIsEditing(true)}
                reviewForm={
                    isEnrolled && !isOwner && !isAdmin ? (
                        <div className="review-form-container">
                            <h3>Write a Review</h3>
                            <form onSubmit={submitReview}>
                                <div className="form-group">
                                    <label>Rating</label>
                                    <select value={reviewForm.rating} onChange={e => setReviewForm({ ...reviewForm, rating: parseInt(e.target.value) })}>
                                        <option value="5">⭐⭐⭐⭐⭐ (5)</option>
                                        <option value="4">⭐⭐⭐⭐ (4)</option>
                                        <option value="3">⭐⭐⭐ (3)</option>
                                        <option value="2">⭐⭐ (2)</option>
                                        <option value="1">⭐ (1)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <textarea
                                        placeholder="Share your experience..."
                                        value={reviewForm.comment}
                                        onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
                                        required
                                    />
                                </div>
                                <button className="btn-primary" type="submit">Submit Review</button>
                            </form>
                        </div>
                    ) : null
                }
            />
        </div>
    );
}
