import { useState, useEffect } from "react";
import { db } from "./firebase";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";

// المفاتيح التي سيتم مزامنتها مع السيرفر (البيانات العامة للجميع)
const CLOUD_KEYS = ["performers-data", "events-data", "votes-results", "users-data", "admin-credentials"];
// سجلات التصويت تُخزَّن لكل مستخدم بشكل منفصل بالصيغة: voted-{userId} أو voted-admin
const isCloudKey = (k) => CLOUD_KEYS.includes(k) || k.startsWith("voted-");

const storage = {
  get: async (k) => {
    if (isCloudKey(k)) {
      const snap = await getDoc(doc(db, "agency_data", k));
      return snap.exists() ? { value: snap.data().v } : null;
    }
    return { value: localStorage.getItem(k) };
  },
  set: async (k, v) => {
    if (isCloudKey(k)) {
      await setDoc(doc(db, "agency_data", k), { v });
    } else {
      localStorage.setItem(k, v);
    }
  },
  delete: (k) => {
    if (isCloudKey(k)) return deleteDoc(doc(db, "agency_data", k));
    localStorage.removeItem(k);
    return Promise.resolve();
  }
};

const ARABIC_MONTHS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const ENGLISH_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const T = {
  ar: {
    agencyName:"وكالة مش مسؤول", heroSubtitle:"Mash Mas'ool Agency — نصنع الفرق",
    voting:"⬡ التصويت", adminPanel:"⚙ لوحة التحكم", logout:"↩ خروج", adminLogin:"🔒 دخول المدير",
    lightMode:"☀ الوضع الفاتح", darkMode:"☾ الوضع الداكن", langToggle:"EN",
    honorBoard:"لوحة الشرف — أبطال شهر", noPerformersMsg:"لم يتم إضافة أبطال لشهر", noPerformersYet:"بعد",
    noPerformersNote:"سيتم تحديث القائمة من قبل المدير",
    latestEvents:"آخر الأحداث", noComments:"لا توجد تعليقات بعد. كن أول من يعلّق!", addCommentPh:"أضف تعليقًا...", send:"إرسال",
    votingSystem:"نظام التصويت", activeVotes:"التصويتات القائمة", endedVotes:"التصويتات المنتهية",
    noActiveVotes:"لا توجد تصويتات قائمة حاليًا", noEndedVotes:"لا توجد تصويتات منتهية حاليًا",
    votedBadge:"✓ تم التصويت", totalVoters:"إجمالي المصوتين:", choose:"اختر",
    alreadyVoted:"لقد قمت بالتصويت مسبقًا على هذا الموضوع!", voteSuccess:"تم تسجيل تصويتك بنجاح ✓",
    loginToVote:"🔒 سجّل دخولك للتصويت", notAllowedVote:"ليس لديك صلاحية رؤية هذا التصويت",
    adminPanelTitle:"⚙ لوحة التحكم", tabPerformers:"المتميزون", tabEvents:"الأحداث", tabVotes:"التصويتات", tabUsers:"المستخدمون",
    honorMonth:"شهر التكريم", newMonthBtn:"🔄 بدء شهر جديد (مسح الكل)", newMonthConfirm:"هل تريد مسح جميع المتميزين وبدء شهر جديد؟",
    addPerformerTitle:"إضافة متميز جديد", changePhoto:"تغيير الصورة", uploadPhoto:"رفع صورة", removePhoto:"إزالة",
    photoHint:"اختياري — PNG أو JPG (أقل من 2MB)", fullName:"الاسم الكامل", rankLabel:"المرتبة", addBtn:"+ إضافة", currentList:"القائمة الحالية",
    deleteBtn:"حذف", editBtn:"تعديل", editEventTitle:"تعديل الحدث", eventTitlePh:"عنوان الحدث",
    eventDescPh:"وصف الحدث...", saveEdit:"حفظ التعديل", cancelBtn:"إلغاء",
    addNewEvent:"إضافة حدث جديد", addEventBtn:"+ إضافة حدث", currentEvents:"الأحداث الحالية", noEvents:"لا توجد أحداث",
    deleteEventConfirm:"هل أنت متأكد من حذف هذا الحدث؟",
    newVoteTitle:"إنشاء تصويت جديد", voteTitlePh:"عنوان التصويت", optionPh:"الخيار",
    addOption:"+ إضافة خيار", createVoteBtn:"إنشاء التصويت", manageVotes:"إدارة التصويتات الحالية",
    noVotes:"لا توجد تصويتات", activeStatus:"قائم", endedStatus:"منتهي", endVoteBtn:"إنهاء",
    deleteVoteConfirm:"هل أنت متأكد من حذف هذا التصويت؟",
    voteVisibility:"صلاحية التصويت", visOpen:"مفتوح للجميع", visMembers:"للأعضاء المسجلين فقط", visSelected:"لأعضاء محددين",
    selectAllowedUsers:"اختر الأعضاء المسموح لهم:",
    adminLoginTitle:"دخول المدير", loginSubtitle:"أدخل بيانات الاعتماد للوصول إلى لوحة التحكم",
    usernameLabel:"اسم المستخدم", usernamePh:"أدخل اسم المستخدم",
    passwordLabel:"كلمة المرور", passwordPh:"أدخل كلمة المرور",
    loginBtn:"تسجيل الدخول", loginErrorMsg:"اسم المستخدم أو كلمة المرور غير صحيحة",
    footer:"© 2026 وكالة مش مسؤول — Mash Mas'ool Agency. جميع الحقوق محفوظة.",
    userLogin:"دخول العضو", register:"تسجيل حساب جديد", myAccount:"حسابي", userLogout:"↩ خروج",
    registerTitle:"إنشاء حساب جديد", registerName:"الاسم الكامل", registerUsername:"اسم المستخدم",
    registerPassword:"كلمة المرور", registerConfirm:"تأكيد كلمة المرور", registerBtn:"إنشاء الحساب",
    registerPending:"✓ تم إرسال طلبك! انتظر موافقة المدير لتفعيل حسابك.",
    profileTitle:"حسابي", changeName:"تغيير الاسم", changePassword:"تغيير كلمة المرور",
    currentPassword:"كلمة المرور الحالية", newPassword:"كلمة المرور الجديدة", confirmNewPassword:"تأكيد كلمة المرور الجديدة",
    saveChanges:"حفظ التغييرات", savedSuccess:"✓ تم الحفظ بنجاح",
    pendingUsers:"طلبات الانضمام المعلّقة", allUsers:"جميع المستخدمين", noUsers:"لا يوجد مستخدمون",
    noPending:"لا توجد طلبات معلّقة", approve:"قبول", reject:"رفض",
    changeAdminPassword:"تغيير كلمة مرور المدير",
    role:"الدور", roleAdmin:"مدير النظام", roleMember:"عضو", roleModerator:"مشرف",
    changeRole:"تغيير الدور",
    pendingApproval:"في انتظار الموافقة", accountPending:"حسابك قيد المراجعة من المدير.",
    editUser:"تعديل المستخدم", newName:"الاسم الجديد", newPasswordOptional:"كلمة المرور الجديدة (اختياري)",
  },
  en: {
    agencyName:"Mash Mas'ool Agency", heroSubtitle:"Mash Mas'ool Agency — We Make a Difference",
    voting:"⬡ Voting", adminPanel:"⚙ Admin Panel", logout:"↩ Logout", adminLogin:"🔒 Admin Login",
    lightMode:"☀ Light Mode", darkMode:"☾ Dark Mode", langToggle:"عربي",
    honorBoard:"Hall of Fame — Champions of", noPerformersMsg:"No champions added for", noPerformersYet:"yet",
    noPerformersNote:"The list will be updated by the admin",
    latestEvents:"Latest Events", noComments:"No comments yet. Be the first to comment!", addCommentPh:"Add a comment...", send:"Send",
    votingSystem:"Voting System", activeVotes:"Active Votes", endedVotes:"Ended Votes",
    noActiveVotes:"No active votes currently", noEndedVotes:"No ended votes currently",
    votedBadge:"✓ Voted", totalVoters:"Total voters:", choose:"Choose",
    alreadyVoted:"You have already voted on this topic!", voteSuccess:"Your vote has been registered ✓",
    loginToVote:"🔒 Login to vote", notAllowedVote:"You don't have permission to see this vote",
    adminPanelTitle:"⚙ Admin Panel", tabPerformers:"Performers", tabEvents:"Events", tabVotes:"Votes", tabUsers:"Users",
    honorMonth:"Honor Month", newMonthBtn:"🔄 New Month (Clear All)", newMonthConfirm:"Clear all performers and start a new month?",
    addPerformerTitle:"Add New Performer", changePhoto:"Change Photo", uploadPhoto:"Upload Photo", removePhoto:"Remove",
    photoHint:"Optional — PNG or JPG (less than 2MB)", fullName:"Full Name", rankLabel:"Rank", addBtn:"+ Add", currentList:"Current List",
    deleteBtn:"Delete", editBtn:"Edit", editEventTitle:"Edit Event", eventTitlePh:"Event Title",
    eventDescPh:"Event description...", saveEdit:"Save Changes", cancelBtn:"Cancel",
    addNewEvent:"Add New Event", addEventBtn:"+ Add Event", currentEvents:"Current Events", noEvents:"No events",
    deleteEventConfirm:"Are you sure you want to delete this event?",
    newVoteTitle:"Create New Vote", voteTitlePh:"Vote Title", optionPh:"Option",
    addOption:"+ Add Option", createVoteBtn:"Create Vote", manageVotes:"Manage Current Votes",
    noVotes:"No votes", activeStatus:"Active", endedStatus:"Ended", endVoteBtn:"End",
    deleteVoteConfirm:"Are you sure you want to delete this vote?",
    voteVisibility:"Vote Visibility", visOpen:"Open to everyone", visMembers:"Registered members only", visSelected:"Selected members only",
    selectAllowedUsers:"Select allowed members:",
    adminLoginTitle:"Admin Login", loginSubtitle:"Enter your credentials to access the admin panel",
    usernameLabel:"Username", usernamePh:"Enter username",
    passwordLabel:"Password", passwordPh:"Enter password",
    loginBtn:"Login", loginErrorMsg:"Incorrect username or password",
    footer:"© 2026 Mash Mas'ool Agency. All rights reserved.",
    userLogin:"Member Login", register:"Create Account", myAccount:"My Account", userLogout:"↩ Logout",
    registerTitle:"Create New Account", registerName:"Full Name", registerUsername:"Username",
    registerPassword:"Password", registerConfirm:"Confirm Password", registerBtn:"Create Account",
    registerPending:"✓ Request sent! Wait for admin approval to activate your account.",
    profileTitle:"My Account", changeName:"Change Name", changePassword:"Change Password",
    currentPassword:"Current Password", newPassword:"New Password", confirmNewPassword:"Confirm New Password",
    saveChanges:"Save Changes", savedSuccess:"✓ Saved successfully",
    pendingUsers:"Pending Join Requests", allUsers:"All Users", noUsers:"No users found",
    noPending:"No pending requests", approve:"Approve", reject:"Reject",
    changeAdminPassword:"Change Admin Password",
    role:"Role", roleAdmin:"System Admin", roleMember:"Member", roleModerator:"Moderator",
    changeRole:"Change Role",
    pendingApproval:"Pending Approval", accountPending:"Your account is under review by the admin.",
    editUser:"Edit User", newName:"New Name", newPasswordOptional:"New Password (optional)",
  },
};

