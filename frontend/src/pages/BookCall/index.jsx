import { useState } from 'react';
import { Link } from 'react-router-dom';
import './index.css';
import './light.css';
import './dark.css';
import './mlight.css';
import './mdark.css';

const EXPERT_MENTORS = [
    {
        id: 1,
        name: 'Alex Rivera',
        role: 'Full Stack Architect',
        tags: ['React', 'Node.js', 'System Design'],
        avatar: '👨‍💻'
    },
    {
        id: 2,
        name: 'Sarah Chen',
        role: 'Senior AI Engineer',
        tags: ['Python', 'PyTorch', 'MLOps'],
        avatar: '👩‍🔬'
    },
    {
        id: 3,
        name: 'Marcus Thorne',
        role: 'Product Lead',
        tags: ['Product Mgr', 'Career Coaching'],
        avatar: '🧔'
    }
];

export default function BookCall() {
    const [step, setStep] = useState(1);
    const [bookingData, setBookingData] = useState({
        mentorId: null,
        date: '',
        time: '',
        name: '',
        email: '',
        reason: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSelectMentor = (id) => {
        setBookingData({ ...bookingData, mentorId: id });
        setStep(2);
    };

    const handleNext = () => setStep(step + 1);
    const handlePrev = () => setStep(step - 1);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            setIsSubmitting(false);
            setIsSuccess(true);
        }, 1500);
    };

    if (isSuccess) {
        return (
            <div className="bookcall-root">
                <div className="bookcall-success">
                    <span className="bookcall-successicon">✅</span>
                    <h2 className="bookcall-successtitle">Booking Confirmed!</h2>
                    <p className="bookcall-successdesc">
                        A calendar invitation has been sent to <strong>{bookingData.email}</strong>.<br />
                        Our expert will see you on {bookingData.date} at {bookingData.time}.
                    </p>
                    <Link to="/" className="bookcall-btn-home">Return Home</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bookcall-root">
            <div className="bookcall-container">
                <header className="bookcall-header">
                    <h1 className="bookcall-title">Let's Book a Call</h1>
                    <p className="bookcall-desc">
                        Unlock your potential with expert-led mentorship. Choose a path and schedule your session today.
                    </p>
                </header>

                <div className="bookcall-steps">
                    {[1, 2, 3].map(s => (
                        <div key={s} className={`bookcall-step ${step >= s ? 'active' : ''}`}>
                            <div className="bookcall-stepnum">{s}</div>
                            <span className="bookcall-steplabel">
                                {s === 1 ? 'Expert' : s === 2 ? 'Schedule' : 'Details'}
                            </span>
                        </div>
                    ))}
                </div>

                {step === 1 && (
                    <div className="bookcall-stepcontent">
                        <div className="bookcall-mentorgrid">
                            {EXPERT_MENTORS.map(m => (
                                <div
                                    key={m.id}
                                    className={`bookcall-mentorcard ${bookingData.mentorId === m.id ? 'selected' : ''}`}
                                    onClick={() => handleSelectMentor(m.id)}
                                >
                                    <div className="bookcall-mentoravatar" style={{ fontSize: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--hover-bg)' }}>
                                        {m.avatar}
                                    </div>
                                    <h3 className="bookcall-mentorname">{m.name}</h3>
                                    <span className="bookcall-mentorrole">{m.role}</span>
                                    <div className="bookcall-mentortags">
                                        {m.tags.map(tag => (
                                            <span key={tag} className="bookcall-mentortag">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="bookcall-formcontainer">
                        <div className="bookcall-formgroup">
                            <label className="bookcall-label">Select Date</label>
                            <input
                                type="date"
                                className="bookcall-input"
                                value={bookingData.date}
                                onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                        <div className="bookcall-formgroup">
                            <label className="bookcall-label">Preferred Time Slot</label>
                            <select
                                className="bookcall-select"
                                value={bookingData.time}
                                onChange={(e) => setBookingData({ ...bookingData, time: e.target.value })}
                            >
                                <option value="">Choose a slot...</option>
                                <option value="10:00 AM">10:00 AM - 11:00 AM</option>
                                <option value="02:00 PM">02:00 PM - 03:00 PM</option>
                                <option value="05:00 PM">05:00 PM - 06:00 PM</option>
                                <option value="08:00 PM">08:00 PM - 09:00 PM</option>
                            </select>
                        </div>
                        <div className="bookcall-actions">
                            <button className="bookcall-btn bookcall-btn-prev" onClick={handlePrev}>Back</button>
                            <button
                                className="bookcall-btn bookcall-btn-next"
                                onClick={handleNext}
                                disabled={!bookingData.date || !bookingData.time}
                            >
                                Next Step
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <form className="bookcall-formcontainer" onSubmit={handleSubmit}>
                        <div className="bookcall-formgroup">
                            <label className="bookcall-label">Full Name</label>
                            <input
                                type="text"
                                className="bookcall-input"
                                placeholder="Your Name"
                                required
                                value={bookingData.name}
                                onChange={(e) => setBookingData({ ...bookingData, name: e.target.value })}
                            />
                        </div>
                        <div className="bookcall-formgroup">
                            <label className="bookcall-label">Work Email</label>
                            <input
                                type="email"
                                className="bookcall-input"
                                placeholder="name@company.com"
                                required
                                value={bookingData.email}
                                onChange={(e) => setBookingData({ ...bookingData, email: e.target.value })}
                            />
                        </div>
                        <div className="bookcall-formgroup">
                            <label className="bookcall-label">Discussion Topic</label>
                            <textarea
                                className="bookcall-textarea"
                                placeholder="Tell us how we can help you..."
                                required
                                value={bookingData.reason}
                                onChange={(e) => setBookingData({ ...bookingData, reason: e.target.value })}
                            ></textarea>
                        </div>
                        <div className="bookcall-actions">
                            <button type="button" className="bookcall-btn bookcall-btn-prev" onClick={handlePrev}>Back</button>
                            <button
                                type="submit"
                                className="bookcall-btn bookcall-btn-next"
                                disabled={isSubmitting || !bookingData.name || !bookingData.email || !bookingData.reason}
                            >
                                {isSubmitting ? 'Confirming...' : 'Complete Booking'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
