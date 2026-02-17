import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import './index.css';

export default function Header() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <header className="header">
            <div className="header-container">
                <Link to="/" className="header-logo">
                    <span className="logo-icon">🎓</span>
                    <span className="logo-text">CourseHub</span>
                </Link>

                <nav className="header-nav">
                    <Link to="/courses" className="nav-link">Courses</Link>
                    {user && user.role === 'student' && (
                        <Link to="/dashboard" className="nav-link">My Learning</Link>
                    )}
                    {user && user.role === 'teacher' && (
                        <Link to="/teacher" className="nav-link">Teacher Panel</Link>
                    )}
                    {user && user.role === 'admin' && (
                        <Link to="/admin" className="nav-link">Admin Panel</Link>
                    )}
                </nav>

                <div className="header-actions">
                    <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>

                    {user ? (
                        <div className="user-menu">
                            <Link to="/profile" className="nav-link user-name">
                                {user.name}
                            </Link>
                            <button className="btn-logout" onClick={handleLogout}>Logout</button>
                        </div>
                    ) : (
                        <div className="auth-buttons">
                            <Link to="/login" className="btn-login">Login</Link>
                            <Link to="/register" className="btn-register">Register</Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
