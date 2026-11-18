import api from '../api/axios';

// Downloads a homework (or answers) PDF through the authenticated API and saves it as a file.
export default async function downloadHomework(id, kind, name) {
  const { data } = await api.get(`/homework/${id}/file/${kind}`, { params: { download: 1 }, responseType: 'blob' });
  const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${String(name || 'homework').replace(/[\\/:*?"<>|]+/g, '-')}${kind === 'answer' ? ' - answers' : ''}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
