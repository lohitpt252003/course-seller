import './index.css';
import './light.css';
import './dark.css';
import './mlight.css';
import './mdark.css';

export default function Teachers() {
    return (
        <div className="teachers-root">
            <div className="teachers-container">
                <h1 className="teachers-title">Our Teachers 👨‍🏫</h1>
                <p className="teachers-desc">Learn from industry experts and professionals.</p>
                <div className="teachers-placeholder">
                    <span className="teachers-placeholdertext">Expert profiles coming soon...</span>
                </div>
            </div>
        </div>
    );
}