const getCurrentMonthKey = () => { const now = new Date(); return `${now.getFullYear()}-${now.getMonth()}`; };
const getCurrentMonthName = () => ARABIC_MONTHS[new Date().getMonth()];

const initialData = {
  performerMonth: getCurrentMonthName(), performerMonthKey: getCurrentMonthKey(),
  topPerformers: [
    { id: 1, name: "أحمد الغامدي", avatar: "أ", color: "#D4AF37", image: null, rank: 1 },
    { id: 2, name: "سارة القحطاني", avatar: "س", color: "#C0C0C0", image: null, rank: 2 },
    { id: 3, name: "خالد العمري", avatar: "خ", color: "#CD7F32", image: null, rank: 3 },
    { id: 4, name: "نورة الشهري", avatar: "ن", color: "#1E3A5F", image: null, rank: 4 },
  ],
  events: [
    { id: 1, title: "إطلاق الحملة الإعلانية الجديدة", date: "2026-04-01", desc: "تم إطلاق حملة 'مش مسؤول عن نجاحك' بنجاح على جميع المنصات الرقمية.", comments: [{ user: "محمد", text: "حملة رائعة! 🔥", time: "منذ ساعتين" }] },
    { id: 2, title: "ورشة عمل: استراتيجيات التسويق الرقمي", date: "2026-03-28", desc: "ورشة تدريبية مكثفة لفريق العمل حول أحدث أدوات التسويق الرقمي والذكاء الاصطناعي.", comments: [] },
    { id: 3, title: "تكريم فريق المبيعات - الربع الأول", date: "2026-03-25", desc: "حفل تكريم لأبطال المبيعات الذين تجاوزوا أهدافهم في الربع الأول من العام.", comments: [{ user: "سارة", text: "فخورة بالفريق 💪", time: "منذ يوم" }] },
  ],
  votes: [
    { id: 1, title: "أفضل مشروع للربع القادم", status: "active", visibility: "open", allowedUsers: [], options: [{ text: "تطوير التطبيق الداخلي", votes: 12 }, { text: "إطلاق منصة العملاء", votes: 18 }, { text: "برنامج التدريب المتقدم", votes: 9 }], totalVoters: 39 },
    { id: 2, title: "موعد الحفل السنوي", status: "active", visibility: "members", allowedUsers: [], options: [{ text: "يونيو 2026", votes: 22 }, { text: "يوليو 2026", votes: 15 }, { text: "أغسطس 2026", votes: 8 }], totalVoters: 45 },
    { id: 3, title: "أفضل موظف لشهر فبراير", status: "ended", visibility: "open", allowedUsers: [], options: [{ text: "أحمد الغامدي", votes: 35 }, { text: "سارة القحطاني", votes: 28 }, { text: "خالد العمري", votes: 17 }], totalVoters: 80 },
    { id: 4, title: "شعار الحملة الجديدة", status: "ended", visibility: "open", allowedUsers: [], options: [{ text: "\"نحن نصنع الفرق\"", votes: 45 }, { text: "\"مش مسؤول عن نجاحك\"", votes: 62 }, { text: "\"ابدأ من هنا\"", votes: 23 }], totalVoters: 130 },
  ],
};

