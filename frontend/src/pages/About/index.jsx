import './index.css';
import './light.css';
import './dark.css';
import './mlight.css';
import './mdark.css';

export default function About() {
    return (
        <div className="about-root">
            <div className="about-container">
                <h1 className="about-title">About Us 🚀</h1>
                <p className="about-desc">We are dedicated to providing the best learning experience for everyone.</p>
                <div className="about-placeholder">
                    <span className="about-placeholdertext">Our story coming soon...</span>
                </div>
            </div>
        </div>
    );
}
