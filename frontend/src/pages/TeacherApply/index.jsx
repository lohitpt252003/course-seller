import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import './index.css';
import './light.css';
import './dark.css';
import './mlight.css';
import './mdark.css';

export default function TeacherApply() {
    const { user } = useAuth();
    const [existingApp, setExistingApp] = useState(null);
    const [checkingStatus, setCheckingStatus] = useState(true);
    const [form, setForm] = useState({
        requirements: '',
        cv: '',
        course_description: '',
        course_overview: '',
        expected_lectures: '',
        demo_video_url: '',
    });
    const [cvFile, setCvFile] = useState(null);
    const [cvUrl, setCvUrl] = useState('');
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    // Check for existing application on mount
    useEffect(() => {
        api.get('/teacher-applications/my')
            .then(r => {
                if (r.data && r.data.length > 0) {
                    setExistingApp(r.data[0]); // Most recent
                }
            })
            .catch(() => { })
            .finally(() => setCheckingStatus(false));
    }, []);

    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleCvUpload = async (file) => {
        if (!file) return;
        if (file.type !== 'application/pdf') {
            setError('Only PDF files are accepted for the CV/Resume');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setError('CV file must be less than 10 MB');
            return;
        }
        setError('');
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await api.post('/teacher-applications/upload-resume', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setCvUrl(res.data.url);
            setCvFile(file);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to upload CV');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validate URL
        try {
            new URL(form.demo_video_url);
        } catch {
            setError('Please enter a valid URL for the demo video (e.g. https://youtube.com/...)');
            setLoading(false);
            return;
        }

        if (parseInt(form.expected_lectures) < 1) {
            setError('Expected lectures must be at least 1');
            setLoading(false);
            return;
        }

        if (!cvUrl) {
            setError('Please upload your CV/Resume as a PDF file');
            setLoading(false);
            return;
        }

        try {
            await api.post('/teacher-applications/', {
                ...form,
                expected_lectures: parseInt(form.expected_lectures),
                cv_url: cvUrl,
            });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit application');
        } finally {
            setLoading(false);
        }
    };

    if (checkingStatus) {
        return (
            <div className="teacherapply-root">
                <div className="teacherapply-card">
                    <div className="teacherapply-loading">
                        <div className="teacherapply-spinner"></div>
                        <p>Checking application status...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Already a teacher
    if (user?.role === 'teacher') {
        return (
            <div className="teacherapply-root">
                <div className="teacherapply-card">
                    <div className="teacherapply-statusicon">🎓</div>
                    <h2>You're Already a Teacher!</h2>
                    <p className="teacherapply-statustext">
                        You already have teacher access. Head over to your Teacher Panel to manage your courses.
                    </p>
                    <Link to="/teacher" className="teacherapply-btn primary">Go to Teacher Panel →</Link>
                </div>
            </div>
        );
    }

    // Existing application — show its status
    if (existingApp) {
        const statusConfig = {
            pending: {
                icon: '⏳',
                title: 'Application Under Review',
                color: '#f59e0b',
                description: 'Your teacher application is being reviewed by our admin team. We\'ll get back to you soon!',
            },
            approved: {
                icon: '🎉',
                title: 'Application Approved!',
                color: '#10b981',
                description: 'Congratulations! Your teacher application has been approved. Please log out and log back in to access your Teacher Panel.',
            },
            rejected: {
                icon: '❌',
                title: 'Application Not Approved',
                color: '#ef4444',
                description: existingApp.admin_notes
                    ? `Unfortunately, your application was not approved. Reason: ${existingApp.admin_notes}`
                    : 'Unfortunately, your application was not approved at this time. Please contact support for more details.',
            },
        };
        const config = statusConfig[existingApp.status] || statusConfig.pending;

        return (
            <div className="teacherapply-root">
                <div className="teacherapply-card">
                    <div className="teacherapply-statusicon">{config.icon}</div>
                    <h2>{config.title}</h2>
                    <div className="teacherapply-statusbadge" style={{ background: config.color }}>
                        {existingApp.status.toUpperCase()}
                    </div>
                    <p className="teacherapply-statustext">{config.description}</p>

                    <div className="teacherapply-statusdetails">
                        <div className="teacherapply-statusrow">
                            <span>📅 Submitted</span>
                            <span>{new Date(existingApp.created_at).toLocaleDateString()}</span>
                        </div>
                        {existingApp.reviewed_at && (
                            <div className="teacherapply-statusrow">
                                <span>✅ Reviewed</span>
                                <span>{new Date(existingApp.reviewed_at).toLocaleDateString()}</span>
                            </div>
                        )}
                        <div className="teacherapply-statusrow">
                            <span>🎬 Expected Lectures</span>
                            <span>{existingApp.expected_lectures}</span>
                        </div>
                        {existingApp.cv_url && (
                            <div className="teacherapply-statusrow">
                                <span>📄 CV/Resume</span>
                                <a href={existingApp.cv_url} target="_blank" rel="noopener noreferrer">
                                    View PDF ↗
                                </a>
                            </div>
                        )}
                        <div className="teacherapply-statusrow">
                            <span>🔗 Demo Video</span>
                            <a href={existingApp.demo_video_url} target="_blank" rel="noopener noreferrer">
                                View ↗
                            </a>
                        </div>
                    </div>

                    <div className="teacherapply-actions">
                        <Link to="/dashboard" className="teacherapply-btn primary">Back to Dashboard</Link>
                        <Link to="/courses" className="teacherapply-btn outline">Browse Courses</Link>
                    </div>
                </div>
            </div>
        );
    }

    // Success state after submission
    if (success) {
        return (
            <div className="teacherapply-root">
                <div className="teacherapply-card">
                    <div className="teacherapply-statusicon">🎉</div>
                    <h2>Application Submitted!</h2>
                    <p className="teacherapply-statustext">
                        Your teacher application has been submitted successfully.
                        Our admin team will review it and get back to you soon.
                    </p>
                    <div className="teacherapply-actions">
                        <Link to="/dashboard" className="teacherapply-btn primary">Go to Dashboard</Link>
                        <Link to="/courses" className="teacherapply-btn outline">Browse Courses</Link>
                    </div>
                </div>
            </div>
        );
    }

    // Application form
    return (
        <div className="teacherapply-root">
            <div className="teacherapply-container">
                <div className="teacherapply-hero">
                    <h1>Become a Teacher 🎓</h1>
                    <p>Share your knowledge with thousands of learners worldwide</p>
                </div>

                <div className="teacherapply-benefits">
                    <div className="teacherapply-benefitcard">
                        <span className="teacherapply-benefiticon">💰</span>
                        <h3>Earn Revenue</h3>
                        <p>Set your own prices and earn from every enrollment</p>
                    </div>
                    <div className="teacherapply-benefitcard">
                        <span className="teacherapply-benefiticon">🌍</span>
                        <h3>Global Reach</h3>
                        <p>Reach students from all around the world</p>
                    </div>
                    <div className="teacherapply-benefitcard">
                        <span className="teacherapply-benefiticon">📊</span>
                        <h3>Track Progress</h3>
                        <p>Detailed analytics and student insights</p>
                    </div>
                    <div className="teacherapply-benefitcard">
                        <span className="teacherapply-benefiticon">🛠️</span>
                        <h3>Easy Tools</h3>
                        <p>Intuitive course builder and content management</p>
                    </div>
                </div>

                {error && <div className="teacherapply-error" style={{ maxWidth: 700, margin: '0 auto 1.5rem' }}>{error}</div>}

                <form onSubmit={handleSubmit} className="teacherapply-form">
                    <div className="teacherapply-formsec">
                        <div className="teacherapply-secheader">
                            <span className="teacherapply-secnum">1</span>
                            <div>
                                <h3>About You</h3>
                                <p>Tell us why you want to teach</p>
                            </div>
                        </div>
                        <div className="teacherapply-formgroup">
                            <label>📋 Why do you want to teach on CourseHub? *</label>
                            <textarea
                                value={form.requirements}
                                onChange={e => handleChange('requirements', e.target.value)}
                                placeholder="Share your motivation, teaching philosophy, and what drives you to educate others..."
                                required
                                rows={4}
                            />
                        </div>
                        <div className="teacherapply-formgroup">
                            <label>📄 Your Qualifications & Experience *</label>
                            <textarea
                                value={form.cv}
                                onChange={e => handleChange('cv', e.target.value)}
                                placeholder="List your degrees, certifications, work experience, and any prior teaching experience..."
                                required
                                rows={4}
                            />
                        </div>
                        <div className="teacherapply-formgroup">
                            <label>📎 Upload CV / Resume (PDF only, max 10MB) *</label>
                            <div
                                className={`teacherapply-cvupload ${cvFile ? 'uploaded' : ''} ${uploading ? 'uploading' : ''}`}
                                onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
                                onDragLeave={e => { e.currentTarget.classList.remove('drag-over'); }}
                                onDrop={e => {
                                    e.preventDefault();
                                    e.currentTarget.classList.remove('drag-over');
                                    const file = e.dataTransfer.files[0];
                                    if (file) handleCvUpload(file);
                                }}
                                onClick={() => document.getElementById('cv-file-input').click()}
                            >
                                <input
                                    id="cv-file-input"
                                    type="file"
                                    accept=".pdf,application/pdf"
                                    style={{ display: 'none' }}
                                    onChange={e => handleCvUpload(e.target.files[0])}
                                />
                                {uploading ? (
                                    <>
                                        <div className="teacherapply-spinner" style={{ margin: '0 auto' }}></div>
                                        <span>Uploading...</span>
                                    </>
                                ) : cvFile ? (
                                    <>
                                        <span className="teacherapply-cvicon">✅</span>
                                        <span className="teacherapply-cvname">{cvFile.name}</span>
                                        <span className="teacherapply-cvchange">Click to change file</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="teacherapply-cvicon">📄</span>
                                        <span>Drag & drop your PDF here, or click to browse</span>
                                        <span className="teacherapply-formhint">PDF format only, max 10 MB</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="teacherapply-formsec">
                        <div className="teacherapply-secheader">
                            <span className="teacherapply-secnum">2</span>
                            <div>
                                <h3>Course Plan</h3>
                                <p>Describe what you plan to teach</p>
                            </div>
                        </div>
                        <div className="teacherapply-formgroup">
                            <label>📚 Course Description *</label>
                            <textarea
                                value={form.course_description}
                                onChange={e => handleChange('course_description', e.target.value)}
                                placeholder="What will your course be about? Who is the target audience? What will students learn?"
                                required
                                rows={3}
                            />
                        </div>
                        <div className="teacherapply-formgroup">
                            <label>🗂️ Course Overview & Structure *</label>
                            <textarea
                                value={form.course_overview}
                                onChange={e => handleChange('course_overview', e.target.value)}
                                placeholder="Outline the modules/chapters, topics covered, and how the course is structured..."
                                required
                                rows={3}
                            />
                        </div>
                        <div className="teacherapply-formgroup">
                            <label>🎬 Expected Number of Lectures *</label>
                            <input
                                type="number"
                                min="1"
                                value={form.expected_lectures}
                                onChange={e => handleChange('expected_lectures', e.target.value)}
                                placeholder="e.g. 20"
                                required
                            />
                        </div>
                    </div>

                    <div className="teacherapply-formsec">
                        <div className="teacherapply-secheader">
                            <span className="teacherapply-secnum">3</span>
                            <div>
                                <h3>Demo Video</h3>
                                <p>Show us your teaching style</p>
                            </div>
                        </div>
                        <div className="teacherapply-formgroup">
                            <label>🔗 Demo Video Link (External URL) *</label>
                            <input
                                type="url"
                                value={form.demo_video_url}
                                onChange={e => handleChange('demo_video_url', e.target.value)}
                                placeholder="https://youtube.com/watch?v=..."
                                required
                            />
                            <span className="teacherapply-formhint">
                                Upload a short teaching demo (5-10 min) to YouTube, Vimeo, or similar and paste the link here
                            </span>
                        </div>
                    </div>

                    <button type="submit" className="teacherapply-submit" disabled={loading}>
                        {loading ? 'Submitting Application...' : '🚀 Submit Application'}
                    </button>
                </form>
            </div>
        </div>
    );
}