const Badge = ({ rank }) => {
  const medals = { 1: "🥇", 2: "🥈", 3: "🥉" };
  if (medals[rank]) return <span style={{ fontSize: 22 }}>{medals[rank]}</span>;
  return <span style={{ background: "rgba(212,175,55,0.15)", color: "#D4AF37", borderRadius: 999, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>#{rank}</span>;
};

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [lang, setLang] = useState("ar");
  const t = (key) => T[lang][key] || key;
  const dir = lang === "en" ? "ltr" : "rtl";

  const [data, setData] = useState(initialData);
  const [showVoting, setShowVoting] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCreds, setAdminCreds] = useState({ username: "admin", password: "mashmool2026" });
  const [showAdminChangePw, setShowAdminChangePw] = useState(false);
  const [adminPwForm, setAdminPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [adminPwError, setAdminPwError] = useState("");

  const [activeComments, setActiveComments] = useState(null);
  const [voteTab, setVoteTab] = useState("active");
  const [voted, setVoted] = useState({});
  const [votedLoading, setVotedLoading] = useState(true);
  const [voteMessage, setVoteMessage] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Admin panel state
  const [adminTab, setAdminTab] = useState("performers");
  const [newPerformer, setNewPerformer] = useState({ name: "", image: null, rank: 1 });
  const [newEvent, setNewEvent] = useState({ title: "", desc: "" });
  const [editingEvent, setEditingEvent] = useState(null);
  const [newVote, setNewVote] = useState({ title: "", options: ["", ""], visibility: "open", allowedUsers: [] });
  const [editingVoteVis, setEditingVoteVis] = useState(null); // voteId being edited for visibility

  // User system state
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [loginTab, setLoginTab] = useState("login"); // "login" | "register"
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [registerForm, setRegisterForm] = useState({ name: "", username: "", password: "", confirm: "" });
  const [registerError, setRegisterError] = useState("");
  const [registerDone, setRegisterDone] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", currentPw: "", newPw: "", confirmPw: "" });
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [editUserForm, setEditUserForm] = useState({ name: "", password: "", role: "member" });
  // Password visibility toggles
  const [showPw, setShowPw] = useState({ login: false, reg: false, regConfirm: false, profCur: false, profNew: false, profConfirm: false, admCur: false, admNew: false, admConfirm: false, editU: false });
  const togglePw = (key) => setShowPw(s => ({ ...s, [key]: !s[key] }));
  const eyeBtn = (key) => (<button type="button" onClick={() => togglePw(key)} style={{ position: "absolute", [dir === "rtl" ? "left" : "right"]: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: theme.textMuted, padding: 0 }}>{showPw[key] ? "🙈" : "👁"}</button>);
  const pwInput = (value, onChange, placeholder, pwKey, extra = {}) => (<div style={{ position: "relative" }}><input type={showPw[pwKey] ? "text" : "password"} value={value} onChange={onChange} placeholder={placeholder} style={{ ...S.input, paddingLeft: dir === "rtl" ? 36 : 14, paddingRight: dir === "rtl" ? 14 : 36 }} {...extra} />{eyeBtn(pwKey)}</div>);

  // ── Load ──
  useEffect(() => {
    setMounted(true);
    const load = async () => {
      try {
        const r2 = await storage.get("admin-session");
        const isAdminSession = r2?.value === "authenticated";
        if (isAdminSession) setIsAdmin(true);

        const r3 = await storage.get("lang-pref");
        if (r3?.value) setLang(r3.value);

        const r4 = await storage.get("performers-data");
        if (r4?.value) {
          const p = JSON.parse(r4.value);
          setData(d => ({
            ...d,
            topPerformers: p.performers || [],
            performerMonth: p.monthName || getCurrentMonthName(),
            performerMonthKey: p.monthKey || getCurrentMonthKey()
          }));
        }

        const r5 = await storage.get("users-data");
        const allUsers = r5?.value ? JSON.parse(r5.value) : [];
        setUsers(allUsers);

        const r6 = await storage.get("user-session");
        let sessionUserId = null;
        if (r6?.value) {
          const u = allUsers.find(u => String(u.id) === r6.value);
          if (u?.approved) { setCurrentUser(u); sessionUserId = u.id; }
        }

        const r7 = await storage.get("admin-credentials");
        if (r7?.value) setAdminCreds(JSON.parse(r7.value));

        // تحميل سجل تصويت المستخدم الحالي
        const votedKey = isAdminSession ? "voted-admin" : sessionUserId ? `voted-${sessionUserId}` : null;
        if (votedKey) {
          const rv2 = await storage.get(votedKey);
          if (rv2?.value) setVoted(JSON.parse(rv2.value));
        }
      } catch (e) { console.error(e); }

      const re = await storage.get("events-data");
      if (re?.value) setData(d => ({ ...d, events: JSON.parse(re.value) }));
      const rv = await storage.get("votes-results");
      if (rv?.value) setData(d => ({ ...d, votes: JSON.parse(rv.value) }));
      setVotedLoading(false);
    };
    load();
  }, []);

  // ── Save ──
  useEffect(() => {
    if (!mounted || votedLoading) return;
    storage.set("performers-data", JSON.stringify({ performers: data.topPerformers, monthName: data.performerMonth, monthKey: data.performerMonthKey }));
    storage.set("events-data", JSON.stringify(data.events));
    storage.set("votes-results", JSON.stringify(data.votes));
    storage.set("lang-pref", lang);
    storage.set("users-data", JSON.stringify(users));
  }, [data.topPerformers, data.events, data.votes, lang, users, mounted, votedLoading]);

  // ── Unified Auth ──
  const handleLogin = async () => {
    // Check admin first
    if (loginForm.username === adminCreds.username && loginForm.password === adminCreds.password) {
      setIsAdmin(true); setLoginError(""); setShowLogin(false); setShowAdmin(true);
      setLoginForm({ username: "", password: "" });
      await storage.set("admin-session", "authenticated");
      // تحميل سجل تصويت المدير
      const vr = await storage.get("voted-admin");
      setVoted(vr?.value ? JSON.parse(vr.value) : {});
      return;
    }
    // Check users (members + moderators)
    const u = users.find(u => u.username === loginForm.username && u.password === loginForm.password);
    if (!u) { setLoginError(t("loginErrorMsg")); return; }
    if (!u.approved) { setLoginError(lang === "ar" ? "حسابك لم يُفعَّل بعد. انتظر موافقة المدير." : "Account not activated yet. Awaiting admin approval."); return; }
    setCurrentUser(u); storage.set("user-session", String(u.id));
    setShowLogin(false); setLoginForm({ username: "", password: "" }); setLoginError("");
    // تحميل سجل تصويت المستخدم
    const vr = await storage.get(`voted-${u.id}`);
    setVoted(vr?.value ? JSON.parse(vr.value) : {});
    if (u.role === "moderator") setShowAdmin(true);
  };

  const handleLogout = async () => {
    if (isAdmin) { setIsAdmin(false); setShowAdmin(false); await storage.delete("admin-session"); }
    if (currentUser) { setCurrentUser(null); await storage.delete("user-session"); }
    setVoted({}); // مسح سجل التصويت عند الخروج
  };

  const handleAdminChangePw = () => {
    if (!adminPwForm.current || !adminPwForm.newPw || !adminPwForm.confirm) { setAdminPwError(lang === "ar" ? "يرجى ملء جميع الحقول" : "Fill all fields"); return; }
    if (adminPwForm.current !== adminCreds.password) { setAdminPwError(lang === "ar" ? "كلمة المرور الحالية غير صحيحة" : "Current password incorrect"); return; }
    if (adminPwForm.newPw !== adminPwForm.confirm) { setAdminPwError(lang === "ar" ? "كلمتا المرور غير متطابقتين" : "Passwords do not match"); return; }
    if (adminPwForm.newPw.length < 6) { setAdminPwError(lang === "ar" ? "6 أحرف على الأقل" : "Min 6 characters"); return; }
    const c = { ...adminCreds, password: adminPwForm.newPw };
    setAdminCreds(c); storage.set("admin-credentials", JSON.stringify(c));
    setAdminPwForm({ current: "", newPw: "", confirm: "" }); setAdminPwError(""); setShowAdminChangePw(false);
    alert(lang === "ar" ? "✓ تم تغيير كلمة المرور" : "✓ Password changed");
  };

  const handleRegister = () => {
    const { name, username, password, confirm } = registerForm;
    if (!name || !username || !password || !confirm) { setRegisterError(lang === "ar" ? "يرجى ملء جميع الحقول" : "Fill all fields"); return; }
    if (!/^\d+$/.test(username)) { setRegisterError(lang === "ar" ? "يجب أن يكون ID أكسينا لايف أرقاماً فقط" : "Axena Live ID must be numbers only"); return; }
    if (password !== confirm) { setRegisterError(lang === "ar" ? "كلمتا المرور غير متطابقتين" : "Passwords do not match"); return; }
    if (password.length < 6) { setRegisterError(lang === "ar" ? "6 أحرف على الأقل" : "Min 6 characters"); return; }
    if (users.find(u => u.username === username)) { setRegisterError(lang === "ar" ? "هذا الـ ID مسجّل بالفعل" : "This ID is already registered"); return; }
    setUsers(us => [...us, { id: Date.now(), username, password, name, role: "member", approved: false, createdAt: new Date().toISOString() }]);
    setRegisterDone(true); setRegisterError("");
  };

  const handleSaveProfile = () => {
    if (!profileForm.name) { setProfileError(lang === "ar" ? "الاسم مطلوب" : "Name required"); return; }
    if (profileForm.newPw) {
      if (!profileForm.currentPw) { setProfileError(lang === "ar" ? "أدخل كلمة المرور الحالية" : "Enter current password"); return; }
      if (profileForm.currentPw !== currentUser.password) { setProfileError(lang === "ar" ? "كلمة المرور الحالية غير صحيحة" : "Current password incorrect"); return; }
      if (profileForm.newPw !== profileForm.confirmPw) { setProfileError(lang === "ar" ? "كلمتا المرور غير متطابقتين" : "Passwords do not match"); return; }
      if (profileForm.newPw.length < 6) { setProfileError(lang === "ar" ? "6 أحرف على الأقل" : "Min 6 characters"); return; }
    }
    const updated = { ...currentUser, name: profileForm.name, ...(profileForm.newPw ? { password: profileForm.newPw } : {}) };
    setCurrentUser(updated); setUsers(us => us.map(u => u.id === currentUser.id ? updated : u));
    setProfileError(""); setProfileSuccess(t("savedSuccess")); setTimeout(() => setProfileSuccess(""), 3000);
  };

  // ── Admin User Mgmt ──
  const approveUser = (id) => setUsers(us => us.map(u => u.id === id ? { ...u, approved: true } : u));
  const rejectUser = (id) => { if (confirm(lang === "ar" ? "هل تريد رفض وحذف هذا الحساب؟" : "Reject and delete this account?")) setUsers(us => us.filter(u => u.id !== id)); };
  const deleteUser = (id) => { if (confirm(lang === "ar" ? "هل تريد حذف هذا المستخدم؟" : "Delete this user?")) { setUsers(us => us.filter(u => u.id !== id)); if (currentUser?.id === id) { setCurrentUser(null); storage.delete("user-session"); } } };
  const saveEditUser = () => {
    if (!editUserForm.name) return;
    const updated = (u) => ({ ...u, name: editUserForm.name, role: editUserForm.role, ...(editUserForm.password ? { password: editUserForm.password } : {}) });
    setUsers(us => us.map(u => u.id === editingUser ? updated(u) : u));
    if (currentUser?.id === editingUser) setCurrentUser(u => updated(u));
    setEditingUser(null); setEditUserForm({ name: "", password: "", role: "member" });
  };

  // ── Vote Logic ──
  const canSeeVote = (vote) => {
    const vis = vote.visibility || "open";
    if (isAdmin) return true;
    if (vis === "open") return true;
    if (vis === "members") return !!currentUser;
    if (vis === "selected") return !!(currentUser && vote.allowedUsers?.includes(currentUser.id));
    return false;
  };
  const canVoteOn = (vote) => (currentUser || isAdmin) && canSeeVote(vote);

  const handleVote = (voteId, optIdx) => {
    if (voted[voteId] !== undefined) { setVoteMessage({ id: voteId, text: t("alreadyVoted") }); setTimeout(() => setVoteMessage(null), 3000); return; }
    const newVoted = { ...voted, [voteId]: optIdx };
    setVoted(newVoted);
    // حفظ سجل التصويت لهذا المستخدم تحديداً في Firebase
    const votedKey = isAdmin ? "voted-admin" : `voted-${currentUser.id}`;
    storage.set(votedKey, JSON.stringify(newVoted));
    setData(d => ({ ...d, votes: d.votes.map(v => v.id === voteId ? { ...v, options: v.options.map((o, i) => i === optIdx ? { ...o, votes: o.votes + 1 } : o), totalVoters: v.totalVoters + 1 } : v) }));
    setVoteMessage({ id: voteId, text: t("voteSuccess") }); setTimeout(() => setVoteMessage(null), 3000);
  };

  const addComment = (eventId) => {
    if (!newComment.trim()) return;
    const username = isAdmin ? (lang === "ar" ? "المدير" : "Admin") : currentUser ? currentUser.name : (lang === "ar" ? "زائر" : "Guest");
    setData(d => ({ ...d, events: d.events.map(e => e.id === eventId ? { ...e, comments: [...e.comments, { user: username, text: newComment, time: lang === "ar" ? "الآن" : "Now" }] } : e) }));
    setNewComment("");
  };

  // ── Admin Performer Mgmt ──
  const rankColors = { 1: "#D4AF37", 2: "#C0C0C0", 3: "#CD7F32" };
  const addPerformer = () => {
    if (!newPerformer.name) return;
    const r = parseInt(newPerformer.rank) || 1;
    setData(d => ({ ...d, topPerformers: [...d.topPerformers, { id: Date.now(), name: newPerformer.name, avatar: newPerformer.name.charAt(0), color: rankColors[r] || "#1E3A5F", image: newPerformer.image, rank: r }].sort((a, b) => a.rank - b.rank) }));
    setNewPerformer({ name: "", image: null, rank: newPerformer.rank });
  };
  const updatePerformerRank = (id, r) => setData(d => ({ ...d, topPerformers: d.topPerformers.map(p => p.id === id ? { ...p, rank: r, color: rankColors[r] || "#1E3A5F" } : p).sort((a, b) => a.rank - b.rank) }));
  const handleImageUpload = (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert(lang === "ar" ? "حجم الصورة يجب أن يكون أقل من 2 ميجابايت" : "Image must be less than 2MB"); return; }
    const reader = new FileReader(); reader.onload = (ev) => setNewPerformer(p => ({ ...p, image: ev.target.result })); reader.readAsDataURL(file);
  };

  // ── Admin Event Mgmt ──
  const addEvent = () => {
    if (!newEvent.title) return;
    setData(d => ({ ...d, events: [{ id: Date.now(), title: newEvent.title, date: new Date().toISOString().split("T")[0], desc: newEvent.desc, comments: [] }, ...d.events] }));
    setNewEvent({ title: "", desc: "" });
  };
  const deleteEvent = (id) => { if (confirm(t("deleteEventConfirm"))) setData(d => ({ ...d, events: d.events.filter(e => e.id !== id) })); };
  const saveEditEvent = () => {
    if (!editingEvent?.title) return;
    setData(d => ({ ...d, events: d.events.map(e => e.id === editingEvent.id ? { ...e, title: editingEvent.title, desc: editingEvent.desc } : e) }));
    setEditingEvent(null);
  };

  // ── Admin Vote Mgmt ──
  const addVoteItem = () => {
    const opts = newVote.options.filter(o => o.trim());
    if (!newVote.title || opts.length < 2) return;
    setData(d => ({ ...d, votes: [{ id: Date.now(), title: newVote.title, status: "active", visibility: newVote.visibility, allowedUsers: newVote.allowedUsers, options: opts.map(o => ({ text: o, votes: 0 })), totalVoters: 0 }, ...d.votes] }));
    setNewVote({ title: "", options: ["", ""], visibility: "open", allowedUsers: [] });
  };
  const updateVoteVisibility = (voteId, vis, allowed) => {
    setData(d => ({ ...d, votes: d.votes.map(v => v.id === voteId ? { ...v, visibility: vis, allowedUsers: allowed } : v) }));
    setEditingVoteVis(null);
  };

  // ── Display helpers ──
  const getDisplayMonth = () => { const idx = ARABIC_MONTHS.indexOf(data.performerMonth); return lang === "en" && idx >= 0 ? ENGLISH_MONTHS[idx] : data.performerMonth; };

  // ── Theme & Styles ──
  const theme = darkMode
    ? { bg: "#0A0A0F", card: "#12121A", text: "#E8E6E1", textMuted: "#8A8A9A", accent: "#D4AF37", accentDim: "rgba(212,175,55,0.12)", border: "rgba(212,175,55,0.08)", navBg: "rgba(10,10,15,0.92)" }
    : { bg: "#F5F3EE", card: "#FFFFFF", text: "#1A1A2E", textMuted: "#6B6B7B", accent: "#B8941F", accentDim: "rgba(184,148,31,0.1)", border: "rgba(184,148,31,0.12)", navBg: "rgba(245,243,238,0.92)" };

  const S = {
    global: { fontFamily: "'Cairo','Tajawal',sans-serif", direction: dir, background: theme.bg, color: theme.text, minHeight: "100vh", transition: "background 0.4s,color 0.4s" },
    nav: { position: "sticky", top: 0, zIndex: 100, background: theme.navBg, backdropFilter: "blur(20px)", borderBottom: `1px solid ${theme.border}`, padding: "0 24px" },
    navInner: { maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 },
    logo: { fontSize: 20, fontWeight: 900, background: "linear-gradient(135deg,#D4AF37,#F5E6A3,#D4AF37)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
    container: { maxWidth: 1200, margin: "0 auto", padding: "32px 24px" },
    card: { background: theme.card, borderRadius: 16, border: `1px solid ${theme.border}`, overflow: "hidden", transition: "all 0.3s" },
    secTitle: { fontSize: 20, fontWeight: 800, marginBottom: 24, display: "flex", alignItems: "center", gap: 10 },
    btn: { padding: "9px 18px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "'Cairo',sans-serif", fontWeight: 700, fontSize: 13, transition: "all 0.2s" },
    gold: { background: "linear-gradient(135deg,#D4AF37,#C49B2A)", color: "#0A0A0F", boxShadow: "0 4px 16px rgba(212,175,55,0.3)" },
    ghost: { background: "transparent", color: theme.accent, border: `1px solid ${theme.border}` },
    input: { width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, fontFamily: "'Cairo',sans-serif", fontSize: 14, outline: "none", boxSizing: "border-box" },
    overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 },
    modal: { background: theme.card, borderRadius: 20, border: `1px solid ${theme.border}`, maxWidth: 620, width: "100%", maxHeight: "88vh", overflow: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.4)" },
  };
  const fade = (d = 0) => ({ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(20px)", transition: `opacity 0.6s ${d}s,transform 0.6s ${d}s` });

  const approvedUsers = users.filter(u => u.approved);
  const pendingUsers = users.filter(u => !u.approved);

  // ══════════════════════════════════════════
  return (
    <div style={S.global}>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet" />

      {/* ── NAV ── */}
      <nav style={S.nav}>
        <div style={S.navInner}>
          <div style={S.logo}>{t("agencyName")}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }} className="hidden-mobile">
            <button onClick={() => setShowVoting(true)} style={{ ...S.btn, ...S.gold }}>{t("voting")}</button>
            {/* Logged-in user/admin name */}
            {(currentUser || isAdmin) && (
              <span style={{ fontSize: 13, fontWeight: 700, color: theme.accent, padding: "0 4px" }}>
                👤 {isAdmin ? (lang === "ar" ? "المدير" : "Admin") : currentUser.name}
                {currentUser?.role === "moderator" && <span style={{ fontSize: 10, marginRight: 4, background: "rgba(52,152,219,0.2)", color: "#3498db", borderRadius: 99, padding: "1px 6px" }}>{t("roleModerator")}</span>}
              </span>
            )}
            {/* Profile button for regular users */}
            {currentUser && <button onClick={() => { setProfileForm({ name: currentUser.name, currentPw: "", newPw: "", confirmPw: "" }); setProfileError(""); setProfileSuccess(""); setShowProfile(true); }} style={{ ...S.btn, ...S.ghost, fontSize: 12 }}>{t("myAccount")}</button>}
            {/* Admin panel for admin + moderators */}
            {(isAdmin || currentUser?.role === "moderator") && (
              <button onClick={() => setShowAdmin(true)} style={{ ...S.btn, ...S.ghost, fontSize: 12 }}>
                {t("adminPanel")} {isAdmin && pendingUsers.length > 0 && <span style={{ background: "#e74c3c", color: "#fff", borderRadius: 99, padding: "1px 6px", fontSize: 10, marginRight: 4 }}>{pendingUsers.length}</span>}
              </button>
            )}
            {/* Single login/logout */}
            {(currentUser || isAdmin) ? (
              <button onClick={handleLogout} style={{ ...S.btn, ...S.ghost, color: "#e74c3c", borderColor: "rgba(231,76,60,0.3)", fontSize: 12 }}>{t("logout")}</button>
            ) : (
              <button onClick={() => { setShowLogin(true); setLoginTab("login"); setLoginError(""); setLoginForm({ username: "", password: "" }); }} style={{ ...S.btn, ...S.ghost, fontSize: 12 }}>🔑 {t("userLogin")}</button>
            )}
            <button onClick={() => setDarkMode(!darkMode)} style={{ ...S.btn, ...S.ghost, padding: "9px 12px" }}>{darkMode ? "☀" : "☾"}</button>
            <button onClick={() => setLang(l => l === "ar" ? "en" : "ar")} style={{ ...S.btn, ...S.ghost, padding: "7px 12px", fontWeight: 800, fontSize: 12 }}>🌐 {t("langToggle")}</button>
          </div>
          <button onClick={() => setMobileMenu(!mobileMenu)} style={{ ...S.btn, ...S.ghost, padding: "8px 12px", display: "none" }} className="show-mobile">☰</button>
        </div>
        {mobileMenu && (
          <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 8 }} className="show-mobile-flex">
            <button onClick={() => { setShowVoting(true); setMobileMenu(false); }} style={{ ...S.btn, ...S.gold, width: "100%" }}>{t("voting")}</button>
            {currentUser && <button onClick={() => { setProfileForm({ name: currentUser.name, currentPw: "", newPw: "", confirmPw: "" }); setShowProfile(true); setMobileMenu(false); }} style={{ ...S.btn, ...S.ghost, width: "100%" }}>{t("myAccount")}</button>}
            {(isAdmin || currentUser?.role === "moderator") && <button onClick={() => { setShowAdmin(true); setMobileMenu(false); }} style={{ ...S.btn, ...S.ghost, width: "100%" }}>{t("adminPanel")}</button>}
            {(currentUser || isAdmin) ? (
              <button onClick={() => { handleLogout(); setMobileMenu(false); }} style={{ ...S.btn, ...S.ghost, width: "100%", color: "#e74c3c" }}>{t("logout")}</button>
            ) : (
              <button onClick={() => { setShowLogin(true); setLoginTab("login"); setLoginError(""); setLoginForm({ username: "", password: "" }); setMobileMenu(false); }} style={{ ...S.btn, ...S.ghost, width: "100%" }}>🔑 {t("userLogin")}</button>
            )}
            <button onClick={() => { setDarkMode(!darkMode); setMobileMenu(false); }} style={{ ...S.btn, ...S.ghost, width: "100%" }}>{darkMode ? t("lightMode") : t("darkMode")}</button>
            <button onClick={() => { setLang(l => l === "ar" ? "en" : "ar"); setMobileMenu(false); }} style={{ ...S.btn, ...S.ghost, width: "100%", fontWeight: 800 }}>🌐 {t("langToggle")}</button>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <div style={{ ...fade(0.1), textAlign: "center", padding: "60px 24px 20px", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 400, height: 400, background: "radial-gradient(circle,rgba(212,175,55,0.08) 0%,transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
        <h1 style={{ fontSize: "clamp(28px,6vw,52px)", fontWeight: 900, margin: 0 }}>
          <span style={{ background: "linear-gradient(135deg,#D4AF37,#F5E6A3,#D4AF37)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{t("agencyName")}</span>
        </h1>
        <p style={{ color: theme.textMuted, fontSize: 17, marginTop: 10, fontWeight: 600 }}>{t("heroSubtitle")}</p>
      </div>

      <div style={S.container}>
        {/* ── PERFORMERS ── */}
        <section style={{ ...fade(0.2), marginBottom: 48 }}>
          <div style={S.secTitle}><span style={{ fontSize: 24 }}>🏆</span><span>{t("honorBoard")} {getDisplayMonth()}</span></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 16 }}>
            {data.topPerformers.length === 0 && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px 20px", color: theme.textMuted }}>
                <span style={{ fontSize: 40, display: "block", marginBottom: 12 }}>🏅</span>
                <p style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>{t("noPerformersMsg")} {getDisplayMonth()} {t("noPerformersYet")}</p>
                <p style={{ fontSize: 13, margin: 0 }}>{t("noPerformersNote")}</p>
              </div>
            )}
            {data.topPerformers.map((p, i) => (
              <div key={p.id} style={{ ...S.card, padding: 24, textAlign: "center", position: "relative", overflow: "visible", opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(30px)", transition: `all 0.5s ${0.3 + i * 0.1}s` }}>
                {p.rank === 1 && <div style={{ position: "absolute", top: -2, left: -2, right: -2, bottom: -2, borderRadius: 18, background: "linear-gradient(135deg,#D4AF37,#F5E6A3,#D4AF37)", zIndex: -1, opacity: 0.4 }} />}
                <div style={{ position: "absolute", top: 12, left: 12 }}><Badge rank={p.rank} /></div>
                <div style={{ width: 72, height: 72, borderRadius: "50%", margin: "0 auto 12px", background: p.image ? "none" : `linear-gradient(135deg,${p.color},${p.color}88)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 900, color: "#fff", boxShadow: p.rank === 1 ? "0 0 24px rgba(212,175,55,0.4)" : "none", overflow: "hidden", border: p.image ? `3px solid ${p.rank === 1 ? "#D4AF37" : theme.border}` : "none" }}>
                  {p.image ? <img src={p.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : p.avatar}
                </div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>{p.name}</h3>
              </div>
            ))}
          </div>
        </section>

        {/* ── EVENTS ── */}
        <section style={{ ...fade(0.4), marginBottom: 48 }}>
          <div style={S.secTitle}><span style={{ fontSize: 24 }}>📢</span><span>{t("latestEvents")}</span></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {data.events.map((ev, i) => (
              <div key={ev.id} style={{ ...S.card, padding: 24, opacity: mounted ? 1 : 0, transform: mounted ? "translateX(0)" : "translateX(30px)", transition: `all 0.5s ${0.5 + i * 0.1}s` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <h3 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 800 }}>{ev.title}</h3>
                    <p style={{ margin: "0 0 10px", fontSize: 14, color: theme.textMuted, lineHeight: 1.7 }}>{ev.desc}</p>
                    <span style={{ fontSize: 12, color: theme.textMuted, background: theme.accentDim, padding: "4px 12px", borderRadius: 20 }}>{ev.date}</span>
                  </div>
                  <button onClick={() => setActiveComments(activeComments === ev.id ? null : ev.id)} style={{ ...S.btn, ...S.ghost, fontSize: 13 }}>💬 {ev.comments.length}</button>
                </div>
                {activeComments === ev.id && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${theme.border}` }}>
                    {ev.comments.length === 0 && <p style={{ fontSize: 13, color: theme.textMuted, textAlign: "center", padding: 12 }}>{t("noComments")}</p>}
                    {ev.comments.map((c, ci) => (
                      <div key={ci} style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "flex-start" }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg,${theme.accent},${theme.accent}88)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#0A0A0F" }}>{c.user.charAt(0)}</div>
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
                      <input value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === "Enter" && addComment(ev.id)} placeholder={t("addCommentPh")} style={{ ...S.input, flex: 1 }} />
                      <button onClick={() => addComment(ev.id)} style={{ ...S.btn, ...S.gold, whiteSpace: "nowrap" }}>{t("send")}</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ══════════════ VOTING MODAL ══════════════ */}
      {showVoting && (
        <div style={S.overlay} onClick={() => setShowVoting(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "24px 28px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>⬡ {t("votingSystem")}</h2>
                <button onClick={() => setShowVoting(false)} style={{ ...S.btn, ...S.ghost, padding: "6px 12px" }}>✕</button>
              </div>
              <div style={{ display: "flex", gap: 0, borderBottom: `2px solid ${theme.border}` }}>
                {[{ key: "active", label: t("activeVotes") }, { key: "ended", label: t("endedVotes") }].map(tab => (
                  <button key={tab.key} onClick={() => setVoteTab(tab.key)} style={{ ...S.btn, background: "transparent", borderRadius: "10px 10px 0 0", color: voteTab === tab.key ? theme.accent : theme.textMuted, borderBottom: voteTab === tab.key ? `2px solid ${theme.accent}` : "2px solid transparent", marginBottom: -2, fontWeight: 700, fontSize: 14 }}>{tab.label}</button>
                ))}
              </div>
            </div>
            <div style={{ padding: "20px 28px 28px" }}>
              {data.votes.filter(v => v.status === voteTab && canSeeVote(v)).length === 0 && (
                <p style={{ textAlign: "center", color: theme.textMuted, padding: 32 }}>{voteTab === "active" ? t("noActiveVotes") : t("noEndedVotes")}</p>
              )}
              {data.votes.filter(v => v.status === voteTab && canSeeVote(v)).map(v => {
                const hasVoted = voted[v.id] !== undefined;
                const userCanVote = canVoteOn(v);
                return (
                  <div key={v.id} style={{ ...S.card, padding: 20, marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{v.title}</h3>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        {v.visibility !== "open" && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "rgba(52,152,219,0.15)", color: "#3498db", fontWeight: 700 }}>🔒</span>}
                        {hasVoted && v.status === "active" && <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "rgba(46,204,113,0.15)", color: "#2ecc71" }}>{t("votedBadge")}</span>}
                      </div>
                    </div>
                    {!userCanVote && v.status === "active" && !hasVoted ? (
                      <button onClick={() => { setShowVoting(false); setShowLogin(true); setLoginTab("login"); setLoginError(""); }} style={{ ...S.btn, ...S.ghost, width: "100%", marginBottom: 8 }}>{t("loginToVote")}</button>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {v.options.map((opt, oi) => {
                          const pct = v.totalVoters > 0 ? Math.round((opt.votes / v.totalVoters) * 100) : 0;
                          const isVoted = voted[v.id] === oi;
                          const showRes = v.status === "ended" || hasVoted;
                          return (
                            <button key={oi} onClick={() => userCanVote && v.status === "active" && handleVote(v.id, oi)} style={{ position: "relative", textAlign: dir === "rtl" ? "right" : "left", padding: "12px 16px", borderRadius: 10, border: `1px solid ${isVoted ? theme.accent : theme.border}`, background: theme.bg, cursor: (userCanVote && !hasVoted && v.status === "active") ? "pointer" : "default", fontFamily: "'Cairo',sans-serif", fontSize: 14, fontWeight: 600, color: theme.text, overflow: "hidden", transition: "all 0.2s", opacity: hasVoted && !isVoted && v.status === "active" ? 0.7 : 1 }}>
                              {showRes && <div style={{ position: "absolute", top: 0, [dir === "rtl" ? "right" : "left"]: 0, bottom: 0, width: `${pct}%`, background: isVoted ? "rgba(212,175,55,0.15)" : theme.accentDim, transition: "width 0.8s ease-out", borderRadius: 10 }} />}
                              <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  {isVoted && <span style={{ color: theme.accent }}>✓</span>}
                                  <span>{opt.text}</span>
                                </div>
                                {showRes && <span style={{ fontWeight: 800, color: theme.accent }}>{pct}%</span>}
                                {userCanVote && !hasVoted && v.status === "active" && <span style={{ fontSize: 12, color: theme.textMuted }}>{t("choose")}</span>}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {voteMessage?.id === v.id && (
                      <div style={{ marginTop: 10, padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700, textAlign: "center", background: voteMessage.text === t("alreadyVoted") ? "rgba(231,76,60,0.12)" : "rgba(46,204,113,0.12)", color: voteMessage.text === t("alreadyVoted") ? "#e74c3c" : "#2ecc71" }}>{voteMessage.text}</div>
                    )}
                    <p style={{ margin: "12px 0 0", fontSize: 12, color: theme.textMuted }}>{t("totalVoters")} {v.totalVoters}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ ADMIN PANEL ══════════════ */}
      {showAdmin && (
        <div style={S.overlay} onClick={() => setShowAdmin(false)}>
          <div style={{ ...S.modal, maxWidth: 680 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "24px 28px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>{t("adminPanelTitle")}</h2>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setShowAdminChangePw(true)} style={{ ...S.btn, ...S.ghost, fontSize: 11, padding: "6px 10px" }}>🔑 {t("changeAdminPassword")}</button>
                  <button onClick={() => setShowAdmin(false)} style={{ ...S.btn, ...S.ghost, padding: "6px 12px" }}>✕</button>
                </div>
              </div>
              <div style={{ display: "flex", gap: 0, borderBottom: `2px solid ${theme.border}`, flexWrap: "wrap" }}>
                {[{ key: "performers", label: t("tabPerformers") }, { key: "events", label: t("tabEvents") }, { key: "votes", label: t("tabVotes") }, { key: "users", label: <>{t("tabUsers")}{pendingUsers.length > 0 && <span style={{ background: "#e74c3c", color: "#fff", borderRadius: 99, padding: "1px 6px", fontSize: 10, marginRight: 4 }}>{pendingUsers.length}</span>}</> }].map(tab => (
                  <button key={tab.key} onClick={() => setAdminTab(tab.key)} style={{ ...S.btn, background: "transparent", borderRadius: "10px 10px 0 0", color: adminTab === tab.key ? theme.accent : theme.textMuted, borderBottom: adminTab === tab.key ? `2px solid ${theme.accent}` : "2px solid transparent", marginBottom: -2, fontWeight: 700, fontSize: 13 }}>{tab.label}</button>
                ))}
              </div>
            </div>
            <div style={{ padding: "24px 28px 28px" }}>

              {/* ── PERFORMERS TAB ── */}
              {adminTab === "performers" && (
                <div>
                  <div style={{ marginBottom: 20, padding: 16, borderRadius: 12, background: theme.accentDim, border: `1px solid ${theme.border}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 700, color: theme.textMuted, display: "block", marginBottom: 6 }}>{t("honorMonth")}</label>
                        <select value={data.performerMonth} onChange={e => setData(d => ({ ...d, performerMonth: e.target.value }))} style={{ ...S.input, width: "auto", minWidth: 140, cursor: "pointer" }}>
                          {ARABIC_MONTHS.map((m, idx) => <option key={m} value={m}>{lang === "en" ? ENGLISH_MONTHS[idx] : m}</option>)}
                        </select>
                      </div>
                      <button onClick={() => { if (confirm(t("newMonthConfirm"))) setData(d => ({ ...d, topPerformers: [], performerMonth: getCurrentMonthName(), performerMonthKey: getCurrentMonthKey() })); }} style={{ ...S.btn, ...S.ghost, fontSize: 12, color: "#f39c12", borderColor: "rgba(243,156,18,0.3)" }}>{t("newMonthBtn")}</button>
                    </div>
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>{t("addPerformerTitle")}</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ width: 56, height: 56, borderRadius: "50%", flexShrink: 0, overflow: "hidden", background: newPerformer.image ? "none" : theme.accentDim, border: `2px dashed ${newPerformer.image ? theme.accent : theme.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} onClick={() => document.getElementById("perf-img").click()}>
                        {newPerformer.image ? <img src={newPerformer.image} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 20, color: theme.textMuted }}>📷</span>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <input id="perf-img" type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
                        <button onClick={() => document.getElementById("perf-img").click()} style={{ ...S.btn, ...S.ghost, fontSize: 12, padding: "5px 12px" }}>{newPerformer.image ? t("changePhoto") : t("uploadPhoto")}</button>
                        {newPerformer.image && <button onClick={() => setNewPerformer(p => ({ ...p, image: null }))} style={{ ...S.btn, background: "transparent", color: "#e74c3c", fontSize: 12, padding: "5px 8px", border: "none" }}>{t("removePhoto")}</button>}
                        <p style={{ margin: "3px 0 0", fontSize: 11, color: theme.textMuted }}>{t("photoHint")}</p>
                      </div>
                    </div>
                    <input value={newPerformer.name} onChange={e => setNewPerformer(p => ({ ...p, name: e.target.value }))} placeholder={t("fullName")} style={S.input} />
                    <select value={newPerformer.rank} onChange={e => setNewPerformer(p => ({ ...p, rank: parseInt(e.target.value) }))} style={{ ...S.input, cursor: "pointer" }}>
                      {[1,2,3,4,5,6,7,8,9,10].map(r => <option key={r} value={r}>{t("rankLabel")} {r} {r===1?"🥇":r===2?"🥈":r===3?"🥉":""}</option>)}
                    </select>
                    <button onClick={addPerformer} style={{ ...S.btn, ...S.gold }}>{t("addBtn")}</button>
                  </div>
                  <div style={{ marginTop: 18, borderTop: `1px solid ${theme.border}`, paddingTop: 14 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: theme.textMuted, marginBottom: 10 }}>{t("currentList")}</h4>
                    {data.topPerformers.map(p => (
                      <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${theme.border}`, flexWrap: "wrap", gap: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Badge rank={p.rank} />
                          <div style={{ width: 32, height: 32, borderRadius: "50%", overflow: "hidden", background: p.image ? "none" : `linear-gradient(135deg,${p.color},${p.color}88)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff" }}>
                            {p.image ? <img src={p.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : p.avatar}
                          </div>
                          <span style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</span>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <select value={p.rank} onChange={e => updatePerformerRank(p.id, parseInt(e.target.value))} style={{ ...S.input, width: "auto", minWidth: 60, padding: "3px 6px", fontSize: 12, cursor: "pointer" }}>
                            {[1,2,3,4,5,6,7,8,9,10].map(r => <option key={r} value={r}>#{r}</option>)}
                          </select>
                          <button onClick={() => setData(d => ({ ...d, topPerformers: d.topPerformers.filter(x => x.id !== p.id) }))} style={{ ...S.btn, ...S.ghost, padding: "3px 10px", fontSize: 12, color: "#e74c3c" }}>{t("deleteBtn")}</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── EVENTS TAB ── */}
              {adminTab === "events" && (
                <div>
                  {editingEvent ? (
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>{t("editEventTitle")}</h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <input value={editingEvent.title} onChange={e => setEditingEvent(ev => ({ ...ev, title: e.target.value }))} placeholder={t("eventTitlePh")} style={S.input} />
                        <textarea value={editingEvent.desc} onChange={e => setEditingEvent(ev => ({ ...ev, desc: e.target.value }))} placeholder={t("eventDescPh")} rows={3} style={{ ...S.input, resize: "vertical" }} />
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={saveEditEvent} style={{ ...S.btn, ...S.gold, flex: 1 }}>{t("saveEdit")}</button>
                          <button onClick={() => setEditingEvent(null)} style={{ ...S.btn, ...S.ghost }}>{t("cancelBtn")}</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>{t("addNewEvent")}</h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <input value={newEvent.title} onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))} placeholder={t("eventTitlePh")} style={S.input} />
                        <textarea value={newEvent.desc} onChange={e => setNewEvent(p => ({ ...p, desc: e.target.value }))} placeholder={t("eventDescPh")} rows={3} style={{ ...S.input, resize: "vertical" }} />
                        <button onClick={addEvent} style={{ ...S.btn, ...S.gold }}>{t("addEventBtn")}</button>
                      </div>
                    </div>
                  )}
                  <div style={{ marginTop: 20, borderTop: `1px solid ${theme.border}`, paddingTop: 14 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: theme.textMuted, marginBottom: 10 }}>{t("currentEvents")}</h4>
                    {data.events.length === 0 && <p style={{ fontSize: 13, color: theme.textMuted }}>{t("noEvents")}</p>}
                    {data.events.map(ev => (
                      <div key={ev.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0", borderBottom: `1px solid ${theme.border}`, gap: 8, flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: 140 }}>
                          <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 13 }}>{ev.title}</p>
                          <span style={{ fontSize: 11, color: theme.textMuted }}>{ev.date}</span>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => setEditingEvent({ id: ev.id, title: ev.title, desc: ev.desc })} style={{ ...S.btn, ...S.ghost, padding: "3px 10px", fontSize: 12, color: theme.accent }}>{t("editBtn")}</button>
                          <button onClick={() => deleteEvent(ev.id)} style={{ ...S.btn, ...S.ghost, padding: "3px 10px", fontSize: 12, color: "#e74c3c" }}>{t("deleteBtn")}</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── VOTES TAB ── */}
              {adminTab === "votes" && (
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>{t("newVoteTitle")}</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <input value={newVote.title} onChange={e => setNewVote(p => ({ ...p, title: e.target.value }))} placeholder={t("voteTitlePh")} style={S.input} />
                    {newVote.options.map((opt, i) => (
                      <div key={i} style={{ display: "flex", gap: 8 }}>
                        <input value={opt} onChange={e => { const o = [...newVote.options]; o[i] = e.target.value; setNewVote(p => ({ ...p, options: o })); }} placeholder={`${t("optionPh")} ${i + 1}`} style={{ ...S.input, flex: 1 }} />
                        {newVote.options.length > 2 && <button onClick={() => setNewVote(p => ({ ...p, options: p.options.filter((_, j) => j !== i) }))} style={{ ...S.btn, ...S.ghost, padding: "8px 12px", color: "#e74c3c" }}>✕</button>}
                      </div>
                    ))}
                    <button onClick={() => setNewVote(p => ({ ...p, options: [...p.options, ""] }))} style={{ ...S.btn, ...S.ghost, fontSize: 13 }}>{t("addOption")}</button>
                    {/* Visibility selector */}
                    <div style={{ padding: 14, borderRadius: 10, background: theme.accentDim, border: `1px solid ${theme.border}` }}>
                      <label style={{ fontSize: 13, fontWeight: 700, color: theme.textMuted, display: "block", marginBottom: 8 }}>🔐 {t("voteVisibility")}</label>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: newVote.visibility === "selected" ? 10 : 0 }}>
                        {[["open", t("visOpen")], ["members", t("visMembers")], ["selected", t("visSelected")]].map(([val, label]) => (
                          <button key={val} onClick={() => setNewVote(p => ({ ...p, visibility: val, allowedUsers: [] }))} style={{ ...S.btn, background: newVote.visibility === val ? theme.accent : "transparent", color: newVote.visibility === val ? "#0A0A0F" : theme.textMuted, border: `1px solid ${newVote.visibility === val ? theme.accent : theme.border}`, padding: "6px 12px", fontSize: 12 }}>{label}</button>
                        ))}
                      </div>
                      {newVote.visibility === "selected" && approvedUsers.length > 0 && (
                        <div>
                          <p style={{ fontSize: 12, color: theme.textMuted, marginBottom: 6 }}>{t("selectAllowedUsers")}</p>
                          {approvedUsers.map(u => (
                            <label key={u.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", cursor: "pointer", fontSize: 13 }}>
                              <input type="checkbox" checked={newVote.allowedUsers.includes(u.id)} onChange={e => setNewVote(p => ({ ...p, allowedUsers: e.target.checked ? [...p.allowedUsers, u.id] : p.allowedUsers.filter(id => id !== u.id) }))} />
                              {u.name} <span style={{ color: theme.textMuted, fontSize: 11 }}>(@{u.username})</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    <button onClick={addVoteItem} style={{ ...S.btn, ...S.gold }}>{t("createVoteBtn")}</button>
                  </div>

                  <div style={{ marginTop: 20, borderTop: `1px solid ${theme.border}`, paddingTop: 14 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: theme.textMuted, marginBottom: 10 }}>{t("manageVotes")}</h4>
                    {data.votes.length === 0 && <p style={{ fontSize: 13, color: theme.textMuted }}>{t("noVotes")}</p>}
                    {data.votes.map(v => (
                      <div key={v.id} style={{ padding: "10px 0", borderBottom: `1px solid ${theme.border}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6, marginBottom: editingVoteVis === v.id ? 10 : 0 }}>
                          <div style={{ flex: 1, minWidth: 140 }}>
                            <span style={{ fontWeight: 700, fontSize: 13 }}>{v.title}</span>
                            <span style={{ marginRight: 8, marginLeft: 8, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: v.status === "active" ? "rgba(46,204,113,0.15)" : "rgba(149,165,166,0.15)", color: v.status === "active" ? "#2ecc71" : "#95a5a6" }}>{v.status === "active" ? t("activeStatus") : t("endedStatus")}</span>
                            <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 10, background: theme.accentDim, color: theme.textMuted }}>{v.visibility === "open" ? "🌐" : v.visibility === "members" ? "👥" : "🔒"}</span>
                          </div>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => setEditingVoteVis(editingVoteVis === v.id ? null : v.id)} style={{ ...S.btn, ...S.ghost, padding: "3px 10px", fontSize: 11, color: theme.accent }}>🔐</button>
                            {v.status === "active" && <button onClick={() => setData(d => ({ ...d, votes: d.votes.map(x => x.id === v.id ? { ...x, status: "ended" } : x) }))} style={{ ...S.btn, ...S.ghost, padding: "3px 10px", fontSize: 12, color: "#f39c12" }}>{t("endVoteBtn")}</button>}
                            <button onClick={() => { if (confirm(t("deleteVoteConfirm"))) setData(d => ({ ...d, votes: d.votes.filter(x => x.id !== v.id) })); }} style={{ ...S.btn, ...S.ghost, padding: "3px 10px", fontSize: 12, color: "#e74c3c" }}>{t("deleteBtn")}</button>
                          </div>
                        </div>
                        {editingVoteVis === v.id && (
                          <div style={{ padding: 12, borderRadius: 10, background: theme.accentDim, border: `1px solid ${theme.border}` }}>
                            <p style={{ fontSize: 12, fontWeight: 700, color: theme.textMuted, margin: "0 0 8px" }}>🔐 {t("voteVisibility")}</p>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                              {[["open", t("visOpen")], ["members", t("visMembers")], ["selected", t("visSelected")]].map(([val, label]) => (
                                <button key={val} onClick={() => { const upd = { ...v, visibility: val, allowedUsers: [] }; setData(d => ({ ...d, votes: d.votes.map(x => x.id === v.id ? upd : x) })); }} style={{ ...S.btn, background: v.visibility === val ? theme.accent : "transparent", color: v.visibility === val ? "#0A0A0F" : theme.textMuted, border: `1px solid ${v.visibility === val ? theme.accent : theme.border}`, padding: "4px 10px", fontSize: 11 }}>{label}</button>
                              ))}
                            </div>
                            {v.visibility === "selected" && approvedUsers.map(u => (
                              <label key={u.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0", cursor: "pointer", fontSize: 12 }}>
                                <input type="checkbox" checked={v.allowedUsers?.includes(u.id)} onChange={e => setData(d => ({ ...d, votes: d.votes.map(x => x.id === v.id ? { ...x, allowedUsers: e.target.checked ? [...(x.allowedUsers || []), u.id] : (x.allowedUsers || []).filter(id => id !== u.id) } : x) }))} />
                                {u.name} <span style={{ color: theme.textMuted }}>(@{u.username})</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── USERS TAB ── */}
              {adminTab === "users" && (
                <div>
                  {/* Pending */}
                  <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12, color: pendingUsers.length > 0 ? "#e74c3c" : theme.text }}>⏳ {t("pendingUsers")} {pendingUsers.length > 0 && `(${pendingUsers.length})`}</h3>
                  {pendingUsers.length === 0 ? <p style={{ fontSize: 13, color: theme.textMuted, marginBottom: 20 }}>{t("noPending")}</p> : pendingUsers.map(u => (
                    <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 10, background: "rgba(231,76,60,0.06)", border: "1px solid rgba(231,76,60,0.2)", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{u.name}</span>
                        <span style={{ color: theme.textMuted, fontSize: 12, marginRight: 8, marginLeft: 8 }}>@{u.username}</span>
                        <span style={{ fontSize: 11, color: theme.textMuted }}>{new Date(u.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => approveUser(u.id)} style={{ ...S.btn, background: "rgba(46,204,113,0.15)", color: "#2ecc71", border: "1px solid rgba(46,204,113,0.3)", padding: "4px 12px", fontSize: 12 }}>{t("approve")}</button>
                        <button onClick={() => rejectUser(u.id)} style={{ ...S.btn, ...S.ghost, padding: "4px 12px", fontSize: 12, color: "#e74c3c" }}>{t("reject")}</button>
                      </div>
                    </div>
                  ))}

                  <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 16, marginTop: 8 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>👥 {t("allUsers")}</h3>
                    {approvedUsers.length === 0 ? <p style={{ fontSize: 13, color: theme.textMuted }}>{t("noUsers")}</p> : approvedUsers.map(u => (
                      <div key={u.id} style={{ padding: "10px 0", borderBottom: `1px solid ${theme.border}` }}>
                        {editingUser === u.id ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <input value={editUserForm.name} onChange={e => setEditUserForm(f => ({ ...f, name: e.target.value }))} placeholder={t("newName")} style={S.input} />
                            {pwInput(editUserForm.password, e => setEditUserForm(f => ({ ...f, password: e.target.value })), t("newPasswordOptional"), "editU")}
                            <select value={editUserForm.role} onChange={e => setEditUserForm(f => ({ ...f, role: e.target.value }))} style={{ ...S.input, cursor: "pointer" }}>
                              <option value="member">{t("roleMember")}</option>
                              <option value="moderator">{t("roleModerator")}</option>
                            </select>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button onClick={() => saveEditUser()} style={{ ...S.btn, ...S.gold, flex: 1 }}>{t("saveChanges")}</button>
                              <button onClick={() => setEditingUser(null)} style={{ ...S.btn, ...S.ghost }}>{t("cancelBtn")}</button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                            <div>
                              <span style={{ fontWeight: 700, fontSize: 14 }}>{u.name}</span>
                              <span style={{ color: theme.textMuted, fontSize: 12, marginRight: 6, marginLeft: 6 }}>@{u.username}</span>
                              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: u.role === "moderator" ? "rgba(52,152,219,0.15)" : theme.accentDim, color: u.role === "moderator" ? "#3498db" : theme.textMuted }}>{u.role === "moderator" ? t("roleModerator") : t("roleMember")}</span>
                            </div>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button onClick={() => { setEditingUser(u.id); setEditUserForm({ name: u.name, password: "", role: u.role || "member" }); }} style={{ ...S.btn, ...S.ghost, padding: "3px 10px", fontSize: 12, color: theme.accent }}>{t("editBtn")}</button>
                              <button onClick={() => deleteUser(u.id)} style={{ ...S.btn, ...S.ghost, padding: "3px 10px", fontSize: 12, color: "#e74c3c" }}>{t("deleteBtn")}</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ LOGIN / REGISTER (UNIFIED) ══════════════ */}
      {showLogin && (
        <div style={S.overlay} onClick={() => { setShowLogin(false); setLoginError(""); setRegisterError(""); setRegisterDone(false); }}>
          <div style={{ ...S.modal, maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: 28 }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>
                  {loginTab === "login" ? "🔑 " + t("userLogin") : "📝 " + t("registerTitle")}
                </h2>
                <button onClick={() => { setShowLogin(false); setLoginError(""); setRegisterError(""); setRegisterDone(false); }} style={{ ...S.btn, ...S.ghost, padding: "6px 12px" }}>✕</button>
              </div>

              {/* Tab switcher */}
              <div style={{ display: "flex", borderBottom: `2px solid ${theme.border}`, marginBottom: 20 }}>
                {[["login", t("userLogin")], ["register", t("register")]].map(([key, label]) => (
                  <button key={key} onClick={() => { setLoginTab(key); setLoginError(""); setRegisterError(""); setRegisterDone(false); }} style={{ ...S.btn, background: "transparent", borderRadius: "8px 8px 0 0", color: loginTab === key ? theme.accent : theme.textMuted, borderBottom: loginTab === key ? `2px solid ${theme.accent}` : "2px solid transparent", marginBottom: -2, fontWeight: 700, fontSize: 13, flex: 1 }}>{label}</button>
                ))}
              </div>

              {/* ── LOGIN TAB ── */}
              {loginTab === "login" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <input value={loginForm.username} onChange={e => setLoginForm(f => ({ ...f, username: e.target.value }))} onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder={t("usernamePh")} style={S.input} autoFocus />
                  {pwInput(loginForm.password, e => setLoginForm(f => ({ ...f, password: e.target.value })), t("passwordPh"), "login", { onKeyDown: e => e.key === "Enter" && handleLogin() })}
                  {loginError && <div style={{ padding: "10px 14px", borderRadius: 10, fontSize: 13, fontWeight: 700, background: "rgba(231,76,60,0.12)", color: "#e74c3c", textAlign: "center" }}>{loginError}</div>}
                  <button onClick={handleLogin} style={{ ...S.btn, ...S.gold, width: "100%", padding: "12px 20px", fontSize: 15, marginTop: 4 }}>{t("loginBtn")}</button>
                  <p style={{ textAlign: "center", fontSize: 13, color: theme.textMuted, margin: "4px 0 0" }}>
                    {lang === "ar" ? "ليس لديك حساب؟" : "Don't have an account?"}{" "}
                    <span onClick={() => { setLoginTab("register"); setLoginError(""); setRegisterForm({ name: "", username: "", password: "", confirm: "" }); }} style={{ color: theme.accent, cursor: "pointer", fontWeight: 700 }}>{t("register")}</span>
                  </p>
                </div>
              )}

              {/* ── REGISTER TAB ── */}
              {loginTab === "register" && (
                registerDone ? (
                  <div style={{ textAlign: "center", padding: "20px 0" }}>
                    <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
                    <p style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.7, color: "#2ecc71" }}>{t("registerPending")}</p>
                    <button onClick={() => { setRegisterDone(false); setLoginTab("login"); }} style={{ ...S.btn, ...S.gold, marginTop: 16 }}>{t("userLogin")}</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <input value={registerForm.name} onChange={e => setRegisterForm(f => ({ ...f, name: e.target.value }))} placeholder={t("registerName")} style={S.input} autoFocus />
                    <div>
                      <input
                        value={registerForm.username}
                        onChange={e => setRegisterForm(f => ({ ...f, username: e.target.value.replace(/\D/g, "") }))}
                        placeholder={lang === "ar" ? "ID أكسينا لايف (أرقام فقط)" : "Axena Live ID (numbers only)"}
                        inputMode="numeric"
                        style={S.input}
                      />
                      <div style={{ marginTop: 6, padding: "8px 12px", borderRadius: 8, background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.25)", fontSize: 12, color: theme.textMuted, lineHeight: 1.6 }}>
                        ⚠️ {lang === "ar"
                          ? "يجب أن يكون اسم المستخدم هو نفس ID الخاص بك في أكسينا لايف والمسجّل في وكالة مش مسؤول"
                          : "Username must be your Axena Live ID registered with Mash Mas'ool Agency"}
                      </div>
                    </div>
                    {pwInput(registerForm.password, e => setRegisterForm(f => ({ ...f, password: e.target.value })), t("registerPassword"), "reg")}
                    {pwInput(registerForm.confirm, e => setRegisterForm(f => ({ ...f, confirm: e.target.value })), t("registerConfirm"), "regConfirm", { onKeyDown: e => e.key === "Enter" && handleRegister() })}
                    {registerError && <div style={{ padding: "10px 14px", borderRadius: 10, fontSize: 13, fontWeight: 700, background: "rgba(231,76,60,0.12)", color: "#e74c3c", textAlign: "center" }}>{registerError}</div>}
                    <button onClick={handleRegister} style={{ ...S.btn, ...S.gold, width: "100%", padding: "12px 20px", fontSize: 15 }}>{t("registerBtn")}</button>
                    <p style={{ textAlign: "center", fontSize: 13, color: theme.textMuted, margin: "4px 0 0" }}>
                      {lang === "ar" ? "لديك حساب بالفعل؟" : "Already have an account?"}{" "}
                      <span onClick={() => { setLoginTab("login"); setRegisterError(""); }} style={{ color: theme.accent, cursor: "pointer", fontWeight: 700 }}>{t("userLogin")}</span>
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ ADMIN CHANGE PASSWORD ══════════════ */}
      {showAdminChangePw && (
        <div style={S.overlay} onClick={() => { setShowAdminChangePw(false); setAdminPwError(""); setAdminPwForm({ current: "", newPw: "", confirm: "" }); }}>
          <div style={{ ...S.modal, maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: 28 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>🔑 {t("changeAdminPassword")}</h2>
                <button onClick={() => { setShowAdminChangePw(false); setAdminPwError(""); setAdminPwForm({ current: "", newPw: "", confirm: "" }); }} style={{ ...S.btn, ...S.ghost, padding: "6px 12px" }}>✕</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {pwInput(adminPwForm.current, e => setAdminPwForm(f => ({ ...f, current: e.target.value })), t("currentPassword"), "admCur")}
                {pwInput(adminPwForm.newPw, e => setAdminPwForm(f => ({ ...f, newPw: e.target.value })), t("newPassword"), "admNew")}
                {pwInput(adminPwForm.confirm, e => setAdminPwForm(f => ({ ...f, confirm: e.target.value })), t("confirmNewPassword"), "admConfirm", { onKeyDown: e => e.key === "Enter" && handleAdminChangePw() })}
                {adminPwError && <div style={{ padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700, background: "rgba(231,76,60,0.12)", color: "#e74c3c", textAlign: "center" }}>{adminPwError}</div>}
                <button onClick={handleAdminChangePw} style={{ ...S.btn, ...S.gold, width: "100%" }}>{t("saveChanges")}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ PROFILE ══════════════ */}
      {showProfile && currentUser && (
        <div style={S.overlay} onClick={() => setShowProfile(false)}>
          <div style={{ ...S.modal, maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: 28 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>👤 {t("profileTitle")}</h2>
                <button onClick={() => setShowProfile(false)} style={{ ...S.btn, ...S.ghost, padding: "6px 12px" }}>✕</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: theme.textMuted, display: "block", marginBottom: 5 }}>{t("fullName")}</label>
                  <input value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} placeholder={t("fullName")} style={S.input} />
                </div>
                <div style={{ padding: 14, borderRadius: 10, background: theme.accentDim, border: `1px solid ${theme.border}` }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: theme.textMuted, margin: "0 0 10px" }}>🔑 {t("changePassword")}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {pwInput(profileForm.currentPw, e => setProfileForm(f => ({ ...f, currentPw: e.target.value })), t("currentPassword"), "profCur")}
                    {pwInput(profileForm.newPw, e => setProfileForm(f => ({ ...f, newPw: e.target.value })), t("newPassword"), "profNew")}
                    {pwInput(profileForm.confirmPw, e => setProfileForm(f => ({ ...f, confirmPw: e.target.value })), t("confirmNewPassword"), "profConfirm")}
                  </div>
                </div>
                {profileError && <div style={{ padding: "10px 14px", borderRadius: 10, fontSize: 13, fontWeight: 700, background: "rgba(231,76,60,0.12)", color: "#e74c3c", textAlign: "center" }}>{profileError}</div>}
                {profileSuccess && <div style={{ padding: "10px 14px", borderRadius: 10, fontSize: 13, fontWeight: 700, background: "rgba(46,204,113,0.12)", color: "#2ecc71", textAlign: "center" }}>{profileSuccess}</div>}
                <button onClick={handleSaveProfile} style={{ ...S.btn, ...S.gold, width: "100%", padding: "12px 20px", fontSize: 15 }}>{t("saveChanges")}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer style={{ textAlign: "center", padding: "32px 24px", borderTop: `1px solid ${theme.border}`, marginTop: 40 }}>
        <p style={{ margin: 0, fontSize: 13, color: theme.textMuted }}>{t("footer")}</p>
      </footer>

      <style>{`
        @media (max-width: 768px) { .hidden-mobile { display: none !important; } .show-mobile { display: block !important; } .show-mobile-flex { display: flex !important; } }
        @media (min-width: 769px) { .show-mobile { display: none !important; } .show-mobile-flex { display: none !important; } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.3); border-radius: 3px; }
        input:focus, textarea:focus, select:focus { border-color: #D4AF37 !important; box-shadow: 0 0 0 3px rgba(212,175,55,0.15); }
        @keyframes fadeIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}
