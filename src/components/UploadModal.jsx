import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadFile } from '../api';
import { Upload, X, CheckCircle, Loader } from 'lucide-react';

export default function UploadModal({ onClose, onComplete }) {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const onDrop = useCallback(async (files) => {
    if (files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const res = await uploadFile(files[0]);
      setResult(res);
      setTimeout(() => onComplete(), 2000);
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }, [onComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200
    }}>
      <div style={{
        background: 'white', borderRadius: 12, padding: 32,
        width: 480, maxWidth: '90vw', position: 'relative',
        boxShadow: '0 4px 20px rgba(0,53,95,0.12)'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 12, right: 12,
          background: 'none', border: 'none', cursor: 'pointer', color: '#9FAFC0'
        }}>
          <X size={20} />
        </button>

        <h2 style={{ color: '#00355F', marginBottom: 16, fontSize: 18, fontWeight: 700 }}>
          Upload Contract Data
        </h2>

        {result ? (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <CheckCircle size={48} color="#0D9668" />
            <p style={{ marginTop: 12, fontWeight: 600, color: '#0D9668' }}>Upload Complete</p>
            <p style={{ color: '#9FAFC0', fontSize: 14, marginTop: 8 }}>
              {result.contracts?.toLocaleString()} contracts processed, {result.customers?.toLocaleString()} unique customers identified
            </p>
          </div>
        ) : uploading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Loader size={40} color="#00355F" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: 12, color: '#00355F', fontWeight: 600 }}>
              Processing data...
            </p>
            <p style={{ color: '#9FAFC0', fontSize: 13, marginTop: 4 }}>
              Ingesting, matching customers, computing NFR
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <div
            {...getRootProps()}
            style={{
              border: `2px dashed ${isDragActive ? '#00355F' : '#EDF0F4'}`,
              borderRadius: 8,
              padding: 40,
              textAlign: 'center',
              cursor: 'pointer',
              background: isDragActive ? `#00355F08` : '#F4F6F9',
              transition: 'all 0.2s'
            }}
          >
            <input {...getInputProps()} />
            <Upload size={36} color="#00355F" style={{ marginBottom: 12 }} />
            <p style={{ fontWeight: 600, color: '#00355F' }}>
              {isDragActive ? 'Drop file here' : 'Drag & drop your file here'}
            </p>
            <p style={{ color: '#9FAFC0', fontSize: 13, marginTop: 4 }}>
              or click to browse — CSV or Excel (.xlsx)
            </p>
          </div>
        )}

        {error && (
          <p style={{ color: '#DC2626', fontSize: 13, marginTop: 12, textAlign: 'center' }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
