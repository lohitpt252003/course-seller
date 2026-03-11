import './index.css';
import './light.css';
import './dark.css';
import './mlight.css';
import './mdark.css';

export default function Students() {
    return (
        <div className="students-root">
            <div className="students-container">
                <h1 className="students-title">Our Students 🎓</h1>
                <p className="students-desc">Learn more about our student community and success stories.</p>
                <div className="students-placeholder">
                    <span className="students-placeholdertext">Coming Soon...</span>
                </div>
            </div>
        </div>
    );
}
