import './index.css';
import './light.css';
import './dark.css';
import './mlight.css';
import './mdark.css';

export default function ContactUs() {
    return (
        <div className="contact-root">
            <div className="contact-container">
                <h1 className="contact-title">Contact Us 📞</h1>
                <p className="contact-desc">Have questions? Reach out to our team.</p>
                <div className="contact-placeholder">
                    <span className="contact-placeholdertext">Contact form coming soon...</span>
                </div>
            </div>
        </div>
    );
}
