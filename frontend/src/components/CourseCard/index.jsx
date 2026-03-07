import { Link } from 'react-router-dom';
import './index.css';
import './light.css';
import './dark.css';
import './mlight.css';
import './mdark.css';

export default function CourseCard({ course }) {
    return (
        <Link to={`/courses/${course.id}`} className="coursecard-root">
            <div className="coursecard-thumbnail">
                {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt={course.title} />
                ) : (
                    <div className="coursecard-placeholder">
                        <span>📚</span>
                    </div>
                )}
                {course.price === 0 ? (
                    <span className="coursecard-badge free">Free</span>
                ) : (
                    <span className="coursecard-badge price">${course.price}</span>
                )}
            </div>
            <div className="coursecard-body">
                <h3 className="coursecard-title">{course.title}</h3>
                <p className="coursecard-teacher">by {course.teacher?.name || 'Unknown'}</p>
                <div className="coursecard-meta">
                    <span className="coursecard-rating">
                        ⭐ {course.avg_rating?.toFixed(1) || '0.0'}
                    </span>
                    <span className="coursecard-students">
                        👥 {course.total_students || 0} students
                    </span>
                </div>
                {course.category && (
                    <span className="coursecard-category">{course.category.name}</span>
                )}
            </div>
        </Link>
    );
}
