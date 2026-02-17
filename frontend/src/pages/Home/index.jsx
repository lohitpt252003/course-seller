import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import CourseCard from '../../components/CourseCard';
import './index.css';

export default function Home() {
    const [featured, setFeatured] = useState([]);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        api.get('/courses/?sort_by=rating').then(r => setFeatured(r.data.slice(0, 6))).catch(() => { });
        api.get('/categories/').then(r => setCategories(r.data)).catch(() => { });
    }, []);

    return (
        <div className="home">
            <section className="hero">
                <div className="hero-content">
                    <h1 className="hero-title">
                        Unlock Your <span className="gradient-text">Potential</span>
                    </h1>
                    <p className="hero-subtitle">
                        Learn from industry experts. Master new skills. Transform your career with our curated courses.
                    </p>
                    <div className="hero-actions">
                        <Link to="/courses" className="btn-primary">Explore Courses</Link>
                        <Link to="/register" className="btn-secondary">Start Teaching</Link>
                    </div>
                    <div className="hero-stats">
                        <div className="stat"><span className="stat-num">500+</span><span className="stat-label">Courses</span></div>
                        <div className="stat"><span className="stat-num">50K+</span><span className="stat-label">Students</span></div>
                        <div className="stat"><span className="stat-num">200+</span><span className="stat-label">Teachers</span></div>
                    </div>
                </div>
                <div className="hero-visual">
                    <div className="hero-card card-1">🚀 Start Learning</div>
                    <div className="hero-card card-2">💡 Gain Skills</div>
                    <div className="hero-card card-3">🏆 Get Certified</div>
                </div>
            </section>

            {categories.length > 0 && (
                <section className="section">
                    <h2 className="section-title">Browse by Category</h2>
                    <div className="category-grid">
                        {categories.map(cat => (
                            <Link key={cat.id} to={`/courses?category=${cat.id}`} className="category-chip">
                                {cat.name}
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {featured.length > 0 && (
                <section className="section">
                    <div className="section-header">
                        <h2 className="section-title">🔥 Top Rated Courses</h2>
                        <Link to="/courses" className="see-all">See All →</Link>
                    </div>
                    <div className="course-grid">
                        {featured.map(course => (
                            <CourseCard key={course.id} course={course} />
                        ))}
                    </div>
                </section>
            )}

            <section className="section cta-section">
                <div className="cta-card">
                    <h2>Ready to start teaching?</h2>
                    <p>Share your knowledge with thousands of learners worldwide.</p>
                    <Link to="/register" className="btn-primary">Become a Teacher</Link>
                </div>
            </section>
        </div>
    );
}
