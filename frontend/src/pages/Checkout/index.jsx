import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import './index.css';

const PAYMENT_METHODS = [
    { id: 'card', label: '💳 Credit Card', icon: '💳' },
    { id: 'debit', label: '🏦 Debit Card', icon: '🏦' },
    { id: 'upi', label: '📱 UPI', icon: '📱' },
    { id: 'banking', label: '🏧 Net Banking', icon: '🏧' },
    { id: 'qr', label: '📷 QR Scanner', icon: '📷' },
    { id: 'coupon', label: '🎟️ Coupon', icon: '🎟️' },
];

const BANKS = ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra', 'Punjab National Bank'];

export default function Checkout() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [method, setMethod] = useState('card');
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [couponApplied, setCouponApplied] = useState(false);
    const [discount, setDiscount] = useState(0);

    useEffect(() => {
        api.get(`/courses/${courseId}`).then(r => setCourse(r.data)).catch(() => navigate('/courses'));
    }, [courseId]);

    const applyCoupon = () => {
        if (couponCode.toUpperCase() === 'LEARN50') {
            setDiscount(50);
            setCouponApplied(true);
        } else if (couponCode.toUpperCase() === 'WELCOME20') {
            setDiscount(20);
            setCouponApplied(true);
        } else if (couponCode.toUpperCase() === 'FREE100') {
            setDiscount(100);
            setCouponApplied(true);
        } else {
            alert('Invalid coupon code. Try LEARN50, WELCOME20, or FREE100');
        }
    };

    const removeCoupon = () => {
        setCouponCode('');
        setCouponApplied(false);
        setDiscount(0);
    };

    const finalPrice = course ? Math.max(0, course.price - (course.price * discount / 100)).toFixed(2) : 0;

    const handlePay = async () => {
        setProcessing(true);
        try {
            // Simulate a 2-second processing delay
            await new Promise(r => setTimeout(r, 2000));
            await api.post('/payments/', { course_id: parseInt(courseId) });
            setSuccess(true);
            setTimeout(() => navigate(`/learn/${courseId}`), 3000);
        } catch (err) {
            alert(err.response?.data?.message || 'Payment failed');
        } finally {
            setProcessing(false);
        }
    };

    if (!course) return <div className="loading-spinner">Loading...</div>;

    if (success) {
        return (
            <div className="checkout-page">
                <div className="checkout-card checkout-success-card">
                    <div className="success-animation">
                        <div className="success-circle">
                            <span>✓</span>
                        </div>
                    </div>
                    <h2>Payment Successful! 🎉</h2>
                    <p className="success-amount">${finalPrice}</p>
                    <p className="success-course">{course.title}</p>
                    <p className="success-redirect">Redirecting to your course...</p>
                    <div className="success-progress-bar">
                        <div className="success-progress-fill"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="checkout-page">
            <div className="checkout-layout">
                {/* Left: Payment Methods */}
                <div className="checkout-card checkout-main">
                    <h1>💳 Checkout</h1>
                    <p className="dummy-banner">🧪 Demo Mode — No real charges will be made</p>

                    {/* Coupon Section */}
                    <div className="coupon-section">
                        <h3>🎟️ Have a coupon code?</h3>
                        <div className="coupon-input-row">
                            <input
                                type="text"
                                placeholder="Enter coupon code..."
                                value={couponCode}
                                onChange={e => setCouponCode(e.target.value)}
                                disabled={couponApplied}
                                className="coupon-input"
                            />
                            {couponApplied ? (
                                <button className="coupon-btn coupon-remove" onClick={removeCoupon}>✕ Remove</button>
                            ) : (
                                <button className="coupon-btn" onClick={applyCoupon} disabled={!couponCode.trim()}>Apply</button>
                            )}
                        </div>
                        {couponApplied && (
                            <div className="coupon-success">
                                ✅ Coupon applied! {discount}% off
                            </div>
                        )}
                        <p className="coupon-hint">Try: LEARN50, WELCOME20, or FREE100</p>
                    </div>

                    {/* Payment Method Tabs */}
                    <div className="pay-methods">
                        {PAYMENT_METHODS.filter(m => m.id !== 'coupon').map(m => (
                            <button
                                key={m.id}
                                className={`pay-method-btn ${method === m.id ? 'active' : ''}`}
                                onClick={() => setMethod(m.id)}
                            >
                                <span className="pay-method-icon">{m.icon}</span>
                                <span>{m.label.split(' ').slice(1).join(' ')}</span>
                            </button>
                        ))}
                    </div>

                    {/* Credit Card Form */}
                    {method === 'card' && (
                        <div className="pay-form fade-in">
                            <div className="form-group">
                                <label>Card Number</label>
                                <input type="text" defaultValue="4242 4242 4242 4242" placeholder="1234 5678 9012 3456" />
                            </div>
                            <div className="form-group">
                                <label>Cardholder Name</label>
                                <input type="text" defaultValue="Demo User" placeholder="John Doe" />
                            </div>
                            <div className="checkout-row">
                                <div className="form-group">
                                    <label>Expiry Date</label>
                                    <input type="text" defaultValue="12/28" placeholder="MM/YY" />
                                </div>
                                <div className="form-group">
                                    <label>CVV</label>
                                    <input type="text" defaultValue="123" placeholder="123" />
                                </div>
                            </div>
                            <div className="card-icons">
                                <span className="card-brand">VISA</span>
                                <span className="card-brand">MC</span>
                                <span className="card-brand">AMEX</span>
                            </div>
                        </div>
                    )}

                    {/* Debit Card Form */}
                    {method === 'debit' && (
                        <div className="pay-form fade-in">
                            <div className="form-group">
                                <label>Debit Card Number</label>
                                <input type="text" defaultValue="5105 1051 0510 5100" placeholder="1234 5678 9012 3456" />
                            </div>
                            <div className="form-group">
                                <label>Cardholder Name</label>
                                <input type="text" defaultValue="Demo User" placeholder="John Doe" />
                            </div>
                            <div className="checkout-row">
                                <div className="form-group">
                                    <label>Expiry Date</label>
                                    <input type="text" defaultValue="06/27" placeholder="MM/YY" />
                                </div>
                                <div className="form-group">
                                    <label>CVV</label>
                                    <input type="text" defaultValue="456" placeholder="123" />
                                </div>
                            </div>
                            <div className="card-icons">
                                <span className="card-brand">RUPAY</span>
                                <span className="card-brand">VISA</span>
                                <span className="card-brand">MC</span>
                            </div>
                        </div>
                    )}

                    {/* UPI Form */}
                    {method === 'upi' && (
                        <div className="pay-form fade-in">
                            <div className="form-group">
                                <label>UPI ID</label>
                                <input type="text" defaultValue="demo@upi" placeholder="yourname@bank" />
                            </div>
                            <p className="pay-info">
                                📱 A payment request will be sent to your UPI app. Approve to complete.
                            </p>
                            <div className="upi-apps">
                                <span className="upi-app">Google Pay</span>
                                <span className="upi-app">PhonePe</span>
                                <span className="upi-app">Paytm</span>
                                <span className="upi-app">BHIM</span>
                            </div>
                        </div>
                    )}

                    {/* Net Banking Form */}
                    {method === 'banking' && (
                        <div className="pay-form fade-in">
                            <div className="form-group">
                                <label>Select Your Bank</label>
                                <select className="bank-select" defaultValue="">
                                    <option value="" disabled>Choose a bank...</option>
                                    {BANKS.map(b => (
                                        <option key={b} value={b}>{b}</option>
                                    ))}
                                </select>
                            </div>
                            <p className="pay-info">
                                🏧 You will be redirected to your bank's secure payment page.
                            </p>
                        </div>
                    )}

                    {/* QR Scanner */}
                    {method === 'qr' && (
                        <div className="pay-form fade-in">
                            <div className="qr-container">
                                <div className="qr-code">
                                    <div className="qr-dummy">
                                        {/* ASCII-art style QR placeholder */}
                                        <div className="qr-grid">
                                            {Array.from({ length: 81 }, (_, i) => (
                                                <div
                                                    key={i}
                                                    className="qr-cell"
                                                    style={{
                                                        background: [0, 1, 2, 6, 7, 8, 9, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 36, 45, 53, 54, 55, 56, 57, 58, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80].includes(i)
                                                            ? 'var(--text)' : 'transparent'
                                                    }}
                                                ></div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <p className="qr-label">Scan with any UPI app to pay</p>
                                <p className="pay-info">📷 Open your payment app and scan this QR code</p>
                            </div>
                        </div>
                    )}

                    {/* Pay Button */}
                    <button
                        className="btn-primary checkout-btn"
                        onClick={handlePay}
                        disabled={processing}
                    >
                        {processing ? (
                            <span className="btn-loading">
                                <span className="btn-spinner"></span>
                                Processing Payment...
                            </span>
                        ) : (
                            `Pay $${finalPrice}`
                        )}
                    </button>

                    <p className="secure-label">🔒 Your payment is secure and encrypted</p>
                </div>

                {/* Right: Order Summary */}
                <div className="checkout-card checkout-sidebar">
                    <h3>📋 Order Summary</h3>
                    <div className="order-course">
                        <h4>{course.title}</h4>
                        <p className="text-muted">by {course.teacher?.name}</p>
                    </div>

                    <div className="order-line">
                        <span>Course Price</span>
                        <span>${course.price}</span>
                    </div>
                    {couponApplied && (
                        <div className="order-line discount">
                            <span>Coupon ({discount}% off)</span>
                            <span>-${(course.price * discount / 100).toFixed(2)}</span>
                        </div>
                    )}
                    <div className="order-divider"></div>
                    <div className="order-line total">
                        <span>Total</span>
                        <span>${finalPrice}</span>
                    </div>

                    <div className="order-guarantees">
                        <div className="guarantee-item">✅ 30-day money-back guarantee</div>
                        <div className="guarantee-item">🔄 Full lifetime access</div>
                        <div className="guarantee-item">📱 Access on mobile and desktop</div>
                        <div className="guarantee-item">🏆 Certificate of completion</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
