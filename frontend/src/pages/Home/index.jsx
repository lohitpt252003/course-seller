import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import CourseCard from '../../components/CourseCard';
import './index.css';
import './light.css';
import './dark.css';
import './mlight.css';
import './mdark.css';

const WHY_FEATURES = [
    { icon: '🎯', title: '1:1 Mentorship', desc: 'Personalized sessions tailored to your learning progress.' },
    { icon: '👨‍🏫', title: 'Expert Faculty', desc: 'Taught by industry practitioners & experienced professionals.' },
    { icon: '🛠️', title: 'Real Projects', desc: 'Build a strong portfolio with hands-on, real-world projects.' },
    { icon: '📈', title: 'Career Guidance', desc: 'Resume building, LinkedIn optimization & interview prep.' },
    { icon: '💻', title: 'Tools Mastery', desc: 'Master industry-standard tools and technologies.' },
    { icon: '🤝', title: 'Community', desc: 'Learn alongside a network of peers & professionals.' },
];

const FAQ_DATA = [
    { q: 'How do I sign up for a course?', a: 'Simply browse our courses, click "Enroll Now", complete the checkout, and start learning immediately.' },
    { q: 'Can I become a teacher on this platform?', a: 'Yes! Register as a student first, then apply through the "Become a Teacher" option. Our admin team will review your application.' },
    { q: 'What payment methods are accepted?', a: 'We accept Credit Cards, Debit Cards, UPI, Net Banking, and QR Scanner payments. You can also apply coupon codes for discounts.' },
    { q: 'Are the courses self-paced?', a: 'Yes, once enrolled you can access the course material anytime and learn at your own pace.' },
    { q: 'Do I get a certificate after completing a course?', a: 'Yes, you receive an industry-recognized certificate upon successful completion of each course.' },
    { q: 'How do I contact support?', a: 'You can reach our support team through the contact form on the platform or email us directly.' },
];

const PARTNER_LOGOS = ['Google', 'Microsoft', 'Amazon', 'Meta', 'Apple'];

