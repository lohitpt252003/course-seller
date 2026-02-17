import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import './index.css';

export default function Checkout() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        api.get(`/courses/${courseId}`).then(r => setCourse(r.data)).catch(() => navigate('/courses'));
    }, [courseId]);

    const handlePay = async () => {
        setProcessing(true);
        try {
            await api.post('/payments/', { course_id: parseInt(courseId) });
            setSuccess(true);
            setTimeout(() => navigate(`/learn/${courseId}`), 2000);
        } catch (err) {
            alert(err.response?.data?.detail || 'Payment failed');
        } finally {
            setProcessing(false);
        }
    };

    if (!course) return <div className="loading-spinner">Loading...</div>;

    return (
        <div className="checkout-page">
            <div className="checkout-card">
                {success ? (
                    <div className="checkout-success">
                        <span className="success-icon">✅</span>
                        <h2>Payment Successful!</h2>
                        <p>Redirecting to your course...</p>
                    </div>
                ) : (
                    <>
                        <h1>💳 Checkout</h1>
                        <div className="checkout-summary">
                            <h3>{course.title}</h3>
                            <p>by {course.teacher?.name}</p>
                            <div className="checkout-price">${course.price}</div>
                        </div>
                        <div className="checkout-dummy">
                            <p className="dummy-label">🧪 This is a demo payment</p>
                            <div className="form-group">
                                <label>Card Number</label>
                                <input type="text" defaultValue="4242 4242 4242 4242" disabled />
                            </div>
                            <div className="checkout-row">
                                <div className="form-group">
                                    <label>Expiry</label>
                                    <input type="text" defaultValue="12/28" disabled />
                                </div>
                                <div className="form-group">
                                    <label>CVC</label>
                                    <input type="text" defaultValue="123" disabled />
                                </div>
                            </div>
                        </div>
                        <button className="btn-primary checkout-btn" onClick={handlePay} disabled={processing}>
                            {processing ? 'Processing...' : `Pay $${course.price}`}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
