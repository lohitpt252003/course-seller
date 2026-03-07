import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import CourseCard from '../../components/CourseCard';
import './index.css';
import './light.css';
import './dark.css';
import './mlight.css';
import './mdark.css';

export default function Courses() {
    const [courses, setCourses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [search, setSearch] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const cat = searchParams.get('category');
        if (cat) setCategoryId(cat);
        api.get('/categories/').then(r => setCategories(r.data)).catch(() => { });
    }, [searchParams]);

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (categoryId) params.set('category_id', categoryId);
        if (sortBy) params.set('sort_by', sortBy);
        api.get(`/courses/?${params.toString()}`)
            .then(r => setCourses(r.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [search, categoryId, sortBy]);

    return (
        <div className="courses-page">
            <div className="courses-header">
                <h1>📚 Explore Courses</h1>
                <p>Discover courses taught by industry experts</p>
            </div>
            <div className="courses-filters">
                <input type="text" className="courses-search" placeholder="🔍 Search courses..." value={search} onChange={e => setSearch(e.target.value)} />
                <select className="courses-select" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
                <select className="courses-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                    <option value="newest">Newest</option>
                    <option value="price">Price: Low to High</option>
                    <option value="rating">Top Rated</option>
                    <option value="students">Most Popular</option>
                </select>
            </div>
            {loading ? (
                <div className="courses-loading">Loading...</div>
            ) : courses.length === 0 ? (
                <div className="courses-empty">
                    <span className="courses-emptyicon">🔍</span>
                    <h3>No courses found</h3>
                    <p>Try adjusting your filters</p>
                </div>
            ) : (
                <div className="courses-grid">
                    {courses.map(course => (
                        <CourseCard key={course.id} course={course} />
                    ))}
                </div>
            )}
        </div>
    );
}
