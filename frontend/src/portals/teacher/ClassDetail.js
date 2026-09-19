import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { FILE_BASE_URL } from '../../api/axios';
import TeacherClassNav from './TeacherClassNav';

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

  if (!cls) return <div style={{ padding: 40 }}>Loading...</div>;

  // Only children who are (a) checked present AND (b) actually have a registration
  // (walk-ins get a registration_id once "Save Attendance" auto-registers them)
  const presentStudents = registrations.filter((r) => attendanceDraft[r.child_id] && r.registration_id);
  const filteredRoster = registrations.filter((r) =>
    r.child_name.toLowerCase().includes(search.toLowerCase())
  );
  const presentCount = registrations.filter((r) => attendanceDraft[r.child_id]).length;
  const absentCount = registrations.length - presentCount;
  const categories = [...new Set(registrations.map((r) => r.category))];

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
    <div style={{ minHeight: '100vh', background: 'var(--canvas, #EEEAE0)' }}>
      <TeacherClassNav tab={tab} setTab={setTab} />
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
                    color: registerStep === s ? 'var(--navy)' : 'var(--meta)',
                    fontWeight: registerStep === s ? 700 : 500,
                    borderBottomColor: registerStep === s ? 'var(--gold)' : 'transparent'
                  }}
                >
                  {s}
                </div>
              ))}
            </div>

            {registerStep === 'Session' && (
              <div style={{ paddingTop: 28 }}>
                <h2 style={{ fontSize: 26 }}>{cls.title}</h2>
                <p style={{ color: 'var(--meta)' }}>{cls.course_name} · {new Date(cls.timing).toLocaleString()}</p>
                <div style={{ marginTop: 8 }}>
                  {categories.map((cat) => <span key={cat} className="badge" style={{ marginRight: 6 }}>{cat}</span>)}
                  <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>Status: {cls.status}</span>
                </div>
                <button className="gold" style={{ marginTop: 22 }} onClick={() => setRegisterStep('Group')}>
                  Continue to Group
                </button>
              </div>
            )}

            {registerStep === 'Group' && (
              <div style={{ paddingTop: 28 }}>
                <h2 style={{ fontSize: 22 }}>Roster by category</h2>
                <p style={{ color: 'var(--meta)', marginBottom: 16 }}>{registrations.length} children eligible for this session.</p>
                {categories.map((cat) => (
                  <div key={cat} style={{ marginBottom: 18 }}>
                    <label style={{ marginTop: 0 }}>{cat}</label>
                    <div style={styles.rosterGrid}>
                      {registrations.filter((r) => r.category === cat).map((r) => (
                        <div key={r.child_id} className="card" style={{ margin: 0, padding: '12px 14px' }}>
                          <strong>{r.child_name}</strong>
                          <div style={{ fontSize: 12, color: 'var(--meta)' }}>
                            {r.registration_id ? r.status : 'Not registered'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <button className="gold" onClick={() => setRegisterStep('Attendance')}>Continue to Attendance</button>
              </div>
            )}

            {registerStep === 'Attendance' && (
              <div style={{ paddingTop: 24, paddingBottom: 90 }}>
                <h2 style={{ fontSize: 22 }}>{new Date(cls.timing).toDateString()} — {cls.course_name}</h2>
                <p style={{ color: 'var(--meta)', marginTop: -4 }}>Tap every child who is in the room</p>
                <input
                  placeholder="🔍 Search name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ marginTop: 16, marginBottom: 14, maxWidth: 420 }}
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
                          background: present ? 'var(--green-wash)' : '#fff',
                          borderColor: present ? 'var(--green)' : 'var(--line)'
                        }}
                      >
                        <span style={{ ...styles.checkbox, background: present ? 'var(--green)' : '#fff', borderColor: present ? 'var(--green)' : 'var(--line)' }}>
                          {present && '✓'}
                        </span>
                        <div>
                          <strong>{r.child_name}</strong>
                          <div style={{ fontSize: 12, color: 'var(--meta)' }}>{r.category}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={styles.footerBar}>
                  <span style={{ fontSize: 13.5 }}>
                    <strong style={{ color: 'var(--green)' }}>{presentCount} present</strong> · {absentCount} absent
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {cls.status !== 'completed' && <button className="secondary" onClick={completeClass}>Complete Class</button>}
                    <button className="gold" onClick={saveAttendance}>Save register</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'Feedback' && (
          <div style={{ paddingTop: 24, paddingBottom: 90 }}>
            <h2 style={{ fontSize: 24 }}>Feedback — {new Date(cls.timing).toDateString()}</h2>
            <p style={{ color: 'var(--meta)', marginTop: -4 }}>
              {presentStudents.length} students present · {studentsWithRemarks} with remarks
            </p>

            {presentStudents.length === 0 && (
              <p style={{ color: '#64748b', marginTop: 16 }}>
                Mark students present in Register first to give feedback.
              </p>
            )}

            {presentStudents.length > 0 && (
              <div style={styles.feedbackGrid}>
                <div className="card" style={{ margin: 0, padding: '14px 12px' }}>
                  <label style={{ marginTop: 0, paddingLeft: 8 }}>Students</label>
                  {presentStudents.map((r) => {
                    const done = subjectsCompleted(r);
                    const isActive = activeReg && r.registration_id === activeReg.registration_id;
                    return (
                      <div
                        key={r.registration_id}
                        onClick={() => setActiveStudent(r.registration_id)}
                        style={{
                          ...styles.studentRow,
                          background: isActive ? 'var(--navy)' : '#fff',
                          color: isActive ? '#fff' : 'var(--navy)',
                          borderLeft: isActive ? '4px solid var(--gold)' : '4px solid transparent'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <strong>{r.child_name}</strong>
                            <div style={{ fontSize: 12, color: isActive ? '#C7CEDB' : 'var(--meta)' }}>{r.category}</div>
                          </div>
                          <span style={{ ...styles.dot, background: done > 0 ? 'var(--gold)' : '#c7ccd6' }} />
                        </div>
                        <div style={{ fontSize: 12, marginTop: 4, color: isActive ? 'var(--gold-soft)' : done > 0 ? 'var(--gold)' : '#94a3b8', fontWeight: 600 }}>
                          {done > 0 ? `${done} subject${done > 1 ? 's' : ''} completed` : 'Not started'}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {activeReg && (
                  <div className="card" style={{ margin: 0 }}>
                    <h3 style={{ marginBottom: 2 }}>{activeReg.child_name}</h3>
                    <p style={{ color: 'var(--meta)', fontSize: 13 }}>{activeReg.category}</p>

                    <label>Subject</label>
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
                              background: isActive ? 'var(--navy)' : '#fff',
                              color: isActive ? '#fff' : done ? 'var(--gold)' : 'var(--navy)',
                              borderColor: isActive ? 'var(--navy)' : done ? 'var(--gold-soft)' : 'var(--line)'
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

                    <label>Remarks</label>
                    <textarea
                      rows={5}
                      placeholder={`Add a remark for ${activeSubject}...`}
                      value={feedbackDraft[`${activeReg.registration_id}:${activeSubject}`] || ''}
                      onChange={(e) => setFeedbackDraft((d) => ({ ...d, [`${activeReg.registration_id}:${activeSubject}`]: e.target.value }))}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                      <button className="secondary" onClick={() => submitFeedback(activeReg.registration_id, activeSubject)}>
                        + Add another subject remark
                      </button>
                      <span style={{ fontSize: 12.5, color: 'var(--meta)' }}>{activeSubjectsDone} of {SUBJECTS.length} subjects have remarks</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {presentStudents.length > 0 && (
              <div style={styles.footerBar}>
                <span style={{ fontSize: 13.5 }}>{studentsWithRemarks} of {presentStudents.length} students have remarks</span>
                <button
                  className="gold"
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
            <h2 style={{ fontSize: 24 }}>Today's material</h2>
            <div className="card" style={{ margin: '16px 0 0', padding: 0, overflow: 'hidden' }}>
              {cls.materials && cls.materials.length > 0 ? (
                cls.materials.map((m, i) => (
                  <div key={m.id} style={{ ...styles.materialRow, borderTop: i === 0 ? 'none' : '1px solid var(--line)' }}>
                    <div style={styles.pdfIcon}>PDF</div>
                    <div style={{ flex: 1 }}>
                      <strong>{m.file_name}</strong>
                      <div style={{ fontSize: 12, color: 'var(--meta)' }}>View only · no download</div>
                    </div>
                    <a href={`${FILE_BASE_URL}${m.file_path}`} target="_blank" rel="noreferrer">
                      <button className="secondary" style={{ borderColor: 'var(--gold)', color: 'var(--navy)' }}>View</button>
                    </a>
                  </div>
                ))
              ) : (
                <p style={{ color: '#64748b', padding: 18 }}>No material uploaded by admin yet.</p>
              )}
            </div>
          </div>
        )}

        {tab === '1:1' && (
          <div style={{ paddingTop: 24, maxWidth: 640 }}>
            <h2 style={{ fontSize: 24 }}>Log a 1:1 lesson</h2>
            <form className="card" style={{ margin: '16px 0 0' }} onSubmit={saveLesson}>
              <label>Child</label>
              <select
                value={oneOnOne.child_id}
                onChange={(e) => setOneOnOne((f) => ({ ...f, child_id: e.target.value }))}
              >
                <option value="">Select a child...</option>
                {registrations.map((r) => (
                  <option key={r.child_id} value={r.child_id}>{r.child_name} — {r.category}</option>
                ))}
              </select>

              <label>Date</label>
              <input type="date" value={oneOnOne.date} onChange={(e) => setOneOnOne((f) => ({ ...f, date: e.target.value }))} />

              <div style={{ display: 'flex', gap: 14, marginTop: 0 }}>
                <div style={{ flex: 1 }}>
                  <label>Start</label>
                  <input type="time" value={oneOnOne.start} onChange={(e) => setOneOnOne((f) => ({ ...f, start: e.target.value }))} />
                </div>
                <div style={{ flex: 1 }}>
                  <label>End</label>
                  <input type="time" value={oneOnOne.end} onChange={(e) => setOneOnOne((f) => ({ ...f, end: e.target.value }))} />
                </div>
              </div>

              {durationLabel() && (
                <div style={{ background: 'var(--green-wash)', color: 'var(--green)', padding: '9px 13px', borderRadius: 10, fontSize: 13, marginTop: 12 }}>
                  Duration: {durationLabel()} — calculated for you
                </div>
              )}

              <label>What was covered</label>
              <textarea
                rows={4}
                placeholder="Summarise what the child worked on..."
                value={oneOnOne.notes}
                onChange={(e) => setOneOnOne((f) => ({ ...f, notes: e.target.value }))}
              />

              {oneOnOneMsg && <div className={oneOnOneMsg.startsWith('Lesson saved') ? 'badge' : 'error'} style={{ marginTop: 10 }}>{oneOnOneMsg}</div>}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
                <span style={{ fontSize: 12.5, color: 'var(--meta)' }}>Saves to parent portal</span>
                <button className="gold" type="submit">Save lesson</button>
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
    display: 'flex', justifyContent: 'space-around', borderBottom: '1px solid var(--line)',
    background: '#fff', margin: '-28px -40px 0', padding: '0 40px'
  },
  step: {
    padding: '16px 10px', cursor: 'pointer', fontSize: 15, borderBottom: '2.5px solid transparent'
  },
  rosterGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
    gap: 12
  },
  rosterCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 16px',
    border: '1.5px solid var(--line)',
    borderRadius: 12,
    cursor: 'pointer',
    background: '#fff'
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, border: '1.5px solid var(--line)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: 13, flexShrink: 0
  },
  footerBar: {
    position: 'sticky', bottom: 0, left: 0, right: 0,
    marginTop: 24, marginLeft: -40, marginRight: -40, padding: '16px 40px',
    background: '#fff', borderTop: '1px solid var(--line)', boxShadow: '0 -4px 16px rgba(22,36,61,.06)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
  },
  feedbackGrid: { display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, marginTop: 20, alignItems: 'flex-start' },
  studentRow: {
    padding: '12px 12px', borderRadius: 10, cursor: 'pointer', marginBottom: 6
  },
  dot: { width: 8, height: 8, borderRadius: '50%', marginTop: 4, flexShrink: 0 },
  pillRow: { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 },
  subjectPill: {
    padding: '9px 16px', borderRadius: 999, border: '1.5px solid var(--line)',
    cursor: 'pointer', fontSize: 13.5, fontWeight: 600
  },
  materialRow: { display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px' },
  pdfIcon: {
    width: 40, height: 40, borderRadius: 8, background: 'var(--navy)', color: 'var(--gold)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0
  }
};
