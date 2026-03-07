import { Link } from 'react-router-dom';
import './index.css';
import './light.css';
import './dark.css';
import './mlight.css';
import './mdark.css';

export default function NotFound() {
    return (
        <div className="notfound-root">
            <div className="notfound-content">
                <div className="notfound-icon">🔍</div>
                <h1 className="notfound-title">404</h1>
                <p className="notfound-text">Page not found</p>
                <Link to="/" className="notfound-btn">Go Home</Link>
            </div>
        </div>
    );
}