export default function Home() {
    const [featured, setFeatured] = useState([]);
    const [categories, setCategories] = useState([]);
    const [stats, setStats] = useState({ total_courses: 0, total_students: 0, total_teachers: 0 });
    const [openFaq, setOpenFaq] = useState(null);
    const [testimonials, setTestimonials] = useState([]);
    const [placementStats, setPlacementStats] = useState(null);

    useEffect(() => {
        api.get('/courses/?sort_by=rating').then(r => setFeatured(r.data.slice(0, 6))).catch(() => { });
        api.get('/categories/').then(r => setCategories(r.data)).catch(() => { });
        api.get('/landing/stats').then(r => setStats(r.data)).catch(() => { });
        api.get('/testimonials/').then(r => setTestimonials(r.data)).catch(() => { });
        api.get('/placement-stats/').then(r => setPlacementStats(r.data)).catch(() => { });
    }, []);

    return (
        <div className="home-root">
            {/* ===== HERO SECTION ===== */}
            <section className="home-hero">
                <div className="home-heroinner">
                    <div className="home-herocontent">
                        <h1 className="home-herotitle">
                            MASTER NEW SKILLS &<br />
                            <span className="home-herohighlight">TRANSFORM YOUR CAREER</span>
                        </h1>
                        <p className="home-herosubtitle">
                            A structured, expert-led platform to build real skills. Learn from industry professionals through curated courses, hands-on projects, and mentor support.
                        </p>
                        <div className="home-herofeatures">
                            <span className="home-herofeature">✦ Live Courses</span>
                            <span className="home-herofeature">✦ 1:1 Mentor Support</span>
                            <span className="home-herofeature">✦ Industry Projects</span>
                        </div>
                        <div className="home-logosbar">
                            <span className="home-logoslabel">OUR LEARNERS WORK AT</span>
                            {PARTNER_LOGOS.map(name => (
                                <span key={name} className="home-partnerlogo">{name}</span>
                            ))}
                        </div>
                        <div className="home-hero-stats">
                            <div className="home-statcard">
                                <span className="home-statnumber">{stats.total_courses}+</span>
                                <span className="home-stattext">Courses Available</span>
                            </div>
                            <div className="home-statcard">
                                <span className="home-statnumber">{stats.total_students}+</span>
                                <span className="home-stattext">Active Learners</span>
                            </div>
                            <div className="home-statcard">
                                <span className="home-statnumber">{stats.total_teachers}+</span>
                                <span className="home-stattext">Expert Teachers</span>
                            </div>
                        </div>
                    </div>

                    <div className="home-heroactions-sidebar">
                        <Link to="/courses" className="home-btnprimary">Explore Courses</Link>
                        <Link to="/register" className="home-btnsecondary">Start Teaching →</Link>
                    </div>
                </div>
            </section>

            {/* ===== COURSES SECTION ===== */}
            {featured.length > 0 && (
                <section className="home-section home-coursessection">
                    <div className="home-sectioninner">
                        <div className="home-sectionheader">
                            <div>
                                <h2 className="home-sectiontitle">OUR COURSES</h2>
                                <p className="home-sectionsubtitle">Carefully curated programs designed by industry experts</p>
                            </div>
                            <Link to="/courses" className="home-seeall">View All Courses →</Link>
                        </div>
                        <div className="home-coursegrid">
                            {featured.map(course => (
                                <CourseCard key={course.id} course={course} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ===== PLACEMENT STATS ===== */}
            {placementStats && (
                <section className="home-section home-placementsection">
                    <div className="home-sectioninner">
                        <div className="home-placementheader">
                            <h2 className="home-sectiontitle">OUTSTANDING CAREER OUTCOMES</h2>
                            <p className="home-sectionsubtitle">Our graduates work at leading tech companies worldwide.</p>
                        </div>
                        <div className="home-placementgrid">
                            <div className="home-placementcard">
                                <div className="home-placementvalue">{placementStats.highest_package}</div>
                                <div className="home-placementlabel">Highest Package</div>
                            </div>
                            <div className="home-placementcard">
                                <div className="home-placementvalue">{placementStats.average_package}</div>
                                <div className="home-placementlabel">Average Package</div>
                            </div>
                            <div className="home-placementcard">
                                <div className="home-placementvalue">{placementStats.placement_percentage}</div>
                                <div className="home-placementlabel">Placement Rate</div>
                            </div>
                            <div className="home-placementcard">
                                <div className="home-placementvalue">{placementStats.total_hiring_partners}+</div>
                                <div className="home-placementlabel">Hiring Partners</div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* ===== CATEGORIES ===== */}
            {categories.length > 0 && (
                <section className="home-section home-categoriessection">
                    <div className="home-sectioninner">
                        <h2 className="home-sectiontitle center">Browse by Category</h2>
                        <div className="home-categorygrid">
                            {categories.map(cat => (
                                <Link key={cat.id} to={`/courses?category=${cat.id}`} className="home-categorychip">
                                    {cat.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ===== WHY CHOOSE US ===== */}
            <section className="home-section home-whysection">
                <div className="home-sectioninner">
                    <h2 className="home-sectiontitle center">WHY LEARN WITH US?</h2>
                    <p className="home-sectionsubtitle center">
                        Technology is changing fast. We focus on clarity, hands-on practice, and industry readiness.
                    </p>
                    <div className="home-whygrid">
                        {WHY_FEATURES.map((f, i) => (
                            <div key={i} className="home-whycard">
                                <div className="home-whyicon">{f.icon}</div>
                                <h3 className="home-whytitle">{f.title}</h3>
                                <p className="home-whydesc">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== CTA BANNER ===== */}
            <section className="home-ctabanner">
                <div className="home-ctabannerinner">
                    <div className="home-ctatext">
                        <h2>Ready to Start Your Journey?</h2>
                        <p>Join thousands of learners who have transformed their careers through our platform. Start learning today.</p>
                        <div className="home-ctapoints">
                            <span>✅ Expert-Led Courses</span>
                            <span>✅ Industry Certification</span>
                            <span>✅ Lifetime Access</span>
                        </div>
                        <Link to="/courses" className="home-btncta">Explore Courses</Link>
                    </div>
                    <div className="home-ctavisual">
                        <div className="home-ctavisualcard">
                            <div className="home-ctaemoji">🚀</div>
                            <span>Launch Your Career</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== ALUMNI TESTIMONIALS ===== */}
            {testimonials.length > 0 && (
                <section className="home-section home-testimonialsection">
                    <div className="home-sectioninner">
                        <h2 className="home-sectiontitle center">What Our Alumni Say</h2>
                        <p className="home-sectionsubtitle center">
                            Hear from our graduates who have transformed their careers
                        </p>
                        <div className="home-testimonialgrid">
                            {testimonials.map(t => (
                                <div key={t.id} className="home-testimonialcard">
                                    <div className="home-testimonialquote">
                                        <span className="home-quotemark">“</span>
                                        <p>{t.quote}</p>
                                    </div>
                                    <div className="home-testimonialauthor">
                                        {t.photo_url ? (
                                            <img src={t.photo_url} alt={t.name} className="home-testimonialavatar" />
                                        ) : (
                                            <div className="home-testimonialavatar home-testimonialplaceholder">
                                                {t.name[0]}
                                            </div>
                                        )}
                                        <div>
                                            <div className="home-testimonialname">{t.name}</div>
                                            <div className="home-testimonialrole">{t.role}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ===== BECOME A TEACHER ===== */}
            <section className="home-section home-teachersection">
                <div className="home-sectioninner">
                    <div className="home-teachercard">
                        <div className="home-teachercontent">
                            <h2>Share Your Knowledge</h2>
                            <p>Become a teacher and inspire thousands of learners worldwide. Create courses, earn revenue, and make an impact.</p>
                            <ul className="home-teacherperks">
                                <li>📹 Create video & PDF lessons</li>
                                <li>💰 Earn from your courses</li>
                                <li>📊 Professional analytics dashboard</li>
                                <li>🌍 Reach a global audience</li>
                            </ul>
                            <Link to="/apply-teacher" className="home-btnprimary">Apply to Teach →</Link>
                        </div>
                        <div className="home-teachervisual">
                            <div className="home-emojigrid">
                                <span>👨‍🏫</span>
                                <span>📚</span>
                                <span>🎯</span>
                                <span>⭐</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== FAQ ===== */}
            <section className="home-section home-faqsection">
                <div className="home-sectioninner">
                    <h2 className="home-sectiontitle center">Frequently Asked Questions</h2>
                    <div className="home-faqlist">
                        {FAQ_DATA.map((item, i) => (
                            <div key={i} className={`home-faqitem ${openFaq === i ? 'open' : ''}`}>
                                <button className="home-faqquestion" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                                    <span>{item.q}</span>
                                    <span className="home-faqtoggle">{openFaq === i ? '−' : '+'}</span>
                                </button>
                                {openFaq === i && (
                                    <div className="home-faqanswer">{item.a}</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== FINAL CTA ===== */}
            <section className="home-finalcta">
                <h2>Start Learning Today</h2>
                <p>Join our growing community of learners and teachers.</p>
                <div className="home-finalctaactions">
                    <Link to="/courses" className="home-btnprimary">Browse Courses</Link>
                    <Link to="/register" className="home-btnsecondary">Create Account →</Link>
                </div>
            </section>
        </div>
    );
}
