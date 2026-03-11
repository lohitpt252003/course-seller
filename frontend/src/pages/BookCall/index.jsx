import './index.css';
import './light.css';
import './dark.css';
import './mlight.css';
import './mdark.css';

export default function BookCall() {
    return (
        <div className="bookcall-root">
            <div className="bookcall-container">
                <h1 className="bookcall-title">Book a Call ☎️</h1>
                <p className="bookcall-desc">Schedule a mentorship or inquiry call with our experts.</p>
                <div className="bookcall-placeholder">
                    <span className="bookcall-placeholdertext">Calendar integration coming soon...</span>
                </div>
            </div>
        </div>
    );
}
