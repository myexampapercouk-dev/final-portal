import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { FILE_BASE_URL } from '../../api/axios';
import TeacherShell from './TeacherShell';
import { T, btn } from './theme';

const SUBJECTS = ['Maths', 'English', 'Reasoning', 'Behaviour'];
const TABS = ['Register', 'Feedback', 'Materials'];

export default function ClassDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cls, setCls] = useState(null);
  const [registrations, setRegistrations] = useState([]); // full class-category roster, incl. unregistered
  const [attendanceDraft, setAttendanceDraft] = useState({}); // keyed by child_id
  const [tab, setTab] = useState('Register');
  const [search, setSearch] = useState('');
  const [feedbackSearch, setFeedbackSearch] = useState('');
  const [feedbackList, setFeedbackList] = useState([]);

  // Bulk feedback: multi-select students + multi-select subjects + one shared remark
  const [bulkStudents, setBulkStudents] = useState([]); // registration_ids
  const [bulkSubjects, setBulkSubjects] = useState([]);
  const [bulkRemark, setBulkRemark] = useState('');
  const [bulkMsg, setBulkMsg] = useState('');

  // Single-student detail editor (fine-grained, one subject at a time)
  const [activeStudent, setActiveStudent] = useState(null); // registration_id
  const [activeSubject, setActiveSubject] = useState(SUBJECTS[0]);
  const [feedbackDraft, setFeedbackDraft] = useState({}); // keyed by `${registrationId}:${subject}`

  const [reviewing, setReviewing] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

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

  async function saveAttendance() {
    const attendance = registrations.map((r) => ({
      child_id: r.child_id,
      registration_id: r.registration_id,
      present: !!attendanceDraft[r.child_id]
    }));
    await api.post(`/registrations/class/${id}/attendance`, { attendance });
    load();
  }

  async function submitFeedback(registrationId, subject, content) {
    if (!content) return;
    await api.post(`/registrations/${registrationId}/feedback`, { content, subject });
  }

  async function submitSingleFeedback() {
    const key = `${activeStudent}:${activeSubject}`;
    const content = feedbackDraft[key];
    if (!content) return;
    await submitFeedback(activeStudent, activeSubject, content);
    setFeedbackDraft((d) => ({ ...d, [key]: '' }));
    load();
  }

  function hasSubjectFeedback(registrationId, subject) {
    return feedbackList.some((f) => f.registration_id === registrationId && f.subject === subject);
  }

  async function applyBulkFeedback() {
    setBulkMsg('');
    if (!bulkStudents.length || !bulkSubjects.length || !bulkRemark.trim()) {
      setBulkMsg('Pick at least one student, one subject, and write a remark.');
      return;
    }
    const jobs = [];
    for (const regId of bulkStudents) {
      for (const subj of bulkSubjects) {
        if (!hasSubjectFeedback(regId, subj)) jobs.push([regId, subj]);
      }
    }
    if (!jobs.length) {
      setBulkMsg('Every selected student already has a remark for the selected subject(s).');
      return;
    }
    await Promise.all(jobs.map(([regId, subj]) => submitFeedback(regId, subj, bulkRemark.trim())));
    setBulkMsg(`Added ${jobs.length} remark${jobs.length === 1 ? '' : 's'} across ${bulkStudents.length} student${bulkStudents.length === 1 ? '' : 's'}.`);
    setBulkStudents([]);
    setBulkSubjects([]);
    setBulkRemark('');
    load();
  }

  function toggleBulkStudent(regId) {
    setBulkStudents((s) => (s.includes(regId) ? s.filter((x) => x !== regId) : [...s, regId]));
  }
  function toggleBulkSubject(subj) {
    setBulkSubjects((s) => (s.includes(subj) ? s.filter((x) => x !== subj) : [...s, subj]));
  }

  async function submitAndNotify() {
    setSubmitting(true);
    setSubmitMsg('');
    try {
      const { data } = await api.post(`/registrations/class/${id}/submit-feedback`);
      setSubmitMsg(`Feedback submitted — ${data.notified} parent${data.notified === 1 ? '' : 's'} notified by email.`);
      await load();
      setTimeout(() => navigate('/teacher'), 1500);
    } catch (err) {
      setSubmitMsg(err.response?.data?.error || 'Could not submit feedback');
    } finally {
      setSubmitting(false);
    }
  }

  if (!cls) return <TeacherShell><div style={{ color: T.meta }}>Loading...</div></TeacherShell>;

  const presentStudents = registrations.filter((r) => attendanceDraft[r.child_id] && r.registration_id);
  const filteredRoster = registrations.filter((r) =>
    r.child_name.toLowerCase().includes(search.toLowerCase())
  );
  const feedbackStudents = presentStudents.filter((r) =>
    r.child_name.toLowerCase().includes(feedbackSearch.toLowerCase())
  );
  const presentCount = registrations.filter((r) => attendanceDraft[r.child_id]).length;
  const absentCount = registrations.length - presentCount;

  const activeReg = presentStudents.find((r) => r.registration_id === activeStudent);
  const subjectsCompleted = (reg) =>
    new Set(feedbackList.filter((f) => f.registration_id === reg?.registration_id).map((f) => f.subject)).size;
  const studentsWithRemarks = presentStudents.filter((r) => subjectsCompleted(r) > 0).length;
  const activeSubjectsDone = activeReg ? subjectsCompleted(activeReg) : 0;
  const allMandatoryDone = presentStudents.length > 0 && studentsWithRemarks === presentStudents.length;

  function openEditor(regId) {
    setActiveStudent(regId);
    setReviewing(false);
    setTab('Feedback');
  }

  return (
    <TeacherShell>
      <Link to="/teacher" style={styles.backLink}>&larr; Back to Assigned Classes</Link>

      <div style={{ display: 'flex', gap: 8, margin: '10px 0 20px', flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setReviewing(false); }}
            style={{
              padding: '8px 18px', borderRadius: 999, fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
              border: `1.5px solid ${tab === t ? T.navy : T.line}`,
              background: tab === t ? T.navy : '#fff',
              color: tab === t ? '#fff' : T.navy
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Register' && (
        <div style={{ paddingBottom: 30 }}>
          <h2 style={{ fontFamily: T.headlineFont, fontSize: 22, color: T.navy }}>{new Date(cls.timing).toDateString()} — {cls.course_name}</h2>
          <p style={{ color: T.meta, marginTop: -4 }}>Tap every child who is in the room</p>
          <input
            placeholder="Search name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...styles.input, marginTop: 16, marginBottom: 14, maxWidth: 420, display: 'block' }}
          />
          <div style={styles.rosterGrid}>
            {filteredRoster.map((r) => {
              const present = !!attendanceDraft[r.child_id];
              return (
                <div
                  key={r.child_id}
                  onClick={() => setAttendanceDraft((d) => ({ ...d, [r.child_id]: !d[r.child_id] }))}
                  style={{
                    ...styles.rosterCard,
                    background: present ? T.greenWash : '#fff',
                    borderColor: present ? T.green : T.line
                  }}
                >
                  <span style={{ ...styles.checkbox, background: present ? T.green : '#fff', borderColor: present ? T.green : T.line }}>
                    {present && '✓'}
                  </span>
                  <div>
                    <strong style={{ color: T.navy }}>{r.child_name}</strong>
                    <div style={{ fontSize: 12, color: T.meta }}>{r.category}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={styles.footerBar}>
            <span style={{ fontSize: 13.5 }}>
              <strong style={{ color: T.green }}>{presentCount} present</strong> · {absentCount} absent
            </span>
            <button style={btn('gold')} onClick={saveAttendance}>Save register</button>
          </div>
        </div>
      )}

      {tab === 'Feedback' && !reviewing && (
        <div style={{ paddingBottom: 30 }}>
          <h2 style={{ fontFamily: T.headlineFont, fontSize: 24, color: T.navy }}>Feedback — {new Date(cls.timing).toDateString()}</h2>
          <p style={{ color: T.meta, marginTop: -4 }}>
            {presentStudents.length} students present · {studentsWithRemarks} with remarks
          </p>

          {presentStudents.length === 0 && (
            <p style={{ color: T.meta, marginTop: 16 }}>
              Mark students present in Register first to give feedback.
            </p>
          )}

          {presentStudents.length > 0 && (
            <>
              <div style={{ ...styles.card, margin: '16px 0' }}>
                <h3 style={{ fontFamily: T.headlineFont, color: T.navy, marginTop: 0, marginBottom: 2 }}>Bulk remark</h3>
                <p style={{ color: T.meta, fontSize: 12.5, marginTop: 0 }}>
                  Select multiple students and subjects to write one remark for all of them at once.
                </p>

                <div style={styles.label}>Students</div>
                <div style={styles.pillRow}>
                  {presentStudents.map((r) => {
                    const checked = bulkStudents.includes(r.registration_id);
                    return (
                      <label
                        key={r.registration_id}
                        onClick={() => toggleBulkStudent(r.registration_id)}
                        style={{ ...styles.checkPill, background: checked ? T.navy : '#fff', color: checked ? '#fff' : T.navy, borderColor: checked ? T.navy : T.line }}
                      >
                        <span style={{ ...styles.checkbox, width: 16, height: 16, fontSize: 11, background: checked ? T.gold : 'transparent', borderColor: checked ? T.gold : T.line, color: T.navy }}>
                          {checked && '✓'}
                        </span>
                        {r.child_name}
                      </label>
                    );
                  })}
                </div>

                <div style={{ ...styles.label, marginTop: 14 }}>Subjects</div>
                <div style={styles.pillRow}>
                  {SUBJECTS.map((s) => {
                    const checked = bulkSubjects.includes(s);
                    return (
                      <label
                        key={s}
                        onClick={() => toggleBulkSubject(s)}
                        style={{ ...styles.checkPill, background: checked ? T.navy : '#fff', color: checked ? '#fff' : T.navy, borderColor: checked ? T.navy : T.line }}
                      >
                        <span style={{ ...styles.checkbox, width: 16, height: 16, fontSize: 11, background: checked ? T.gold : 'transparent', borderColor: checked ? T.gold : T.line, color: T.navy }}>
                          {checked && '✓'}
                        </span>
                        {s}
                      </label>
                    );
                  })}
                </div>

                <div style={{ ...styles.label, marginTop: 14 }}>Remark</div>
                <textarea
                  rows={3}
                  placeholder="Write one remark to apply to every selected student + subject..."
                  value={bulkRemark}
                  onChange={(e) => setBulkRemark(e.target.value)}
                  style={{ ...styles.input, resize: 'vertical' }}
                />

                {bulkMsg && (
                  <div style={{
                    marginTop: 10, fontSize: 12.5, padding: '8px 12px', borderRadius: 8,
                    background: bulkMsg.startsWith('Added') ? T.greenWash : T.redWash,
                    color: bulkMsg.startsWith('Added') ? T.green : T.red
                  }}>
                    {bulkMsg}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                  <button style={btn('gold')} onClick={applyBulkFeedback}>
                    Apply to {bulkStudents.length || 0} student{bulkStudents.length === 1 ? '' : 's'} × {bulkSubjects.length || 0} subject{bulkSubjects.length === 1 ? '' : 's'}
                  </button>
                </div>
              </div>

              <input
                placeholder="Search student..."
                value={feedbackSearch}
                onChange={(e) => setFeedbackSearch(e.target.value)}
                style={{ ...styles.input, marginTop: 4, marginBottom: 4, maxWidth: 420, display: 'block' }}
              />
              <div style={styles.feedbackGrid}>
                <div style={{ ...styles.card, margin: 0, padding: '14px 12px' }}>
                  <div style={{ ...styles.label, marginTop: 0, paddingLeft: 8 }}>Students · click to edit individually</div>
                  {feedbackStudents.map((r) => {
                    const done = subjectsCompleted(r);
                    const isActive = activeReg && r.registration_id === activeReg.registration_id;
                    return (
                      <div
                        key={r.registration_id}
                        onClick={() => setActiveStudent(r.registration_id)}
                        style={{
                          ...styles.studentRow,
                          background: isActive ? T.navy : '#fff',
                          color: isActive ? '#fff' : T.navy,
                          borderLeft: isActive ? `4px solid ${T.gold}` : '4px solid transparent'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <strong>{r.child_name}</strong>
                            <div style={{ fontSize: 12, color: isActive ? '#C7CEDB' : T.meta }}>{r.category}</div>
                          </div>
                          <span style={{ ...styles.dot, background: done > 0 ? T.gold : '#c7ccd6' }} />
                        </div>
                        <div style={{ fontSize: 12, marginTop: 4, color: isActive ? T.goldSoft : done > 0 ? T.gold : '#94a3b8', fontWeight: 600 }}>
                          {done > 0 ? `${done} subject${done > 1 ? 's' : ''} completed` : 'Not started (required)'}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {activeReg && (
                  <div style={{ ...styles.card, margin: 0 }}>
                    <h3 style={{ fontFamily: T.headlineFont, color: T.navy, marginBottom: 2 }}>{activeReg.child_name}</h3>
                    <p style={{ color: T.meta, fontSize: 13 }}>{activeReg.category}</p>

                    <div style={styles.label}>Subject</div>
                    <div style={styles.pillRow}>
                      {SUBJECTS.map((s) => {
                        const done = hasSubjectFeedback(activeReg.registration_id, s);
                        const isActive = activeSubject === s;
                        return (
                          <label
                            key={s}
                            onClick={() => setActiveSubject(s)}
                            style={{ ...styles.checkPill, background: isActive ? T.navy : '#fff', color: isActive ? '#fff' : done ? T.gold : T.navy, borderColor: isActive ? T.navy : done ? T.goldSoft : T.line }}
                          >
                            <span style={{ ...styles.checkbox, width: 16, height: 16, fontSize: 11, background: done ? T.gold : 'transparent', borderColor: isActive ? '#fff' : done ? T.gold : T.line, color: T.navy }}>
                              {done && '✓'}
                            </span>
                            {s}
                          </label>
                        );
                      })}
                    </div>

                    {feedbackList
                      .filter((f) => f.registration_id === activeReg.registration_id && f.subject === activeSubject)
                      .map((f) => (
                        <p key={f.id} style={{ fontSize: 13, color: '#334155', background: '#f1f5f9', padding: '8px 10px', borderRadius: 8, marginTop: 10 }}>
                          {f.content}
                        </p>
                      ))}

                    <div style={{ ...styles.label, marginTop: 14 }}>Remarks</div>
                    <textarea
                      rows={5}
                      placeholder={`Add a remark for ${activeSubject}...`}
                      value={feedbackDraft[`${activeReg.registration_id}:${activeSubject}`] || ''}
                      onChange={(e) => setFeedbackDraft((d) => ({ ...d, [`${activeReg.registration_id}:${activeSubject}`]: e.target.value }))}
                      style={{ ...styles.input, resize: 'vertical' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                      <button style={btn('secondary')} onClick={submitSingleFeedback}>
                        + Add another subject remark
                      </button>
                      <span style={{ fontSize: 12.5, color: T.meta }}>{activeSubjectsDone} of {SUBJECTS.length} subjects have remarks</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {presentStudents.length > 0 && (
            <div style={styles.footerBar}>
              <span style={{ fontSize: 13.5 }}>
                {studentsWithRemarks} of {presentStudents.length} students have remarks
                {!allMandatoryDone && <span style={{ color: T.red }}> — every present student needs at least one remark</span>}
              </span>
              <button style={btn('gold')} disabled={!allMandatoryDone} onClick={() => setReviewing(true)}>
                Review Feedback
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'Feedback' && reviewing && (
        <div style={{ paddingBottom: 30 }}>
          <button onClick={() => setReviewing(false)} style={styles.plainLink}>&larr; Back to feedback</button>
          <h2 style={{ fontFamily: T.headlineFont, fontSize: 24, color: T.navy, marginTop: 6 }}>Review Feedback</h2>
          <p style={{ color: T.meta, marginTop: -4 }}>Check each student's remarks before notifying parents.</p>

          <div style={styles.reviewGrid}>
            {presentStudents.map((r) => (
              <div key={r.registration_id} style={{ ...styles.card, margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <strong style={{ color: T.navy }}>{r.child_name}</strong>
                    <div style={{ fontSize: 12, color: T.meta }}>{r.category}</div>
                  </div>
                  <button style={btn('secondary')} onClick={() => openEditor(r.registration_id)}>Edit</button>
                </div>
                {feedbackList.filter((f) => f.registration_id === r.registration_id).length === 0 ? (
                  <p style={{ color: T.red, fontSize: 13, marginTop: 10 }}>No remarks yet</p>
                ) : (
                  feedbackList
                    .filter((f) => f.registration_id === r.registration_id)
                    .map((f) => (
                      <div key={f.id} style={styles.reviewRemark}>
                        <div style={{ fontSize: 11, letterSpacing: '.04em', textTransform: 'uppercase', color: T.meta, fontWeight: 700 }}>{f.subject || 'General'}</div>
                        <div style={{ fontSize: 13, color: '#334155', marginTop: 2 }}>{f.content}</div>
                      </div>
                    ))
                )}
              </div>
            ))}
          </div>

          {submitMsg && (
            <div style={{
              marginTop: 14, fontSize: 13, padding: '10px 14px', borderRadius: 8,
              background: submitMsg.startsWith('Feedback submitted') ? T.greenWash : T.redWash,
              color: submitMsg.startsWith('Feedback submitted') ? T.green : T.red
            }}>
              {submitMsg}
            </div>
          )}

          <div style={styles.footerBar}>
            <button style={btn('secondary')} onClick={() => setReviewing(false)}>Back to edit</button>
            <button style={btn('gold')} disabled={submitting} onClick={submitAndNotify}>
              {submitting ? 'Submitting...' : 'Submit & Notify Parents'}
            </button>
          </div>
        </div>
      )}

      {tab === 'Materials' && (
        <div style={{ paddingBottom: 30 }}>
          <h2 style={{ fontFamily: T.headlineFont, fontSize: 24, color: T.navy }}>Today's material</h2>
          <div style={{ ...styles.card, margin: '16px 0 0', padding: 0, overflow: 'hidden' }}>
            {cls.materials && cls.materials.length > 0 ? (
              cls.materials.map((m, i) => (
                <div
                  key={m.id}
                  style={{
                    ...styles.materialRow,
                    flexWrap: 'wrap',
                    borderTop: i === 0 ? 'none' : `1px solid ${T.line}`
                  }}
                >
                  <div style={styles.pdfIcon}>PDF</div>
                  <div style={{ flex: '1 1 160px', minWidth: 0 }}>
                    <strong style={{ color: T.navy, wordBreak: 'break-word' }}>{m.file_name}</strong>
                    <div style={{ fontSize: 12, color: T.meta }}>View only · no download</div>
                  </div>
                  <a href={`${FILE_BASE_URL}${m.file_path}`} target="_blank" rel="noreferrer">
                    <button style={{ ...btn('secondary'), borderColor: T.gold }}>View</button>
                  </a>
                </div>
              ))
            ) : (
              <p style={{ color: T.meta, padding: 18 }}>No material uploaded by admin yet.</p>
            )}
          </div>
        </div>
      )}
    </TeacherShell>
  );
}

const styles = {
  backLink: { fontSize: 13, color: T.meta, textDecoration: 'none', display: 'inline-block' },
  plainLink: { fontSize: 13, color: T.meta, background: 'none', border: 'none', cursor: 'pointer', padding: 0 },
  card: { background: '#fff', borderRadius: T.radius, boxShadow: T.shadow, border: `1px solid ${T.line}`, padding: '16px 18px', marginBottom: 14 },
  input: {
    width: '100%', padding: '10px 13px', border: `1.5px solid ${T.line}`, borderRadius: 10,
    fontFamily: T.bodyFont, fontSize: 14, color: T.navy, background: '#fff', boxSizing: 'border-box'
  },
  label: { fontSize: 11.5, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 5, marginTop: 12, color: T.meta, fontWeight: 600 },
  rosterGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 12 },
  rosterCard: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
    border: '1.5px solid', borderRadius: 12, cursor: 'pointer', background: '#fff'
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, border: '1.5px solid', display: 'flex',
    alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, flexShrink: 0
  },
  feedbackGrid: { display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, marginTop: 12, alignItems: 'flex-start' },
  reviewGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14, marginTop: 16 },
  reviewRemark: { marginTop: 10, paddingLeft: 10, borderLeft: `3px solid ${T.gold}` },
  studentRow: { padding: '12px 12px', borderRadius: 10, cursor: 'pointer', marginBottom: 6 },
  dot: { width: 8, height: 8, borderRadius: '50%', marginTop: 4, flexShrink: 0 },
  pillRow: { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 },
  checkPill: {
    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 999,
    border: '1.5px solid', cursor: 'pointer', fontSize: 13.5, fontWeight: 600
  },
  materialRow: { display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px' },
  pdfIcon: {
    width: 40, height: 40, borderRadius: 8, background: T.navy, color: T.gold,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0
  },
  footerBar: {
    marginTop: 24, padding: '14px 0 0', borderTop: `1px solid ${T.line}`,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10
  }
};
