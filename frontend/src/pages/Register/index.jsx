import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './index.css';
import './light.css';
import './dark.css';
import './mlight.css';
import './mdark.css';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(name, email, password, 'student');
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-page">
            <div className="register-card">
                <div className="register-header">
                    <h1>Create Account 🚀</h1>
                    <p>Start your learning journey today</p>
                </div>
                {error && <div className="register-error">{error}</div>}
                <form onSubmit={handleSubmit} className="register-form">
                    <div className="register-formgroup">
                        <label>Full Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" required />
                    </div>
                    <div className="register-formgroup">
                        <label>Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
                    </div>
                    <div className="register-formgroup">
                        <label>Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
                    </div>
                    <button type="submit" className="register-submit" disabled={loading}>
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>
                <p className="register-switch">
                    Already have an account? <Link to="/login">Sign In</Link>
                </p>
                <p className="register-switch" style={{ marginTop: '0.5rem' }}>
                    🎓 Want to teach? <Link to="/apply-teacher" style={{ fontWeight: 700 }}>Apply to become a Teacher</Link>
                </p>
            </div>
        </div>
    );
}
