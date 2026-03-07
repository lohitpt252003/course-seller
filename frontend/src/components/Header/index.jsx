import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import './index.css';
import './light.css';
import './dark.css';
import './mlight.css';
import './mdark.css';

export default function Header() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <header className="header-root">
            <div className="header-container">
                <Link to="/" className="header-logo">
                    <span className="header-logoicon">🎓</span>
                    <span className="header-logotext">CourseHub</span>
                </Link>

                <nav className="header-nav">
                    <Link to="/courses" className="header-navlink">Courses</Link>
                    {user && user.role === 'student' && (
                        <Link to="/dashboard" className="header-navlink">My Learning</Link>
                    )}
                    {user && user.role === 'teacher' && (
                        <Link to="/teacher" className="header-navlink">Teacher Panel</Link>
                    )}
                    {user && user.role === 'admin' && (
                        <Link to="/admin" className="header-navlink">Admin Panel</Link>
                    )}
                </nav>

                <div className="header-actions">
                    <button className="header-themetoggle" onClick={toggleTheme} title="Toggle theme">
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>

                    {user ? (
                        <div className="header-usermenu">
                            <Link to="/profile" className="header-navlink header-username">
                                {user.name}
                            </Link>
                            <button className="header-btnlogout" onClick={handleLogout}>Logout</button>
                        </div>
                    ) : (
                        <div className="header-authbuttons">
                            <Link to="/login" className="header-btnlogin">Login</Link>
                            <Link to="/register" className="header-btnregister">Register</Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
