import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import '../StudentDashboard/index.css';

export default function Profile() {
    const { user, refreshUser } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.patch(`/users/${user.id}`, { name, bio, avatar_url: avatarUrl || null });
            await refreshUser();
            setMsg('Profile updated! ✅');
            setTimeout(() => setMsg(''), 3000);
        } catch (err) {
            setMsg(err.response?.data?.message || 'Failed to update');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>👤 My Profile</h1>
            </div>
            <div style={{ maxWidth: '600px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', padding: '1.5rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'white', fontWeight: 'bold', flexShrink: 0, overflow: 'hidden' }}>
                        {avatarUrl ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : user?.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                        <h3>{user?.name}</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{user?.email}</p>
                        <span className={`dash-badge ${user?.role === 'admin' ? 'completed' : 'in-progress'}`}>{user?.role}</span>
                    </div>
                </div>
                {msg && <div style={{ padding: '0.75rem', borderRadius: '10px', marginBottom: '1rem', background: 'var(--hover-bg)', textAlign: 'center' }}>{msg}</div>}
                <form onSubmit={handleSave} className="dash-form">
                    <div className="form-group"><label>Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} required /></div>
                    <div className="form-group"><label>Bio</label><textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us about yourself..." /></div>
                    <div className="form-group"><label>Avatar URL</label><input type="text" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://..." /></div>
                    <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
                </form>
            </div>
        </div>
    );
}
