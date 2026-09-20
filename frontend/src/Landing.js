import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useIsMobile from './useIsMobile';

// Same navy/gold/cream system used across Parent, Teacher and Admin.
const NAVY = 'var(--navy, #16243D)';
const GOLD = 'var(--gold, #C9A227)';
const GOLD_SOFT = 'var(--gold-soft, #E8D9A8)';
const CREAM = 'var(--cream, #FAF6EE)';
const PAPER = 'var(--paper, #FFFFFF)';
const INK = 'var(--ink, #1D2433)';
const META = 'var(--meta, #66707F)';
const LINE = 'var(--line, #E6E1D5)';
const GREEN = 'var(--green, #2E7D5B)';
const RED = 'var(--red, #B4433A)';
const C = {
  primary: NAVY,
  primaryContainer: NAVY,
  onPrimary: '#ffffff',
  primaryFixed: GOLD_SOFT,
  onPrimaryFixed: NAVY,
  secondary: NAVY,
  secondaryFixed: GOLD_SOFT,
  onSecondaryFixed: NAVY,
  secondaryContainer: GOLD,
  onSecondaryContainer: NAVY,
  tertiary: GREEN,
  tertiaryFixed: GOLD_SOFT,
  onTertiaryFixed: NAVY,
  error: RED,
  surface: 'var(--canvas, #EEEAE0)',
  surfaceContainerLowest: PAPER,
  surfaceContainerLow: CREAM,
  surfaceContainer: CREAM,
  surfaceContainerHigh: LINE,
  onSurface: INK,
  onSurfaceVariant: META,
  outlineVariant: LINE,
  headlineFont: "'Lora', serif",
  bodyFont: "'Poppins', -apple-system, sans-serif"
};

