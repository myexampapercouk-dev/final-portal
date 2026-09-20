import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { FILE_BASE_URL } from '../../api/axios';
import TeacherTopNav from './TeacherTopNav';
import { T, btn } from './theme';

const REGISTER_STEPS = ['Session', 'Group', 'Attendance'];
const SUBJECTS = ['Maths', 'English', 'Reasoning', 'Behaviour'];

export default function ClassDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cls, setCls] = useState(null);
  const [registrations, setRegistrations] = useState([]); // full class-category roster, incl. unregistered
  const [attendanceDraft, setAttendanceDraft] = useState({}); // keyed by child_id
  const [tab, setTab] = useState('Register');
  const [registerStep, setRegisterStep] = useState('Attendance');
  const [search, setSearch] = useState('');
  const [feedbackDraft, setFeedbackDraft] = useState({}); // keyed by `${registrationId}:${subject}`
  const [feedbackList, setFeedbackList] = useState([]);
  const [activeStudent, setActiveStudent] = useState(null); // registration_id
  const [activeSubject, setActiveSubject] = useState(SUBJECTS[0]);
  const [oneOnOne, setOneOnOne] = useState({ child_id: '', date: '', start: '', end: '', notes: '' });
  const [oneOnOneMsg, setOneOnOneMsg] = useState('');

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

  async function submitFeedback(registrationId, subject) {
    const key = `${registrationId}:${subject}`;
    const content = feedbackDraft[key];
    if (!content) return;
    await api.post(`/registrations/${registrationId}/feedback`, { content, subject });
    setFeedbackDraft((d) => ({ ...d, [key]: '' }));
    load();
  }

  async function completeClass() {
    if (!window.confirm('Mark this class as complete? This will reflect across parent and admin portals.')) return;
    await api.post(`/registrations/class/${id}/complete`);
    navigate('/teacher');
  }

  async function saveLesson(e) {
    e.preventDefault();
    setOneOnOneMsg('');
    if (!oneOnOne.child_id || !oneOnOne.date || !oneOnOne.start) {
      setOneOnOneMsg('Pick a child, date and start time.');
      return;
    }
    try {
      await api.post('/one-on-one', {
        child_id: oneOnOne.child_id,
        timing: `${oneOnOne.date}T${oneOnOne.start}`,
        end_timing: oneOnOne.end ? `${oneOnOne.date}T${oneOnOne.end}` : null,
        notes: oneOnOne.notes
      });
      setOneOnOneMsg('Lesson saved — visible on the parent portal.');
      setOneOnOne({ child_id: '', date: '', start: '', end: '', notes: '' });
    } catch (err) {
      setOneOnOneMsg(err.response?.data?.error || 'Could not save lesson');
    }
  }

  if (!cls) return <div style={{ padding: 40, fontFamily: T.bodyFont }}>Loading...</div>;

  const presentStudents = registrations.filter((r) => attendanceDraft[r.child_id] && r.registration_id);
  const filteredRoster = registrations.filter((r) =>
    r.child_name.toLowerCase().includes(search.toLowerCase())
  );
  const presentCount = registrations.filter((r) => attendanceDraft[r.child_id]).length;
  const absentCount = registrations.length - presentCount;

  const activeReg = presentStudents.find((r) => r.registration_id === activeStudent) || presentStudents[0];
  const activeIndex = presentStudents.findIndex((r) => r.registration_id === (activeReg && activeReg.registration_id));
  const subjectsCompleted = (reg) =>
    new Set(feedbackList.filter((f) => f.registration_id === reg?.registration_id).map((f) => f.subject)).size;
  const studentsWithRemarks = presentStudents.filter((r) => subjectsCompleted(r) > 0).length;
  const activeSubjectsDone = activeReg ? subjectsCompleted(activeReg) : 0;

  function durationLabel() {
    if (!oneOnOne.start || !oneOnOne.end) return null;
    const [sh, sm] = oneOnOne.start.split(':').map(Number);
    const [eh, em] = oneOnOne.end.split(':').map(Number);
    let mins = (eh * 60 + em) - (sh * 60 + sm);
    if (mins <= 0) return null;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h ? `${h} hr ${m ? `${m} min` : ''}` : `${m} min`}`.trim();
  }

  return (
    <div style={{ minHeight: '100vh', background: T.canvas, fontFamily: T.bodyFont }}>
      <TeacherTopNav tabs={[
        { label: 'Register', active: tab === 'Register', onClick: () => setTab('Register') },
        { label: 'Feedback', active: tab === 'Feedback', onClick: () => setTab('Feedback') },
        { label: 'Materials', active: tab === 'Materials', onClick: () => setTab('Materials') },
        { label: '1:1', active: tab === '1:1', onClick: () => setTab('1:1') }
      ]} />
      <div style={styles.page}>
        {tab === 'Register' && (
          <>
            <div style={styles.stepRow}>
              {REGISTER_STEPS.map((s) => (
                <div
                  key={s}
                  onClick={() => setRegisterStep(s)}
                  style={{
                    ...styles.step,
                    color: registerStep === s ? T.navy : T.meta,
                    fontWeight: registerStep === s ? 700 : 500,
                    borderBottomColor: registerStep === s ? T.gold : 'transparent'
                  }}
                >
                  {s}
                </div>
              ))}
            </div>

            {registerStep === 'Session' && (
              <div style={{ paddingTop: 28 }}>
                <h2 style={{ fontFamily: T.headlineFont, fontSize: 26, color: T.navy }}>{cls.title}</h2>
                <p style={{ color: T.meta }}>{cls.course_name} · {new Date(cls.timing).toLocaleString()}</p>
                <div style={{ marginTop: 8 }}>
                  {(cls.categories || []).map((cat) => <span key={cat} style={styles.badge}>{cat}</span>)}
                  <span style={{ ...styles.badge, background: '#E0F2FE', color: '#0369A1' }}>Status: {cls.status}</span>
                </div>
                <button style={{ ...btn('gold'), marginTop: 22 }} onClick={() => setRegisterStep('Group')}>
                  Continue to Group
                </button>
              </div>
            )}

            {registerStep === 'Group' && (
              <div style={{ paddingTop: 28 }}>
                <h2 style={{ fontFamily: T.headlineFont, fontSize: 22, color: T.navy }}>Roster by category</h2>
                <p style={{ color: T.meta, marginBottom: 16 }}>{registrations.length} children eligible for this session.</p>
                {[...new Set(registrations.map((r) => r.category))].map((cat) => (
                  <div key={cat} style={{ marginBottom: 18 }}>
                    <div style={styles.label}>{cat}</div>
                    <div style={styles.rosterGrid}>
                      {registrations.filter((r) => r.category === cat).map((r) => (
                        <div key={r.child_id} style={{ ...styles.card, margin: 0, padding: '12px 14px' }}>
                          <strong style={{ color: T.navy }}>{r.child_name}</strong>
                          <div style={{ fontSize: 12, color: T.meta }}>
                            {r.registration_id ? r.status : 'Not registered'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <button style={btn('gold')} onClick={() => setRegisterStep('Attendance')}>Continue to Attendance</button>
              </div>
            )}

            {registerStep === 'Attendance' && (
              <div style={{ paddingTop: 24, paddingBottom: 90 }}>
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
                  <div style={{ display: 'flex', gap: 8 }}>
                    {cls.status !== 'completed' && <button style={btn('secondary')} onClick={completeClass}>Complete Class</button>}
                    <button style={btn('gold')} onClick={saveAttendance}>Save register</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'Feedback' && (
          <div style={{ paddingTop: 24, paddingBottom: 90 }}>
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
              <div style={styles.feedbackGrid}>
                <div style={{ ...styles.card, margin: 0, padding: '14px 12px' }}>
                  <div style={{ ...styles.label, marginTop: 0, paddingLeft: 8 }}>Students</div>
                  {presentStudents.map((r) => {
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
                          {done > 0 ? `${done} subject${done > 1 ? 's' : ''} completed` : 'Not started'}
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
                        const done = feedbackList.some((f) => f.registration_id === activeReg.registration_id && f.subject === s);
                        const isActive = activeSubject === s;
                        return (
                          <div
                            key={s}
                            onClick={() => setActiveSubject(s)}
                            style={{
                              ...styles.subjectPill,
                              background: isActive ? T.navy : '#fff',
                              color: isActive ? '#fff' : done ? T.gold : T.navy,
                              borderColor: isActive ? T.navy : done ? T.goldSoft : T.line
                            }}
                          >
                            {s} {done && '✓'}
                          </div>
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
                      <button style={btn('secondary')} onClick={() => submitFeedback(activeReg.registration_id, activeSubject)}>
                        + Add another subject remark
                      </button>
                      <span style={{ fontSize: 12.5, color: T.meta }}>{activeSubjectsDone} of {SUBJECTS.length} subjects have remarks</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {presentStudents.length > 0 && (
              <div style={styles.footerBar}>
                <span style={{ fontSize: 13.5 }}>{studentsWithRemarks} of {presentStudents.length} students have remarks</span>
                <button
                  style={btn('gold')}
                  disabled={activeIndex >= presentStudents.length - 1}
                  onClick={() => setActiveStudent(presentStudents[activeIndex + 1]?.registration_id)}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {tab === 'Materials' && (
          <div style={{ paddingTop: 24 }}>
            <h2 style={{ fontFamily: T.headlineFont, fontSize: 24, color: T.navy }}>Today's material</h2>
            <div style={{ ...styles.card, margin: '16px 0 0', padding: 0, overflow: 'hidden' }}>
              {cls.materials && cls.materials.length > 0 ? (
                cls.materials.map((m, i) => (
                  <div key={m.id} style={{ ...styles.materialRow, borderTop: i === 0 ? 'none' : `1px solid ${T.line}` }}>
                    <div style={styles.pdfIcon}>PDF</div>
                    <div style={{ flex: 1 }}>
                      <strong style={{ color: T.navy }}>{m.file_name}</strong>
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

        {tab === '1:1' && (
          <div style={{ paddingTop: 24, maxWidth: 640 }}>
            <h2 style={{ fontFamily: T.headlineFont, fontSize: 24, color: T.navy }}>Log a 1:1 lesson</h2>
            <form style={{ ...styles.card, margin: '16px 0 0' }} onSubmit={saveLesson}>
              <div style={styles.label}>Child</div>
              <select
                value={oneOnOne.child_id}
                onChange={(e) => setOneOnOne((f) => ({ ...f, child_id: e.target.value }))}
                style={styles.input}
              >
                <option value="">Select a child...</option>
                {registrations.map((r) => (
                  <option key={r.child_id} value={r.child_id}>{r.child_name} — {r.category}</option>
                ))}
              </select>

              <div style={{ ...styles.label, marginTop: 14 }}>Date</div>
              <input type="date" value={oneOnOne.date} onChange={(e) => setOneOnOne((f) => ({ ...f, date: e.target.value }))} style={styles.input} />

              <div style={{ display: 'flex', gap: 14, marginTop: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={styles.label}>Start</div>
                  <input type="time" value={oneOnOne.start} onChange={(e) => setOneOnOne((f) => ({ ...f, start: e.target.value }))} style={styles.input} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={styles.label}>End</div>
                  <input type="time" value={oneOnOne.end} onChange={(e) => setOneOnOne((f) => ({ ...f, end: e.target.value }))} style={styles.input} />
                </div>
              </div>

              {durationLabel() && (
                <div style={{ background: T.greenWash, color: T.green, padding: '9px 13px', borderRadius: 10, fontSize: 13, marginTop: 12 }}>
                  Duration: {durationLabel()} — calculated for you
                </div>
              )}

              <div style={{ ...styles.label, marginTop: 14 }}>What was covered</div>
              <textarea
                rows={4}
                placeholder="Summarise what the child worked on..."
                value={oneOnOne.notes}
                onChange={(e) => setOneOnOne((f) => ({ ...f, notes: e.target.value }))}
                style={{ ...styles.input, resize: 'vertical' }}
              />

              {oneOnOneMsg && (
                <div style={{
                  marginTop: 10, fontSize: 12.5, padding: '8px 12px', borderRadius: 8,
                  background: oneOnOneMsg.startsWith('Lesson saved') ? T.greenWash : T.redWash,
                  color: oneOnOneMsg.startsWith('Lesson saved') ? T.green : T.red
                }}>
                  {oneOnOneMsg}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
                <span style={{ fontSize: 12.5, color: T.meta }}>Saves to parent portal</span>
                <button style={btn('gold')} type="submit">Save lesson</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: 1100, margin: '0 auto', padding: '28px 40px 60px' },
  stepRow: {
    display: 'flex', justifyContent: 'space-around', borderBottom: `1px solid ${T.line}`,
    background: '#fff', margin: '-28px -40px 0', padding: '0 40px'
  },
  step: { padding: '16px 10px', cursor: 'pointer', fontSize: 15, borderBottom: '2.5px solid transparent' },
  card: { background: '#fff', borderRadius: T.radius, boxShadow: T.shadow, border: `1px solid ${T.line}`, padding: '16px 18px', marginBottom: 14 },
  input: {
    width: '100%', padding: '10px 13px', border: `1.5px solid ${T.line}`, borderRadius: 10,
    fontFamily: T.bodyFont, fontSize: 14, color: T.navy, background: '#fff', boxSizing: 'border-box'
  },
  label: { fontSize: 11.5, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 5, marginTop: 12, color: T.meta, fontWeight: 600 },
  badge: { display: 'inline-block', padding: '4px 11px', borderRadius: 999, fontSize: 11.5, fontWeight: 600, background: '#E8ECF3', color: T.navy, marginRight: 6 },
  rosterGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 12 },
  rosterCard: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
    border: '1.5px solid', borderRadius: 12, cursor: 'pointer', background: '#fff'
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, border: '1.5px solid', display: 'flex',
    alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, flexShrink: 0
  },
  footerBar: {
    position: 'sticky', bottom: 0, left: 0, right: 0, marginTop: 24, marginLeft: -40, marginRight: -40,
    padding: '16px 40px', background: '#fff', borderTop: `1px solid ${T.line}`,
    boxShadow: '0 -4px 16px rgba(22,36,61,.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
  },
  feedbackGrid: { display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, marginTop: 20, alignItems: 'flex-start' },
  studentRow: { padding: '12px 12px', borderRadius: 10, cursor: 'pointer', marginBottom: 6 },
  dot: { width: 8, height: 8, borderRadius: '50%', marginTop: 4, flexShrink: 0 },
  pillRow: { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 },
  subjectPill: { padding: '9px 16px', borderRadius: 999, border: '1.5px solid', cursor: 'pointer', fontSize: 13.5, fontWeight: 600 },
  materialRow: { display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px' },
  pdfIcon: {
    width: 40, height: 40, borderRadius: 8, background: T.navy, color: T.gold,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0
  }
};
