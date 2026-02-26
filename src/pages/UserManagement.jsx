import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { fetchAPI, postAPI, putAPI, deleteAPI } from '../api';
import { Crd, Sec, Callout, C } from '../components/shared';
import LoadingState from '../components/LoadingState';

const ROLES = ['admin', 'analyst', 'viewer'];

const roleBadge = (role) => {
  const colors = {
    admin: { bg: '#FEF2F2', color: '#DC2626' },
    analyst: { bg: '#DBEAFE', color: '#1E40AF' },
    viewer: { bg: '#F4F6F9', color: '#3D5A7C' },
  };
  const c = colors[role] || colors.viewer;
  return (
    <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: c.bg, color: c.color }}>
      {role}
    </span>
  );
};

const inputStyle = {
  width: '100%', padding: '8px 12px', border: '1px solid var(--border)',
  borderRadius: 8, fontSize: 13, fontFamily: 'var(--font)', color: 'var(--navy)',
  outline: 'none', boxSizing: 'border-box',
};

const selectStyle = {
  ...inputStyle, cursor: 'pointer', fontWeight: 600,
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'viewer' });
  const [creating, setCreating] = useState(false);

  const loadUsers = async () => {
    try {
      const data = await fetchAPI('/api/users');
      setUsers(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      await postAPI('/api/users', form);
      setForm({ username: '', email: '', password: '', role: 'viewer' });
      setShowCreate(false);
      await loadUsers();
    } catch (e) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await putAPI(`/api/users/${userId}`, { role: newRole });
      await loadUsers();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDelete = async (userId, username) => {
    if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    try {
      await deleteAPI(`/api/users/${userId}`);
      await loadUsers();
    } catch (e) {
      setError(e.message);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Callout type="info">
        <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.7 }}>
          <strong style={{ color: C.navy }}>User Management:</strong> Admins can create, edit roles, and delete users.
          Analysts and viewers can access all data but cannot upload or manage users.
        </div>
      </Callout>

      {error && (
        <Callout type="red">
          <div style={{ fontSize: 13, color: C.red, fontWeight: 600 }}>{error}</div>
        </Callout>
      )}

      <Crd>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Sec>Users ({users.length})</Sec>
          <button
            onClick={() => setShowCreate(!showCreate)}
            style={{
              padding: '6px 16px', background: showCreate ? C.bg : C.navy,
              color: showCreate ? C.navy : 'white', border: `1px solid ${showCreate ? C.border : C.navy}`,
              borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)',
            }}
          >
            {showCreate ? 'Cancel' : '+ Add User'}
          </button>
        </div>

        {/* Create User Form */}
        {showCreate && (
          <form onSubmit={handleCreate} style={{
            padding: 20, background: C.bg, borderRadius: 10, marginBottom: 20,
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 120px auto', gap: 12, alignItems: 'end',
          }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 4 }}>Username</label>
              <input style={inputStyle} value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 4 }}>Email</label>
              <input style={inputStyle} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 4 }}>Password</label>
              <input style={inputStyle} type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6} />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 4 }}>Role</label>
              <select style={selectStyle} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <button type="submit" disabled={creating} style={{
              padding: '8px 16px', background: C.green, color: 'white', border: 'none',
              borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)',
              whiteSpace: 'nowrap',
            }}>
              {creating ? 'Creating...' : 'Create User'}
            </button>
          </form>
        )}

        {/* Users Table */}
        <div>
          {/* Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1.5fr 120px 140px 80px',
            padding: '10px 16px', background: `${C.navy}08`, borderRadius: '8px 8px 0 0',
          }}>
            {['Username', 'Email', 'Role', 'Created', ''].map((h, i) => (
              <div key={i} style={{ fontSize: 10, fontWeight: 700, color: C.navy, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</div>
            ))}
          </div>

          {users.map((u, i) => (
            <div key={u.id} style={{
              display: 'grid', gridTemplateColumns: '1fr 1.5fr 120px 140px 80px',
              padding: '10px 16px', borderBottom: `1px solid ${C.borderLight}`,
              background: i % 2 ? C.bg : C.white, alignItems: 'center', fontSize: 13,
            }}>
              <div style={{ fontWeight: 600, color: C.navy }}>{u.username}</div>
              <div style={{ color: C.textMid }}>{u.email}</div>
              <div>
                <select
                  value={u.role}
                  onChange={e => handleRoleChange(u.id, e.target.value)}
                  style={{
                    padding: '3px 8px', borderRadius: 6, border: `1px solid ${C.borderLight}`,
                    fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)',
                    background: C.white, color: C.navy,
                  }}
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div style={{ fontSize: 11, color: C.textMuted }}>{new Date(u.created_at).toLocaleDateString()}</div>
              <div>
                <button
                  onClick={() => handleDelete(u.id, u.username)}
                  style={{
                    padding: '3px 10px', background: 'none', border: `1px solid ${C.borderLight}`,
                    borderRadius: 6, fontSize: 11, color: C.red, cursor: 'pointer',
                    fontFamily: 'var(--font)', fontWeight: 600,
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </Crd>
    </div>
  );
}
