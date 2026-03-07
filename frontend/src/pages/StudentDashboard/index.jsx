import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import './index.css';
import './light.css';
import './dark.css';
import './mlight.css';
import './mdark.css';

export default function StudentDashboard() {
    const { user } = useAuth();
    const [enrollments, setEnrollments] = useState([]);
    const [certificates, setCertificates] = useState([]);
    const [payments, setPayments] = useState([]);
    const [tab, setTab] = useState('courses');

    useEffect(() => {
        api.get('/enrollments/my').then(r => setEnrollments(r.data)).catch(() => { });
        api.get('/certificates/my').then(r => setCertificates(r.data)).catch(() => { });
        api.get('/payments/my').then(r => setPayments(r.data)).catch(() => { });
    }, []);

    return (
        <div className="studentdash-root">
            <div className="studentdash-header">
                <h1>Welcome back, {user?.name} 👋</h1>
                <p>Track your learning progress</p>
            </div>

            <div className="studentdash-banner">
                <div>
                    <h3>🎓 Want to share your knowledge?</h3>
                    <p>Apply to become a teacher and create courses on CourseHub</p>
                </div>
                <Link to="/apply-teacher" className="btn-primary" style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', textDecoration: 'none' }}>
                    Apply to Teach →
                </Link>
            </div>
            <div className="studentdash-stats">
                <div className="studentdash-statcard"><span className="studentdash-statnum">{enrollments.length}</span><span className="studentdash-statlabel">Enrolled Courses</span></div>
                <div className="studentdash-statcard"><span className="studentdash-statnum">{enrollments.filter(e => e.completed).length}</span><span className="studentdash-statlabel">Completed</span></div>
                <div className="studentdash-statcard"><span className="studentdash-statnum">{certificates.length}</span><span className="studentdash-statlabel">Certificates</span></div>
            </div>
            <div className="studentdash-tabs">
                <button className={`studentdash-tab ${tab === 'courses' ? 'active' : ''}`} onClick={() => setTab('courses')}>📚 My Courses</button>
                <button className={`studentdash-tab ${tab === 'certificates' ? 'active' : ''}`} onClick={() => setTab('certificates')}>🏆 Certificates</button>
                <button className={`studentdash-tab ${tab === 'payments' ? 'active' : ''}`} onClick={() => setTab('payments')}>💳 Payments</button>
            </div>
            {tab === 'courses' && (
                <div className="studentdash-grid">
                    {enrollments.length === 0 ? (
                        <div className="studentdash-empty"><h3>No courses yet</h3><p>Start learning today!</p><Link to="/courses" className="btn-primary" style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', textDecoration: 'none' }}>Browse Courses</Link></div>
                    ) : enrollments.map(enr => (
                        <Link key={enr.id} to={`/learn/${enr.course_id}`} className="studentdash-coursecard">
                            <h4>{enr.course?.title || `Course #${enr.course_id}`}</h4>
                            <span className={`studentdash-badge ${enr.completed ? 'completed' : 'in-progress'}`}>
                                {enr.completed ? '✅ Completed' : '📖 In Progress'}
                            </span>
                        </Link>
                    ))}
                </div>
            )}
            {tab === 'certificates' && (
                <div className="studentdash-list">
                    {certificates.length === 0 ? <p className="studentdash-empty">No certificates yet. Complete a course to earn one!</p> :
                        certificates.map(cert => (
                            <div key={cert.id} className="studentdash-listitem">
                                <span>🏆 Course #{cert.course_id}</span>
                                <span className="studentdash-date">{new Date(cert.issued_at).toLocaleDateString()}</span>
                            </div>
                        ))
                    }
                </div>
            )}
            {tab === 'payments' && (
                <div className="studentdash-list">
                    {payments.length === 0 ? <p className="studentdash-empty">No payments yet</p> :
                        payments.map(p => (
                            <div key={p.id} className="studentdash-listitem">
                                <span>💳 {p.transaction_id}</span>
                                <span>${p.amount}</span>
                                <span className={`studentdash-badge ${p.status}`}>{p.status}</span>
                            </div>
                        ))
                    }
                </div>
            )}
        </div>
    );
}
