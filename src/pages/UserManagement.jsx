import React, { useState, useEffect } from 'react';
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

const labelStyle = {
  fontSize: 10, fontWeight: 700, color: C.textLight,
  textTransform: 'uppercase', letterSpacing: '0.04em',
  display: 'block', marginBottom: 4,
};

const inputStyle = {
  width: '100%', padding: '8px 12px', border: '1px solid var(--border)',
  borderRadius: 8, fontSize: 13, fontFamily: 'var(--font)', color: 'var(--navy)',
  outline: 'none', boxSizing: 'border-box',
};

const selectStyle = { ...inputStyle, cursor: 'pointer', fontWeight: 600 };

const btnStyle = (bg, color, border) => ({
  padding: '6px 14px', background: bg, color, border: border || 'none',
  borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
  fontFamily: 'var(--font)', whiteSpace: 'nowrap',
});

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'viewer' });
  const [editForm, setEditForm] = useState({ username: '', email: '', password: '', role: 'viewer' });
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

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
      flash('User created successfully');
      await loadUsers();
    } catch (e) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (user) => {
    setEditingId(user.id);
    setEditForm({ username: user.username, email: user.email, password: '', role: user.role });
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ username: '', email: '', password: '', role: 'viewer' });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      // Update profile (username, email, role)
      await putAPI(`/api/users/${editingId}`, {
        username: editForm.username,
        email: editForm.email,
        role: editForm.role,
      });

      // Update password if provided
      if (editForm.password.trim()) {
        await putAPI(`/api/users/${editingId}/password`, { password: editForm.password });
      }

      cancelEdit();
      flash('User updated successfully');
      await loadUsers();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId, username) => {
    if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    try {
      await deleteAPI(`/api/users/${userId}`);
      if (editingId === userId) cancelEdit();
      flash(`User "${username}" deleted`);
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
          <strong style={{ color: C.navy }}>User Management:</strong> Admins can create, edit, and delete users.
          Click <strong>Edit</strong> on any user to change their username, email, password, or role.
        </div>
      </Callout>

      {error && (
        <Callout type="red">
          <div style={{ fontSize: 13, color: C.red, fontWeight: 600 }}>{error}</div>
        </Callout>
      )}

      {success && (
        <Callout type="green">
          <div style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>{success}</div>
        </Callout>
      )}

      <Crd>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Sec>Users ({users.length})</Sec>
          <button
            onClick={() => { setShowCreate(!showCreate); cancelEdit(); }}
            style={btnStyle(showCreate ? C.bg : C.navy, showCreate ? C.navy : 'white', showCreate ? `1px solid ${C.border}` : undefined)}
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
              <label style={labelStyle}>Username</label>
              <input style={inputStyle} value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input style={inputStyle} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <input style={inputStyle} type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6} />
            </div>
            <div>
              <label style={labelStyle}>Role</label>
              <select style={selectStyle} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <button type="submit" disabled={creating} style={btnStyle(C.green, 'white')}>
              {creating ? 'Creating...' : 'Create User'}
            </button>
          </form>
        )}

        {/* Users Table */}
        <div>
          {/* Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1.5fr 100px 130px 130px 120px',
            padding: '10px 16px', background: `${C.navy}08`, borderRadius: '8px 8px 0 0',
          }}>
            {['Username', 'Email', 'Role', 'Created', 'Last Login', ''].map((h, i) => (
              <div key={i} style={{ fontSize: 10, fontWeight: 700, color: C.navy, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</div>
            ))}
          </div>

          {users.map((u, i) => (
            <React.Fragment key={u.id}>
              {/* User row */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1.5fr 100px 130px 130px 120px',
                padding: '10px 16px', borderBottom: editingId === u.id ? 'none' : `1px solid ${C.borderLight}`,
                background: i % 2 ? C.bg : C.white, alignItems: 'center', fontSize: 13,
              }}>
                <div style={{ fontWeight: 600, color: C.navy }}>{u.username}</div>
                <div style={{ color: C.textMid }}>{u.email}</div>
                <div>{roleBadge(u.role)}</div>
                <div style={{ fontSize: 11, color: C.textMuted }}>{new Date(u.created_at.replace(' ', 'T') + 'Z').toLocaleDateString()}</div>
                <div style={{ fontSize: 11, color: u.last_login ? C.textMid : C.textMuted }}>
                  {u.last_login ? new Date(u.last_login.replace(' ', 'T') + 'Z').toLocaleString() : 'Never'}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => editingId === u.id ? cancelEdit() : startEdit(u)}
                    style={btnStyle(
                      editingId === u.id ? C.amber : C.white,
                      editingId === u.id ? 'white' : C.navy,
                      editingId === u.id ? undefined : `1px solid ${C.borderLight}`
                    )}
                  >
                    {editingId === u.id ? 'Cancel' : 'Edit'}
                  </button>
                  <button
                    onClick={() => handleDelete(u.id, u.username)}
                    style={btnStyle('none', C.red, `1px solid ${C.borderLight}`)}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Edit form (expands below user row) */}
              {editingId === u.id && (
                <form onSubmit={handleSave} style={{
                  padding: '16px 16px 20px', background: '#FFFBEB',
                  borderBottom: `1px solid ${C.borderLight}`,
                  borderTop: `2px solid ${C.amber}`,
                }}>
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr 120px auto', gap: 12, alignItems: 'end',
                  }}>
                    <div>
                      <label style={labelStyle}>Username</label>
                      <input
                        style={inputStyle}
                        value={editForm.username}
                        onChange={e => setEditForm(f => ({ ...f, username: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Email</label>
                      <input
                        style={inputStyle}
                        type="email"
                        value={editForm.email}
                        onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>New Password <span style={{ fontWeight: 400, textTransform: 'none', color: C.textMuted }}>(leave blank to keep)</span></label>
                      <input
                        style={inputStyle}
                        type="password"
                        value={editForm.password}
                        onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))}
                        minLength={6}
                        placeholder="••••••"
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Role</label>
                      <select style={selectStyle} value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}>
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <button type="submit" disabled={saving} style={btnStyle(C.green, 'white')}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              )}
            </React.Fragment>
          ))}
        </div>
      </Crd>
    </div>
  );
}