// Matches the exact category taxonomy the rest of the app uses
// (AddChildModal.js) — a child's category gates which classes they can see,
// so this list must never drift from the real one.
const CATEGORIES = ['7+', '8+', '9+', '10+', '11+', '13+'];

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function Landing() {
  const navigate = useNavigate();
  const isMobile = useIsMobile(860);
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    childName: '', childDob: '', category: '', targetExam: '', allergies: '',
    agree: false
  });

  function update(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  function submitRegistration(e) {
    e.preventDefault();
    navigate('/register', {
      state: {
        name: form.name,
        email: form.email,
        password: form.password,
        child: {
          name: form.childName,
          dob: form.childDob,
          category: form.category,
          target_exam: form.targetExam,
          allergies: form.allergies
        }
      }
    });
  }

  return (
    <div style={{ fontFamily: C.bodyFont, color: C.onSurface, background: C.surface, minHeight: '100vh' }}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.brand}>
          <div style={styles.brandMark}>M</div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span style={{ fontFamily: C.headlineFont, fontWeight: 700, fontSize: 18, color: C.primary }}>My Exam Papers</span>
            <span style={{ fontSize: 10, letterSpacing: '.08em', color: C.secondary, textTransform: 'uppercase' }}>The School Specialist</span>
          </div>
        </div>

        {!isMobile && (
          <>
            <nav style={styles.headerNav}>
              <span onClick={() => scrollTo('parent-portal')} style={styles.navLink}>Parent Portal</span>
              <span onClick={() => scrollTo('teacher-portal')} style={styles.navLink}>Teacher Portal</span>
              <span onClick={() => scrollTo('admin-portal')} style={styles.navLink}>Admin Portal</span>
              <span onClick={() => scrollTo('system-overview')} style={styles.navLink}>System Overview</span>
            </nav>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => scrollTo('parent-signup')} style={styles.btnGhost}>Parent Self-Registration</button>
              <button onClick={() => navigate('/login')} style={styles.btnPrimary}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>lock</span> Portal Login
              </button>
            </div>
          </>
        )}

        {isMobile && (
          <button onClick={() => setMenuOpen((o) => !o)} style={styles.hamburgerBtn} aria-label="Open menu">
            <span style={styles.hamburgerBar} />
            <span style={styles.hamburgerBar} />
            <span style={styles.hamburgerBar} />
          </button>
        )}
      </header>

      {isMobile && menuOpen && (
        <div style={styles.mobileMenu}>
          <span onClick={() => { scrollTo('parent-portal'); setMenuOpen(false); }} style={styles.mobileNavLink}>Parent Portal</span>
          <span onClick={() => { scrollTo('teacher-portal'); setMenuOpen(false); }} style={styles.mobileNavLink}>Teacher Portal</span>
          <span onClick={() => { scrollTo('admin-portal'); setMenuOpen(false); }} style={styles.mobileNavLink}>Admin Portal</span>
          <span onClick={() => { scrollTo('system-overview'); setMenuOpen(false); }} style={styles.mobileNavLink}>System Overview</span>
          <button onClick={() => { scrollTo('parent-signup'); setMenuOpen(false); }} style={{ ...styles.btnGhost, width: '100%', justifyContent: 'center', marginTop: 10 }}>
            Parent Self-Registration
          </button>
          <button onClick={() => navigate('/login')} style={{ ...styles.btnPrimary, width: '100%', justifyContent: 'center', marginTop: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>lock</span> Portal Login
          </button>
        </div>
      )}

      <main>
        {/* Notification banner */}
        <div style={styles.banner}>
          <span style={styles.bannerPill}>Institutional Architecture</span>
          <span style={{ fontWeight: 600, fontSize: 13 }}>Strict operational workflows for UK Prep &amp; Grammar School entrance preparation (7+, 8+, 11+, 13+).</span>
          <span style={{ fontSize: 12, color: C.onSurfaceVariant }}>• Zero e-commerce or retail transactions</span>
        </div>

        {/* Hero */}
        <section id="system-overview" style={{ ...styles.section, paddingTop: 56, paddingBottom: 64, borderBottom: `1px solid ${C.surfaceContainer}` }}>
          <div style={{ ...styles.heroGrid, gridTemplateColumns: isMobile ? '1fr' : styles.heroGrid.gridTemplateColumns }}>
            <div>
              <div style={styles.kicker}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>account_tree</span>
                Three Dedicated Role-Governed Portals
              </div>
              <h1 style={{ fontFamily: C.headlineFont, fontSize: 42, fontWeight: 800, lineHeight: 1.15, margin: '0 0 18px', letterSpacing: '-.02em' }}>
                My Exam Papers <span style={{ color: C.primary }}>School Portal Ecosystem</span>
              </h1>
              <p style={{ fontSize: 16.5, color: C.onSurfaceVariant, maxWidth: 620, lineHeight: 1.6, marginBottom: 28 }}>
                An institutional, multi-tiered infrastructure purpose-built for British independent school entrance examinations. Each user role—Parent, Teacher, and Administrator—operates within dedicated views strictly governed by pupil examination categories.
              </p>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <button onClick={() => scrollTo('parent-signup')} style={{ ...styles.btnPrimary, padding: '13px 22px', fontSize: 14.5 }}>
                  Register as Parent <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_add</span>
                </button>
                <button onClick={() => scrollTo('portal-login')} style={{ ...styles.btnOutline, padding: '13px 22px', fontSize: 14.5 }}>
                  Access Portal <span className="material-symbols-outlined" style={{ fontSize: 18 }}>login</span>
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <PillarCard icon="family_restroom" bg={C.primaryFixed} fg={C.onPrimaryFixed} title="Parent Portal" tag="Self-Serve"
                desc="Direct signup, per-child profiles, category-filtered class bookings, and consolidated offline ledger statements." />
              <PillarCard icon="school" bg={C.secondaryFixed} fg={C.onSecondaryFixed} title="Teacher Portal" tag="Admin-Managed"
                desc="Admin-assigned masterclasses, live attendance marking, present-only feedback, and 1:1 pupil booking." />
              <PillarCard icon="admin_panel_settings" bg={C.tertiaryFixed} fg={C.onTertiaryFixed} title="Admin Portal" tag="Central Control"
                desc="Tutor assignment, curriculum upload, category visibility governance, and consolidated parent cash invoices." />
            </div>
          </div>
        </section>

        {/* Section A: Parent */}
        <section id="parent-portal" style={{ ...styles.section, paddingTop: 72, paddingBottom: 72 }}>
          <SectionHeader letter="A" color={C.primary} title="Parent Portal Architecture" />
          <p style={styles.sectionIntro}>
            Designed for absolute clarity and strict child management. Parents register themselves via self-service, add multiple child profiles, and navigate curriculum streams restricted strictly to each child's entrance tier.
          </p>

          <div style={styles.tripleGrid}>
            <SpecCard icon="how_to_reg" bg={C.primaryFixed} fg={C.primary} title="Self-Serve Registration"
              desc="Parents create an account independently. Instant access allows managing family profiles, onboarding children, and reviewing available course options without administrative delay." />
            <SpecCard icon="person_add" bg={C.primaryFixed} fg={C.primary} title="Child Profile Intake Modal"
              desc={`The "Add Child" popup strictly captures: Full Legal Name, Date of Birth, Target Exam Tier, Allergies/Special Notes, and Primary Category (7+, 8+, 11+, or 13+).`} />
            <SpecCard icon="security" bg={C.primaryFixed} fg={C.primary} title="Category-Driven Visibility"
              desc="Strict platform rule: A child assigned to the 7+ track can never view or enroll in 11+ or 13+ classes. System visibility filters class catalogs exclusively by the pupil's assigned tier." />
          </div>

          <div style={styles.panel}>
            <span style={styles.kickerSmall}>Child Profile Interface</span>
            <h3 style={styles.panelTitle}>4 Per-Child Dedicated Functional Tabs</h3>
            <p style={{ fontSize: 13, color: C.onSurfaceVariant, marginTop: 4, marginBottom: 20 }}>Every registered child in the parent dashboard has four dedicated isolated records:</p>
            <div style={styles.quadGrid}>
              <TabCard n={1} icon="calendar_today" color={C.primary} title="Upcoming Classes"
                desc="Lists scheduled masterclasses with direct options to register for additional sessions."
                note="Enforces strict 24-hr cancellation cutoff" noteIcon="info" noteColor={C.error} />
              <TabCard n={2} icon="history_edu" color={C.primary} title="Classes Attended"
                desc="Full chronological register of all completed lessons with confirmed teacher attendance stamps."
                note="Broadcast directly from teacher register" noteIcon="check_circle" noteColor={C.tertiary} />
              <TabCard n={3} icon="record_voice_over" color={C.primary} title="1:1 Classes"
                desc="Dedicated view for targeted one-on-one sessions created and scheduled directly by tutors."
                note="Personalized diagnostic agenda" noteIcon="tune" noteColor={C.secondary} />
              <TabCard n={4} icon="analytics" color={C.primary} title="Mock Exams"
                desc="Archived exam papers, examiner mark reports, rubric benchmarks, and developmental progress notes."
                note="Standardized cohort scoring" noteIcon="assignment_turned_in" noteColor={C.primary} />
            </div>
          </div>

          <div style={{ ...styles.panelLowest, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ ...styles.iconBox, background: C.surfaceContainer, color: C.primary, width: 48, height: 48 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 26 }}>receipt_long</span>
              </div>
              <div>
                <div style={{ fontFamily: C.headlineFont, fontWeight: 700, fontSize: 17 }}>Menu Navigation &amp; Invoices Ledger</div>
                <p style={{ fontSize: 13, color: C.onSurfaceVariant, maxWidth: 560, marginTop: 4 }}>
                  The parent navigation strictly consists of <strong>Main Dashboard</strong> and <strong>Invoices</strong>. The invoice screen is strictly an informational record/fee statement. The school operates on a cash-only basis; there is zero online payment processing or credit card gateway.
                </p>
              </div>
            </div>
            <span style={styles.footnotePill}>Cash-Only Record Ledger • No Payment Gateway</span>
          </div>
        </section>

        {/* Section B: Teacher */}
        <section id="teacher-portal" style={{ ...styles.section, paddingTop: 72, paddingBottom: 72, background: C.surfaceContainerLow, borderTop: `1px solid ${C.surfaceContainer}`, borderBottom: `1px solid ${C.surfaceContainer}` }}>
          <SectionHeader letter="B" color={C.secondary} title="Teacher Portal Architecture" />
          <p style={styles.sectionIntro}>
            An operational hub reserved exclusively for vetted prep school tutors and senior examiners. Teachers have no public signup; their profiles and teaching schedules are governed directly by Admin.
          </p>

          <div style={{ ...styles.tripleGrid, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', marginBottom: 24 }}>
            <SpecCard icon="admin_panel_settings" bg={C.secondaryFixed} fg={C.secondary} title="Managed Registration (Non-Self-Serve)"
              desc="Teachers cannot register themselves. Accounts are provisioned and credentialed directly by school administrators following enhanced DBS verification and admissions qualifications check." />
            <SpecCard icon="calendar_view_week" bg={C.secondaryFixed} fg={C.secondary} title="Assigned Class Dashboard"
              desc="The teacher dashboard immediately renders all masterclasses and schedules allocated to that instructor by Admin, organized by date, exam tier, and enrolled pupil rosters." />
          </div>

          <div style={styles.panelLowest}>
            <span style={{ ...styles.kickerSmall, color: C.secondary }}>Classroom Operations</span>
            <h3 style={styles.panelTitle}>Active Class Workspace &amp; Execution</h3>
            <p style={{ fontSize: 13, color: C.onSurfaceVariant, marginTop: 4, marginBottom: 20 }}>When opening an assigned class, the teacher accesses a comprehensive execution environment:</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <FeatureRow icon="format_list_bulleted" color={C.secondary} title="Registered Pupil Roster" desc="Instant listing of every student enrolled in the session, including medical notes and target grammar/prep school goals." />
              <FeatureRow icon="checklist" color={C.secondary} title="Attendance Register" desc="One-click interface to mark each pupil as Present or Absent. Attendance triggers the availability of feedback forms." />
              <FeatureRow icon="rate_review" color={C.secondary} title="Present-Only Feedback" desc="Pedagogical feedback inputs render strictly for students marked present, preventing erroneous evaluations for absent pupils." />
              <FeatureRow icon="folder_shared" color={C.secondary} title="Admin Material Tab" desc="Direct access to curriculum worksheets, past papers, mark schemes, and lesson decks uploaded by the school administrator." />
              <FeatureRow icon="broadcast_on_personal" color={C.secondary} title="'Complete Class' Action" desc="Concluding the class stamps sessions as attended, instantly broadcasting records to parent portals and admin invoicing." />
              <FeatureRow icon="person_pin" color={C.secondary} title="Teacher-Initiated 1:1 Booking" desc="Tutors can schedule targeted 1:1 sessions for a specific pupil, which automatically publishes into that child's 1:1 Classes tab." />
            </div>
            <div style={{ marginTop: 22, padding: 14, borderRadius: 12, background: C.surfaceContainer, display: 'flex', gap: 10, alignItems: 'center', border: `1px solid ${C.secondary}33` }}>
              <span className="material-symbols-outlined" style={{ color: C.secondary, fontSize: 22 }}>policy</span>
              <div style={{ fontSize: 13 }}>
                <strong>Strict 24-Hour Policy:</strong> Parents and teachers may cancel or adjust scheduled sessions only up to 24 hours prior to class start time. Late changes are locked to protect tutor commitments.
              </div>
            </div>
          </div>
        </section>

        {/* Section C: Admin */}
        <section id="admin-portal" style={{ ...styles.section, paddingTop: 72, paddingBottom: 72 }}>
          <SectionHeader letter="C" color={C.tertiary} title="Admin Portal & Governance" />
          <p style={styles.sectionIntro}>
            The central institutional cockpit. Administrators oversee tutor onboarding, course and timetable setup, strict category assignment rules, parent rosters, and consolidated offline cash accounting.
          </p>

          <div style={{ ...styles.tripleGrid, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            <SpecCard icon="badge" bg={C.tertiaryFixed} fg={C.tertiary} title="Tutor & Teacher Management"
              desc="Admin registers tutors, manages credential permissions, tracks pedagogical disciplines, and binds teachers to specific curriculum tiers." />
            <SpecCard icon="menu_book" bg={C.tertiaryFixed} fg={C.tertiary} title="Course & Class Setup"
              desc="Create parent Courses and schedule associated Classes with multi-select exam categories (7+, 8+, 11+, 13+), instructor assignments, and timetables." />
            <SpecCard icon="upload_file" bg={C.tertiaryFixed} fg={C.tertiary} title="Class Configuration & Materials"
              desc="Upload past examination papers, worksheets, and syllabus modules per class, instantly pushing materials to the assigned teacher's portal workspace." />
            <SpecCard icon="visibility_lock" bg={C.tertiaryFixed} fg={C.tertiary} title="Category Enforcement Engine"
              desc="Admin enforces system-wide rules ensuring pupil profiles only ever see classes matching their category tags, preserving age-appropriate test conditioning." />
            <SpecCard icon="contacts" bg={C.tertiaryFixed} fg={C.tertiary} title="Parent & Pupil Directory"
              desc="Comprehensive registry linking registered parents to their child profiles, historical attendance records, target school portfolios, and contact details." />
            <SpecCard icon="calculate" bg={C.tertiaryFixed} fg={C.tertiary} title="Consolidated Invoicing Protocol"
              desc="Select Parent → View all children → View attended classes → Generate ONE consolidated cash invoice per family. Strictly cash-only offline notification ledger." />
          </div>

          <div style={{ ...styles.panel, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20, marginTop: 8 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <span className="material-symbols-outlined" style={{ color: C.tertiary, fontSize: 30 }}>payments</span>
              <div>
                <div style={{ fontFamily: C.headlineFont, fontWeight: 700, fontSize: 16 }}>Institutional Cash-Only Ledger Protocol</div>
                <p style={{ fontSize: 12.5, color: C.onSurfaceVariant, marginTop: 2, maxWidth: 480 }}>Invoices aggregate completed attendances across all siblings into a single family notice. No automated card charges or payment gateway integration.</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, flexWrap: 'wrap' }}>
              <span>Select Parent</span>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: C.tertiary }}>arrow_forward</span>
              <span>Aggregate Children</span>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: C.tertiary }}>arrow_forward</span>
              <span>Single Consolidated PDF</span>
            </div>
          </div>
        </section>

        {/* Parent registration form */}
        <section id="parent-signup" style={{ padding: '72px 24px', background: C.surfaceContainerHigh }}>
          <div style={{ maxWidth: 860, margin: '0 auto', background: C.surfaceContainerLowest, borderRadius: 28, padding: '44px 40px', boxShadow: '0 10px 30px rgba(15,23,42,.08)', border: `1px solid ${C.surfaceContainer}` }}>
            <div style={{ textAlign: 'center', maxWidth: 480, margin: '0 auto 34px' }}>
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: C.primary }}>Direct Parent Access</span>
              <h2 style={{ fontFamily: C.headlineFont, fontSize: 26, fontWeight: 700, margin: '4px 0 8px' }}>Parent Self-Registration Intake</h2>
              <p style={{ fontSize: 13, color: C.onSurfaceVariant }}>
                Create your primary parent account to access the dashboard and register your child's examination category.
              </p>
            </div>

            <form onSubmit={submitRegistration} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              <div style={styles.formGrid}>
                <Field label="Parent / Guardian Full Name">
                  <input required value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g. Dr. Arthur Pendelton" style={styles.input} />
                </Field>
                <Field label="Parent Email Address (Login ID)">
                  <input required type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="parent@domain.co.uk" style={styles.input} />
                </Field>
              </div>
              <div style={styles.formGrid}>
                <Field label="Secure Password">
                  <input required type="password" value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="••••••••••••" style={styles.input} />
                </Field>
                <Field label="First Child's Full Name">
                  <input required value={form.childName} onChange={(e) => update('childName', e.target.value)} placeholder="e.g. George Pendelton" style={styles.input} />
                </Field>
              </div>
              <div style={styles.formGrid}>
                <Field label="Child's Date of Birth">
                  <input required type="date" value={form.childDob} onChange={(e) => update('childDob', e.target.value)} style={styles.input} />
                </Field>
                <Field label="Child's Category">
                  <select required value={form.category} onChange={(e) => update('category', e.target.value)} style={styles.input}>
                    <option value="">Select a category</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
              </div>
              <div style={styles.formGrid}>
                <Field label="Target Exam (optional)">
                  <input value={form.targetExam} onChange={(e) => update('targetExam', e.target.value)} placeholder="e.g. Westminster Under 7+" style={styles.input} />
                </Field>
                <Field label="Allergies (optional)">
                  <input value={form.allergies} onChange={(e) => update('allergies', e.target.value)} placeholder="e.g. Nuts, none" style={styles.input} />
                </Field>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, background: C.surfaceContainer, fontSize: 12.5, color: C.onSurfaceVariant, cursor: 'pointer' }}>
                <input required type="checkbox" checked={form.agree} onChange={(e) => update('agree', e.target.checked)} style={{ width: 18, height: 18, accentColor: C.primary }} />
                I acknowledge the category-locked curriculum rules, the 24-hour lesson cancellation policy, and cash-only fee settlement procedures.
              </label>
              <button type="submit" style={{ ...styles.btnPrimary, width: '100%', justifyContent: 'center', padding: '15px 0', fontSize: 15, borderRadius: 14 }}>
                Complete Parent Registration <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_forward</span>
              </button>
              <p style={{ fontSize: 11.5, color: C.onSurfaceVariant, textAlign: 'center', margin: 0 }}>
                You'll verify your email with a one-time code on the next step — {form.childName || 'your child'} is added to your dashboard automatically once verified.
              </p>
            </form>
          </div>
        </section>

        {/* Portal login gateway */}
        <section id="portal-login" style={{ padding: '64px 24px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: C.headlineFont, fontSize: 26, fontWeight: 700, margin: '0 0 8px' }}>Portal Access Gateway</h2>
          <p style={{ fontSize: 13, color: C.onSurfaceVariant, maxWidth: 480, margin: '0 auto 32px' }}>
            Select your authorized gateway below. Ensure you possess active credentials corresponding to your institutional role.
          </p>
          <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, textAlign: 'left' }}>
            <GatewayCard icon="family_restroom" bg={C.primaryFixed} fg={C.primary} title="Parent Portal"
              desc="Access enrolled child profiles, upcoming classes, and offline invoice statements."
              btnBg={C.primary} btnFg="#fff" btnLabel="Parent Sign In" onClick={() => navigate('/login')} />
            <GatewayCard icon="school" bg={C.secondaryFixed} fg={C.secondary} title="Teacher Portal"
              desc="Instructor credentials issued directly by Admin. View assigned classes and attendance registers."
              btnBg={C.secondary} btnFg="#fff" btnLabel="Teacher Sign In" onClick={() => navigate('/login')} />
            <GatewayCard icon="admin_panel_settings" bg={C.tertiaryFixed} fg={C.tertiary} title="Admin Portal"
              desc="Central administrative governance, tutor allocation, and consolidated cash invoicing."
              btnBg={C.surfaceContainer} btnFg={C.onSurface} btnLabel="Admin Sign In" onClick={() => navigate('/login')} />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ background: C.surfaceContainerLowest, borderTop: `1px solid ${C.surfaceContainer}`, padding: '40px 24px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32, paddingBottom: 32 }}>
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ fontFamily: C.headlineFont, fontWeight: 700, fontSize: 17, color: C.primary, marginBottom: 10 }}>My Exam Papers</div>
              <p style={{ fontSize: 13, color: C.onSurfaceVariant, maxWidth: 340, lineHeight: 1.6, marginBottom: 14 }}>
                The dedicated institutional portal infrastructure for independent prep and grammar school entrance examinations. Strictly informational role-based access for Parents, Teachers, and School Administrators.
              </p>
              <FooterContact icon="location_on" text="Kensington High Street, London W8 5SF" />
              <FooterContact icon="mail" text="portals@myexampapers.co.uk" />
              <FooterContact icon="call" text="+44 (0)20 7946 0832" />
            </div>
            <FooterCol title="Parent Portal" items={['Self-Serve Registration', 'Child Profile Setup', 'Upcoming & Attended Tabs', '1:1 Classes & Mocks', 'Cash Invoice Notices']} />
            <FooterCol title="Teacher Portal" items={['Admin-Assigned Classes', 'Live Student Rosters', 'Attendance & Feedback', 'Curriculum Worksheets', '1:1 Pupil Scheduling']} />
            <FooterCol title="Admin Governance" items={['Tutor Registration & Roles', 'Course & Class Creation', 'Category Multi-Select', 'Parent/Child Directory', 'Consolidated Invoicing']} />
          </div>
          <div style={{ background: C.surfaceContainerLow, borderRadius: 14, padding: '12px 18px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: C.onSurfaceVariant }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.tertiary }} />
              Strict 24-Hour Policy • Category-Enforced Visibility • Zero Online Payment Gateway
            </div>
            <div style={{ fontSize: 12, color: C.onSurfaceVariant }}>© 2026 My Exam Papers Ltd. Operational System Specification.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PillarCard({ icon, bg, fg, title, tag, desc }) {
  return (
    <div style={{ padding: 18, borderRadius: 16, background: C.surfaceContainerLowest, border: `1px solid ${C.surfaceContainerHigh}`, boxShadow: '0 1px 3px rgba(15,23,42,.05)', display: 'flex', gap: 14 }}>
      <div style={{ ...styles.iconBox, background: bg, color: fg, flexShrink: 0 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{icon}</span>
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <h2 style={{ fontFamily: C.headlineFont, fontSize: 15.5, fontWeight: 700, margin: 0 }}>{title}</h2>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 6, background: C.surfaceContainer, color: C.onSurface }}>{tag}</span>
        </div>
        <p style={{ fontSize: 12.5, color: C.onSurfaceVariant, marginTop: 4 }}>{desc}</p>
      </div>
    </div>
  );
}

function SectionHeader({ letter, color, title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <span style={{ width: 30, height: 30, borderRadius: 8, background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontFamily: C.headlineFont }}>{letter}</span>
      <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color }}>Specification Breakdown</span>
    </div>
  );
}

