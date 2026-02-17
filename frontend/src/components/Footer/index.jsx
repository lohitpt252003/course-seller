import './index.css';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-brand">
                    <span className="footer-logo">🎓 CourseHub</span>
                    <p className="footer-tagline">Learn. Grow. Succeed.</p>
                </div>
                <div className="footer-links">
                    <div className="footer-col">
                        <h4>Platform</h4>
                        <a href="/courses">Browse Courses</a>
                        <a href="/register">Become a Teacher</a>
                    </div>
                    <div className="footer-col">
                        <h4>Support</h4>
                        <a href="#">Help Center</a>
                        <a href="#">Contact Us</a>
                    </div>
                    <div className="footer-col">
                        <h4>Legal</h4>
                        <a href="#">Privacy Policy</a>
                        <a href="#">Terms of Service</a>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>© 2026 CourseHub. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
