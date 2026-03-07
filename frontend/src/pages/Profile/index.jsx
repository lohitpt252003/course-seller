import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import './index.css';
import './light.css';
import './dark.css';
import './mlight.css';
import './mdark.css';

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
        <div className="profiledash-root fade-in">
            <div className="profiledash-header">
                <h1>👤 My Profile</h1>
            </div>
            <div style={{ maxWidth: '600px' }}>
                <div className="profiledash-card">
                    <div className="profiledash-avatar">
                        {avatarUrl ? <img src={avatarUrl} alt="avatar" /> : user?.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="profiledash-info">
                        <h3>{user?.name}</h3>
                        <p className="profiledash-email">{user?.email}</p>
                        <span className={`profiledash-badge ${user?.role === 'admin' ? 'completed' : 'in-progress'}`}>{user?.role}</span>
                    </div>
                </div>
                {msg && <div className="profiledash-msg">{msg}</div>}
                <form onSubmit={handleSave} className="profiledash-form">
                    <div className="profiledash-formgroup">
                        <label>Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div className="profiledash-formgroup">
                        <label>Bio</label>
                        <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us about yourself..." />
                    </div>
                    <div className="profiledash-formgroup">
                        <label>Avatar URL</label>
                        <input type="text" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://..." />
                    </div>
                    <button type="submit" className="profiledash-btn" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    );
}
