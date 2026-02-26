import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { fetchAPI, postAPI, uploadFile } from '../api';
import { Crd, Sec, Callout, Pill, C, fN } from '../components/shared';
import MetricGrid from '../components/MetricGrid';
import { Database, Upload, Trash2, Activity, Clock, HardDrive, FileUp, AlertTriangle, CheckCircle } from 'lucide-react';

const ACTION_LABELS = {
  data_upload: 'Data Upload',
  data_purge: 'Data Purge',
  user_created: 'User Created',
  user_updated: 'User Updated',
  user_deleted: 'User Deleted',
  user_password_changed: 'Password Changed',
  password_self_change: 'Password Changed (self)',
  login_success: 'Login',
  login_failed: 'Failed Login',
  page_view: 'Page View',
};

const CATEGORY_PILLS = [
  { key: null, label: 'All' },
  { key: 'login', label: 'Logins' },
  { key: 'activity', label: 'Activity' },
  { key: 'upload', label: 'Uploads' },
  { key: 'purge', label: 'Purges' },
  { key: 'user', label: 'User Changes' },
];

const CATEGORY_COLORS = {
  upload: { bg: '#ECFDF5', color: C.green },
  purge: { bg: '#FEF2F2', color: C.red },
  user: { bg: '#DBEAFE', color: '#1E40AF' },
  login: { bg: '#FEF3C7', color: '#92400E' },
  activity: { bg: '#F0F9FF', color: '#0369A1' },
};

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDateTime(dt) {
  if (!dt) return '\u2014';
  try {
    const d = new Date(dt.includes('T') ? dt : dt + 'T00:00:00Z');
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  } catch { return dt; }
}

function formatDate(dt) {
  if (!dt) return '\u2014';
  try {
    const d = new Date(dt.includes('T') ? dt : dt + 'T00:00:00Z');
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return dt; }
}

const gridRow = {
  display: 'grid', gridTemplateColumns: '160px 110px 140px 1fr',
  padding: '10px 16px', fontSize: 12, alignItems: 'center',
};