function SpecCard({ icon, bg, fg, title, desc }) {
  return (
    <div style={{ padding: 22, borderRadius: 18, background: C.surfaceContainerLowest, border: `1px solid ${C.surfaceContainerHigh}` }}>
      <div style={{ ...styles.iconBox, background: bg, color: fg, marginBottom: 14 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{icon}</span>
      </div>
      <h3 style={{ fontFamily: C.headlineFont, fontSize: 15.5, fontWeight: 700, margin: '0 0 6px' }}>{title}</h3>
      <p style={{ fontSize: 13, color: C.onSurfaceVariant, lineHeight: 1.55, margin: 0 }}>{desc}</p>
    </div>
  );
}

function TabCard({ n, icon, color, title, desc, note, noteIcon, noteColor }) {
  return (
    <div style={{ padding: 18, borderRadius: 14, background: C.surfaceContainerLowest, border: `1px solid ${C.surfaceContainer}`, boxShadow: '0 1px 3px rgba(15,23,42,.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ width: 26, height: 26, borderRadius: '50%', background: `${color}1a`, color, fontWeight: 700, fontSize: 12.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n}</span>
        <span className="material-symbols-outlined" style={{ color, fontSize: 20 }}>{icon}</span>
      </div>
      <div style={{ fontFamily: C.headlineFont, fontSize: 15.5, fontWeight: 700, marginBottom: 4 }}>{title}</div>
      <p style={{ fontSize: 12.5, color: C.onSurfaceVariant, marginBottom: 12 }}>{desc}</p>
      <div style={{ padding: 10, borderRadius: 10, background: C.surfaceContainer, fontSize: 11.5, fontWeight: 600, color: C.onSurfaceVariant, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 15, color: noteColor }}>{noteIcon}</span>
        {note}
      </div>
    </div>
  );
}

function FeatureRow({ icon, color, title, desc }) {
  return (
    <div style={{ padding: 18, borderRadius: 14, background: C.surfaceContainerLow, border: `1px solid ${C.surfaceContainer}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color, fontFamily: C.headlineFont, fontWeight: 700, fontSize: 14.5, marginBottom: 6 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 19 }}>{icon}</span> {title}
      </div>
      <p style={{ fontSize: 12.5, color: C.onSurfaceVariant, margin: 0 }}>{desc}</p>
    </div>
  );
}

function GatewayCard({ icon, bg, fg, title, desc, btnBg, btnFg, btnLabel, onClick }) {
  return (
    <div style={{ padding: 22, borderRadius: 18, background: C.surfaceContainerLowest, border: `1px solid ${C.surfaceContainerHigh}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <div style={{ ...styles.iconBox, background: bg, color: fg, marginBottom: 12 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{icon}</span>
        </div>
        <div style={{ fontFamily: C.headlineFont, fontSize: 15.5, fontWeight: 700, marginBottom: 4 }}>{title}</div>
        <p style={{ fontSize: 12.5, color: C.onSurfaceVariant, margin: 0 }}>{desc}</p>
      </div>
      <button onClick={onClick} style={{ marginTop: 20, width: '100%', padding: '11px 0', borderRadius: 10, border: 'none', background: btnBg, color: btnFg, fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}>
        {btnLabel}
      </button>
    </div>
  );
}

function FooterContact({ icon, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: C.onSurfaceVariant, marginBottom: 6 }}>
      <span className="material-symbols-outlined" style={{ fontSize: 16, color: C.primary }}>{icon}</span>
      {text}
    </div>
  );
}

function FooterCol({ title, items }) {
  return (
    <div>
      <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', margin: '0 0 12px' }}>{title}</h4>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
        {items.map((it) => (
          <li key={it} style={{ fontSize: 13, color: C.onSurfaceVariant }}>{it}</li>
        ))}
      </ul>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

const styles = {
  header: {
    position: 'sticky', top: 0, zIndex: 50, minHeight: 76, background: 'rgba(255,255,255,.95)', backdropFilter: 'blur(8px)',
    borderBottom: `1px solid ${C.surfaceContainerHigh}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 20px', gap: 12, boxSizing: 'border-box'
  },
  hamburgerBtn: {
    background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0
  },
  hamburgerBar: { width: 22, height: 2, background: C.primary, borderRadius: 2 },
  mobileMenu: {
    position: 'sticky', top: 76, zIndex: 49, background: '#fff', borderBottom: `1px solid ${C.surfaceContainerHigh}`,
    padding: '14px 20px 18px', display: 'flex', flexDirection: 'column', gap: 14
  },
  mobileNavLink: { fontSize: 15, fontWeight: 600, color: C.onSurface, cursor: 'pointer' },
  brand: { display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 },
  brandMark: {
    width: 36, height: 36, borderRadius: 10, background: C.primaryContainer, color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontFamily: C.headlineFont
  },
  headerNav: { display: 'flex', gap: 26 },
  navLink: { fontSize: 13.5, fontWeight: 600, color: C.onSurface, cursor: 'pointer' },
  btnGhost: {
    padding: '10px 16px', borderRadius: 10, border: `1px solid ${C.primary}33`, background: C.surfaceContainerLow,
    color: C.primary, fontWeight: 600, fontSize: 13, cursor: 'pointer'
  },
  btnPrimary: {
    padding: '10px 18px', borderRadius: 10, border: 'none', background: C.primary, color: '#fff',
    fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6
  },
  btnOutline: {
    padding: '10px 18px', borderRadius: 10, border: `1px solid ${C.outlineVariant}`, background: C.surfaceContainerLowest,
    color: C.onSurface, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6
  },
  banner: {
    background: C.surfaceContainerHigh, padding: '10px 24px', textAlign: 'center', display: 'flex',
    justifyContent: 'center', alignItems: 'center', gap: 10, flexWrap: 'wrap', borderBottom: `1px solid ${C.outlineVariant}4d`
  },
  bannerPill: {
    fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em',
    background: C.primaryFixed, color: C.onPrimaryFixed, padding: '3px 10px', borderRadius: 999
  },
  section: { maxWidth: 1200, margin: '0 auto', padding: '0 32px' },
  heroGrid: { display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(280px, 1fr)', gap: 48, alignItems: 'center' },
  kicker: {
    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderRadius: 999,
    background: C.surfaceContainer, color: C.primary, fontWeight: 700, fontSize: 12.5, marginBottom: 18, border: `1px solid ${C.primary}1a`
  },
  kickerSmall: { fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: C.primary },
  sectionIntro: { fontSize: 15.5, color: C.onSurfaceVariant, maxWidth: 720, lineHeight: 1.6, marginBottom: 36 },
  tripleGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18, marginBottom: 36 },
  quadGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 },
  panel: { padding: 30, borderRadius: 20, background: C.surfaceContainerLow, border: `1px solid ${C.surfaceContainerHigh}`, marginBottom: 24 },
  panelLowest: { padding: 30, borderRadius: 20, background: C.surfaceContainerLowest, border: `1px solid ${C.surfaceContainerHigh}` },
  panelTitle: { fontFamily: C.headlineFont, fontSize: 22, fontWeight: 700, margin: '2px 0 0' },
  footnotePill: {
    flexShrink: 0, padding: '7px 14px', borderRadius: 10, background: C.surfaceContainer, color: C.onSurfaceVariant,
    fontSize: 12, fontWeight: 600, border: `1px solid ${C.outlineVariant}4d`
  },
  iconBox: { width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 },
  input: {
    width: '100%', padding: '11px 14px', borderRadius: 10, border: `1px solid ${C.outlineVariant}99`,
    background: C.surface, fontSize: 13.5, fontFamily: C.bodyFont, boxSizing: 'border-box'
  }
};
