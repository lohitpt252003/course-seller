import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import './index.css';

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
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Welcome back, {user?.name} 👋</h1>
                <p>Track your learning progress</p>
            </div>
            <div className="dash-stats">
                <div className="dash-stat-card"><span className="dash-stat-num">{enrollments.length}</span><span className="dash-stat-label">Enrolled Courses</span></div>
                <div className="dash-stat-card"><span className="dash-stat-num">{enrollments.filter(e => e.completed).length}</span><span className="dash-stat-label">Completed</span></div>
                <div className="dash-stat-card"><span className="dash-stat-num">{certificates.length}</span><span className="dash-stat-label">Certificates</span></div>
            </div>
            <div className="dash-tabs">
                <button className={`dash-tab ${tab === 'courses' ? 'active' : ''}`} onClick={() => setTab('courses')}>📚 My Courses</button>
                <button className={`dash-tab ${tab === 'certificates' ? 'active' : ''}`} onClick={() => setTab('certificates')}>🏆 Certificates</button>
                <button className={`dash-tab ${tab === 'payments' ? 'active' : ''}`} onClick={() => setTab('payments')}>💳 Payments</button>
            </div>
            {tab === 'courses' && (
                <div className="dash-grid">
                    {enrollments.length === 0 ? (
                        <div className="empty-state"><h3>No courses yet</h3><p>Start learning today!</p><Link to="/courses" className="btn-primary">Browse Courses</Link></div>
                    ) : enrollments.map(enr => (
                        <Link key={enr.id} to={`/learn/${enr.course_id}`} className="dash-course-card">
                            <h4>{enr.course?.title || `Course #${enr.course_id}`}</h4>
                            <span className={`dash-badge ${enr.completed ? 'completed' : 'in-progress'}`}>
                                {enr.completed ? '✅ Completed' : '📖 In Progress'}
                            </span>
                        </Link>
                    ))}
                </div>
            )}
            {tab === 'certificates' && (
                <div className="dash-list">
                    {certificates.length === 0 ? <p className="empty-text">No certificates yet. Complete a course to earn one!</p> :
                        certificates.map(cert => (
                            <div key={cert.id} className="dash-list-item">
                                <span>🏆 Course #{cert.course_id}</span>
                                <span className="dash-date">{new Date(cert.issued_at).toLocaleDateString()}</span>
                            </div>
                        ))
                    }
                </div>
            )}
            {tab === 'payments' && (
                <div className="dash-list">
                    {payments.length === 0 ? <p className="empty-text">No payments yet</p> :
                        payments.map(p => (
                            <div key={p.id} className="dash-list-item">
                                <span>💳 {p.transaction_id}</span>
                                <span>${p.amount}</span>
                                <span className={`dash-badge ${p.status}`}>{p.status}</span>
                            </div>
                        ))
                    }
                </div>
            )}
        </div>
    );
}
