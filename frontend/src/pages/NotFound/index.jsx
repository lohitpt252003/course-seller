import { Link } from 'react-router-dom';

export default function NotFound() {
    return (
        <div style={{ minHeight: 'calc(100vh - 140px)', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
            <div>
                <div style={{ fontSize: '6rem', marginBottom: '1rem' }}>🔍</div>
                <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '0.5rem' }}>404</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginBottom: '2rem' }}>Page not found</p>
                <Link to="/" className="btn-primary" style={{ padding: '0.85rem 2rem', borderRadius: '12px', textDecoration: 'none', fontWeight: 700 }}>Go Home</Link>
            </div>
        </div>
    );
}
