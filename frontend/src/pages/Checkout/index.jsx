import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import './index.css';
import './light.css';
import './dark.css';
import './mlight.css';
import './mdark.css';

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

    const applyCoupon = async () => {
        if (!couponCode.trim()) return;
        try {
            const res = await api.get(`/coupons/validate/${couponCode}`);
            if (res.data.valid) {
                setDiscount(res.data.discount_percentage);
                setCouponApplied(true);
            }
        } catch (err) {
            alert(err.response?.data?.detail || 'Invalid or expired coupon code');
            setCouponCode('');
            setDiscount(0);
            setCouponApplied(false);
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

    if (!course) return <div className="checkout-spinner">Loading...</div>;

    if (success) {
        return (
            <div className="checkout-root">
                <div className="checkout-card checkout-successcard">
                    <div className="checkout-successanim">
                        <div className="checkout-successcircle">
                            <span>✓</span>
                        </div>
                    </div>
                    <h2>Payment Successful! 🎉</h2>
                    <p className="checkout-successamount">${finalPrice}</p>
                    <p className="checkout-successcourse">{course.title}</p>
                    <p className="checkout-successredirect">Redirecting to your course...</p>
                    <div className="checkout-successbar">
                        <div className="checkout-successfill"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="checkout-root">
            <div className="checkout-layout">
                {/* Left: Payment Methods */}
                <div className="checkout-card checkout-main">
                    <h1>💳 Checkout</h1>
                    <p className="checkout-dummybanner">🧪 Demo Mode — No real charges will be made</p>

                    {/* Coupon Section */}
                    <div className="checkout-couponsec">
                        <h3>🎟️ Have a coupon code?</h3>
                        <div className="checkout-couponrow">
                            <input
                                type="text"
                                placeholder="Enter coupon code..."
                                value={couponCode}
                                onChange={e => setCouponCode(e.target.value)}
                                disabled={couponApplied}
                                className="checkout-couponinput"
                            />
                            {couponApplied ? (
                                <button className="checkout-couponbtn checkout-couponremove" onClick={removeCoupon}>✕ Remove</button>
                            ) : (
                                <button className="checkout-couponbtn" onClick={applyCoupon} disabled={!couponCode.trim()}>Apply</button>
                            )}
                        </div>
                        {couponApplied && (
                            <div className="checkout-couponsuccess">
                                ✅ Coupon applied! {discount}% off
                            </div>
                        )}
                        <p className="checkout-couponhint">Ask your teacher for applicable coupon codes.</p>
                    </div>

                    {/* Payment Method Tabs */}
                    <div className="checkout-paymethods">
                        {PAYMENT_METHODS.filter(m => m.id !== 'coupon').map(m => (
                            <button
                                key={m.id}
                                className={`checkout-methodbtn ${method === m.id ? 'active' : ''}`}
                                onClick={() => setMethod(m.id)}
                            >
                                <span className="checkout-methodicon">{m.icon}</span>
                                <span>{m.label.split(' ').slice(1).join(' ')}</span>
                            </button>
                        ))}
                    </div>

                    {/* Credit Card Form */}
                    {method === 'card' && (
                        <div className="checkout-payform fade-in">
                            <div className="checkout-formgroup">
                                <label>Card Number</label>
                                <input type="text" defaultValue="4242 4242 4242 4242" placeholder="1234 5678 9012 3456" />
                            </div>
                            <div className="checkout-formgroup">
                                <label>Cardholder Name</label>
                                <input type="text" defaultValue="Demo User" placeholder="John Doe" />
                            </div>
                            <div className="checkout-row">
                                <div className="checkout-formgroup">
                                    <label>Expiry Date</label>
                                    <input type="text" defaultValue="12/28" placeholder="MM/YY" />
                                </div>
                                <div className="checkout-formgroup">
                                    <label>CVV</label>
                                    <input type="text" defaultValue="123" placeholder="123" />
                                </div>
                            </div>
                            <div className="checkout-cardicons">
                                <span className="checkout-cardbrand">VISA</span>
                                <span className="checkout-cardbrand">MC</span>
                                <span className="checkout-cardbrand">AMEX</span>
                            </div>
                        </div>
                    )}

                    {/* Debit Card Form */}
                    {method === 'debit' && (
                        <div className="checkout-payform fade-in">
                            <div className="checkout-formgroup">
                                <label>Debit Card Number</label>
                                <input type="text" defaultValue="5105 1051 0510 5100" placeholder="1234 5678 9012 3456" />
                            </div>
                            <div className="checkout-formgroup">
                                <label>Cardholder Name</label>
                                <input type="text" defaultValue="Demo User" placeholder="John Doe" />
                            </div>
                            <div className="checkout-row">
                                <div className="checkout-formgroup">
                                    <label>Expiry Date</label>
                                    <input type="text" defaultValue="06/27" placeholder="MM/YY" />
                                </div>
                                <div className="checkout-formgroup">
                                    <label>CVV</label>
                                    <input type="text" defaultValue="456" placeholder="123" />
                                </div>
                            </div>
                            <div className="checkout-cardicons">
                                <span className="checkout-cardbrand">RUPAY</span>
                                <span className="checkout-cardbrand">VISA</span>
                                <span className="checkout-cardbrand">MC</span>
                            </div>
                        </div>
                    )}

                    {/* UPI Form */}
                    {method === 'upi' && (
                        <div className="checkout-payform fade-in">
                            <div className="checkout-formgroup">
                                <label>UPI ID</label>
                                <input type="text" defaultValue="demo@upi" placeholder="yourname@bank" />
                            </div>
                            <p className="checkout-payinfo">
                                📱 A payment request will be sent to your UPI app. Approve to complete.
                            </p>
                            <div className="checkout-upiapps">
                                <span className="checkout-upiapp">Google Pay</span>
                                <span className="checkout-upiapp">PhonePe</span>
                                <span className="checkout-upiapp">Paytm</span>
                                <span className="checkout-upiapp">BHIM</span>
                            </div>
                        </div>
                    )}

                    {/* Net Banking Form */}
                    {method === 'banking' && (
                        <div className="checkout-payform fade-in">
                            <div className="checkout-formgroup">
                                <label>Select Your Bank</label>
                                <select className="checkout-select" defaultValue="">
                                    <option value="" disabled>Choose a bank...</option>
                                    {BANKS.map(b => (
                                        <option key={b} value={b}>{b}</option>
                                    ))}
                                </select>
                            </div>
                            <p className="checkout-payinfo">
                                🏧 You will be redirected to your bank's secure payment page.
                            </p>
                        </div>
                    )}

                    {/* QR Scanner */}
                    {method === 'qr' && (
                        <div className="checkout-payform fade-in">
                            <div className="checkout-qrcontainer">
                                <div className="checkout-qrcode">
                                    <div className="checkout-qrdummy">
                                        {/* ASCII-art style QR placeholder */}
                                        <div className="checkout-qrgrid">
                                            {Array.from({ length: 81 }, (_, i) => (
                                                <div
                                                    key={i}
                                                    className="checkout-qrcell"
                                                    style={{
                                                        background: [0, 1, 2, 6, 7, 8, 9, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 36, 45, 53, 54, 55, 56, 57, 58, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80].includes(i)
                                                            ? 'var(--text)' : 'transparent'
                                                    }}
                                                ></div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <p className="checkout-qrlabel">Scan with any UPI app to pay</p>
                                <p className="checkout-payinfo">📷 Open your payment app and scan this QR code</p>
                            </div>
                        </div>
                    )}

                    {/* Pay Button */}
                    <button
                        className="checkout-mainbtn"
                        onClick={handlePay}
                        disabled={processing}
                    >
                        {processing ? (
                            <span className="checkout-btnloading">
                                <span className="checkout-btnspinner"></span>
                                Processing Payment...
                            </span>
                        ) : (
                            `Pay $${finalPrice}`
                        )}
                    </button>

                    <p className="checkout-securelabel">🔒 Your payment is secure and encrypted</p>
                </div>

                {/* Right: Order Summary */}
                <div className="checkout-card checkout-sidebar">
                    <h3>📋 Order Summary</h3>
                    <div className="checkout-ordercourse">
                        <h4>{course.title}</h4>
                        <p className="checkout-textmuted">by {course.teacher?.name}</p>
                    </div>

                    <div className="checkout-orderline">
                        <span>Course Price</span>
                        <span>${course.price}</span>
                    </div>
                    {couponApplied && (
                        <div className="checkout-orderline discount">
                            <span>Coupon ({discount}% off)</span>
                            <span>-${(course.price * discount / 100).toFixed(2)}</span>
                        </div>
                    )}
                    <div className="checkout-orderdivider"></div>
                    <div className="checkout-orderline total">
                        <span>Total</span>
                        <span>${finalPrice}</span>
                    </div>

                    <div className="checkout-guarantees">
                        <div className="checkout-guaranteeitem">✅ 30-day money-back guarantee</div>
                        <div className="checkout-guaranteeitem">🔄 Full lifetime access</div>
                        <div className="checkout-guaranteeitem">📱 Access on mobile and desktop</div>
                        <div className="checkout-guaranteeitem">🏆 Certificate of completion</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
