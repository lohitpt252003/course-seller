import { Link } from 'react-router-dom';
import './index.css';

export default function CourseCard({ course }) {
    return (
        <Link to={`/courses/${course.id}`} className="course-card">
            <div className="card-thumbnail">
                {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt={course.title} />
                ) : (
                    <div className="card-thumbnail-placeholder">
                        <span>📚</span>
                    </div>
                )}
                {course.price === 0 ? (
                    <span className="card-badge free">Free</span>
                ) : (
                    <span className="card-badge price">${course.price}</span>
                )}
            </div>
            <div className="card-body">
                <h3 className="card-title">{course.title}</h3>
                <p className="card-teacher">by {course.teacher?.name || 'Unknown'}</p>
                <div className="card-meta">
                    <span className="card-rating">
                        ⭐ {course.avg_rating?.toFixed(1) || '0.0'}
                    </span>
                    <span className="card-students">
                        👥 {course.total_students || 0} students
                    </span>
                </div>
                {course.category && (
                    <span className="card-category">{course.category.name}</span>
                )}
            </div>
        </Link>
    );
}
