import './index.css';
import './light.css';
import './dark.css';
import './mlight.css';
import './mdark.css';

export default function Footer() {
    return (
        <footer className="footer-root">
            <div className="footer-container">
                <div className="footer-main">
                    <div className="footer-brand">
                        <span className="footer-logo">🎓 CourseHub</span>
                        <p className="footer-tagline">Learn. Grow. Succeed.</p>
                    </div>
                    <div className="footer-links">
                        <div className="footer-col">
                            <h4>Platform</h4>
                            <a href="/courses">Browse Courses</a>
                            <a href="/teachers">Our Teachers</a>
                            <a href="/students">Our Students</a>
                        </div>
                        <div className="footer-col">
                            <h4>Support</h4>
                            <a href="/help-centre">Help Centre</a>
                            <a href="/contact-us">Contact Us</a>
                            <a href="/book-call">Book a Call</a>
                        </div>
                        <div className="footer-col">
                            <h4>Legal</h4>
                            <a href="/privacy-policy">Privacy Policy</a>
                            <a href="/terms-conditions">Terms and Conditions</a>
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>© 2026 CourseHub. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
