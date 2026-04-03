import { useState, useEffect, useRef } from "react";

// --- Arabic Month Names ---
const ARABIC_MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

const getCurrentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth()}`;
};

const getCurrentMonthName = () => ARABIC_MONTHS[new Date().getMonth()];

// --- Data Store (simulated backend) ---
const initialData = {
  performerMonth: getCurrentMonthName(),
  performerMonthKey: getCurrentMonthKey(),
  topPerformers: [
    { id: 1, name: "أحمد الغامدي", avatar: "أ", color: "#D4AF37", image: null, rank: 1 },
    { id: 2, name: "سارة القحطاني", avatar: "س", color: "#C0C0C0", image: null, rank: 2 },
    { id: 3, name: "خالد العمري", avatar: "خ", color: "#CD7F32", image: null, rank: 3 },
    { id: 4, name: "نورة الشهري", avatar: "ن", color: "#1E3A5F", image: null, rank: 4 },
  ],
  events: [
    { id: 1, title: "إطلاق الحملة الإعلانية الجديدة", date: "2026-04-01", desc: "تم إطلاق حملة 'مش مسؤول عن نجاحك' بنجاح على جميع المنصات الرقمية.", comments: [{ user: "محمد", text: "حملة رائعة! 🔥", time: "منذ ساعتين" }] },
    { id: 2, title: "ورشة عمل: استراتيجيات التسويق الرقمي", date: "2026-03-28", desc: "ورشة تدريبية مكثفة لفريق العمل حول أحدث أدوات التسويق الرقمي والذكاء الاصطناعي.", comments: [] },
    { id: 3, title: "تكريم فريق المبيعات - الربع الأول", date: "2026-03-25", desc: "حفل تكريم لأبطال المبيعات الذين تجاوزوا أهدافهم في الربع الأول من العام.", comments: [{ user: "سارة", text: "فخورة بالفريق 💪", time: "منذ يوم" }, { user: "أحمد", text: "إلى الأمام دائمًا!", time: "منذ يومين" }] },
  ],
  votes: [
    { id: 1, title: "أفضل مشروع للربع القادم", status: "active", options: [{ text: "تطوير التطبيق الداخلي", votes: 12 }, { text: "إطلاق منصة العملاء", votes: 18 }, { text: "برنامج التدريب المتقدم", votes: 9 }], totalVoters: 39 },
    { id: 2, title: "موعد الحفل السنوي", status: "active", options: [{ text: "يونيو 2026", votes: 22 }, { text: "يوليو 2026", votes: 15 }, { text: "أغسطس 2026", votes: 8 }], totalVoters: 45 },
    { id: 3, title: "أفضل موظف لشهر فبراير", status: "ended", options: [{ text: "أحمد الغامدي", votes: 35 }, { text: "سارة القحطاني", votes: 28 }, { text: "خالد العمري", votes: 17 }], totalVoters: 80 },
    { id: 4, title: "شعار الحملة الجديدة", status: "ended", options: [{ text: "\"نحن نصنع الفرق\"", votes: 45 }, { text: "\"مش مسؤول عن نجاحك\"", votes: 62 }, { text: "\"ابدأ من هنا\"", votes: 23 }], totalVoters: 130 },
  ],
};

// --- Reusable Components ---

const GoldIcon = ({ children, size = 20 }) => (
  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: size, height: size, color: "#D4AF37" }}>
    {children}
  </span>
);

const Badge = ({ rank }) => {
  const medals = { 1: "🥇", 2: "🥈", 3: "🥉" };
  if (medals[rank]) return <span className="text-2xl">{medals[rank]}</span>;
  return <span style={{ background: "rgba(212,175,55,0.15)", color: "#D4AF37", borderRadius: 999, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>#{rank}</span>;
};

// --- Main App ---
export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [data, setData] = useState(initialData);
  const [showVoting, setShowVoting] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [activeComments, setActiveComments] = useState(null);
  const [voteTab, setVoteTab] = useState("active");
  const [voted, setVoted] = useState({});
  const [votedLoading, setVotedLoading] = useState(true);
  const [voteMessage, setVoteMessage] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Admin credentials (in production, this would be server-side)
  const ADMIN_USERNAME = "admin";
  const ADMIN_PASSWORD = "mashmool2026";

  // Admin states
  const [adminTab, setAdminTab] = useState("performers");
  const [newPerformer, setNewPerformer] = useState({ name: "", image: null, rank: 1 });
  const [newEvent, setNewEvent] = useState({ title: "", desc: "" });
  const [newVote, setNewVote] = useState({ title: "", options: ["", ""] });

  // Load saved votes and admin session from persistent storage on mount
  useEffect(() => {
    setMounted(true);
    (() => {
      try {
        const result = (() => { const v = localStorage.getItem("voted-records"); return v ? { value: v } : null; })();
        if (result && result.value) {
          setVoted(JSON.parse(result.value));
        }
      } catch (e) {}
      try {
        const session = (() => { const v = localStorage.getItem("admin-session"); return v ? { value: v } : null; })();
        if (session && session.value === "authenticated") {
          setIsAdmin(true);
        }
      } catch (e) {}

      // Load saved performers and check month reset
      try {
        const saved = (() => { const v = localStorage.getItem("performers-data"); return v ? { value: v } : null; })();
        if (saved && saved.value) {
          const parsed = JSON.parse(saved.value);
          if (parsed.monthKey === getCurrentMonthKey()) {
            // Same month — restore saved data
            setData(d => ({
              ...d,
              topPerformers: parsed.performers,
              performerMonth: parsed.monthName,
              performerMonthKey: parsed.monthKey,
            }));
          } else {
            // New month — clear performers, update month
            const newMonth = getCurrentMonthName();
            const newKey = getCurrentMonthKey();
            setData(d => ({
              ...d,
              topPerformers: [],
              performerMonth: newMonth,
              performerMonthKey: newKey,
            }));
            localStorage.setItem("performers-data", JSON.stringify({
              performers: [],
              monthName: newMonth,
              monthKey: newKey,
            }));
          }
        }
      } catch (e) {}

      setVotedLoading(false);
    })();
  }, []);

  // Save performers data whenever it changes
  useEffect(() => {
    if (!mounted) return;
    (() => {
      try {
        localStorage.setItem("performers-data", JSON.stringify({
          performers: data.topPerformers,
          monthName: data.performerMonth,
          monthKey: data.performerMonthKey,
        }));
      } catch (e) {}
    })();
  }, [data.topPerformers, data.performerMonth, mounted]);

  // Save voted records to persistent storage whenever they change
  useEffect(() => {
    if (votedLoading) return;
    (() => {
      try {
        localStorage.setItem("voted-records", JSON.stringify(voted));
      } catch (e) {
        console.error("Failed to save vote records:", e);
      }
    })();
  }, [voted, votedLoading]);

  const handleLogin = () => {
    if (loginForm.username === ADMIN_USERNAME && loginForm.password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setLoginError("");
      setShowLoginModal(false);
      setShowAdmin(true);
      setLoginForm({ username: "", password: "" });
      try {
        localStorage.setItem("admin-session", "authenticated");
      } catch (e) {}
    } else {
      setLoginError("اسم المستخدم أو كلمة المرور غير صحيحة");
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setShowAdmin(false);
    try {
      localStorage.removeItem("admin-session");
    } catch (e) {}
  };

  const theme = darkMode
    ? { bg: "#0A0A0F", card: "#12121A", cardHover: "#1A1A25", text: "#E8E6E1", textMuted: "#8A8A9A", accent: "#D4AF37", accentDim: "rgba(212,175,55,0.12)", border: "rgba(212,175,55,0.08)", shadow: "0 8px 32px rgba(0,0,0,0.5)", navBg: "rgba(10,10,15,0.92)" }
    : { bg: "#F5F3EE", card: "#FFFFFF", cardHover: "#FAFAF7", text: "#1A1A2E", textMuted: "#6B6B7B", accent: "#B8941F", accentDim: "rgba(184,148,31,0.1)", border: "rgba(184,148,31,0.12)", shadow: "0 8px 32px rgba(0,0,0,0.08)", navBg: "rgba(245,243,238,0.92)" };

  const handleVote = (voteId, optIdx) => {
    if (voted[voteId] !== undefined) {
      setVoteMessage({ id: voteId, text: "لقد قمت بالتصويت مسبقًا على هذا الموضوع!" });
      setTimeout(() => setVoteMessage(null), 3000);
      return;
    }
    setVoted(v => ({ ...v, [voteId]: optIdx }));
    setData(d => ({
      ...d,
      votes: d.votes.map(v => v.id === voteId ? { ...v, options: v.options.map((o, i) => i === optIdx ? { ...o, votes: o.votes + 1 } : o), totalVoters: v.totalVoters + 1 } : v)
    }));
    setVoteMessage({ id: voteId, text: "تم تسجيل تصويتك بنجاح ✓" });
    setTimeout(() => setVoteMessage(null), 3000);
  };

  const addComment = (eventId) => {
    if (!newComment.trim()) return;
    setData(d => ({
      ...d,
      events: d.events.map(e => e.id === eventId ? { ...e, comments: [...e.comments, { user: "أنت", text: newComment, time: "الآن" }] } : e)
    }));
    setNewComment("");
  };

  const rankColors = { 1: "#D4AF37", 2: "#C0C0C0", 3: "#CD7F32" };

  const addPerformer = () => {
    if (!newPerformer.name) return;
    const r = parseInt(newPerformer.rank) || 1;
    const p = { id: Date.now(), name: newPerformer.name, avatar: newPerformer.name.charAt(0), color: rankColors[r] || "#1E3A5F", image: newPerformer.image, rank: r };
    setData(d => ({ ...d, topPerformers: [...d.topPerformers, p].sort((a, b) => a.rank - b.rank) }));
    setNewPerformer({ name: "", image: null, rank: r });
  };

  const updatePerformerRank = (id, newRank) => {
    setData(d => ({
      ...d,
      topPerformers: d.topPerformers.map(p => p.id === id ? { ...p, rank: newRank, color: rankColors[newRank] || "#1E3A5F" } : p).sort((a, b) => a.rank - b.rank),
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("حجم الصورة يجب أن يكون أقل من 2 ميجابايت");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setNewPerformer(p => ({ ...p, image: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const addEvent = () => {
    if (!newEvent.title) return;
    const ev = { id: Date.now(), title: newEvent.title, date: new Date().toISOString().split("T")[0], desc: newEvent.desc, comments: [] };
    setData(d => ({ ...d, events: [ev, ...d.events] }));
    setNewEvent({ title: "", desc: "" });
  };

  const addVoteItem = () => {
    const opts = newVote.options.filter(o => o.trim());
    if (!newVote.title || opts.length < 2) return;
    const v = { id: Date.now(), title: newVote.title, status: "active", options: opts.map(o => ({ text: o, votes: 0 })), totalVoters: 0 };
    setData(d => ({ ...d, votes: [v, ...d.votes] }));
    setNewVote({ title: "", options: ["", ""] });
  };

  const styles = {
    global: { fontFamily: "'Cairo', 'Tajawal', sans-serif", direction: "rtl", background: theme.bg, color: theme.text, minHeight: "100vh", transition: "background 0.4s, color 0.4s" },
    nav: { position: "sticky", top: 0, zIndex: 100, background: theme.navBg, backdropFilter: "blur(20px)", borderBottom: `1px solid ${theme.border}`, padding: "0 24px" },
    navInner: { maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 },
    logo: { fontSize: 22, fontWeight: 900, background: "linear-gradient(135deg, #D4AF37, #F5E6A3, #D4AF37)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.5px" },
    container: { maxWidth: 1200, margin: "0 auto", padding: "32px 24px" },
    card: { background: theme.card, borderRadius: 16, border: `1px solid ${theme.border}`, overflow: "hidden", transition: "all 0.3s" },
    sectionTitle: { fontSize: 20, fontWeight: 800, marginBottom: 24, display: "flex", alignItems: "center", gap: 10 },
    btn: { padding: "10px 20px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "'Cairo', sans-serif", fontWeight: 700, fontSize: 14, transition: "all 0.2s" },
    goldBtn: { background: "linear-gradient(135deg, #D4AF37, #C49B2A)", color: "#0A0A0F", boxShadow: "0 4px 16px rgba(212,175,55,0.3)" },
    ghostBtn: { background: "transparent", color: theme.accent, border: `1px solid ${theme.border}` },
    input: { width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, fontFamily: "'Cairo', sans-serif", fontSize: 14, outline: "none", boxSizing: "border-box" },
    overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 },
    modal: { background: theme.card, borderRadius: 20, border: `1px solid ${theme.border}`, maxWidth: 600, width: "100%", maxHeight: "85vh", overflow: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.4)" },
  };

  const fadeIn = (delay = 0) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0)" : "translateY(20px)",
    transition: `opacity 0.6s ${delay}s, transform 0.6s ${delay}s`,
  });

  return (
    <div style={styles.global}>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet" />

      {/* Navigation */}
      <nav style={styles.nav}>
        <div style={styles.navInner}>
          <div style={styles.logo}>وكالة مش مسؤول</div>

          {/* Desktop Nav */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }} className="hidden-mobile">
            <button onClick={() => setShowVoting(true)} style={{ ...styles.btn, ...styles.goldBtn }}>
              ⬡ التصويت
            </button>
            {isAdmin ? (
              <>
                <button onClick={() => setShowAdmin(true)} style={{ ...styles.btn, ...styles.ghostBtn }}>
                  ⚙ لوحة التحكم
                </button>
                <button onClick={handleLogout} style={{ ...styles.btn, ...styles.ghostBtn, color: "#e74c3c", borderColor: "rgba(231,76,60,0.3)" }}>
                  ↩ خروج
                </button>
              </>
            ) : (
              <button onClick={() => setShowLoginModal(true)} style={{ ...styles.btn, ...styles.ghostBtn }}>
                🔒 دخول المدير
              </button>
            )}
            <button onClick={() => setDarkMode(!darkMode)} style={{ ...styles.btn, ...styles.ghostBtn, padding: "10px 14px" }}>
              {darkMode ? "☀" : "☾"}
            </button>
          </div>

          {/* Mobile Hamburger */}
          <button onClick={() => setMobileMenu(!mobileMenu)} style={{ ...styles.btn, ...styles.ghostBtn, padding: "8px 12px", display: "none" }} className="show-mobile">
            ☰
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenu && (
          <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 8 }} className="show-mobile-flex">
            <button onClick={() => { setShowVoting(true); setMobileMenu(false); }} style={{ ...styles.btn, ...styles.goldBtn, width: "100%" }}>⬡ التصويت</button>
            {isAdmin ? (
              <>
                <button onClick={() => { setShowAdmin(true); setMobileMenu(false); }} style={{ ...styles.btn, ...styles.ghostBtn, width: "100%" }}>⚙ لوحة التحكم</button>
                <button onClick={() => { handleLogout(); setMobileMenu(false); }} style={{ ...styles.btn, ...styles.ghostBtn, width: "100%", color: "#e74c3c" }}>↩ خروج</button>
              </>
            ) : (
              <button onClick={() => { setShowLoginModal(true); setMobileMenu(false); }} style={{ ...styles.btn, ...styles.ghostBtn, width: "100%" }}>🔒 دخول المدير</button>
            )}
            <button onClick={() => { setDarkMode(!darkMode); setMobileMenu(false); }} style={{ ...styles.btn, ...styles.ghostBtn, width: "100%" }}>{darkMode ? "☀ الوضع الفاتح" : "☾ الوضع الداكن"}</button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <div style={{ ...fadeIn(0.1), textAlign: "center", padding: "60px 24px 20px", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 400, height: 400, background: "radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
        <h1 style={{ fontSize: "clamp(32px, 6vw, 56px)", fontWeight: 900, margin: 0, lineHeight: 1.2 }}>
          <span style={{ background: "linear-gradient(135deg, #D4AF37, #F5E6A3, #D4AF37)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>وكالة مش مسؤول</span>
        </h1>
        <p style={{ color: theme.textMuted, fontSize: 18, marginTop: 12, fontWeight: 600 }}>Mash Mas'ool Agency — نصنع الفرق</p>
      </div>

      <div style={styles.container}>

        {/* === TOP PERFORMERS === */}
        <section style={{ ...fadeIn(0.2), marginBottom: 48 }}>
          <div style={styles.sectionTitle}>
            <span style={{ fontSize: 24 }}>🏆</span>
            <span>لوحة الشرف — أبطال شهر {data.performerMonth}</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            {data.topPerformers.length === 0 && (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px 20px", color: theme.textMuted }}>
                <span style={{ fontSize: 40, display: "block", marginBottom: 12 }}>🏅</span>
                <p style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>لم يتم إضافة أبطال لشهر {data.performerMonth} بعد</p>
                <p style={{ fontSize: 13, margin: 0 }}>سيتم تحديث القائمة من قبل المدير</p>
              </div>
            )}
            {data.topPerformers.map((p, i) => (
              <div key={p.id} style={{
                ...styles.card,
                padding: 24,
                textAlign: "center",
                position: "relative",
                overflow: "visible",
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(30px)",
                transition: `all 0.5s ${0.3 + i * 0.1}s`,
              }}>
                {p.rank === 1 && <div style={{ position: "absolute", top: -2, left: -2, right: -2, bottom: -2, borderRadius: 18, background: "linear-gradient(135deg, #D4AF37, #F5E6A3, #D4AF37)", zIndex: -1, opacity: 0.4 }} />}
                <div style={{ position: "absolute", top: 12, left: 12 }}>
                  <Badge rank={p.rank} />
                </div>
                <div style={{
                  width: 72, height: 72, borderRadius: "50%", margin: "0 auto 12px",
                  background: p.image ? "none" : `linear-gradient(135deg, ${p.color}, ${p.color}88)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 28, fontWeight: 900, color: "#fff",
                  boxShadow: p.rank === 1 ? "0 0 24px rgba(212,175,55,0.4)" : "none",
                  overflow: "hidden", border: p.image ? `3px solid ${p.rank === 1 ? "#D4AF37" : theme.border}` : "none",
                }}>
                  {p.image ? (
                    <img src={p.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    p.avatar
                  )}
                </div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>{p.name}</h3>
              </div>
            ))}
          </div>
        </section>

        {/* === LATEST EVENTS === */}
        <section style={{ ...fadeIn(0.4), marginBottom: 48 }}>
          <div style={styles.sectionTitle}>
            <span style={{ fontSize: 24 }}>📢</span>
            <span>آخر الأحداث</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {data.events.map((ev, i) => (
              <div key={ev.id} style={{
                ...styles.card, padding: 24,
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateX(0)" : "translateX(30px)",
                transition: `all 0.5s ${0.5 + i * 0.1}s`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <h3 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 800 }}>{ev.title}</h3>
                    <p style={{ margin: "0 0 10px", fontSize: 14, color: theme.textMuted, lineHeight: 1.7 }}>{ev.desc}</p>
                    <span style={{ fontSize: 12, color: theme.textMuted, background: theme.accentDim, padding: "4px 12px", borderRadius: 20 }}>{ev.date}</span>
                  </div>
                  <button
                    onClick={() => setActiveComments(activeComments === ev.id ? null : ev.id)}
                    style={{ ...styles.btn, ...styles.ghostBtn, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
                  >
                    💬 {ev.comments.length}
                  </button>
                </div>

                {/* Comments Section */}
                {activeComments === ev.id && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${theme.border}` }}>
                    {ev.comments.length === 0 && (
                      <p style={{ fontSize: 13, color: theme.textMuted, textAlign: "center", padding: 12 }}>لا توجد تعليقات بعد. كن أول من يعلّق!</p>
                    )}
                    {ev.comments.map((c, ci) => (
                      <div key={ci} style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "flex-start" }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                          background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}88)`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 13, fontWeight: 800, color: "#0A0A0F",
                        }}>
                          {c.user.charAt(0)}
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 700 }}>{c.user}</span>
                            <span style={{ fontSize: 11, color: theme.textMuted }}>{c.time}</span>
                          </div>
                          <p style={{ margin: "2px 0 0", fontSize: 14, lineHeight: 1.6 }}>{c.text}</p>
                        </div>
                      </div>
                    ))}
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <input
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && addComment(ev.id)}
                        placeholder="أضف تعليقًا..."
                        style={{ ...styles.input, flex: 1 }}
                      />
                      <button onClick={() => addComment(ev.id)} style={{ ...styles.btn, ...styles.goldBtn, whiteSpace: "nowrap" }}>إرسال</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* === VOTING MODAL === */}
      {showVoting && (
        <div style={styles.overlay} onClick={() => setShowVoting(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "24px 28px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, display: "flex", alignItems: "center", gap: 8 }}>
                  <span>⬡</span> نظام التصويت
                </h2>
                <button onClick={() => setShowVoting(false)} style={{ ...styles.btn, ...styles.ghostBtn, padding: "6px 12px" }}>✕</button>
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", gap: 0, borderBottom: `2px solid ${theme.border}` }}>
                {[{ key: "active", label: "التصويتات القائمة" }, { key: "ended", label: "التصويتات المنتهية" }].map(t => (
                  <button key={t.key} onClick={() => setVoteTab(t.key)} style={{
                    ...styles.btn, background: "transparent", borderRadius: "10px 10px 0 0",
                    color: voteTab === t.key ? theme.accent : theme.textMuted,
                    borderBottom: voteTab === t.key ? `2px solid ${theme.accent}` : "2px solid transparent",
                    marginBottom: -2, fontWeight: 700, fontSize: 14,
                  }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ padding: "20px 28px 28px" }}>
              {data.votes.filter(v => v.status === voteTab).length === 0 && (
                <p style={{ textAlign: "center", color: theme.textMuted, padding: 32 }}>لا توجد تصويتات {voteTab === "active" ? "قائمة" : "منتهية"} حاليًا</p>
              )}
              {data.votes.filter(v => v.status === voteTab).map(v => {
                const hasVoted = voted[v.id] !== undefined;
                return (
                <div key={v.id} style={{ ...styles.card, padding: 20, marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{v.title}</h3>
                    {hasVoted && v.status === "active" && (
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                        background: "rgba(46,204,113,0.15)", color: "#2ecc71",
                        display: "flex", alignItems: "center", gap: 4,
                      }}>
                        ✓ تم التصويت
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {v.options.map((opt, oi) => {
                      const pct = v.totalVoters > 0 ? Math.round((opt.votes / v.totalVoters) * 100) : 0;
                      const isVoted = voted[v.id] === oi;
                      const canVote = v.status === "active" && !hasVoted;
                      const showResults = v.status === "ended" || hasVoted;

                      return (
                        <button
                          key={oi}
                          onClick={() => v.status === "active" && handleVote(v.id, oi)}
                          style={{
                            position: "relative", textAlign: "right", padding: "12px 16px",
                            borderRadius: 10, border: `1px solid ${isVoted ? theme.accent : theme.border}`,
                            background: theme.bg, cursor: canVote ? "pointer" : "default",
                            fontFamily: "'Cairo', sans-serif", fontSize: 14, fontWeight: 600,
                            color: theme.text, overflow: "hidden", transition: "all 0.2s",
                            opacity: hasVoted && !isVoted && v.status === "active" ? 0.7 : 1,
                          }}
                        >
                          {showResults && (
                            <div style={{
                              position: "absolute", top: 0, right: 0, bottom: 0,
                              width: `${pct}%`, background: isVoted ? "rgba(212,175,55,0.15)" : theme.accentDim,
                              transition: "width 0.8s ease-out", borderRadius: 10,
                            }} />
                          )}
                          <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              {isVoted && <span style={{ color: theme.accent }}>✓</span>}
                              <span>{opt.text}</span>
                            </div>
                            {showResults && <span style={{ fontWeight: 800, color: theme.accent }}>{pct}%</span>}
                            {canVote && <span style={{ fontSize: 12, color: theme.textMuted }}>اختر</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {/* Vote feedback message */}
                  {voteMessage && voteMessage.id === v.id && (
                    <div style={{
                      marginTop: 10, padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700, textAlign: "center",
                      background: voteMessage.text.includes("مسبقًا") ? "rgba(231,76,60,0.12)" : "rgba(46,204,113,0.12)",
                      color: voteMessage.text.includes("مسبقًا") ? "#e74c3c" : "#2ecc71",
                      animation: "fadeInMsg 0.3s ease-out",
                    }}>
                      {voteMessage.text}
                    </div>
                  )}
                  <p style={{ margin: "12px 0 0", fontSize: 12, color: theme.textMuted }}>إجمالي المصوتين: {v.totalVoters}</p>
                </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* === ADMIN PANEL MODAL === */}
      {showAdmin && (
        <div style={styles.overlay} onClick={() => setShowAdmin(false)}>
          <div style={{ ...styles.modal, maxWidth: 650 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "24px 28px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>⚙ لوحة التحكم</h2>
                <button onClick={() => setShowAdmin(false)} style={{ ...styles.btn, ...styles.ghostBtn, padding: "6px 12px" }}>✕</button>
              </div>

              <div style={{ display: "flex", gap: 0, borderBottom: `2px solid ${theme.border}`, flexWrap: "wrap" }}>
                {[{ key: "performers", label: "المتميزون" }, { key: "events", label: "الأحداث" }, { key: "votes", label: "التصويتات" }].map(t => (
                  <button key={t.key} onClick={() => setAdminTab(t.key)} style={{
                    ...styles.btn, background: "transparent", borderRadius: "10px 10px 0 0",
                    color: adminTab === t.key ? theme.accent : theme.textMuted,
                    borderBottom: adminTab === t.key ? `2px solid ${theme.accent}` : "2px solid transparent",
                    marginBottom: -2, fontWeight: 700, fontSize: 14,
                  }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ padding: "24px 28px 28px" }}>
              {/* Add Performer */}
              {adminTab === "performers" && (
                <div>
                  {/* Month Selector */}
                  <div style={{ marginBottom: 20, padding: 16, borderRadius: 12, background: theme.accentDim, border: `1px solid ${theme.border}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 700, color: theme.textMuted, display: "block", marginBottom: 6 }}>شهر التكريم</label>
                        <select
                          value={data.performerMonth}
                          onChange={e => setData(d => ({ ...d, performerMonth: e.target.value }))}
                          style={{ ...styles.input, width: "auto", minWidth: 140, cursor: "pointer" }}
                        >
                          {ARABIC_MONTHS.map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={() => { if (confirm("هل تريد مسح جميع المتميزين وبدء شهر جديد؟")) setData(d => ({ ...d, topPerformers: [], performerMonth: getCurrentMonthName(), performerMonthKey: getCurrentMonthKey() })); }}
                        style={{ ...styles.btn, ...styles.ghostBtn, fontSize: 12, color: "#f39c12", borderColor: "rgba(243,156,18,0.3)" }}
                      >
                        🔄 بدء شهر جديد (مسح الكل)
                      </button>
                    </div>
                  </div>

                  <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>إضافة متميز جديد</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                    {/* Image Upload */}
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{
                        width: 64, height: 64, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
                        background: newPerformer.image ? "none" : theme.accentDim,
                        border: `2px dashed ${newPerformer.image ? theme.accent : theme.border}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", transition: "all 0.2s",
                      }} onClick={() => document.getElementById("performer-img-input").click()}>
                        {newPerformer.image ? (
                          <img src={newPerformer.image} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <span style={{ fontSize: 24, color: theme.textMuted }}>📷</span>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <input
                          id="performer-img-input"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          style={{ display: "none" }}
                        />
                        <button onClick={() => document.getElementById("performer-img-input").click()} style={{ ...styles.btn, ...styles.ghostBtn, fontSize: 13, padding: "6px 14px" }}>
                          {newPerformer.image ? "تغيير الصورة" : "رفع صورة"}
                        </button>
                        {newPerformer.image && (
                          <button onClick={() => setNewPerformer(p => ({ ...p, image: null }))} style={{ ...styles.btn, background: "transparent", color: "#e74c3c", fontSize: 12, padding: "6px 10px", border: "none" }}>
                            إزالة
                          </button>
                        )}
                        <p style={{ margin: "4px 0 0", fontSize: 11, color: theme.textMuted }}>اختياري — PNG أو JPG (أقل من 2MB)</p>
                      </div>
                    </div>

                    <input value={newPerformer.name} onChange={e => setNewPerformer(p => ({ ...p, name: e.target.value }))} placeholder="الاسم الكامل" style={styles.input} />
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 700, color: theme.textMuted, display: "block", marginBottom: 6 }}>المرتبة</label>
                      <select
                        value={newPerformer.rank}
                        onChange={e => setNewPerformer(p => ({ ...p, rank: parseInt(e.target.value) }))}
                        style={{ ...styles.input, cursor: "pointer" }}
                      >
                        {[1,2,3,4,5,6,7,8,9,10].map(r => (
                          <option key={r} value={r}>المرتبة {r} {r === 1 ? "🥇" : r === 2 ? "🥈" : r === 3 ? "🥉" : ""}</option>
                        ))}
                      </select>
                    </div>
                    <button onClick={addPerformer} style={{ ...styles.btn, ...styles.goldBtn }}>+ إضافة</button>
                  </div>
                  <div style={{ marginTop: 20, borderTop: `1px solid ${theme.border}`, paddingTop: 16 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: theme.textMuted, marginBottom: 10 }}>القائمة الحالية</h4>
                    {data.topPerformers.map(p => (
                      <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${theme.border}`, flexWrap: "wrap", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <Badge rank={p.rank} />
                          <div style={{
                            width: 36, height: 36, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
                            background: p.image ? "none" : `linear-gradient(135deg, ${p.color}, ${p.color}88)`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 14, fontWeight: 800, color: "#fff",
                          }}>
                            {p.image ? (
                              <img src={p.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              p.avatar
                            )}
                          </div>
                          <span style={{ fontWeight: 700 }}>{p.name}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <select
                            value={p.rank}
                            onChange={e => updatePerformerRank(p.id, parseInt(e.target.value))}
                            style={{ ...styles.input, width: "auto", minWidth: 70, padding: "4px 8px", fontSize: 12, cursor: "pointer" }}
                          >
                            {[1,2,3,4,5,6,7,8,9,10].map(r => (
                              <option key={r} value={r}>#{r}</option>
                            ))}
                          </select>
                          <button onClick={() => setData(d => ({ ...d, topPerformers: d.topPerformers.filter(x => x.id !== p.id) }))} style={{ ...styles.btn, ...styles.ghostBtn, padding: "4px 10px", fontSize: 12, color: "#e74c3c" }}>حذف</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Event */}
              {adminTab === "events" && (
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>إضافة حدث جديد</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <input value={newEvent.title} onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))} placeholder="عنوان الحدث" style={styles.input} />
                    <textarea value={newEvent.desc} onChange={e => setNewEvent(p => ({ ...p, desc: e.target.value }))} placeholder="وصف الحدث..." rows={3} style={{ ...styles.input, resize: "vertical" }} />
                    <button onClick={addEvent} style={{ ...styles.btn, ...styles.goldBtn }}>+ إضافة حدث</button>
                  </div>
                </div>
              )}

              {/* Add Vote */}
              {adminTab === "votes" && (
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>إنشاء تصويت جديد</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <input value={newVote.title} onChange={e => setNewVote(p => ({ ...p, title: e.target.value }))} placeholder="عنوان التصويت" style={styles.input} />
                    {newVote.options.map((opt, i) => (
                      <div key={i} style={{ display: "flex", gap: 8 }}>
                        <input value={opt} onChange={e => { const o = [...newVote.options]; o[i] = e.target.value; setNewVote(p => ({ ...p, options: o })); }} placeholder={`الخيار ${i + 1}`} style={{ ...styles.input, flex: 1 }} />
                        {newVote.options.length > 2 && (
                          <button onClick={() => setNewVote(p => ({ ...p, options: p.options.filter((_, j) => j !== i) }))} style={{ ...styles.btn, ...styles.ghostBtn, padding: "8px 12px", color: "#e74c3c" }}>✕</button>
                        )}
                      </div>
                    ))}
                    <button onClick={() => setNewVote(p => ({ ...p, options: [...p.options, ""] }))} style={{ ...styles.btn, ...styles.ghostBtn, fontSize: 13 }}>+ إضافة خيار</button>
                    <button onClick={addVoteItem} style={{ ...styles.btn, ...styles.goldBtn }}>إنشاء التصويت</button>
                  </div>

                  {/* Existing Votes Management */}
                  <div style={{ marginTop: 24, borderTop: `1px solid ${theme.border}`, paddingTop: 16 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: theme.textMuted, marginBottom: 12 }}>إدارة التصويتات الحالية</h4>
                    {data.votes.length === 0 && <p style={{ fontSize: 13, color: theme.textMuted }}>لا توجد تصويتات</p>}
                    {data.votes.map(v => (
                      <div key={v.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${theme.border}`, flexWrap: "wrap", gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 150 }}>
                          <span style={{ fontWeight: 700, fontSize: 14 }}>{v.title}</span>
                          <span style={{
                            marginRight: 8, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                            background: v.status === "active" ? "rgba(46,204,113,0.15)" : "rgba(149,165,166,0.15)",
                            color: v.status === "active" ? "#2ecc71" : "#95a5a6",
                          }}>
                            {v.status === "active" ? "قائم" : "منتهي"}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          {v.status === "active" && (
                            <button onClick={() => setData(d => ({ ...d, votes: d.votes.map(x => x.id === v.id ? { ...x, status: "ended" } : x) }))} style={{ ...styles.btn, ...styles.ghostBtn, padding: "4px 12px", fontSize: 12, color: "#f39c12" }}>
                              إنهاء
                            </button>
                          )}
                          <button onClick={() => { if (confirm("هل أنت متأكد من حذف هذا التصويت؟")) setData(d => ({ ...d, votes: d.votes.filter(x => x.id !== v.id) })); }} style={{ ...styles.btn, ...styles.ghostBtn, padding: "4px 12px", fontSize: 12, color: "#e74c3c" }}>
                            حذف
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* === LOGIN MODAL === */}
      {showLoginModal && (
        <div style={styles.overlay} onClick={() => { setShowLoginModal(false); setLoginError(""); setLoginForm({ username: "", password: "" }); }}>
          <div style={{ ...styles.modal, maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: 32, textAlign: "center" }}>
              <div style={{
                width: 72, height: 72, borderRadius: "50%", margin: "0 auto 20px",
                background: "linear-gradient(135deg, #D4AF37, #C49B2A)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 32, boxShadow: "0 8px 24px rgba(212,175,55,0.3)",
              }}>
                🔒
              </div>
              <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 900 }}>دخول المدير</h2>
              <p style={{ margin: "0 0 24px", fontSize: 14, color: theme.textMuted }}>أدخل بيانات الاعتماد للوصول إلى لوحة التحكم</p>

              <div style={{ display: "flex", flexDirection: "column", gap: 14, textAlign: "right" }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: theme.textMuted, marginBottom: 6, display: "block" }}>اسم المستخدم</label>
                  <input
                    value={loginForm.username}
                    onChange={e => setLoginForm(f => ({ ...f, username: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && handleLogin()}
                    placeholder="أدخل اسم المستخدم"
                    style={styles.input}
                    autoFocus
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: theme.textMuted, marginBottom: 6, display: "block" }}>كلمة المرور</label>
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && handleLogin()}
                    placeholder="أدخل كلمة المرور"
                    style={styles.input}
                  />
                </div>

                {loginError && (
                  <div style={{
                    padding: "10px 14px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                    background: "rgba(231,76,60,0.12)", color: "#e74c3c", textAlign: "center",
                    animation: "fadeInMsg 0.3s ease-out",
                  }}>
                    {loginError}
                  </div>
                )}

                <button onClick={handleLogin} style={{ ...styles.btn, ...styles.goldBtn, width: "100%", padding: "12px 20px", fontSize: 16, marginTop: 4 }}>
                  تسجيل الدخول
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ textAlign: "center", padding: "32px 24px", borderTop: `1px solid ${theme.border}`, marginTop: 40 }}>
        <p style={{ margin: 0, fontSize: 13, color: theme.textMuted }}>
          © 2026 وكالة مش مسؤول — Mash Mas'ool Agency. جميع الحقوق محفوظة.
        </p>
      </footer>

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: block !important; }
          .show-mobile-flex { display: flex !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
          .show-mobile-flex { display: none !important; }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.3); border-radius: 3px; }
        input:focus, textarea:focus { border-color: #D4AF37 !important; box-shadow: 0 0 0 3px rgba(212,175,55,0.15); }
        @keyframes fadeInMsg { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