export default function DataManagement() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadMode, setUploadMode] = useState('replace');
  const [purgeInput, setPurgeInput] = useState('');
  const [purging, setPurging] = useState(false);
  const [auditLog, setAuditLog] = useState([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditCategory, setAuditCategory] = useState(null);
  const [auditOffset, setAuditOffset] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const flash = useCallback((msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 4000);
  }, []);

  const loadOverview = useCallback(async () => {
    try {
      const d = await fetchAPI('/api/admin/data-overview');
      setOverview(d);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }, []);

  const loadAuditLog = useCallback(async (reset = false) => {
    try {
      const off = reset ? 0 : auditOffset;
      const catParam = auditCategory ? `&category=${auditCategory}` : '';
      const d = await fetchAPI(`/api/admin/audit-log?limit=30&offset=${off}${catParam}`);
      setAuditLog(reset ? d.entries : [...auditLog, ...d.entries]);
      setAuditTotal(d.total);
      if (reset) setAuditOffset(d.entries.length);
      else setAuditOffset(off + d.entries.length);
    } catch (e) { setError(e.message); }
  }, [auditCategory, auditOffset, auditLog]);

  useEffect(() => { loadOverview(); }, [loadOverview]);
  useEffect(() => { loadAuditLog(true); }, [auditCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  // Upload dropzone
  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    setUploading(true);
    setUploadResult(null);
    setError('');
    try {
      const result = await uploadFile(acceptedFiles[0], uploadMode);
      setUploadResult(result);
      flash(`Uploaded ${result.contracts?.toLocaleString()} contracts, ${result.customers?.toLocaleString()} customers matched`);
      loadOverview();
      loadAuditLog(true);
    } catch (e) {
      setError(e.message);
    }
    setUploading(false);
  }, [uploadMode, flash, loadOverview, loadAuditLog]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'text/csv': ['.csv'] },
    multiple: false,
    disabled: uploading,
  });

  const handlePurge = async () => {
    if (purgeInput !== 'PURGE') return;
    setPurging(true);
    setError('');
    try {
      const result = await postAPI('/api/admin/purge', { confirm: 'PURGE' });
      flash(`Purged ${result.purged_contracts?.toLocaleString()} contracts and all associated data`);
      setPurgeInput('');
      loadOverview();
      loadAuditLog(true);
    } catch (e) {
      setError(e.message);
    }
    setPurging(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Flash messages */}
      {error && (
        <Callout type="error" onDismiss={() => setError('')}>
          {error}
        </Callout>
      )}
      {success && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
          background: '#ECFDF5', border: '1px solid rgba(13,150,104,0.3)', borderRadius: 10,
          color: C.green, fontSize: 13, fontWeight: 600,
        }}>
          <CheckCircle size={16} />
          {success}
        </div>
      )}

      <Callout type="info">
        Manage your NFR data from here. Upload new data files, view database health, purge data for privacy compliance, and review the audit trail of all admin actions.
      </Callout>

      {/* Card 1: Data Overview */}
      <Crd>
        <Sec style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Database size={16} color={C.navy} />
          <span style={{ fontSize: 15, fontWeight: 700, color: C.navy }}>Data Overview</span>
          {overview && overview.last_import && (
            <span style={{ fontSize: 11, color: C.textMuted, marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={12} />
              Last import: {formatDateTime(overview.last_import)}
            </span>
          )}
        </Sec>

        {loading ? (
          <div style={{ padding: 20, textAlign: 'center', color: C.textMuted }}>Loading...</div>
        ) : overview ? (
          <>
            <MetricGrid columns={4} metrics={[
              { label: 'Total Contracts', value: fN(overview.contracts), accent: C.navy },
              { label: 'Unique Customers', value: fN(overview.customers), accent: C.teal },
              { label: 'NFR Results', value: fN(overview.nfr_results), accent: C.green },
              { label: 'Database Size', value: formatBytes(overview.db_size_bytes), accent: C.purple },
            ]} />
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 12,
              fontSize: 11, color: C.textMuted,
            }}>
              <div>
                <span style={{ fontWeight: 600 }}>Open contracts:</span> {fN(overview.open_contracts)}
              </div>
              <div>
                <span style={{ fontWeight: 600 }}>Date range:</span>{' '}
                {overview.contracts > 0 ? `${formatDate(overview.earliest_contract)} \u2014 ${formatDate(overview.latest_contract)}` : '\u2014'}
              </div>
              <div>
                <span style={{ fontWeight: 600 }}>Match pairs:</span> {fN(overview.matching_log)}
              </div>
              <div>
                <span style={{ fontWeight: 600 }}>Users:</span> {overview.users} | <span style={{ fontWeight: 600 }}>Audit entries:</span> {overview.audit_entries}
              </div>
            </div>
          </>
        ) : (
          <div style={{ padding: 20, textAlign: 'center', color: C.textMuted }}>No data available</div>
        )}
      </Crd>

      {/* Card 2: Upload Data */}
      <Crd>
        <Sec style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <FileUp size={16} color={C.navy} />
          <span style={{ fontSize: 15, fontWeight: 700, color: C.navy }}>Upload Data</span>
        </Sec>

        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <label style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
            borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
            border: `2px solid ${uploadMode === 'replace' ? C.navy : C.border}`,
            background: uploadMode === 'replace' ? 'rgba(0,53,95,0.04)' : 'white',
            color: uploadMode === 'replace' ? C.navy : C.textMid,
          }}>
            <input
              type="radio" name="mode" value="replace" checked={uploadMode === 'replace'}
              onChange={() => setUploadMode('replace')}
              style={{ display: 'none' }}
            />
            <div style={{
              width: 16, height: 16, borderRadius: '50%',
              border: `2px solid ${uploadMode === 'replace' ? C.navy : C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {uploadMode === 'replace' && <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.navy }} />}
            </div>
            <div>
              <div>Replace All</div>
              <div style={{ fontSize: 10, fontWeight: 400, color: C.textMuted }}>Clear existing data and upload fresh</div>
            </div>
          </label>
          <label style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
            borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
            border: `2px solid ${uploadMode === 'merge' ? C.navy : C.border}`,
            background: uploadMode === 'merge' ? 'rgba(0,53,95,0.04)' : 'white',
            color: uploadMode === 'merge' ? C.navy : C.textMid,
          }}>
            <input
              type="radio" name="mode" value="merge" checked={uploadMode === 'merge'}
              onChange={() => setUploadMode('merge')}
              style={{ display: 'none' }}
            />
            <div style={{
              width: 16, height: 16, borderRadius: '50%',
              border: `2px solid ${uploadMode === 'merge' ? C.navy : C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {uploadMode === 'merge' && <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.navy }} />}
            </div>
            <div>
              <div>Merge</div>
              <div style={{ fontSize: 10, fontWeight: 400, color: C.textMuted }}>Add to existing data (upsert by contract ID)</div>
            </div>
          </label>
        </div>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          style={{
            border: `2px dashed ${isDragActive ? C.navy : C.border}`,
            borderRadius: 10, padding: '30px 20px', textAlign: 'center', cursor: 'pointer',
            background: isDragActive ? 'rgba(0,53,95,0.03)' : '#FAFBFC',
            transition: 'all 0.15s',
            opacity: uploading ? 0.5 : 1,
          }}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <div style={{ color: C.navy, fontWeight: 600, fontSize: 13 }}>
              <Upload size={24} style={{ marginBottom: 8, opacity: 0.5 }} />
              <div>Processing... this may take a moment</div>
            </div>
          ) : (
            <div style={{ color: C.textMid }}>
              <Upload size={24} style={{ marginBottom: 8, opacity: 0.4 }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>
                {isDragActive ? 'Drop file here' : 'Drag & drop an Excel file, or click to browse'}
              </div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>Supports .xlsx and .csv files</div>
            </div>
          )}
        </div>

        {/* Upload result */}
        {uploadResult && (
          <div style={{
            marginTop: 12, padding: '10px 14px', borderRadius: 8,
            background: '#ECFDF5', border: '1px solid rgba(13,150,104,0.2)',
            fontSize: 12, color: C.green, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <CheckCircle size={14} />
            {uploadResult.contracts?.toLocaleString()} contracts ingested, {uploadResult.customers?.toLocaleString()} customers matched ({uploadResult.mode} mode)
          </div>
        )}
      </Crd>

      {/* Card 3: Database Purge */}
      <Crd>
        <Sec style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Trash2 size={16} color={C.red} />
          <span style={{ fontSize: 15, fontWeight: 700, color: C.red }}>Database Purge</span>
        </Sec>

        <div style={{
          padding: '12px 16px', borderRadius: 8, marginBottom: 16,
          background: '#FEF2F2', border: '1px solid rgba(220,38,38,0.2)',
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <AlertTriangle size={16} color={C.red} style={{ marginTop: 2, flexShrink: 0 }} />
          <div style={{ fontSize: 12, color: '#991B1B', lineHeight: 1.6 }}>
            <strong>This permanently deletes all contract data, NFR results, and matching logs.</strong><br />
            Users and audit log are preserved. This action cannot be undone. Type <strong>PURGE</strong> below to confirm.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            type="text"
            value={purgeInput}
            onChange={e => setPurgeInput(e.target.value)}
            placeholder='Type "PURGE" to confirm'
            style={{
              padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.border}`,
              fontSize: 13, fontFamily: 'var(--font)', fontWeight: 600,
              color: purgeInput === 'PURGE' ? C.red : C.navy, width: 220,
            }}
          />
          <button
            onClick={handlePurge}
            disabled={purgeInput !== 'PURGE' || purging}
            style={{
              padding: '8px 18px', borderRadius: 8, border: 'none',
              background: purgeInput === 'PURGE' ? C.red : '#E5E7EB',
              color: purgeInput === 'PURGE' ? 'white' : '#9CA3AF',
              fontSize: 12, fontWeight: 700, cursor: purgeInput === 'PURGE' ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font)', display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.15s',
            }}
          >
            <Trash2 size={13} />
            {purging ? 'Purging...' : 'Purge All Data'}
          </button>
        </div>
      </Crd>

      {/* Card 4: Audit Log */}
      <Crd>
        <Sec style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Activity size={16} color={C.navy} />
          <span style={{ fontSize: 15, fontWeight: 700, color: C.navy }}>Audit Log</span>
          <span style={{ fontSize: 11, color: C.textMuted, marginLeft: 'auto' }}>
            {auditTotal} total entries
          </span>
        </Sec>

        {/* Category filter pills */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {CATEGORY_PILLS.map(p => (
            <Pill
              key={p.key || 'all'}
              active={auditCategory === p.key}
              onClick={() => { setAuditCategory(p.key); setAuditOffset(0); }}
            >
              {p.label}
            </Pill>
          ))}
        </div>

        {/* Table header */}
        <div style={{
          ...gridRow, background: '#F8FAFC', borderRadius: '8px 8px 0 0',
          fontWeight: 700, color: C.navy, fontSize: 11, textTransform: 'uppercase',
          letterSpacing: '0.03em',
        }}>
          <span>Time</span>
          <span>User</span>
          <span>Action</span>
          <span>Details</span>
        </div>

        {/* Rows */}
        {auditLog.length === 0 ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: C.textMuted, fontSize: 12 }}>
            No audit entries yet. Actions like uploads, purges, and user changes will appear here.
          </div>
        ) : (
          auditLog.map((entry, i) => {
            const catColor = CATEGORY_COLORS[entry.category] || { bg: '#F3F4F6', color: '#374151' };
            return (
              <div
                key={entry.id}
                style={{
                  ...gridRow,
                  background: i % 2 === 0 ? 'white' : '#FAFBFC',
                  borderBottom: `1px solid ${C.borderLight}`,
                }}
              >
                <span style={{ color: C.textMuted, fontSize: 11 }}>
                  {formatDateTime(entry.created_at)}
                </span>
                <span style={{ fontWeight: 600, color: C.navy, fontSize: 12 }}>
                  {entry.username}
                </span>
                <span>
                  <span style={{
                    display: 'inline-block', padding: '2px 8px', borderRadius: 4,
                    background: catColor.bg, color: catColor.color,
                    fontSize: 10, fontWeight: 700,
                  }}>
                    {ACTION_LABELS[entry.action] || entry.action}
                  </span>
                </span>
                <span style={{ color: C.textMid, fontSize: 12, lineHeight: 1.4 }}>
                  {entry.detail}
                </span>
              </div>
            );
          })
        )}

        {/* Load more */}
        {auditLog.length < auditTotal && (
          <div style={{ padding: '12px 16px', textAlign: 'center' }}>
            <button
              onClick={() => loadAuditLog(false)}
              style={{
                padding: '6px 20px', borderRadius: 6, border: `1px solid ${C.border}`,
                background: 'white', color: C.navy, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'var(--font)',
              }}
            >
              Load more ({auditTotal - auditLog.length} remaining)
            </button>
          </div>
        )}
      </Crd>
    </div>
  );
}
