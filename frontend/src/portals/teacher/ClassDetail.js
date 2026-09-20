import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { FILE_BASE_URL } from '../../api/axios';
import TeacherShell from './TeacherShell';
import { T } from './theme';

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export default function ClassDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cls, setCls] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [attendanceDraft, setAttendanceDraft] = useState({}); // keyed by child_id
  const [tab, setTab] = useState('attendance');
  const [feedbackDraft, setFeedbackDraft] = useState({}); // keyed by registration_id
  const [feedbackList, setFeedbackList] = useState([]);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [schedule, setSchedule] = useState({ child_id: '', subject: '', duration: '60', date: '', start: '', notes: '' });
  const [toast, setToast] = useState('');

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 2800);
  }

  async function load() {
    const [classesRes, regsRes, fbRes] = await Promise.all([
      api.get('/classes'),
      api.get(`/registrations/class/${id}`),
      api.get(`/registrations/class/${id}/feedback`)
    ]);
    const found = classesRes.data.find((c) => String(c.id) === String(id));
    setCls(found);
    setRegistrations(regsRes.data);
    setFeedbackList(fbRes.data);
    const draft = {};
    regsRes.data.forEach((r) => { draft[r.child_id] = r.present === 1; });
    setAttendanceDraft(draft);
  }

  async function persistAttendance(nextDraft) {
    const attendance = registrations.map((r) => ({
      child_id: r.child_id,
      registration_id: r.registration_id,
      present: !!nextDraft[r.child_id]
    }));
    await api.post(`/registrations/class/${id}/attendance`, { attendance });
    load();
  }

  function setAttendance(childId, present) {
    const next = { ...attendanceDraft, [childId]: present };
    setAttendanceDraft(next);
    persistAttendance(next);
    showToast(`Updated attendance to: ${present ? 'Present' : 'Absent'}`);
  }

  function markAllPresent() {
    const next = {};
    registrations.forEach((r) => { next[r.child_id] = true; });
    setAttendanceDraft(next);
    persistAttendance(next);
    showToast(`All ${registrations.length} students marked as Present`);
  }

  async function submitFeedback(registrationId) {
    const content = feedbackDraft[registrationId];
    if (!content) return;
    await api.post(`/registrations/${registrationId}/feedback`, { content });
    setFeedbackDraft((d) => ({ ...d, [registrationId]: '' }));
    load();
    showToast('Tutor observation synced to Parent Portal');
  }

  async function saveAllFeedback() {
    const entries = Object.entries(feedbackDraft).filter(([, v]) => v);
    for (const [regId, content] of entries) {
      await api.post(`/registrations/${regId}/feedback`, { content });
    }
    setFeedbackDraft({});
    load();
    showToast(`${entries.length} feedback${entries.length === 1 ? '' : 's'} dispatched to parents!`);
  }

  async function completeClass() {
    await api.post(`/registrations/class/${id}/complete`);
    setCompleteOpen(false);
    showToast('Class confirmed completed and published to parents.');
    load();
  }

  async function submitSchedule(e) {
    e.preventDefault();
    if (!schedule.child_id || !schedule.date || !schedule.start) return;
    const startDt = new Date(`${schedule.date}T${schedule.start}`);
    const endDt = new Date(startDt.getTime() + Number(schedule.duration) * 60000);
    const pad = (n) => String(n).padStart(2, '0');
    const toLocal = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    try {
      await api.post('/one-on-one', {
        child_id: schedule.child_id,
        topic: schedule.subject,
        timing: toLocal(startDt),
        end_timing: toLocal(endDt),
        notes: schedule.notes
      });
      const childName = registrations.find((r) => String(r.child_id) === String(schedule.child_id))?.child_name;
      setScheduleOpen(false);
      setSchedule({ child_id: '', subject: '', duration: '60', date: '', start: '', notes: '' });
      showToast(`1:1 invitation sent to ${childName || 'the student'}'s guardian!`);
    } catch (err) {
      showToast(err.response?.data?.error || 'Could not schedule the session');
    }
  }

  if (!cls) return <TeacherShell active="classes"><div style={{ padding: 24 }}>Loading...</div></TeacherShell>;

  const presentStudents = registrations.filter((r) => attendanceDraft[r.child_id] && r.registration_id);
  const presentCount = registrations.filter((r) => attendanceDraft[r.child_id]).length;
  const totalCount = registrations.length;
  const attendanceRate = totalCount ? Math.round((presentCount / totalCount) * 100) : 0;
  const msUntilClass = new Date(cls.timing).getTime() - Date.now();
  const cancellationClosed = msUntilClass < TWENTY_FOUR_HOURS_MS;
  const initials = (name) => name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  const STATUS_STYLE = {
    scheduled: { bg: T.secondaryFixed, fg: T.onSecondaryFixed, label: 'Scheduled' },
    completed: { bg: T.tertiaryFixed, fg: T.onTertiaryFixed, label: 'Completed' },
    cancelled: { bg: T.errorContainer, fg: T.onErrorContainer, label: 'Cancelled' }
  };
  const statusInfo = STATUS_STYLE[cls.status] || STATUS_STYLE.scheduled;

  const TABS = [
    { key: 'attendance', label: 'Students & Attendance', icon: 'group', badge: totalCount },
    { key: 'feedback', label: 'Student Feedback', icon: 'rate_review', badge: presentCount },
    { key: 'materials', label: 'Class Material', icon: 'menu_book', badge: (cls.materials || []).length }
  ];

  return (
    <TeacherShell active="classes">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Breadcrumb + cancellation notice */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.onSurfaceVariant }}>
            <span onClick={() => navigate('/teacher')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
              My Assigned Classes
            </span>
            <span>/</span>
            <span style={{ color: T.onSurface, fontWeight: 600 }}>{cls.title}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.surfaceContainerHigh, padding: '7px 14px', borderRadius: 999, fontSize: 12.5, color: T.onSurfaceVariant }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: T.primary }}>lock_clock</span>
            {cancellationClosed ? 'Free cancellation window for parents closed (within 24h window)' : 'Free cancellation window open (24h+ before class)'}
          </div>
        </div>

        {/* Overview card */}
        <div style={{ background: T.surfaceContainerLowest, borderRadius: T.radius.lg, boxShadow: T.shadow, padding: 24 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: T.primaryFixed, color: T.onPrimaryFixed, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, fontFamily: T.headlineFont }}>
                {initials(cls.title)}
              </div>
              <div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                  <span style={{ background: statusInfo.bg, color: statusInfo.fg, fontSize: 11.5, fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>{statusInfo.label}</span>
                  {(cls.categories || []).map((cat) => (
                    <span key={cat} style={{ background: T.secondaryFixed, color: T.onSecondaryFixed, fontSize: 11.5, fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>{cat}</span>
                  ))}
                </div>
                <h1 style={{ fontFamily: T.headlineFont, fontSize: 22, fontWeight: 700, color: T.onSurface, margin: 0 }}>{cls.title}</h1>
                <p style={{ fontSize: 13, color: T.onSurfaceVariant, margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15, color: T.secondary }}>verified_user</span>
                  {cls.course_name}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setScheduleOpen(true)} style={btnStyle('secondaryOutline')}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>calendar_add_on</span> Schedule 1:1 Class
              </button>
              {cls.status !== 'completed' && (
                <button onClick={() => setCompleteOpen(true)} style={btnStyle('primary')}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>fact_check</span> Complete Class
                </button>
              )}
            </div>
          </div>

          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
            <Metric icon="schedule" bg={T.secondaryFixed} fg={T.onSecondaryFixed} label="Session Time" value={new Date(cls.timing).toLocaleString()} />
            <Metric icon="menu_book" bg={T.primaryFixed} fg={T.onPrimaryFixed} label="Course" value={cls.course_name} />
            <Metric icon="person" bg={T.tertiaryFixed} fg={T.onTertiaryFixed} label="Pupils Registered" value={`${totalCount} Enrolled`} />
            <Metric icon="task_alt" bg={T.surfaceContainerHighest} fg={T.secondary} label="Attendance Rate" value={`${presentCount} / ${totalCount} Present (${attendanceRate}%)`} />
          </div>
        </div>

        {/* Segmented tabs */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'inline-flex', padding: 6, borderRadius: 14, background: T.surfaceContainerHigh, gap: 4 }}>
            {TABS.map((t) => {
              const isActive = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 10, border: 'none',
                    cursor: 'pointer', fontSize: 13.5, fontWeight: 600,
                    background: isActive ? T.surfaceContainerLowest : 'transparent',
                    color: isActive ? T.onSurface : T.onSurfaceVariant,
                    boxShadow: isActive ? T.shadow : 'none'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{t.icon}</span>
                  {t.label}
                  <span style={{ background: T.secondaryFixed, color: T.onSecondaryFixed, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>{t.badge}</span>
                </button>
              );
            })}
          </div>
          {tab === 'attendance' && (
            <button onClick={markAllPresent} style={btnStyle('ghost')}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: T.tertiary }}>done_all</span> Mark All Present
            </button>
          )}
        </div>

        {/* PANE: Attendance */}
        {tab === 'attendance' && (
          <div style={{ background: T.surfaceContainerLowest, borderRadius: T.radius.lg, boxShadow: T.shadow, overflow: 'hidden' }}>
            <div style={{ padding: 14, background: T.surfaceContainerLow, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: T.headlineFont, fontWeight: 700, fontSize: 15 }}>Live Class Register</span>
              <span style={{ fontSize: 12.5, color: T.onSurfaceVariant }}>Changes are recorded instantly</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
              <thead>
                <tr style={{ background: T.surfaceContainer, color: T.onSurfaceVariant, textTransform: 'uppercase', fontSize: 11, letterSpacing: '.05em' }}>
                  <th style={thStyle}>Student</th>
                  <th style={thStyle}>Category</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Status</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Attendance Action</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((r) => {
                  const present = !!attendanceDraft[r.child_id];
                  return (
                    <tr key={r.child_id} style={{ borderBottom: `1px solid ${T.surfaceContainerHigh}` }}>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: T.surfaceContainerHigh, color: T.onSurface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
                            {initials(r.child_name)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{r.child_name}</div>
                            <div style={{ fontSize: 11.5, color: T.onSurfaceVariant }}>
                              {r.registration_id ? r.status : 'Not registered'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={tdStyle}>{r.category}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6,
                          background: present ? T.tertiaryFixed : T.errorContainer, color: present ? T.onTertiaryFixed : T.onErrorContainer
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: present ? T.tertiary : T.error }} />
                          {present ? 'Present' : 'Absent'}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', padding: 4, background: T.surfaceContainerHigh, borderRadius: 10, gap: 4 }}>
                          <button onClick={() => setAttendance(r.child_id, true)} style={pillActionStyle(present)}>Present</button>
                          <button onClick={() => setAttendance(r.child_id, false)} style={pillActionStyle(!present && r.registration_id, true)}>Absent</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PANE: Feedback */}
        {tab === 'feedback' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: T.surfaceContainerLow, borderRadius: T.radius.lg, padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="material-symbols-outlined" style={{ color: T.secondary }}>family_restroom</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>Live Parent Portal Synchronization</div>
                  <div style={{ fontSize: 12, color: T.onSurfaceVariant }}>Showing only students marked Present ({presentCount}).</div>
                </div>
              </div>
              <button onClick={saveAllFeedback} style={btnStyle('primary')}>
                <span className="material-symbols-outlined" style={{ fontSize: 17 }}>cloud_sync</span> Save All Feedbacks
              </button>
            </div>

            {presentStudents.length === 0 && <p style={{ color: T.onSurfaceVariant }}>Mark students present in the register first to give feedback.</p>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {presentStudents.map((r) => {
                const existing = feedbackList.filter((f) => f.registration_id === r.registration_id);
                return (
                  <div key={r.registration_id} style={{ background: T.surfaceContainerLowest, borderRadius: T.radius.lg, boxShadow: T.shadow, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: T.primaryFixed, color: T.onPrimaryFixed, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                          {initials(r.child_name)}
                        </div>
                        <div>
                          <div style={{ fontFamily: T.headlineFont, fontWeight: 700, fontSize: 15 }}>{r.child_name}</div>
                          <div style={{ fontSize: 12, color: T.secondary }}>{r.category}</div>
                        </div>
                      </div>
                      <span style={{ background: T.tertiaryFixed, color: T.onTertiaryFixed, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>Verified Present</span>
                    </div>

                    {existing.map((f) => (
                      <p key={f.id} style={{ fontSize: 12.5, color: T.onSurface, background: T.surfaceContainerLow, padding: '8px 10px', borderRadius: 8, margin: 0 }}>{f.content}</p>
                    ))}

                    <div>
                      <label style={{ fontSize: 11, color: T.onSurfaceVariant, fontWeight: 600, display: 'block', marginBottom: 4 }}>Tutor's Observations</label>
                      <textarea
                        rows={3}
                        placeholder="Provide actionable feedback for parents..."
                        value={feedbackDraft[r.registration_id] || ''}
                        onChange={(e) => setFeedbackDraft((d) => ({ ...d, [r.registration_id]: e.target.value }))}
                        style={{ width: '100%', border: `1px solid ${T.surfaceContainerHigh}`, borderRadius: 8, padding: 8, fontSize: 13, resize: 'vertical', background: T.surfaceContainerLow }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button onClick={() => submitFeedback(r.registration_id)} style={btnStyle('secondary')}>Save &amp; Send to Parent</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PANE: Materials */}
        {tab === 'materials' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {cls.materials && cls.materials.length > 0 ? cls.materials.map((m) => (
              <div key={m.id} style={{ background: T.surfaceContainerLowest, borderRadius: T.radius.lg, boxShadow: T.shadow, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: T.primaryFixed, color: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 22 }}>picture_as_pdf</span>
                  </div>
                  <div>
                    <h2 style={{ fontFamily: T.headlineFont, fontSize: 15, fontWeight: 700, margin: 0 }}>{m.file_name}</h2>
                    <p style={{ fontSize: 12, color: T.onSurfaceVariant, margin: '2px 0 0' }}>View only · no download</p>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <a href={`${FILE_BASE_URL}${m.file_path}`} target="_blank" rel="noreferrer">
                    <button style={btnStyle('secondary')}>
                      <span className="material-symbols-outlined" style={{ fontSize: 17 }}>visibility</span> View
                    </button>
                  </a>
                </div>
              </div>
            )) : (
              <p style={{ color: T.onSurfaceVariant }}>No material uploaded by admin yet.</p>
            )}
          </div>
        )}
      </div>

      {/* MODAL: Schedule 1:1 */}
      {scheduleOpen && (
        <div style={modalBackdrop}>
          <div style={{ ...modalCard, maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontFamily: T.headlineFont, margin: 0, fontSize: 17 }}>Schedule 1:1 Booster Class</h3>
              <button onClick={() => setScheduleOpen(false)} style={iconBtn}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p style={{ fontSize: 13, color: T.onSurfaceVariant, marginTop: 0 }}>
              The student's parent portal will show this session once scheduled.
            </p>
            <form onSubmit={submitSchedule} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={modalLabel}>Select Student</label>
                <select value={schedule.child_id} onChange={(e) => setSchedule((s) => ({ ...s, child_id: e.target.value }))} style={modalInput}>
                  <option value="">Choose a student...</option>
                  {registrations.map((r) => (
                    <option key={r.child_id} value={r.child_id}>{r.child_name} ({r.category})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={modalLabel}>Subject / Focus</label>
                  <input value={schedule.subject} onChange={(e) => setSchedule((s) => ({ ...s, subject: e.target.value }))} style={modalInput} placeholder="e.g. Non-Verbal Reasoning" />
                </div>
                <div style={{ width: 130 }}>
                  <label style={modalLabel}>Duration</label>
                  <select value={schedule.duration} onChange={(e) => setSchedule((s) => ({ ...s, duration: e.target.value }))} style={modalInput}>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="90">90 minutes</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={modalLabel}>Date</label>
                  <input type="date" value={schedule.date} onChange={(e) => setSchedule((s) => ({ ...s, date: e.target.value }))} style={modalInput} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={modalLabel}>Start Time</label>
                  <input type="time" value={schedule.start} onChange={(e) => setSchedule((s) => ({ ...s, start: e.target.value }))} style={modalInput} />
                </div>
              </div>
              <div>
                <label style={modalLabel}>Notes for Parent</label>
                <textarea rows={3} value={schedule.notes} onChange={(e) => setSchedule((s) => ({ ...s, notes: e.target.value }))} style={{ ...modalInput, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setScheduleOpen(false)} style={btnStyle('ghost')}>Cancel</button>
                <button type="submit" style={btnStyle('primary')}>
                  <span className="material-symbols-outlined" style={{ fontSize: 17 }}>send</span> Send Invite to Parent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Complete Class */}
      {completeOpen && (
        <div style={modalBackdrop}>
          <div style={{ ...modalCard, maxWidth: 420 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: T.primaryFixed, color: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>verified</span>
            </div>
            <h3 style={{ fontFamily: T.headlineFont, margin: 0, fontSize: 17 }}>Mark Class as Complete?</h3>
            <p style={{ fontSize: 13.5, color: T.onSurfaceVariant }}>
              This finalizes the register and reflects across the parent and admin portals.
            </p>
            <div style={{ background: T.surfaceContainerLow, borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                <span style={{ color: T.onSurfaceVariant }}>Attended:</span>
                <span style={{ color: T.tertiary, fontWeight: 700 }}>{presentCount} Students</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                <span style={{ color: T.onSurfaceVariant }}>Absent:</span>
                <span style={{ color: T.error, fontWeight: 700 }}>{totalCount - presentCount} Students</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setCompleteOpen(false)} style={btnStyle('ghost')}>Return to Class</button>
              <button onClick={completeClass} style={btnStyle('primary')}>
                <span className="material-symbols-outlined" style={{ fontSize: 17 }}>check_circle</span> Confirm &amp; Publish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 60, background: '#283044', color: '#eef0ff',
          padding: '12px 18px', borderRadius: 12, boxShadow: T.shadowMd, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5
        }}>
          <span className="material-symbols-outlined" style={{ color: T.tertiary, fontSize: 20 }}>check_circle</span>
          {toast}
        </div>
      )}
    </TeacherShell>
  );
}

function Metric({ icon, bg, fg, label, value }) {
  return (
    <div style={{ background: T.surfaceContainerLow, padding: 10, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, color: T.onSurfaceVariant }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.onSurface, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
      </div>
    </div>
  );
}

function btnStyle(variant) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10,
    fontSize: 13.5, fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: T.bodyFont
  };
  if (variant === 'primary') return { ...base, background: T.primaryContainer, color: '#fff' };
  if (variant === 'secondary') return { ...base, background: T.secondary, color: '#fff' };
  if (variant === 'secondaryOutline') return { ...base, background: T.surfaceContainerHigh, color: T.onSurface };
  if (variant === 'ghost') return { ...base, background: T.surfaceContainerLowest, color: T.onSurfaceVariant, boxShadow: T.shadow };
  return base;
}

function pillActionStyle(active, danger) {
  return {
    padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
    background: active ? (danger ? T.error : T.surfaceContainerLowest) : 'transparent',
    color: active ? (danger ? '#fff' : T.tertiary) : T.onSurfaceVariant,
    boxShadow: active && !danger ? T.shadow : 'none'
  };
}

const thStyle = { padding: '10px 16px', fontWeight: 700 };
const tdStyle = { padding: '12px 16px' };
const modalBackdrop = {
  position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(40,48,68,.45)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
};
const modalCard = {
  background: T.surfaceContainerLowest, borderRadius: T.radius.xl, boxShadow: T.shadowMd,
  padding: 22, width: '100%', fontFamily: T.bodyFont
};
const modalLabel = { display: 'block', fontSize: 11.5, fontWeight: 600, color: T.onSurfaceVariant, marginBottom: 4 };
const modalInput = {
  width: '100%', padding: '9px 11px', borderRadius: 8, border: `1px solid ${T.surfaceContainerHigh}`,
  background: T.surfaceContainerLow, fontSize: 13.5, fontFamily: T.bodyFont, boxSizing: 'border-box'
};
const iconBtn = { width: 32, height: 32, borderRadius: 8, border: 'none', background: T.surfaceContainerHigh, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
