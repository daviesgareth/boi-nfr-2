const BASE = '';

export async function fetchAPI(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function uploadFile(file, mode = 'replace') {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE}/api/upload?mode=${mode}`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`Upload error: ${res.status}`);
  return res.json();
}
