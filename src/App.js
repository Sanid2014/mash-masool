import { useState, useEffect, useRef, useCallback } from "react";
import { db } from "./firebase";
import { doc, getDoc, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import FoodWheel from "./FoodWheel";

// المفاتيح التي سيتم مزامنتها مع السيرفر (البيانات العامة للجميع)
const CLOUD_KEYS = ["performers-data", "events-data", "votes-results", "users-data", "admin-credentials", "presence-data", "members-visible", "announcements-data", "broadcasts-data", "diary-data", "naif-diary-data", "farm-game-data", "food-wheel-leaderboard", "stories-data"];
// سجلات التصويت تُخزَّن لكل مستخدم بشكل منفصل بالصيغة: voted-{userId} أو voted-admin
const isCloudKey = (k) => CLOUD_KEYS.includes(k) || k.startsWith("voted-") || k.startsWith("chat-");

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
    agencyName:"نادي وكالة مش مسؤول", heroSubtitle:"هنا حفرنا وهنا دفنا",
    voting:"⬡ التصويت", adminPanel:"⚙ لوحة التحكم", logout:"↩ خروج", adminLogin:"🔒 دخول المدير",
    lightMode:"☀ الوضع الفاتح", darkMode:"☾ الوضع الداكن", langToggle:"EN",
    honorBoard:"لوحة الشرف — أبطال شهر", noPerformersMsg:"لم يتم إضافة أبطال لشهر", noPerformersYet:"بعد",
    noPerformersNote:"سيتم تحديث القائمة من قبل المدير",
    latestEvents:"📓 مذكرات نفنف", noComments:"لا توجد تعليقات بعد. كن أول من يعلّق!", addCommentPh:"أضف تعليقًا...", send:"إرسال",
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
    onlineNow:"متصل الآن", offline:"غير متصل", hideOnlineStatus:"إخفاء حالة الاتصال",
    onlineUsers:"المتصلون الآن", uploadAvatar:"رفع صورة شخصية", removeAvatar:"إزالة الصورة",
    moderatorPerms:"صلاحيات المشرف", permSection:"القسم", permAdd:"إضافة", permEdit:"تعديل", permDelete:"حذف",
    permApprove:"قبول/رفض", permView:"عرض", sectionPerformers:"المتميزون", sectionEvents:"الأحداث",
    sectionVotes:"التصويتات", sectionUsers:"المستخدمون", sectionAnnouncements:"الإعلانات", sectionNaifDiary:"مذكرات نفنف", allPerms:"جميع الصلاحيات", noPerms:"بدون صلاحيات",
    addFromMembers:"إضافة من الأعضاء المسجلين", selectMember:"اختر عضواً", resetPassword:"إعادة تعيين كلمة المرور",
    addFriend:"إضافة", friends:"أصدقاء", following:"متابَع", followBack:"متابعة", requested:"طلب مُرسل",
    followRequest:"طلب متابعة", accept:"قبول", decline:"رفض", message:"مراسلة", removeFriend:"إلغاء الصداقة",
    online:"متصل", membersDropTitle:"الأعضاء", typeMessage:"اكتب رسالة...", sendMsg:"إرسال",
    noMessages:"لا توجد رسائل بعد. ابدأ المحادثة!", followRequests:"طلبات المتابعة",
    resetPasswordFor:"إعادة تعيين كلمة المرور لـ", newPwForUser:"كلمة المرور الجديدة", resetDone:"✓ تم تغيير كلمة المرور",
    membersSection:"أعضاء الوكالة", membersCount:"عدد الأعضاء", showMembers:"عرض الأعضاء للعلن", hideMembers:"إخفاء الأعضاء",
    membersVisible:"الأعضاء ظاهرون للجميع", membersHidden:"الأعضاء مخفيون",
    tabAnnouncements:"الإعلانات", announcementsTitle:"شريط الإعلانات", addAnnouncementPh:"نص الإعلان...",
    addAnnouncementBtn:"+ إضافة إعلان", noAnnouncements:"لا توجد إعلانات. أضف أول إعلان.",
    deleteAnnouncementConfirm:"هل تريد حذف هذا الإعلان؟",
    broadcastChat:"رسائل المجموعة", broadcastPh:"رسالة للجميع...", sendBroadcast:"إرسال للجميع",
    noBroadcasts:"لا توجد رسائل جماعية بعد.", sectionBroadcast:"رسائل جماعية", permSend:"إرسال",
    autoLoggedOut:"تم تسجيل خروجك تلقائياً بسبب عدم النشاط لمدة ساعة",
    diaryTitle:"📓 مذكرات نفنف", diaryEmpty:"لا توجد مذكرات بعد.", diaryAddTitle:"عنوان المذكرة", diaryAddContent:"محتوى المذكرة...", diaryAddBtn:"+ إضافة مذكرة", diaryDeleteConfirm:"هل تريد حذف هذه المذكرة؟", diaryReadMore:"قراءة المزيد", diaryClose:"إغلاق", tabDiary:"المذكرات",
  },
  en: {
    agencyName:"Mash Mas'ool Agency", heroSubtitle:"Mash Mas'ool Agency — We Make a Difference",
    voting:"⬡ Voting", adminPanel:"⚙ Admin Panel", logout:"↩ Logout", adminLogin:"🔒 Admin Login",
    lightMode:"☀ Light Mode", darkMode:"☾ Dark Mode", langToggle:"عربي",
    honorBoard:"Hall of Fame — Champions of", noPerformersMsg:"No champions added for", noPerformersYet:"yet",
    noPerformersNote:"The list will be updated by the admin",
    latestEvents:"📓 Nafnaf's Diary", noComments:"No comments yet. Be the first to comment!", addCommentPh:"Add a comment...", send:"Send",
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
    onlineNow:"Online Now", offline:"Offline", hideOnlineStatus:"Hide online status",
    onlineUsers:"Online Now", uploadAvatar:"Upload Profile Photo", removeAvatar:"Remove Photo",
    moderatorPerms:"Moderator Permissions", permSection:"Section", permAdd:"Add", permEdit:"Edit", permDelete:"Delete",
    permApprove:"Approve/Reject", permView:"View", sectionPerformers:"Performers", sectionEvents:"Events",
    sectionVotes:"Votes", sectionUsers:"Users", sectionAnnouncements:"Announcements", sectionNaifDiary:"Naif's Diary", allPerms:"All Permissions", noPerms:"No Permissions",
    addFromMembers:"Add from Registered Members", selectMember:"Select a member", resetPassword:"Reset Password",
    addFriend:"Add", friends:"Friends", following:"Following", followBack:"Follow Back", requested:"Requested",
    followRequest:"Follow Request", accept:"Accept", decline:"Decline", message:"Message", removeFriend:"Remove Friend",
    online:"Online", membersDropTitle:"Members", typeMessage:"Type a message...", sendMsg:"Send",
    noMessages:"No messages yet. Start the conversation!", followRequests:"Follow Requests",
    resetPasswordFor:"Reset password for", newPwForUser:"New Password", resetDone:"✓ Password changed",
    membersSection:"Agency Members", membersCount:"Members", showMembers:"Show Members Publicly", hideMembers:"Hide Members",
    membersVisible:"Members are visible to everyone", membersHidden:"Members are hidden",
    tabAnnouncements:"Announcements", announcementsTitle:"Announcements Ticker", addAnnouncementPh:"Announcement text...",
    addAnnouncementBtn:"+ Add Announcement", noAnnouncements:"No announcements yet. Add the first one.",
    deleteAnnouncementConfirm:"Delete this announcement?",
    broadcastChat:"Group Messages", broadcastPh:"Message to everyone...", sendBroadcast:"Send to All",
    noBroadcasts:"No group messages yet.", sectionBroadcast:"Broadcast Messages", permSend:"Send",
    autoLoggedOut:"You were automatically logged out due to 1 hour of inactivity",
    diaryTitle:"📓 Nafnaf's Diary", diaryEmpty:"No diary entries yet.", diaryAddTitle:"Entry Title", diaryAddContent:"Entry content...", diaryAddBtn:"+ Add Entry", diaryDeleteConfirm:"Delete this diary entry?", diaryReadMore:"Read More", diaryClose:"Close", tabDiary:"Diary",
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
const DEFAULT_MOD_PERMS = {
    performers: { add: true, edit: true, delete: true },
    events: { add: true, edit: true, delete: true },
    votes: { add: true, edit: true, delete: true },
    users: { view: true, approve: true },
    announcements: { add: true, delete: true },
    broadcast: { send: true },
    naifDiary: { add: true, edit: true, delete: true },
};
// ══════════════ FARM GAME CONSTANTS ══════════════
// عناصر الرهان (الأطعمة الفردية فقط — بيتزا وسلطة نتائج عجلة وليست رهانات)
const FARM_ITEMS = [
  { key:"shrimp",  emoji:"🦐", ar:"روبيان",  en:"Shrimp",  mult:10, type:"meat"   },
  { key:"chicken", emoji:"🐔", ar:"دجاج",    en:"Chicken", mult:45, type:"meat"   },
  { key:"cow",     emoji:"🐄", ar:"لحم بقر", en:"Beef",    mult:15, type:"meat"   },
  { key:"corn",    emoji:"🌽", ar:"ذرة",     en:"Corn",    mult:5,  type:"veggie" },
  { key:"pepper",  emoji:"🌶️", ar:"فلفل",    en:"Pepper",  mult:5,  type:"veggie" },
  { key:"carrot",  emoji:"🥕", ar:"جزر",     en:"Carrot",  mult:5,  type:"veggie" },
  { key:"fish",    emoji:"🐟", ar:"سمك",     en:"Fish",    mult:25, type:"meat"   },
  { key:"tomato",  emoji:"🍅", ar:"طماطم",   en:"Tomato",  mult:5,  type:"veggie" },
];
// نتائج العجلة = الأطعمة الفردية + بيتزا + سلطة
const FARM_RESULTS = [
  ...FARM_ITEMS,
  { key:"pizza",  emoji:"🍕", ar:"بيتزا",  en:"Pizza",  mult:0, type:"wildMeat"   },
  { key:"salata", emoji:"🥗", ar:"سلطة",   en:"Salad",  mult:0, type:"wildVeggie" },
];
// layout 3×3 (center=[1,1] = timer) — للرهانات فقط
const FARM_GRID = [
  ["shrimp","chicken","cow"],
  ["corn",   null,    "pepper"],
  ["carrot","fish",   "tomato"],
];
const FARM_ROUND_MS = 30000;
const farmSeeded = (seed) => { const x = Math.sin(seed * 9301 + 49297) * 233280; return x - Math.floor(x); };

// أوزان الظهور (المجموع = 1000 لسهولة الحساب)
// الجولة = 30 ثانية → 120 جولة/ساعة
// البيتزا والسلطة: وزن 2 → ~1.5 ظهور كل 6-7 ساعات
// الكتكوت والسمكة: وزن 20 → ~2.4 ظهور/ساعة
// البقرة: وزن 42 → ~5 ظهور/ساعة
// الباقي (روبيان، ذرة، فلفل، جزر، طماطم): يقسمون الوزن المتبقي
const FARM_WEIGHTS = [
  { key:"shrimp",  w: 184 },
  { key:"chicken", w: 20  },
  { key:"cow",     w: 42  },
  { key:"corn",    w: 183 },
  { key:"pepper",  w: 183 },
  { key:"carrot",  w: 183 },
  { key:"fish",    w: 20  },
  { key:"tomato",  w: 183 },
  { key:"pizza",   w: 2   },
  { key:"salata",  w: 2   },
]; // total = 1002 (قريب من 1000)
const FARM_WEIGHT_TOTAL = FARM_WEIGHTS.reduce((s, w) => s + w.w, 0);

const getFarmResult = (rid) => {
  const r = farmSeeded(rid) * FARM_WEIGHT_TOTAL;
  let cum = 0;
  for (const w of FARM_WEIGHTS) {
    cum += w.w;
    if (r < cum) return FARM_RESULTS.find(x => x.key === w.key) || FARM_RESULTS[0];
  }
  return FARM_RESULTS[0];
};

// ══════════════ FARM GAME COMPONENT ══════════════
// helpers خارج المكوّن (لا تتغيّر بين الrender-ات)
const _toXY = (cx, cy, r, deg) => {
  const rad = (deg - 90) * Math.PI / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
};
const _slicePath = (cx, cy, R, i, n) => {
  const a0 = (i / n) * 360;
  const a1 = ((i + 1) / n) * 360;
  const [x0, y0] = _toXY(cx, cy, R, a0);
  const [x1, y1] = _toXY(cx, cy, R, a1);
  const large = (a1 - a0) > 180 ? 1 : 0;
  return `M${cx},${cy} L${x0},${y0} A${R},${R},0,${large},1,${x1},${y1}Z`;
};

const FarmGame = ({ onClose, currentUser, lang, onCoinsChange, users }) => {
  const AMOUNTS = [1000, 10000, 50000, 100000, 1000000];
  const MAX_BETS = 6;
  const [timer, setTimer]           = useState(30);
  const [phase, setPhase]           = useState("betting"); // betting | spinning | result
  const [result, setResult]         = useState(null);
  const [winAmt, setWinAmt]         = useState(0);
  const [myBets, setMyBets]         = useState([]); // [{ item, amount, roundId }, ...]  — حتى 6
  const [selAmount, setSelAmount]   = useState(1000);
  const [showRules, setShowRules]   = useState(false);
  const [allBets, setAllBets]       = useState({}); // { userId: { name, items:[{item,amount}], avatar } }
  const [leaderboard, setLeaderboard] = useState([]);
  const [lastResults, setLastResults] = useState([]); // آخر 10 نتائج
  const phaseRef   = useRef("betting");
  const myBetsRef  = useRef([]);
  const processedRef = useRef(new Set());
  const dir  = lang === "ar" ? "rtl" : "ltr";
  const myId = currentUser?.id;
  const myCoins = currentUser?.xcoins ?? 0;

  // Load farm state from Firebase
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "agency_data", "farm-game-data"), snap => {
      if (snap.exists()) {
        const d = JSON.parse(snap.data().v);
        setAllBets(d.currentBets || {});
        setLeaderboard(d.leaderboard || []);
        setLastResults(d.lastResults || []);
      }
    });
    return () => unsub();
  }, []);

  // Timer engine
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const rid = Math.floor(now / FARM_ROUND_MS);
      const elapsed = now % FARM_ROUND_MS;
      const remaining = Math.ceil((FARM_ROUND_MS - elapsed) / 1000);
      setTimer(remaining || 30);
      if (remaining <= 2 && !processedRef.current.has(rid) && phaseRef.current === "betting") {
        processedRef.current.add(rid);
        handleRoundEnd(rid);
      }
    };
    const iv = setInterval(tick, 500);
    tick();
    return () => clearInterval(iv);
  }, []); // eslint-disable-line

  const handleRoundEnd = (rid) => {
    phaseRef.current = "spinning";
    setPhase("spinning");
    const res = getFarmResult(rid);
    setTimeout(() => {
      setResult(res);
      phaseRef.current = "result";
      setPhase("result");
      const bets = myBetsRef.current.filter(b => b.roundId === rid);
      if (bets.length > 0) {
        let totalWin = 0;
        bets.forEach(bet => {
          let win = 0;
          const betItem = FARM_ITEMS.find(i => i.key === bet.item);
          if (res.key === bet.item) {
            // نتيجة مطابقة تماماً
            win = bet.amount * res.mult;
          } else if (res.type === "wildMeat" && betItem?.type === "meat") {
            // بيتزا — كل رهانات اللحوم تكسب بمضاعف طعامها
            win = bet.amount * betItem.mult;
          } else if (res.type === "wildVeggie" && betItem?.type === "veggie") {
            // سلطة — كل رهانات الخضار تكسب بمضاعف طعامها
            win = bet.amount * betItem.mult;
          }
          totalWin += win;
        });
        // حفظ النتيجة في آخر 10 نتائج
        const newEntry = { emoji: res.emoji, key: res.key, mult: res.mult, type: res.type, rid };
        setLastResults(prev => {
          const updated = [newEntry, ...prev].slice(0, 10);
          if (totalWin > 0) {
            setWinAmt(totalWin);
            onCoinsChange(totalWin);
            const today = new Date(Date.now() + 3*3600000).toISOString().split('T')[0];
            setLeaderboard(lb => {
              const prevToday = lb.filter(l => l.date === today);
              const existing = prevToday.find(l => l.userId === myId);
              const entry = existing
                ? { ...existing, totalWin: existing.totalWin + totalWin }
                : { userId: myId, name: currentUser.name, avatar: currentUser.avatar || null, totalWin, date: today };
              const lbList = existing ? prevToday.map(l => l.userId === myId ? entry : l) : [...prevToday, entry];
              const sorted = lbList.sort((a,b) => b.totalWin - a.totalWin).slice(0, 10);
              setDoc(doc(db, "agency_data", "farm-game-data"), { v: JSON.stringify({ currentBets: {}, leaderboard: sorted, lastResults: updated }) });
              return sorted;
            });
          } else {
            setDoc(doc(db, "agency_data", "farm-game-data"), { v: JSON.stringify({ currentBets: {}, leaderboard, lastResults: updated }) });
          }
          return updated;
        });
      }
      myBetsRef.current = [];
      setMyBets([]);
      // reset after 5s
      setTimeout(() => { phaseRef.current = "betting"; setPhase("betting"); setResult(null); setWinAmt(0); }, 5000);
    }, 3000);
  };

  const placeBet = async (itemKey) => {
    if (!currentUser || phase !== "betting") return;
    const now = Date.now();
    const rid = Math.floor(now / FARM_ROUND_MS);
    const remaining = Math.ceil((FARM_ROUND_MS - (now % FARM_ROUND_MS)) / 1000);
    if (remaining <= 3) { alert(lang === "ar" ? "انتهى وقت الرهانات!" : "Betting closed!"); return; }

    const currentRoundBets = myBetsRef.current.filter(b => b.roundId === rid);

    // إذا كان نفس الطعام موجود — نحدّث المبلغ
    const existingIdx = currentRoundBets.findIndex(b => b.item === itemKey);
    if (existingIdx !== -1) {
      // إضافة مبلغ إضافي على نفس الطعام
      if (myCoins < selAmount) { alert(lang === "ar" ? "رصيد غير كافٍ!" : "Insufficient coins!"); return; }
      const updated = myBetsRef.current.map((b, i) =>
        b.roundId === rid && b.item === itemKey ? { ...b, amount: b.amount + selAmount } : b
      );
      myBetsRef.current = updated;
      setMyBets([...updated]);
      onCoinsChange(-selAmount);
    } else {
      // رهان جديد — تحقق من الحد 6
      if (currentRoundBets.length >= MAX_BETS) {
        alert(lang === "ar" ? `الحد الأقصى ${MAX_BETS} رهانات في الجولة!` : `Max ${MAX_BETS} bets per round!`);
        return;
      }
      if (myCoins < selAmount) { alert(lang === "ar" ? "رصيد غير كافٍ!" : "Insufficient coins!"); return; }
      const newBet = { item: itemKey, amount: selAmount, roundId: rid };
      const updated = [...myBetsRef.current, newBet];
      myBetsRef.current = updated;
      setMyBets([...updated]);
      onCoinsChange(-selAmount);
    }

    // save to firebase — نخزن كل رهانات العضو كـ array
    const snap = await getDoc(doc(db, "agency_data", "farm-game-data"));
    const existing = snap.exists() ? JSON.parse(snap.data().v) : { currentBets: {}, leaderboard: [] };
    const myCurrentBets = myBetsRef.current.filter(b => b.roundId === rid);
    const updBets = { ...existing.currentBets, [String(myId)]: { name: currentUser.name, items: myCurrentBets, avatar: currentUser.avatar || null } };
    await setDoc(doc(db, "agency_data", "farm-game-data"), { v: JSON.stringify({ ...existing, currentBets: updBets }) });
  };

  const removeBet = (itemKey) => {
    const rid = Math.floor(Date.now() / FARM_ROUND_MS);
    const bet = myBetsRef.current.find(b => b.roundId === rid && b.item === itemKey);
    if (!bet) return;
    onCoinsChange(bet.amount); // استرداد المبلغ
    const updated = myBetsRef.current.filter(b => !(b.roundId === rid && b.item === itemKey));
    myBetsRef.current = updated;
    setMyBets([...updated]);
  };

  // ── Wheel spin state ──
  const [wheelRot, setWheelRot]         = useState(0);
  const [spinTransition, setSpinTransition] = useState("none");
  const wheelRotRef2 = useRef(0);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);

  // عندما تبدأ الجولة بالدوران — نطلق animation
  useEffect(() => {
    if (phase === "spinning") {
      setSpinTransition("transform 0.6s linear infinite");
    }
  }, [phase]);

  // عندما تظهر النتيجة — نوقف عند القسم الصحيح
  useEffect(() => {
    if (phase === "result" && result) {
      const N = FARM_RESULTS.length;
      const idx = FARM_RESULTS.findIndex(r => r.key === result.key);
      const SEG = 360 / N;
      const curMod = wheelRotRef2.current % 360;
      const target = idx * SEG + SEG / 2;
      const needed = (target - curMod + 360) % 360;
      const total  = wheelRotRef2.current + needed + 360 * 8;
      wheelRotRef2.current = total;
      setSpinTransition("transform 3.5s cubic-bezier(0.17,0.67,0.12,0.99)");
      setWheelRot(total);
    }
  }, [phase, result]); // eslint-disable-line

  const getAvatar = (uid, fallbackAvatar) => {
    if (String(uid) === String(currentUser?.id)) return currentUser?.avatar || fallbackAvatar || null;
    const u = (users || []).find(x => String(x.id) === String(uid));
    return u?.avatar || fallbackAvatar || null;
  };
  const getName = (uid, fallbackName) => {
    if (String(uid) === String(currentUser?.id)) return currentUser?.name || fallbackName || "?";
    const u = (users || []).find(x => String(x.id) === String(uid));
    return u?.name || fallbackName || "?";
  };
  const fmtCoins = (n) => n >= 1000000 ? (n/1000000).toFixed(1)+"M" : n >= 1000 ? (n/1000).toFixed(0)+"K" : String(n);
  const itemLabel = (key) => { if (key==="pizza") return "🍕"; if (key==="salata") return "🥗"; const i = FARM_ITEMS.find(x=>x.key===key); return i ? i.emoji : "?"; };

  const timerColor = timer <= 5 ? "#ef4444" : timer <= 10 ? "#f59e0b" : "#22c55e";
  // توقيت السعودية UTC+3 — يعيد التسمية بعد منتصف الليل
  const today     = new Date(Date.now() + 3*3600000).toISOString().split('T')[0];
  const yesterday = new Date(Date.now() + 3*3600000 - 86400000).toISOString().split('T')[0];
  const kingToday     = [...leaderboard].filter(l=>l.date===today).sort((a,b)=>b.totalWin-a.totalWin)[0] || null;
  const kingYesterday = [...leaderboard].filter(l=>l.date===yesterday).sort((a,b)=>b.totalWin-a.totalWin)[0] || null;

  // ── Wheel SVG constants (SVG size = 300×300) ──
  const N   = FARM_RESULTS.length; // 10
  const SEG = 360 / N;
  const CX  = 150; const CY = 150; const R = 130;
  // ألوان قطاعات العجلة — غنية ومتباينة
  const SEG_COLS = [
    "#FF4757","#FF9F43","#26de81","#4B7BEC","#FD79A8",
    "#FDCB6E","#00B894","#A29BFE","#E17055","#00CEC9",
  ];
  const rid_now = Math.floor(Date.now() / FARM_ROUND_MS);
  const currentRoundMyBets = myBets.filter(b => b.roundId === rid_now);
  const totalBetted = currentRoundMyBets.reduce((s,b)=>s+b.amount,0);

  return (
    <div style={{ position:"fixed",inset:0,zIndex:3000,background:"#08011a",display:"flex",flexDirection:"column",fontFamily:"'Cairo',sans-serif",direction:dir,overflowY:"auto",paddingBottom:"calc(72px + env(safe-area-inset-bottom,0px))" }}>

      {/* ── نجوم الخلفية ── */}
      <div style={{ position:"fixed",inset:0,pointerEvents:"none",overflow:"hidden",zIndex:0 }}>
        {[...Array(28)].map((_,i)=>(
          <div key={i} style={{ position:"absolute",left:`${(i*37+11)%100}%`,top:`${(i*53+9)%100}%`,width:i%5===0?3:i%3===0?2:1,height:i%5===0?3:i%3===0?2:1,borderRadius:"50%",background:"#fff",opacity:0.15+((i*0.13)%0.35),animation:`twinkle ${2.5+(i%4)*0.6}s ease-in-out ${(i%5)*0.3}s infinite alternate` }}/>
        ))}
      </div>

      {/* ── Header ── */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:"rgba(0,0,0,0.6)",backdropFilter:"blur(12px)",borderBottom:"1px solid rgba(251,191,36,0.12)",flexShrink:0,position:"relative",zIndex:2 }}>
        <button onClick={()=>setShowRules(true)} style={{ background:"rgba(255,255,255,0.06)",border:"1px solid rgba(251,191,36,0.2)",color:"#fbbf24",fontWeight:700,fontSize:11,padding:"6px 12px",borderRadius:8,cursor:"pointer",fontFamily:"inherit" }}>
          {lang==="ar"?"📋 القواعد":"📋 Rules"}
        </button>
        <div style={{ textAlign:"center" }}>
          <div style={{ display:"flex",alignItems:"center",gap:6,justifyContent:"center" }}>
            <img src="/greedycat.jpg" alt="GreedyCat" style={{ width:22,height:22,objectFit:"contain",borderRadius:4 }} />
            <span style={{ fontSize:15,fontWeight:900,color:"#fbbf24",letterSpacing:0.5 }}>Greedy Cat</span>
          </div>
          <div style={{ fontSize:9,color:"rgba(255,255,255,0.3)",fontWeight:600 }}>{lang==="ar"?"الجولة":"Round"} #{Math.floor(Date.now()/FARM_ROUND_MS)}</div>
        </div>
        <button onClick={onClose} style={{ width:40,height:40,borderRadius:"50%",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(50,20,80,0.85)",backdropFilter:"blur(6px)",color:"#fff",fontSize:20,fontWeight:900,flexShrink:0 }}>{lang==="ar"?"❮":"❯"}</button>
      </div>

      {/* ── شريط الرصيد ── */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 16px",background:"rgba(0,0,0,0.4)",flexShrink:0,position:"relative",zIndex:2,borderBottom:"1px solid rgba(255,255,255,0.03)" }}>
        <div>
          {phase==="result" && result && (
            <div style={{ display:"inline-flex",alignItems:"center",gap:5,background:result.type==="wildMeat"?"rgba(251,146,60,0.12)":result.type==="wildVeggie"?"rgba(74,222,128,0.12)":"rgba(251,191,36,0.12)",borderRadius:20,padding:"3px 10px",border:`1px solid ${result.type==="wildMeat"?"rgba(251,146,60,0.3)":result.type==="wildVeggie"?"rgba(74,222,128,0.3)":"rgba(251,191,36,0.3)"}` }}>
              <span style={{ fontSize:13 }}>{result.emoji}</span>
              <span style={{ fontSize:11,fontWeight:800,color:result.type==="wildMeat"?"#fb923c":result.type==="wildVeggie"?"#4ade80":"#fbbf24" }}>{lang==="ar"?result.ar:result.en}</span>
            </div>
          )}
          {phase==="betting" && (
            <div style={{ display:"flex",alignItems:"center",gap:5 }}>
              <div style={{ width:7,height:7,borderRadius:"50%",background:timerColor,boxShadow:`0 0 6px ${timerColor}`,animation:timer<=5?"pulse 0.5s infinite":"none" }}/>
              <span style={{ fontSize:11,color:"rgba(255,255,255,0.5)",fontWeight:700 }}>{lang==="ar"?"وقت الرهان":"Betting"}</span>
            </div>
          )}
          {phase==="spinning" && (
            <div style={{ display:"flex",alignItems:"center",gap:5 }}>
              <div style={{ width:7,height:7,borderRadius:"50%",background:"#f59e0b",animation:"pulse 0.4s infinite" }}/>
              <span style={{ fontSize:11,color:"#f59e0b",fontWeight:800 }}>{lang==="ar"?"تدور...":"Spinning..."}</span>
            </div>
          )}
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:6,background:"rgba(251,191,36,0.08)",border:"1px solid rgba(251,191,36,0.2)",borderRadius:20,padding:"4px 12px" }}>
          <span style={{ fontSize:14 }}>🪙</span>
          <span style={{ fontSize:14,fontWeight:900,color:"#fbbf24" }}>{fmtCoins(myCoins)}</span>
        </div>
      </div>

      {/* ══ العجلة الدوارة ══ */}
      <div style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', padding:'14px 12px 0', position:'relative' }}>

        {/* أفضل لاعب اليوم */}
        {kingToday && (
          <button onClick={()=>setShowLeaderboardModal(true)} title={kingToday.name} style={{ position:'absolute', top:14, left:14, zIndex:10, background:'none', border:'none', cursor:'pointer', padding:0, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
            <div style={{ position:'relative', width:50, height:50 }}>
              <div style={{ position:'absolute', inset:-2, borderRadius:'50%', background:'conic-gradient(#ffd700,#f59e0b,#ffd700)', animation:'spin 3s linear infinite' }}/>
              <div style={{ position:'absolute', inset:1, borderRadius:'50%', background:'#08011a' }}/>
              {(() => { const av = getAvatar(kingToday.userId, kingToday.avatar); return av
                ? <img src={av} alt='' style={{ position:'absolute', inset:3, borderRadius:'50%', objectFit:'cover', width:'calc(100% - 6px)', height:'calc(100% - 6px)', zIndex:2 }}/>
                : <div style={{ position:'absolute', inset:3, borderRadius:'50%', background:'linear-gradient(135deg,#ffd700,#f59e0b)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:900, color:'#000', zIndex:2 }}>{(getName(kingToday.userId,kingToday.name))?.[0]||'?'}</div>
              ; })()}
              <span style={{ position:'absolute', top:-8, left:'50%', transform:'translateX(-50%)', fontSize:14, zIndex:3 }}>👑</span>
            </div>
            <span style={{ fontSize:9, color:'#ffd700', fontWeight:800, maxWidth:54, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{fmtCoins(kingToday.totalWin)}🪙</span>
          </button>
        )}

        {/* حاوية العجلة 306×306 */}
        <div style={{ position:'relative', width:306, height:306 }}>
          <div style={{ position:'absolute', inset:-5, borderRadius:'50%', background:'conic-gradient(from 0deg,#ffd700,#ef4444,#8b5cf6,#3b82f6,#10b981,#ffd700)', opacity:0.14, filter:'blur(7px)', animation:'spin 10s linear infinite', pointerEvents:'none' }}/>

          {/* السهم الثابت */}
          <div style={{ position:'absolute', top:-16, left:'50%', transform:'translateX(-50%)', zIndex:15 }}>
            <svg width={32} height={24} viewBox='0 0 32 24'>
              <defs><linearGradient id='arrG' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stopColor='#ffd700'/><stop offset='100%' stopColor='#b45309'/></linearGradient></defs>
              <polygon points='16,22 2,2 30,2' fill='url(#arrG)'/>
              <polygon points='16,22 2,2 30,2' fill='none' stroke='rgba(255,255,255,0.4)' strokeWidth='0.8'/>
            </svg>
          </div>

          {/* SVG العجلة — تدور */}
          <svg width={300} height={300} viewBox='0 0 300 300'
            style={{ display:'block', position:'absolute', top:3, left:3, transformOrigin:'150px 150px', transform:`rotate(${wheelRot}deg)`, transition:spinTransition, filter:'drop-shadow(0 0 18px rgba(255,215,0,0.2))' }}>
            <defs>
              {SEG_COLS.map((c,i)=>(
                <radialGradient key={i} id={`rg${i}`} cx='50%' cy='30%' r='80%'>
                  <stop offset='0%' stopColor={c} stopOpacity='1'/>
                  <stop offset='100%' stopColor={SEG_COLS[(i+5)%10]} stopOpacity='0.8'/>
                </radialGradient>
              ))}
              <linearGradient id='goldb' x1='0' y1='0' x2='1' y2='1'>
                <stop offset='0%' stopColor='#ffd700'/><stop offset='50%' stopColor='#fbbf24'/><stop offset='100%' stopColor='#f59e0b'/>
              </linearGradient>
            </defs>

            {/* القطاعات */}
            {FARM_RESULTS.map((item,i)=>{
              const mid=(i+0.5)*SEG;
              return (
                <g key={item.key}>
                  <path d={_slicePath(150,150,R,i,N)} fill={`url(#rg${i})`} stroke='rgba(0,0,0,0.28)' strokeWidth='1.5'/>
                  <g transform={`rotate(${mid},150,150)`}>
                    <text x={150} y={58} textAnchor='middle' dominantBaseline='middle' fontSize={20} style={{ pointerEvents:'none', userSelect:'none' }}>{item.emoji}</text>
                    <text x={150} y={76} textAnchor='middle' dominantBaseline='middle' fontSize={7} fontWeight='bold' fill='#fff' stroke='rgba(0,0,0,0.8)' strokeWidth='0.5' paintOrder='stroke' style={{ pointerEvents:'none', userSelect:'none' }}>
                      {item.type==='wildMeat'?'اللحوم':item.type==='wildVeggie'?'الخضار':`×${item.mult}`}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* فواصل */}
            {FARM_RESULTS.map((_,i)=>{ const [x2,y2]=_toXY(150,150,R,i*SEG); return <line key={i} x1={150} y1={150} x2={x2} y2={y2} stroke='rgba(255,255,255,0.18)' strokeWidth='1.5'/>; })}
            {/* الحلقة الذهبية */}
            <circle cx={150} cy={150} r={R+1} fill='none' stroke='url(#goldb)' strokeWidth='7'/>
            {/* نقاط ذهبية */}
            {FARM_RESULTS.map((_,i)=>{ const [dx,dy]=_toXY(150,150,R+1,i*SEG); return <circle key={i} cx={dx} cy={dy} r={5} fill='#ffd700' stroke='#78350f' strokeWidth='1'/>; })}
            {/* محور وسط */}
            <circle cx={150} cy={150} r={40} fill='#08011a' stroke='#ffd700' strokeWidth='3.5'/>
            <circle cx={150} cy={150} r={35} fill='rgba(255,215,0,0.04)' stroke='rgba(255,215,0,0.2)' strokeWidth='1'/>
          </svg>

          {/* المركز الثابت */}
          <div style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)', width:72, height:72, borderRadius:'50%', background:'radial-gradient(circle at 35% 30%,#1e0a3a,#08011a)', border:'3.5px solid #ffd700', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', zIndex:5, boxShadow:'0 0 30px rgba(255,215,0,0.4),inset 0 0 14px rgba(255,215,0,0.07)' }}>
            {phase==='result' && result
              ? <span style={{ fontSize:32, lineHeight:1 }}>{result.emoji}</span>
              : phase==='spinning'
              ? <span style={{ fontSize:36, animation:'catBounce 0.35s ease infinite alternate' }}>😸</span>
              : <><span style={{ fontSize:28, fontWeight:900, color:timerColor, lineHeight:1 }}>{timer}</span><span style={{ fontSize:8, color:'rgba(255,255,255,0.3)', fontWeight:700 }}>{lang==='ar'?'ث':'s'}</span></>
            }
          </div>
        </div>

        {/* بيتزا + سلطة */}
        <div style={{ display:'flex', gap:8, marginTop:10, flexWrap:'wrap', justifyContent:'center' }}>
          {[
            { type:'wildMeat',   emoji:'🍕', ar:'بيتزا = كل اللحوم',  en:'Pizza = all meats',   col:'#fb923c', glow:'rgba(251,146,60,0.35)' },
            { type:'wildVeggie', emoji:'🥗', ar:'سلطة = كل الخضار', en:'Salad = all veggies', col:'#4ade80', glow:'rgba(74,222,128,0.35)' },
          ].map(w => {
            const isW  = phase==='result' && result?.type===w.type;
            const iWon = isW && myBets.some(b => FARM_ITEMS.find(f=>f.key===b.item)?.type===(w.type==='wildMeat'?'meat':'veggie'));
            return (
              <div key={w.type} style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 14px', borderRadius:20, background:isW?'rgba(255,255,255,0.09)':'rgba(255,255,255,0.04)', border:`1.5px solid ${isW?w.col:'rgba(255,255,255,0.08)'}`, boxShadow:isW?`0 0 14px ${w.glow}`:'none', animation:isW&&iWon?'wheelWin 0.4s infinite':'none', transition:'all 0.3s' }}>
                <span style={{ fontSize:16 }}>{w.emoji}</span>
                <span style={{ fontSize:10, fontWeight:700, color:isW?w.col:'rgba(255,255,255,0.4)' }}>{lang==='ar'?w.ar:w.en}</span>
                {iWon && <span style={{ fontSize:12 }}>🏆</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* ══ شبكة الطعام ══ */}
      <div style={{ padding:'12px 12px 0', flexShrink:0 }}>
        <div style={{ maxWidth:440, margin:'0 auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontWeight:700 }}>{lang==='ar'?'اضغط الطعام للرهان':'Tap food to bet'}</span>
            {totalBetted>0 && <span style={{ fontSize:11, color:'#fbbf24', fontWeight:800 }}>{lang==='ar'?'مراهن:':'Bet:'} {fmtCoins(totalBetted)} 🪙</span>}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:7 }}>
            {FARM_ITEMS.map(item => {
              const rid_btn = Math.floor(Date.now() / FARM_ROUND_MS);
              const myBetOnThis = myBets.find(b => b.item===item.key && b.roundId===rid_btn);
              const betCount = Object.values(allBets).filter(b => Array.isArray(b.items)?b.items.some(x=>x.item===item.key):b.item===item.key).length;
              const isWinner = phase==='result' && (result?.key===item.key||(result?.type==='wildMeat'&&item.type==='meat')||(result?.type==='wildVeggie'&&item.type==='veggie'));
              const typCol = item.type==='meat'?'#f87171':'#4ade80';
              return (
                <button key={item.key} onClick={()=>placeBet(item.key)} style={{
                  borderRadius:14, padding:'10px 4px', position:'relative',
                  background:isWinner?'linear-gradient(135deg,#ffd700,#f59e0b)':myBetOnThis?'rgba(255,215,0,0.1)':'rgba(255,255,255,0.05)',
                  border:`2px solid ${isWinner?'#ffd700':myBetOnThis?'rgba(255,215,0,0.5)':'rgba(255,255,255,0.07)'}`,
                  cursor:phase==='betting'?'pointer':'default',
                  display:'flex', flexDirection:'column', alignItems:'center', gap:2,
                  animation:isWinner?'wheelWin 0.4s ease infinite':'none',
                  transition:'all 0.2s',
                  boxShadow:isWinner?'0 0 20px rgba(255,215,0,0.5)':myBetOnThis?'0 0 8px rgba(255,215,0,0.12)':'none',
                }}>
                  <span style={{ fontSize:24 }}>{item.emoji}</span>
                  <span style={{ fontSize:9, fontWeight:800, color:isWinner?'#000':'rgba(255,255,255,0.75)' }}>{lang==='ar'?item.ar:item.en}</span>
                  <span style={{ fontSize:8, fontWeight:700, color:isWinner?'#000':typCol }}>×{item.mult}</span>
                  {myBetOnThis && <span style={{ fontSize:7, fontWeight:900, color:isWinner?'#000':'#fbbf24', background:'rgba(0,0,0,0.3)', borderRadius:4, padding:'1px 4px' }}>{fmtCoins(myBetOnThis.amount)}🪙</span>}
                  {betCount>0 && <span style={{ position:'absolute', top:-5, right:-3, fontSize:8, background:'#ef4444', color:'#fff', borderRadius:'50%', width:15, height:15, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, border:'1.5px solid #08011a', zIndex:2 }}>{betCount}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes wheelWin { 0%,100%{transform:scale(1);box-shadow:0 0 10px rgba(255,215,0,0.5)} 50%{transform:scale(1.07);box-shadow:0 0 28px rgba(255,215,0,1)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(28px) scale(0.92)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes catBounce { from{transform:scale(1) rotate(-6deg)} to{transform:scale(1.12) rotate(6deg)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes twinkle { from{opacity:0.1} to{opacity:0.7} }
        @keyframes pulse { 0%,100%{opacity:0.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.3)} }
      `}</style>

      {/* Bet Amount */}
      <div style={{ padding:"0 12px 12px",flexShrink:0 }}>
        <div style={{ background:"rgba(0,0,0,0.3)",borderRadius:14,padding:"10px 12px",maxWidth:420,margin:"0 auto",border:"1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ margin:"0 0 8px",fontSize:11,color:"rgba(255,255,255,0.5)",fontWeight:700 }}>{lang==="ar"?"اختر مبلغ الرهان":"Select bet amount"}</p>
          <div style={{ display:"flex",gap:5,flexWrap:"wrap" }}>
            {AMOUNTS.map(a => (
              <button key={a} onClick={() => setSelAmount(a)} style={{
                flex:1,minWidth:50,padding:"7px 4px",borderRadius:8,
                background: selAmount===a ? "linear-gradient(135deg,#fbbf24,#f59e0b)" : "rgba(255,255,255,0.06)",
                border:`1px solid ${selAmount===a?"transparent":"rgba(255,255,255,0.1)"}`,
                color: selAmount===a ? "#000" : "#fff",fontWeight:700,fontSize:11,cursor:"pointer",
              }}>{fmtCoins(a)}</button>
            ))}
          </div>
          {myBets.filter(b => b.roundId === Math.floor(Date.now()/FARM_ROUND_MS)).length > 0 && (
            <div style={{ marginTop:8,padding:"8px 10px",borderRadius:8,background:"rgba(251,191,36,0.08)",border:"1px solid rgba(251,191,36,0.2)" }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4 }}>
                <span style={{ fontSize:11,color:"rgba(255,255,255,0.5)",fontWeight:700 }}>
                  {lang==="ar"?`رهاناتك (${myBets.filter(b=>b.roundId===Math.floor(Date.now()/FARM_ROUND_MS)).length}/${MAX_BETS}):`:`Your bets (${myBets.filter(b=>b.roundId===Math.floor(Date.now()/FARM_ROUND_MS)).length}/${MAX_BETS}):`}
                </span>
                <span style={{ fontSize:11,color:"#fbbf24",fontWeight:800 }}>
                  {lang==="ar"?"إجمالي:":"Total:"} {fmtCoins(myBets.filter(b=>b.roundId===Math.floor(Date.now()/FARM_ROUND_MS)).reduce((s,b)=>s+b.amount,0))} 🪙
                </span>
              </div>
              <div style={{ display:"flex",flexWrap:"wrap",gap:4 }}>
                {myBets.filter(b=>b.roundId===Math.floor(Date.now()/FARM_ROUND_MS)).map(b => (
                  <div key={b.item} style={{ display:"flex",alignItems:"center",gap:4,padding:"3px 8px",borderRadius:20,background:"rgba(251,191,36,0.15)",border:"1px solid rgba(251,191,36,0.3)" }}>
                    <span style={{ fontSize:14 }}>{itemLabel(b.item)}</span>
                    <span style={{ fontSize:11,fontWeight:700,color:"#fbbf24" }}>{fmtCoins(b.amount)}</span>
                    {phase==="betting" && <button onClick={() => removeBet(b.item)} style={{ background:"none",border:"none",color:"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:11,padding:"0 2px",lineHeight:1 }}>✕</button>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Last 10 Results */}
      <div style={{ padding:"0 12px 8px",flexShrink:0 }}>
        <div style={{ background:"rgba(0,0,0,0.3)",borderRadius:14,padding:"10px 12px",maxWidth:420,margin:"0 auto",border:"1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ margin:"0 0 8px",fontSize:11,color:"rgba(255,255,255,0.5)",fontWeight:700 }}>
            {lang==="ar"?"🕒 آخر 10 نتائج":"🕒 Last 10 Results"}
          </p>
          <div style={{ display:"flex",gap:5,flexWrap:"wrap" }}>
            {lastResults.length === 0 ? (
              <span style={{ fontSize:11,color:"rgba(255,255,255,0.3)" }}>{lang==="ar"?"لا توجد نتائج بعد":"No results yet"}</span>
            ) : lastResults.map((r, i) => {
              const isWild = r.type === "wildMeat" || r.type === "wildVeggie";
              const wildColor = r.type === "wildMeat" ? "#fb923c" : "#4ade80";
              const normalColor = r.type === "meat" ? "#f87171" : "#4ade80";
              const label = isWild
                ? (r.type === "wildMeat" ? (lang==="ar"?"بيتزا":"Pizza") : (lang==="ar"?"سلطة":"Salad"))
                : `×${r.mult}`;
              return (
                <div key={i} style={{
                  display:"flex",flexDirection:"column",alignItems:"center",
                  padding:"5px 7px",borderRadius:10,minWidth:38,
                  background: i===0 ? "rgba(251,191,36,0.18)" : isWild ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${i===0 ? "rgba(251,191,36,0.4)" : isWild ? (r.type==="wildMeat"?"rgba(251,146,60,0.4)":"rgba(74,222,128,0.4)") : "rgba(255,255,255,0.06)"}`,
                  position:"relative",
                }}>
                  {i === 0 && <span style={{ position:"absolute",top:-7,fontSize:8,fontWeight:900,color:"#fbbf24",background:"rgba(0,0,0,0.8)",borderRadius:4,padding:"1px 4px" }}>{lang==="ar"?"آخر":"Last"}</span>}
                  <span style={{ fontSize:18,lineHeight:1 }}>{r.emoji}</span>
                  <span style={{ fontSize:9,fontWeight:800,color: isWild ? wildColor : normalColor,marginTop:2,whiteSpace:"nowrap" }}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <div style={{ padding:"0 12px 12px",flexShrink:0 }}>
          <div style={{ background:"rgba(0,0,0,0.3)",borderRadius:14,padding:"10px 12px",maxWidth:420,margin:"0 auto",border:"1px solid rgba(255,255,255,0.06)" }}>
            <p style={{ margin:"0 0 8px",fontSize:12,fontWeight:800,color:"#fbbf24" }}>🏆 {lang==="ar"?"فائزو اليوم":"Today's Winners"}</p>
            {leaderboard.filter(l => l.date === new Date().toDateString()).slice(0,5).map((l, i) => {
              const av = getAvatar(l.userId, l.avatar); const nm = getName(l.userId, l.name); return (
              <div key={l.userId} style={{ display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ fontSize:14,width:20,textAlign:"center",color:["#fbbf24","#9ca3af","#b45309","#fff","#fff"][i] }}>
                  {["👑","🥈","🥉","4","5"][i]}
                </span>
                {av ? <img src={av} alt="" style={{ width:24,height:24,borderRadius:"50%",objectFit:"cover" }} /> : <div style={{ width:24,height:24,borderRadius:"50%",background:"rgba(251,191,36,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fbbf24",fontWeight:800 }}>{nm?.[0]||"?"}</div>}
                <span style={{ flex:1,fontSize:12,fontWeight:700,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{nm}</span>
                <span style={{ fontSize:12,fontWeight:900,color:"#fbbf24" }}>{fmtCoins(l.totalWin)} 🪙</span>
              </div>
            );})}

          </div>
        </div>
      )}

      {/* Active Bets this round */}
      {Object.keys(allBets).length > 0 && (
        <div style={{ padding:"0 12px 80px",flexShrink:0 }}>
          <div style={{ background:"rgba(0,0,0,0.3)",borderRadius:14,padding:"10px 12px",maxWidth:420,margin:"0 auto",border:"1px solid rgba(255,255,255,0.06)" }}>
            <p style={{ margin:"0 0 8px",fontSize:12,fontWeight:800,color:"rgba(255,255,255,0.6)" }}>🎲 {lang==="ar"?"رهانات الجولة":"Round Bets"} ({Object.keys(allBets).length})</p>
            {Object.entries(allBets).slice(0,5).map(([uid,b],i) => {
              const items = Array.isArray(b.items) ? b.items : (b.item ? [{ item: b.item, amount: b.amount }] : []);
              const total = items.reduce((s,x)=>s+x.amount,0);
              const av = getAvatar(uid, b.avatar);
              const nm = getName(uid, b.name);
              return (
                <div key={i} style={{ display:"flex",alignItems:"center",gap:8,padding:"4px 0",fontSize:12 }}>
                  {av ? <img src={av} alt="" style={{ width:20,height:20,borderRadius:"50%",objectFit:"cover" }} /> : <div style={{ width:20,height:20,borderRadius:"50%",background:"rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"rgba(255,255,255,0.6)" }}>{nm?.[0]||"?"}</div>}
                  <span style={{ flex:1,color:"rgba(255,255,255,0.7)",fontWeight:600 }}>{nm}</span>
                  <span style={{ display:"flex",gap:2 }}>{items.map(x=><span key={x.item}>{itemLabel(x.item)}</span>)}</span>
                  <span style={{ color:"#fbbf24",fontWeight:700 }}>{fmtCoins(total)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ Win Popup ══ */}
      {winAmt > 0 && (
        <div style={{ position:"fixed",inset:0,zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.5)",backdropFilter:"blur(4px)" }}>
          <div style={{ background:"linear-gradient(135deg,#ffd700,#f59e0b)",borderRadius:28,padding:"32px 44px",textAlign:"center",boxShadow:"0 0 80px rgba(255,215,0,0.6),0 20px 60px rgba(0,0,0,0.5)",animation:"slideUp 0.45s cubic-bezier(0.34,1.56,0.64,1)",pointerEvents:"none" }}>
            <div style={{ fontSize:52,marginBottom:8 }}>🏆</div>
            <div style={{ fontSize:22,fontWeight:900,color:"#000",marginBottom:4 }}>{lang==="ar"?"مبروك ربحت!":"You Won!"}</div>
            <div style={{ fontSize:38,fontWeight:900,color:"#000",margin:"4px 0" }}>+{fmtCoins(winAmt)} 🪙</div>
            {result && <div style={{ fontSize:13,color:"rgba(0,0,0,0.55)",fontWeight:700,marginTop:6 }}>{result.emoji} {lang==="ar"?result.ar:result.en}</div>}
          </div>
        </div>
      )}

      {/* ══ Leaderboard Modal ══ */}
      {showLeaderboardModal && (
        <div style={{ position:"fixed",inset:0,zIndex:400,background:"rgba(0,0,0,0.85)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16 }} onClick={()=>setShowLeaderboardModal(false)}>
          <div style={{ background:"linear-gradient(180deg,#1a0533,#08011a)",borderRadius:24,maxWidth:380,width:"100%",overflow:"hidden",border:"1px solid rgba(255,215,0,0.25)",boxShadow:"0 0 60px rgba(255,215,0,0.12)" }} onClick={e=>e.stopPropagation()}>
            <div style={{ background:"linear-gradient(135deg,rgba(255,215,0,0.12),rgba(255,215,0,0.04))",padding:"16px 20px",borderBottom:"1px solid rgba(255,215,0,0.15)",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <span style={{ fontWeight:900,fontSize:16,color:"#ffd700" }}>👑 {lang==="ar"?"أفضل فائزي اليوم":"Today's Top Winners"}</span>
              <button onClick={()=>setShowLeaderboardModal(false)} style={{ background:"rgba(255,255,255,0.07)",border:"none",color:"#fff",fontWeight:900,fontSize:15,width:30,height:30,borderRadius:8,cursor:"pointer" }}>✕</button>
            </div>
            <div style={{ padding:"12px 20px 20px",maxHeight:"70vh",overflowY:"auto" }}>
              {leaderboard.filter(l=>l.date===today).length===0 ? (
                <p style={{ textAlign:"center",color:"rgba(255,255,255,0.35)",fontSize:13,margin:"24px 0" }}>{lang==="ar"?"لا توجد نتائج اليوم بعد":"No results today yet"}</p>
              ) : leaderboard.filter(l=>l.date===today).sort((a,b)=>b.totalWin-a.totalWin).slice(0,10).map((l,i)=>{
                const av=getAvatar(l.userId,l.avatar); const nm=getName(l.userId,l.name); return (
                <div key={l.userId} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:i<9?"1px solid rgba(255,255,255,0.05)":"none" }}>
                  <span style={{ fontSize:15,width:22,textAlign:"center",color:["#ffd700","#d4d4d8","#b45309","rgba(255,255,255,0.5)","rgba(255,255,255,0.4)","rgba(255,255,255,0.35)","rgba(255,255,255,0.3)","rgba(255,255,255,0.25)","rgba(255,255,255,0.2)","rgba(255,255,255,0.18)"][i] }}>
                    {["👑","🥈","🥉","4","5","6","7","8","9","10"][i]}
                  </span>
                  {av
                    ? <img src={av} alt="" style={{ width:32,height:32,borderRadius:"50%",objectFit:"cover",border:`2px solid ${i===0?"#ffd700":i===1?"#d4d4d8":"transparent"}` }}/>
                    : <div style={{ width:32,height:32,borderRadius:"50%",background:"rgba(255,215,0,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#ffd700",fontWeight:800 }}>{nm?.[0]||"?"}</div>
                  }
                  <span style={{ flex:1,fontSize:13,fontWeight:700,color:i===0?"#ffd700":"rgba(255,255,255,0.85)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{nm}</span>
                  <span style={{ fontSize:13,fontWeight:900,color:"#fbbf24" }}>{fmtCoins(l.totalWin)} 🪙</span>
                </div>
              );})()}
            </div>
          </div>
        </div>
      )}

      {/* ══ Rules Modal ══ */}
      {showRules && (
        <div style={{ position:"fixed",inset:0,zIndex:400,background:"rgba(0,0,0,0.85)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16 }} onClick={()=>setShowRules(false)}>
          <div style={{ background:"linear-gradient(180deg,#1a0533,#08011a)",borderRadius:24,maxWidth:380,width:"100%",overflow:"hidden",border:"1px solid rgba(255,215,0,0.25)" }} onClick={e=>e.stopPropagation()}>
            <div style={{ background:"linear-gradient(135deg,rgba(255,215,0,0.12),rgba(255,215,0,0.04))",padding:"16px 20px",borderBottom:"1px solid rgba(255,215,0,0.15)",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <span style={{ fontWeight:900,fontSize:16,color:"#ffd700" }}>📋 {lang==="ar"?"طريقة اللعب":"How to Play"}</span>
              <button onClick={()=>setShowRules(false)} style={{ background:"rgba(255,255,255,0.07)",border:"none",color:"#fff",fontWeight:900,fontSize:15,width:30,height:30,borderRadius:8,cursor:"pointer" }}>✕</button>
            </div>
            <div style={{ padding:"16px 20px 20px" }}>
              {[
                { e:"🎯", ar:"اضغط على الطعام للرهان عليه، يمكنك حتى 6 رهانات بالجولة", en:"Tap food to bet — up to 6 different bets per round" },
                { e:"⏱", ar:"كل جولة 30 ثانية ومتزامنة مع جميع اللاعبين", en:"Each round is 30 seconds, synced for all players" },
                { e:"✨", ar:"عند توقف العجلة على طعامك: الربح = المبلغ × المضاعف", en:"Win = bet × multiplier when wheel lands on your food" },
                { e:"🍕", ar:"البيتزا: جميع رهانات اللحوم تكسب بمضاعف كل لحم (دجاج×45، بقر×15، روبيان×10، سمك×25)", en:"Pizza: all meat bets win at their own multiplier" },
                { e:"🥗", ar:"السلطة: جميع رهانات الخضار تكسب بمضاعف كل خضار (ذرة×5، جزر×5، فلفل×5، طماطم×5)", en:"Salad: all veggie bets win at their own multiplier" },
                { e:"🎁", ar:"تحصل على 10,000 كوينز عند الانضمام وعند كل تسجيل دخول يومي", en:"Earn 10,000 coins on join & each daily login" },
              ].map((r,i)=>(
                <div key={i} style={{ display:"flex",gap:12,marginBottom:12,alignItems:"flex-start" }}>
                  <span style={{ fontSize:18,flexShrink:0 }}>{r.e}</span>
                  <span style={{ fontSize:12,color:"rgba(255,255,255,0.75)",lineHeight:1.7 }}>{lang==="ar"?r.ar:r.en}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// ══════════════ STORIES COMPONENTS ══════════════

const STORY_COLORS = ["#7C3AED","#EC4899","#EF4444","#F97316","#EAB308","#22C55E","#06B6D4","#3B82F6","#8B5CF6","#1e1b4b"];

const StoriesBar = ({ stories, currentUser, isAdmin, lang, dir, onAdd, onView }) => {
  const now = Date.now();
  const activeStories = stories.filter(s => s.expiresAt > now);
  const myId = currentUser?.id ?? (isAdmin ? "admin" : null);

  const grouped = [];
  const seen = new Set();
  activeStories.forEach(s => {
    if (!seen.has(s.userId)) {
      seen.add(s.userId);
      grouped.push({ userId: s.userId, userName: s.userName, userAvatar: s.userAvatar, userColor: s.userColor, stories: activeStories.filter(x => x.userId === s.userId) });
    }
  });

  const myGroup = grouped.find(g => String(g.userId) === String(myId));
  const others = grouped.filter(g => String(g.userId) !== String(myId));
  const sorted = myGroup ? [myGroup, ...others] : grouped;

  const hasUnread = (group) => group.stories.some(s => !(s.viewers||[]).includes(String(myId)));

  return (
    <div style={{ overflowX: "auto", display: "flex", gap: 14, padding: "14px 16px", scrollbarWidth: "none", direction: dir }} className="hide-scrollbar">
      {myId && (
        <div onClick={onAdd} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer", flexShrink: 0 }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#EC4899)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", boxShadow: "0 4px 16px rgba(124,58,237,0.4)" }}>
            {currentUser?.avatar
              ? <img src={currentUser.avatar} alt="" style={{ width: 54, height: 54, borderRadius: "50%", objectFit: "cover", border: "3px solid #0A0A0F" }} />
              : <span style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>{isAdmin ? "ن" : (currentUser?.name?.charAt(0) || "?")}</span>}
            <div style={{ position: "absolute", bottom: -2, right: -2, width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#EC4899)", border: "2px solid #0A0A0F", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)", whiteSpace: "nowrap", maxWidth: 64, overflow: "hidden", textOverflow: "ellipsis" }}>{lang === "ar" ? "ستوري" : "Story"}</span>
        </div>
      )}
      {sorted.map(group => {
        const unread = hasUnread(group);
        const isMe = String(group.userId) === String(myId);
        return (
          <div key={group.userId} onClick={() => onView(group)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer", flexShrink: 0 }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", padding: 2, background: unread ? "linear-gradient(135deg,#F97316,#EC4899,#7C3AED)" : "rgba(255,255,255,0.15)", boxShadow: unread ? "0 4px 16px rgba(236,72,153,0.4)" : "none" }}>
              <div style={{ width: "100%", height: "100%", borderRadius: "50%", border: "3px solid #0A0A0F", overflow: "hidden", background: group.userAvatar ? "none" : (group.userColor || "#7C3AED"), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900, color: "#fff" }}>
                {group.userAvatar
                  ? <img src={group.userAvatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : (group.userName || "?").charAt(0)}
              </div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: unread ? "#fff" : "rgba(255,255,255,0.5)", whiteSpace: "nowrap", maxWidth: 64, overflow: "hidden", textOverflow: "ellipsis" }}>
              {isMe ? (lang === "ar" ? "ستوريتي" : "My Story") : group.userName}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const StoryViewer = ({ group, myId, onClose, onMarkViewed, onDelete, onComment, lang, dir, users }) => {
  const [idx, setIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [sentAnim, setSentAnim] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const timerRef = useRef(null);
  const inputRef = useRef(null);
  const DURATION = 5000;

  const story = group.stories[idx];

  useEffect(() => {
    if (story) onMarkViewed(story.id, myId);
  }, [idx]); // eslint-disable-line

  useEffect(() => {
    if (inputFocused || showViewers) { clearInterval(timerRef.current); return; }
    setProgress(0);
    const start = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / DURATION) * 100, 100);
      setProgress(pct);
      if (elapsed >= DURATION) {
        clearInterval(timerRef.current);
        if (idx < group.stories.length - 1) setIdx(i => i + 1);
        else onClose();
      }
    }, 50);
    return () => clearInterval(timerRef.current);
  }, [idx, inputFocused, showViewers]); // eslint-disable-line

  const goNext = () => { if (inputFocused) return; if (showViewers) { setShowViewers(false); return; } clearInterval(timerRef.current); if (idx < group.stories.length - 1) setIdx(i => i + 1); else onClose(); };
  const goPrev = () => { if (inputFocused) return; if (showViewers) { setShowViewers(false); return; } clearInterval(timerRef.current); if (idx > 0) setIdx(i => i - 1); };

  const sendReply = () => {
    if (!replyText.trim() || !onComment) return;
    onComment(story, replyText.trim());
    setReplyText("");
    setSentAnim(true);
    inputRef.current?.blur();
    setTimeout(() => setSentAnim(false), 2500);
  };

  const timeAgo = (ts) => {
    const diff = Math.floor((Date.now() - ts) / 60000);
    if (diff < 1) return lang === "ar" ? "الآن" : "now";
    if (diff < 60) return lang === "ar" ? `${diff} د` : `${diff}m`;
    return lang === "ar" ? `${Math.floor(diff/60)} س` : `${Math.floor(diff/60)}h`;
  };

  if (!story) return null;

  const isMyStory = String(story.userId) === String(myId);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9800, background: "#000", direction: dir }} onClick={goNext}>
      {/* Progress bars */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, display: "flex", gap: 4, padding: "12px 12px 0" }}>
        {group.stories.map((s, i) => (
          <div key={s.id} style={{ flex: 1, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.35)", overflow: "hidden" }}>
            <div style={{ height: "100%", background: "#fff", width: i < idx ? "100%" : i === idx ? `${progress}%` : "0%" }} />
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={{ position: "absolute", top: 24, left: 0, right: 0, zIndex: 10, display: "flex", alignItems: "center", gap: 10, padding: "8px 14px" }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 38, height: 38, borderRadius: "50%", overflow: "hidden", background: group.userAvatar ? "none" : "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 900, color: "#fff", border: "2px solid rgba(255,255,255,0.5)", flexShrink: 0 }}>
          {group.userAvatar ? <img src={group.userAvatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (group.userName || "?").charAt(0)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Cairo',sans-serif", fontSize: 13, fontWeight: 800, color: "#fff" }}>{group.userName}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{timeAgo(story.createdAt)}</div>
        </div>
        {isMyStory && (
          <button
            onClick={e => { e.stopPropagation(); if (window.confirm(lang === "ar" ? "حذف هذه الستوري؟" : "Delete this story?")) { onDelete(story.id); if (group.stories.length <= 1) onClose(); else if (idx >= group.stories.length - 1) setIdx(i => i - 1); } }}
            style={{ background: "rgba(239,68,68,0.85)", border: "none", borderRadius: 99, padding: "6px 14px", cursor: "pointer", color: "#fff", fontFamily: "'Cairo',sans-serif", fontWeight: 800, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}
          >
            🗑 {lang === "ar" ? "حذف" : "Delete"}
          </button>
        )}
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", fontSize: 18 }}>✕</button>
      </div>

      {/* Story Content */}
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {story.type === "image" ? (
          <img src={story.content} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: story.bgColor || "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
            <p style={{ fontFamily: "'Cairo',sans-serif", fontSize: 28, fontWeight: 900, color: "#fff", textAlign: "center", lineHeight: 1.6, margin: 0, textShadow: "0 2px 12px rgba(0,0,0,0.3)", wordBreak: "break-word" }}>{story.content}</p>
          </div>
        )}
      </div>

      {/* Tap zones */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "35%", height: "75%", zIndex: 5 }} onClick={e => { e.stopPropagation(); goPrev(); }} />
      <div style={{ position: "absolute", top: 0, right: 0, width: "35%", height: "75%", zIndex: 5 }} onClick={e => { e.stopPropagation(); goNext(); }} />

      {/* Viewers count (for owner) */}
      {isMyStory && (
        <div style={{ position: "absolute", bottom: 90, left: dir === "rtl" ? 20 : "auto", right: dir === "rtl" ? "auto" : 20, zIndex: 10 }} onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setShowViewers(true)}
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 99, padding: "9px 22px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <span style={{ fontFamily: "'Cairo',sans-serif", fontSize: 14, color: "#fff", fontWeight: 800 }}>{(story.viewers || []).length}</span>
          </button>
        </div>
      )}

      {/* Viewers sheet */}
      {isMyStory && showViewers && (
        <div style={{ position: "absolute", inset: 0, zIndex: 20, display: "flex", alignItems: "flex-end" }} onClick={() => setShowViewers(false)}>
          <div style={{ width: "100%", background: "rgba(14,10,28,0.97)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderRadius: "22px 22px 0 0", padding: "16px 20px calc(env(safe-area-inset-bottom,0px) + 24px)", maxHeight: "55vh", overflowY: "auto", direction: dir }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <span style={{ fontFamily: "'Cairo',sans-serif", fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.6)", flex: 1 }}>
                {lang === "ar" ? `${(story.viewers||[]).length} مشاهدة` : `${(story.viewers||[]).length} views`}
              </span>
              <button onClick={() => setShowViewers(false)} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", fontSize: 16, flexShrink: 0 }}>✕</button>
            </div>
            {(story.viewers || []).length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px 0", fontFamily: "'Cairo',sans-serif", fontSize: 13, color: "rgba(255,255,255,0.35)", fontWeight: 700 }}>
                {lang === "ar" ? "لا يوجد مشاهدون بعد" : "No viewers yet"}
              </div>
            ) : (story.viewers || []).map(viewerId => {
              const u = (users || []).find(x => String(x.id) === String(viewerId));
              const name = u?.name || (lang === "ar" ? "عضو" : "Member");
              const avatar = u?.avatar || null;
              return (
                <div key={viewerId} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#A855F7)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 900, color: "#fff", flexShrink: 0 }}>
                    {avatar ? <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : name.charAt(0)}
                  </div>
                  <span style={{ fontFamily: "'Cairo',sans-serif", fontSize: 14, fontWeight: 700, color: "#fff" }}>{name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── حقل التعليق (للمشاهدين فقط) ── */}
      {!isMyStory && myId && (
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10, padding: "12px 14px calc(env(safe-area-inset-bottom,0px) + 14px)", background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)" }} onClick={e => e.stopPropagation()}>
          {/* رسالة التأكيد */}
          {sentAnim && (
            <div style={{ textAlign: "center", marginBottom: 10, fontFamily: "'Cairo',sans-serif", fontSize: 13, fontWeight: 800, color: "#a78bfa", background: "rgba(0,0,0,0.5)", borderRadius: 99, padding: "6px 20px", display: "inline-flex", alignItems: "center", gap: 6, width: "100%", justifyContent: "center" }}>
              ✓ {lang === "ar" ? "تم إرسال تعليقك كرسالة خاصة" : "Comment sent as DM"}
            </div>
          )}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              ref={inputRef}
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              onKeyDown={e => { if (e.key === "Enter" && replyText.trim()) sendReply(); }}
              placeholder={lang === "ar" ? `رد على ${group.userName}...` : `Reply to ${group.userName}...`}
              style={{ flex: 1, background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", border: "1.5px solid rgba(255,255,255,0.25)", borderRadius: 24, padding: "11px 18px", color: "#fff", fontFamily: "'Cairo',sans-serif", fontSize: 14, outline: "none" }}
            />
            <button
              onClick={sendReply}
              disabled={!replyText.trim()}
              style={{ width: 44, height: 44, borderRadius: "50%", border: "none", cursor: replyText.trim() ? "pointer" : "default", background: replyText.trim() ? "linear-gradient(135deg,#7C3AED,#EC4899)" : "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}
            >
              <svg viewBox="0 0 24 24" fill="#fff" width="20" height="20" style={{ transform: dir === "rtl" ? "scaleX(-1)" : "none" }}>
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ══════════════ GAMES LOBBY COMPONENT ══════════════
const GamesLobby = ({ onClose, onSelectGame, currentUser, lang, dir, closeLobbyRef }) => {
  const [closing, setClosing] = useState(false);
  const fmtC = (n) => n>=1000000?(n/1000000).toFixed(1)+"M":n>=1000?(n/1000).toFixed(0)+"K":String(n||0);
  const games = [
    { key:"food-wheel", name:"Greedy Cat",  img:"/greedycat.jpg", locked:false },
    { key:"coming1",  name:"قريباً",        emoji:"🎰",           locked:true  },
    { key:"coming2",  name:"قريباً",        emoji:"🎣",           locked:true  },
    { key:"coming3",  name:"قريباً",        emoji:"🏆",           locked:true  },
    { key:"coming4",  name:"قريباً",        emoji:"🎯",           locked:true  },
    { key:"coming5",  name:"قريباً",        emoji:"⚡",           locked:true  },
  ];

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, 320);
  }, [onClose]);

  useEffect(() => {
    if (closeLobbyRef) closeLobbyRef.current = handleClose;
  }, [closeLobbyRef, handleClose]);

  return (
    <>
      <style>{`
        @keyframes sheetUp   { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes sheetDown { from { transform: translateY(0);    } to { transform: translateY(100%); } }
        @keyframes fadeInBg  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOutBg { from { opacity: 1; } to { opacity: 0; } }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position:"fixed", inset:0, zIndex:2899,
          background:"rgba(0,0,0,0.55)", backdropFilter:"blur(4px)",
          animation: closing ? "fadeOutBg 0.32s ease forwards" : "fadeInBg 0.25s ease forwards",
        }}
      />

      {/* Bottom Sheet — نصف الشاشة */}
      <div style={{
        position:"fixed", bottom:0, left:0, right:0, zIndex:2900,
        height:"52vh", minHeight:320, maxHeight:480,
        background:"linear-gradient(180deg,#1e0a40 0%,#2d1060 100%)",
        borderRadius:"22px 22px 0 0",
        fontFamily:"'Cairo',sans-serif", direction:dir,
        display:"flex", flexDirection:"column",
        animation: closing ? "sheetDown 0.32s cubic-bezier(0.4,0,1,1) forwards" : "sheetUp 0.35s cubic-bezier(0,0,0.2,1) forwards",
        boxShadow:"0 -8px 40px rgba(0,0,0,0.6)",
      }}>
        {/* Drag handle */}
        <div style={{ display:"flex", justifyContent:"center", padding:"10px 0 0" }}>
          <div style={{ width:40, height:4, borderRadius:2, background:"rgba(255,255,255,0.2)" }} />
        </div>

        {/* Header */}
        <div style={{ padding:"10px 18px 12px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <button onClick={handleClose} style={{ width:40,height:40,borderRadius:"50%",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(50,20,80,0.85)",backdropFilter:"blur(6px)",color:"#fff",fontSize:20,fontWeight:900,flexShrink:0 }}>{lang==="ar"?"❮":"❯"}</button>
          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
            <span style={{ fontSize:16 }}>🏆</span>
            <span style={{ fontSize:16, fontWeight:900, color:"#fff" }}>{lang==="ar"?"مركز الألعاب":"Game Center"}</span>
          </div>
          <div style={{ background:"rgba(255,215,0,0.15)",border:"1px solid rgba(255,215,0,0.3)",borderRadius:20,padding:"4px 12px",display:"flex",alignItems:"center",gap:5 }}>
            <span style={{ fontSize:13 }}>🪙</span>
            <span style={{ fontSize:12, fontWeight:900, color:"#ffd700" }}>{fmtC(currentUser?.xcoins)}</span>
          </div>
        </div>

        {/* Games Grid */}
        <div style={{ flex:1, overflowY:"auto", padding:"4px 20px 20px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
            {games.map(g => (
              <div
                key={g.key}
                onClick={() => { if(!g.locked){ setClosing(true); setTimeout(()=>onSelectGame(g.key), 300); } }}
                style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, cursor:g.locked?"default":"pointer", opacity:g.locked?0.45:1 }}
              >
                <div style={{ width:64, height:64, borderRadius:16, overflow:"hidden", position:"relative", border:g.locked?"1px solid rgba(255,255,255,0.07)":"2px solid rgba(255,215,0,0.4)", boxShadow:g.locked?"none":"0 4px 16px rgba(0,0,0,0.5)" }}>
                  {g.img
                    ? <img src={g.img} alt={g.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, background:"rgba(255,255,255,0.05)" }}>{g.emoji}</div>
                  }
                  {!g.locked && <div style={{ position:"absolute", top:4, right:4, width:7, height:7, borderRadius:"50%", background:"#ff4444", boxShadow:"0 0 5px #ff4444" }} />}
                  {g.locked  && <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, background:"rgba(0,0,0,0.35)" }}>🔒</div>}
                </div>
                <span style={{ fontSize:10, fontWeight:700, color:g.locked?"rgba(255,255,255,0.35)":"#fff", textAlign:"center" }}>{g.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

// ══════════════ MARIO GAME COMPONENT ══════════════
const MarioGame = ({ onClose }) => {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const keysRef = useRef({});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const HEADER = 48, CTRL = 120;
    const setSize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight - HEADER - CTRL;
    };
    setSize();
    const W = canvas.width, H = canvas.height;
    const GRAV = 0.45, SPD = 3.5, JUMP = -10;
    const GY = H - 60;
    let score = 0, coinCount = 0, lives = 3, gameState = "playing", camX = 0, tick = 0;

    let pl = { x: 80, y: GY - 40, w: 28, h: 36, vx: 0, vy: 0, onGround: false, dir: 1, frame: 0, fT: 0, inv: 0 };
    const resetPl = () => { pl = { x: 80, y: GY - 40, w: 28, h: 36, vx: 0, vy: 0, onGround: false, dir: 1, frame: 0, fT: 0, inv: 0 }; camX = 0; };

    const plats = [
      { x: 0,    y: GY, w: 680, h: 60, t: "g" },
      { x: 780,  y: GY, w: 480, h: 60, t: "g" },
      { x: 1350, y: GY, w: 420, h: 60, t: "g" },
      { x: 1870, y: GY, w: 280, h: 60, t: "g" },
      { x: 2250, y: GY, w: 750, h: 60, t: "g" },
      { x: 220,  y: GY - 100, w: 96, h: 16, t: "b" },
      { x: 380,  y: GY - 90,  w: 32, h: 16, t: "q", hit: false },
      { x: 412,  y: GY - 90,  w: 32, h: 16, t: "b" },
      { x: 444,  y: GY - 90,  w: 32, h: 16, t: "q", hit: false },
      { x: 820,  y: GY - 84,  w: 128,h: 16, t: "b" },
      { x: 980,  y: GY - 132, w: 64, h: 16, t: "q", hit: false },
      { x: 1120, y: GY - 100, w: 96, h: 16, t: "b" },
      { x: 1420, y: GY - 84,  w: 128,h: 16, t: "b" },
      { x: 1600, y: GY - 148, w: 64, h: 16, t: "q", hit: false },
      { x: 1930, y: GY - 84,  w: 96, h: 16, t: "b" },
      { x: 2080, y: GY - 132, w: 64, h: 16, t: "q", hit: false },
      { x: 2320, y: GY - 100, w: 128,h: 16, t: "b" },
      { x: 2520, y: GY - 84,  w: 96, h: 16, t: "b" },
    ];

    const coinArr = [
      {x:230,y:GY-132,got:false},{x:262,y:GY-132,got:false},{x:294,y:GY-132,got:false},
      {x:840,y:GY-116,got:false},{x:872,y:GY-116,got:false},{x:904,y:GY-116,got:false},
      {x:1130,y:GY-132,got:false},{x:1162,y:GY-132,got:false},
      {x:1430,y:GY-116,got:false},{x:1462,y:GY-116,got:false},{x:1494,y:GY-116,got:false},
      {x:1940,y:GY-116,got:false},{x:1972,y:GY-116,got:false},
      {x:2330,y:GY-132,got:false},{x:2362,y:GY-132,got:false},
    ];

    const enemies = [
      {x:380,y:GY-32,w:28,h:28,vx:-1.5,vy:0,alive:true,sq:false,sqT:0},
      {x:580,y:GY-32,w:28,h:28,vx:-1.5,vy:0,alive:true,sq:false,sqT:0},
      {x:880,y:GY-32,w:28,h:28,vx:-1.5,vy:0,alive:true,sq:false,sqT:0},
      {x:1060,y:GY-32,w:28,h:28,vx:-1.5,vy:0,alive:true,sq:false,sqT:0},
      {x:1470,y:GY-32,w:28,h:28,vx:-1.5,vy:0,alive:true,sq:false,sqT:0},
      {x:1720,y:GY-32,w:28,h:28,vx:-1.5,vy:0,alive:true,sq:false,sqT:0},
      {x:2060,y:GY-32,w:28,h:28,vx:-1.5,vy:0,alive:true,sq:false,sqT:0},
      {x:2560,y:GY-32,w:28,h:28,vx:-1.5,vy:0,alive:true,sq:false,sqT:0},
    ];

    const parts = [], popups = [];
    const addParts = (x, y, col, n=6) => { for (let i=0;i<n;i++) parts.push({x,y,vx:(Math.random()-.5)*6,vy:-Math.random()*5-2,life:1,col,sz:5+Math.random()*4}); };
    const addPop = (x, y, txt) => popups.push({x,y,txt,life:1,vy:-1});
    const ovlp = (a,b) => a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;

    const die = () => { lives--; if(lives<=0){gameState="gameover";}else{gameState="dead";setTimeout(()=>{resetPl();gameState="playing";},1200);} };
    const restart = () => {
      score=0;coinCount=0;lives=3;
      coinArr.forEach(c=>c.got=false);
      plats.forEach(b=>{if(b.t==="q")b.hit=false;});
      enemies.forEach(e=>Object.assign(e,{alive:true,sq:false,sqT:0,vy:0,vx:-1.5}));
      resetPl(); gameState="playing";
    };

    const update = () => {
      tick++;
      if (gameState !== "playing") return;
      const K = keysRef.current;
      const left  = K["ArrowLeft"]||K["a"]||K["A"]||K["touchLeft"];
      const right = K["ArrowRight"]||K["d"]||K["D"]||K["touchRight"];
      const jump  = K["ArrowUp"]||K["w"]||K["W"]||K[" "]||K["touchJump"];

      if (left)  { pl.vx=-SPD; pl.dir=-1; }
      else if (right) { pl.vx=SPD; pl.dir=1; }
      else pl.vx *= 0.75;

      if (jump && pl.onGround) { pl.vy=JUMP; pl.onGround=false; }
      pl.vy += GRAV;

      // X + collision (non-ground)
      pl.x += pl.vx;
      pl.x = Math.max(0, pl.x);
      for (const b of plats) {
        if (b.t==="g") continue;
        if (ovlp(pl,b)) { pl.vx>0?pl.x=b.x-pl.w:pl.x=b.x+b.w; pl.vx=0; }
      }

      // Y + collision
      pl.y += pl.vy;
      pl.onGround = false;
      for (const b of plats) {
        if (!ovlp(pl,b)) continue;
        if (pl.vy>=0) { pl.y=b.y-pl.h; pl.vy=0; pl.onGround=true; }
        else { pl.y=b.y+b.h; pl.vy=1;
          if (b.t==="q"&&!b.hit) { b.hit=true; score+=100; addParts(b.x+b.w/2,b.y,"#FFD700"); addPop(b.x+b.w/2-camX,b.y-10,"+100"); }
          else if (b.t==="b") addParts(b.x+b.w/2,b.y,"#CC4400",4);
        }
      }

      if (pl.y > H + 60) { die(); return; }
      camX = Math.max(0, Math.min(3000-W, pl.x - W*0.38));

      // Coins
      for (const c of coinArr) {
        if (c.got) continue;
        if (Math.hypot(pl.x+pl.w/2-c.x, pl.y+pl.h/2-c.y)<24) {
          c.got=true; coinCount++; score+=200;
          addPop(c.x-camX,c.y-8,"+200"); addParts(c.x,c.y,"#FFD700",4);
        }
      }

      // Enemies
      for (const e of enemies) {
        if (!e.alive) continue;
        if (e.sq) { if(++e.sqT>40) e.alive=false; continue; }
        e.vy+=GRAV; e.x+=e.vx; e.y+=e.vy;
        for (const b of plats) { const eb={x:e.x,y:e.y,w:e.w,h:e.h}; if(ovlp(eb,b)&&e.vy>=0){e.y=b.y-e.h;e.vy=0;} }
        if (e.x<0){e.x=0;e.vx=Math.abs(e.vx);} if(e.x+e.w>3000){e.x=3000-e.w;e.vx=-Math.abs(e.vx);}
        if (pl.inv===0 && ovlp(pl,{x:e.x,y:e.y,w:e.w,h:e.h})) {
          if (pl.vy>0 && pl.y+pl.h < e.y+e.h*0.55) {
            e.sq=true; pl.vy=-7; score+=100; addPop(e.x-camX+e.w/2,e.y-10,"+100"); addParts(e.x+e.w/2,e.y+e.h/2,"#8B4513",5);
          } else { die(); return; }
        }
      }

      if (pl.x+pl.w>=2820&&!enemies.every(e=>!e.alive||e.sq)) { gameState="win"; }
      if (pl.x+pl.w>=2820) { gameState="win"; }
      if (pl.inv>0) pl.inv--;
      pl.fT++; if(pl.fT>8){pl.fT=0;pl.frame=(pl.frame+1)%3;}

      for (let i=parts.length-1;i>=0;i--){const p=parts[i];p.x+=p.vx;p.y+=p.vy;p.vy+=0.2;p.life-=0.04;if(p.life<=0)parts.splice(i,1);}
      for (let i=popups.length-1;i>=0;i--){const p=popups[i];p.y+=p.vy;p.life-=0.025;if(p.life<=0)popups.splice(i,1);}
    };

    const drawBG = () => {
      const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,"#3A6BC0");g.addColorStop(1,"#6A9FD8");
      ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
      // mountains
      ctx.fillStyle="#4E7BAA";
      [120,320,540,780,1020,1280,1540,1800,2060,2320].forEach(mx=>{
        const sx=(mx-camX*0.3+9000)%(W+200)-100;
        ctx.beginPath();ctx.moveTo(sx-70,GY);ctx.lineTo(sx,GY-85);ctx.lineTo(sx+70,GY);ctx.fill();
      });
      // clouds
      ctx.fillStyle="rgba(255,255,255,0.9)";
      [100,350,600,900,1200,1600,2000,2400,2800].forEach(cx=>{
        const sx=(cx-camX*0.4+12000)%(W+300)-150, cy=28+(cx%60);
        [[0,0,36,16],[-24,8,20,13],[24,8,20,13]].forEach(([ox,oy,rx,ry])=>{
          ctx.beginPath();ctx.ellipse(sx+ox,cy+oy,rx,ry,0,0,Math.PI*2);ctx.fill();
        });
      });
    };

    const drawPlat = (b) => {
      const sx=b.x-camX; if(sx+b.w<0||sx>W) return;
      if (b.t==="g") {
        ctx.fillStyle="#5FA020";ctx.fillRect(sx,b.y,b.w,13);
        ctx.fillStyle="#3D7A10";ctx.fillRect(sx,b.y,b.w,4);
        ctx.fillStyle="#8B5E3C";ctx.fillRect(sx,b.y+13,b.w,b.h-13);
      } else if (b.t==="b") {
        ctx.fillStyle="#CC4400";ctx.fillRect(sx,b.y,b.w,b.h);
        for(let gx=0;gx<b.w;gx+=16){ctx.fillStyle="#E05520";ctx.fillRect(sx+gx+1,b.y+2,14,12);}
        ctx.strokeStyle="#882200";ctx.lineWidth=1;ctx.strokeRect(sx,b.y,b.w,b.h);
      } else if (b.t==="q") {
        if (b.hit) { ctx.fillStyle="#8B6914";ctx.fillRect(sx,b.y,b.w,b.h);ctx.strokeStyle="#5C4510";ctx.lineWidth=1;ctx.strokeRect(sx,b.y,b.w,b.h); }
        else {
          const sh=Math.sin(tick*0.1)*0.15+0.85;
          ctx.fillStyle=`rgb(${Math.round(232*sh)},${Math.round(160*sh)},0)`;ctx.fillRect(sx,b.y,b.w,b.h);
          ctx.fillStyle="rgba(255,255,255,0.25)";ctx.fillRect(sx+2,b.y+2,b.w-4,4);
          ctx.fillStyle="#fff";ctx.font=`bold ${Math.min(b.w-2,14)}px Arial`;ctx.textAlign="center";
          ctx.fillText("?",sx+b.w/2,b.y+b.h-3);
          ctx.strokeStyle="#A07000";ctx.lineWidth=1;ctx.strokeRect(sx,b.y,b.w,b.h);
        }
      }
    };

    const drawMario = () => {
      if (pl.inv>0&&Math.floor(pl.inv/3)%2===0) return;
      const sx=Math.round(pl.x-camX),y=Math.round(pl.y);
      ctx.save();
      if(pl.dir===-1){ctx.translate(sx+pl.w,0);ctx.scale(-1,1);ctx.translate(-sx,0);}
      // hat
      ctx.fillStyle="#CC0000";ctx.fillRect(sx+4,y,22,7);ctx.fillRect(sx+1,y+4,26,4);
      // face
      ctx.fillStyle="#FAB077";ctx.fillRect(sx+4,y+7,20,11);
      // eye
      ctx.fillStyle="#333";ctx.fillRect(sx+15,y+10,5,4);
      // mustache
      ctx.fillStyle="#5C3010";ctx.fillRect(sx+6,y+15,16,4);
      // overalls
      ctx.fillStyle="#1144CC";ctx.fillRect(sx+6,y+19,16,11);
      ctx.fillStyle="#CC0000";ctx.fillRect(sx+1,y+19,6,8);ctx.fillRect(sx+21,y+19,6,8);
      ctx.fillStyle="#FFD700";ctx.fillRect(sx+9,y+20,3,2);ctx.fillRect(sx+16,y+20,3,2);
      // legs animated
      const la=pl.onGround?(pl.frame===1?4:0):2;
      ctx.fillStyle="#CC0000";ctx.fillRect(sx+4,y+30,9,8);ctx.fillRect(sx+15,y+30-la,9,8);
      ctx.fillStyle="#5C3010";ctx.fillRect(sx+1,y+36,12,5);ctx.fillRect(sx+14,y+36-la,12,5);
      ctx.restore();
    };

    const drawGoomba = (e) => {
      const sx=Math.round(e.x-camX),y=Math.round(e.y);if(sx+e.w<0||sx>W)return;
      if(e.sq){ctx.fillStyle="#8B4513";ctx.beginPath();ctx.ellipse(sx+e.w/2,y+e.h-5,e.w/2-1,5,0,0,Math.PI*2);ctx.fill();return;}
      ctx.fillStyle="#5C3010";ctx.beginPath();ctx.ellipse(sx+6,y+e.h-1,7,4,-0.3,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(sx+e.w-6,y+e.h-1,7,4,0.3,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#C68642";ctx.fillRect(sx+3,y+10,e.w-6,e.h-13);
      ctx.fillStyle="#8B4513";ctx.beginPath();ctx.ellipse(sx+e.w/2,y+9,e.w/2+1,10,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#fff";ctx.fillRect(sx+3,y+5,8,8);ctx.fillRect(sx+e.w-11,y+5,8,8);
      ctx.fillStyle="#222";ctx.fillRect(sx+5,y+7,4,5);ctx.fillRect(sx+e.w-9,y+7,4,5);
      ctx.fillStyle="#fff";ctx.fillRect(sx+5,y+7,2,2);ctx.fillRect(sx+e.w-9,y+7,2,2);
      ctx.fillStyle="#000";
      ctx.save();ctx.translate(sx+4,y+4);ctx.rotate(0.4);ctx.fillRect(0,0,9,2);ctx.restore();
      ctx.save();ctx.translate(sx+e.w-13,y+4);ctx.rotate(-0.4);ctx.fillRect(0,0,9,2);ctx.restore();
      ctx.fillStyle="#fff";ctx.fillRect(sx+5,y+14,4,4);ctx.fillRect(sx+e.w-9,y+14,4,4);
    };

    const drawCoin = (c) => {
      if (c.got) return;
      const sx=c.x-camX; if(sx<-20||sx>W+20)return;
      const bob=Math.sin(tick*0.08+c.x)*3,y=c.y+bob;
      ctx.save();ctx.shadowColor="#FFD700";ctx.shadowBlur=8;ctx.fillStyle="#FFD700";
      ctx.beginPath();ctx.ellipse(sx,y,9,9,0,0,Math.PI*2);ctx.fill();ctx.restore();
      ctx.fillStyle="#FFF4A0";ctx.beginPath();ctx.ellipse(sx-3,y-3,4,4,0,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle="#DAA520";ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(sx,y,9,9,0,0,Math.PI*2);ctx.stroke();
    };

    const drawFlag = () => {
      const fx=2820-camX;if(fx<-60||fx>W+60)return;
      ctx.fillStyle="#aaa";ctx.fillRect(fx-2,GY-200,4,200);
      ctx.fillStyle="#FFD700";ctx.beginPath();ctx.arc(fx,GY-200,7,0,Math.PI*2);ctx.fill();
      const wv=Math.sin(tick*0.08)*5;
      ctx.fillStyle="#00BB00";ctx.beginPath();ctx.moveTo(fx+2,GY-195);ctx.quadraticCurveTo(fx+24+wv,GY-183,fx+2,GY-163);ctx.closePath();ctx.fill();
      ctx.fillStyle="#777";ctx.fillRect(fx-10,GY-4,20,8);
    };

    const drawHUD = () => {
      ctx.fillStyle="rgba(0,0,0,0.55)";ctx.fillRect(0,0,W,38);
      ctx.font="bold 14px Arial";
      ctx.fillStyle="#FFD700";ctx.textAlign="left";ctx.fillText(`SCORE: ${score}`,10,24);
      ctx.textAlign="center";ctx.fillText(`🪙 ${coinCount}`,W/2,24);
      ctx.textAlign="right";ctx.fillStyle="#FF8888";ctx.fillText(`❤️ × ${lives}`,W-10,24);
    };

    const drawOverlay = (title, sub1, sub2, col="#FF4444") => {
      ctx.fillStyle="rgba(0,0,0,0.72)";ctx.fillRect(0,0,W,H);
      ctx.fillStyle=col;ctx.font=`bold 34px Arial`;ctx.textAlign="center";ctx.fillText(title,W/2,H/2-28);
      if(sub1){ctx.fillStyle="#fff";ctx.font="18px Arial";ctx.fillText(sub1,W/2,H/2+14);}
      if(sub2){ctx.fillStyle="#aaa";ctx.font="14px Arial";ctx.fillText(sub2,W/2,H/2+46);}
    };

    const draw = () => {
      ctx.clearRect(0,0,W,H);
      drawBG();
      for(const b of plats) drawPlat(b);
      drawFlag();
      for(const c of coinArr) drawCoin(c);
      for(const e of enemies) if(e.alive) drawGoomba(e);
      drawMario();
      ctx.globalAlpha=1;
      for(const p of parts){ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.col;ctx.fillRect(p.x-camX-p.sz/2,p.y-p.sz/2,p.sz,p.sz);}
      ctx.globalAlpha=1;
      for(const p of popups){ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle="#FFD700";ctx.font="bold 13px Arial";ctx.textAlign="center";ctx.fillText(p.txt,p.x,p.y);}
      ctx.globalAlpha=1;
      drawHUD();
      if(gameState==="dead")   drawOverlay("💀 OOPS!",`حياتك المتبقية: ${lives}`,"");
      if(gameState==="gameover")drawOverlay("GAME OVER",`Score: ${score}`,"اضغط للمحاولة مرة أخرى");
      if(gameState==="win")    drawOverlay("🎉 YOU WIN! 🎉",`Score: ${score}  🪙 ${coinCount}`,"اضغط للعب مرة أخرى","#FFD700");
    };

    const loop = () => { update(); draw(); animRef.current=requestAnimationFrame(loop); };
    loop();

    const onKD = (e) => { keysRef.current[e.key]=true; if([" ","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key))e.preventDefault(); };
    const onKU = (e) => { keysRef.current[e.key]=false; };
    window.addEventListener("keydown",onKD); window.addEventListener("keyup",onKU);
    canvas.addEventListener("click",()=>{ if(gameState==="gameover"||gameState==="win")restart(); });

    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener("keydown",onKD); window.removeEventListener("keyup",onKU); };
  }, []); // eslint-disable-line

  const tS = (k) => { keysRef.current[k]=true; };
  const tE = (k) => { keysRef.current[k]=false; };

  const DBtn = ({ k, children, style={} }) => (
    <button
      onPointerDown={e=>{e.preventDefault();tS(k);}}
      onPointerUp={e=>{e.preventDefault();tE(k);}}
      onPointerLeave={()=>tE(k)}
      onPointerCancel={()=>tE(k)}
      style={{
        width:70, height:70, borderRadius:18,
        background:"rgba(255,255,255,0.10)",
        border:"3px solid rgba(255,255,255,0.22)",
        color:"#fff", fontSize:28, cursor:"pointer",
        userSelect:"none", touchAction:"none",
        WebkitUserSelect:"none", display:"flex",
        alignItems:"center", justifyContent:"center",
        boxShadow:"0 4px 16px rgba(0,0,0,0.5)",
        transition:"background 0.1s",
        ...style,
      }}
    >{children}</button>
  );

  const CTRL_H = 120; // ارتفاع شريط التحكم ثابت

  return (
    <div style={{ position:"fixed",inset:0,zIndex:9999,background:"#111",overflow:"hidden" }}>
      {/* Header — ثابت في الأعلى */}
      <div style={{ position:"absolute",top:0,left:0,right:0,height:48,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 16px",background:"#CC0000",zIndex:2 }}>
        <div style={{ color:"#fff",fontWeight:900,fontSize:15,letterSpacing:1 }}>🍄 SUPER MARIO BROS</div>
        <button onClick={onClose} style={{ width:40,height:40,borderRadius:"50%",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(50,20,80,0.85)",backdropFilter:"blur(6px)",color:"#fff",fontSize:20,fontWeight:900,flexShrink:0 }}>❮</button>
      </div>

      {/* Game canvas — بين الهيدر والأزرار */}
      <canvas
        ref={canvasRef}
        style={{
          position:"absolute",
          top:48,
          left:0,
          right:0,
          width:"100%",
          height:`calc(100% - ${48 + CTRL_H}px)`,
          display:"block",
        }}
      />

      {/* Controls — ثابتة في الأسفل دائماً */}
      <div style={{
        position:"absolute",
        bottom:0, left:0, right:0,
        height:CTRL_H,
        display:"flex", justifyContent:"space-between", alignItems:"center",
        padding:"10px 28px 16px",
        background:"linear-gradient(180deg,rgba(0,0,0,0.88),rgba(15,0,0,0.98))",
        zIndex:2,
      }}>
        {/* D-pad */}
        <div style={{ display:"flex",gap:10,alignItems:"center",direction:"ltr" }}>
          <DBtn k="touchLeft">◀</DBtn>
          <DBtn k="touchRight">▶</DBtn>
        </div>

        {/* Jump — دائرة حمراء كبيرة */}
        <DBtn k="touchJump" style={{
          width:84, height:84, borderRadius:"50%",
          background:"radial-gradient(circle at 35% 35%,#FF5555,#CC0000)",
          border:"4px solid #880000",
          boxShadow:"0 6px 0 #550000,0 8px 24px rgba(200,0,0,0.6)",
          flexDirection:"column", gap:1,
        }}>
          <span style={{fontSize:26,lineHeight:1,pointerEvents:"none"}}>↑</span>
          <span style={{fontSize:10,fontWeight:900,letterSpacing:1,pointerEvents:"none"}}>JUMP</span>
        </DBtn>
      </div>
    </div>
  );
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
  const dataLoadedRef = useRef(false); // يمنع الحفظ قبل اكتمال التحميل من Firebase
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
  const [profileForm, setProfileForm] = useState({ name: "", currentPw: "", newPw: "", confirmPw: "", avatar: null, hideOnline: false });
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [editUserForm, setEditUserForm] = useState({ name: "", password: "", role: "member", moderatorPerms: DEFAULT_MOD_PERMS });
  const [resetPwUserId, setResetPwUserId] = useState(null);
  const [resetPwValue, setResetPwValue] = useState("");
  const [showMembersSection, setShowMembersSection] = useState(false); // مرئية للعلن؟
  const [membersExpanded, setMembersExpanded] = useState(true); // مطوية أو مفتوحة
  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [tickerPaused, setTickerPaused] = useState(false);
  const [showMsgList, setShowMsgList] = useState(false);
  const [showMobileMembers, setShowMobileMembers] = useState(false);
  const [broadcasts, setBroadcasts] = useState([]);
  const [openBroadcast, setOpenBroadcast] = useState(false);
  const [broadcastInput, setBroadcastInput] = useState("");
  const [logoutNotice, setLogoutNotice] = useState(false);
  // ═══ ستوريات ═══
  const [stories, setStories] = useState([]);
  const [showStoryViewer, setShowStoryViewer] = useState(null);
  const [showStoryCreator, setShowStoryCreator] = useState(false);
  const [storyType, setStoryType] = useState("text");
  const [storyText, setStoryText] = useState("");
  const [storyBg, setStoryBg] = useState("#7C3AED");
  const [storyImage, setStoryImage] = useState(null);

  const [diary, setDiary] = useState([]);
  const [newDiaryTitle, setNewDiaryTitle] = useState("");
  const [newDiaryContent, setNewDiaryContent] = useState("");
  const [openDiaryEntry, setOpenDiaryEntry] = useState(null);
  // مذكرات نفنف
  const [naifDiary, setNaifDiary] = useState([]);
  const [showNaifDiary, setShowNaifDiary] = useState(false);
  const [openNaifArticle, setOpenNaifArticle] = useState(null);
  const [naifComment, setNaifComment] = useState("");
  const [newNaifTitle, setNewNaifTitle] = useState("");
  const [newNaifContent, setNewNaifContent] = useState("");
  const [showNaifWrite, setShowNaifWrite] = useState(false);
  const [naifWriteImages, setNaifWriteImages] = useState([]);
  const [editingNaifId, setEditingNaifId] = useState(null);
  const [naifMenuOpen, setNaifMenuOpen] = useState(false);
  const [naifConfirm, setNaifConfirm] = useState(null); // { type:"delete"|"edit", article }
  const [goldPrice, setGoldPrice] = useState(null); // سعر الأونصة بالدولار (احتياطي)
  const [goldData, setGoldData] = useState(null);   // { k24sar, k22sar, k21sar, k18sar, k24usd, ozSAR, ozUSD }
  const [goldLoading, setGoldLoading] = useState(true);
  const [goldError, setGoldError] = useState(false);
  const [goldLastUpdated, setGoldLastUpdated] = useState(null);
  const [showMarioGame, setShowMarioGame] = useState(false);
  const [showFarmGame, setShowFarmGame] = useState(false);
  const [showFoodWheel, setShowFoodWheel] = useState(false);
  const [showGamesLobby, setShowGamesLobby] = useState(false);
  const closeLobbyRef = useRef(null);
  // closing states للأنيميشن
  const [closingVoting,  setClosingVoting]  = useState(false);
  const [closingMsgList, setClosingMsgList] = useState(false);
  const [closingProfile, setClosingProfile] = useState(false);

  const closeWithAnim = (setClosing, setShow) => {
    setClosing(true);
    setTimeout(() => { setShow(false); setClosing(false); }, 320);
  };
  const [coinToast, setCoinToast] = useState(null); // { msg, amount }
  const [adminXcoinsForm, setAdminXcoinsForm] = useState({ userId: null, amount: "", op: "add" });
  const inactivityTimer = useRef(null);
  const [showMobileProfile, setShowMobileProfile] = useState(false);
  const [mobileAdminSection, setMobileAdminSection] = useState(null); // "performers"|"events"|"votes"|"announcements"|"users"|null
  const [mpName, setMpName] = useState("");
  const [mpAvatar, setMpAvatar] = useState(null);
  const [mpHideOnline, setMpHideOnline] = useState(false);
  const [mpAdminOpen, setMpAdminOpen] = useState(false);
  const [mpNameColor, setMpNameColor] = useState(null);
  const [mpSocialSheet, setMpSocialSheet] = useState(null); // "friends"|"followers"|"following"
  const [newPerformerFromMember, setNewPerformerFromMember] = useState("");
  // Members nav dropdown & chat
  const [showMembersNav, setShowMembersNav] = useState(false);
  const [openChat, setOpenChat] = useState(null);
  const [chatMessages, setChatMessages] = useState({});
  const [chatInput, setChatInput] = useState("");
  const [lastReadTimes, setLastReadTimes] = useState(() => { try { return JSON.parse(localStorage.getItem("chat-last-read") || "{}"); } catch { return {}; } });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  // ── Toast notifications ──
  const [toasts, setToasts] = useState([]);
  const [lastSeenHomeTs, setLastSeenHomeTs] = useState(() => Number(localStorage.getItem("last-seen-home") || 0));
  const [lastSeenNaifTs, setLastSeenNaifTs] = useState(() => Number(localStorage.getItem("last-seen-naif") || 0));
  const prevStoriesRef = useRef([]);
  const prevNaifRef = useRef([]);
  const prevChatRef = useRef({});
  const addToast = (toast) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev.slice(-2), { id, ...toast }]); // max 3 at once
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  };
  const membersNavRef = useRef(null);
  // Presence
  const [presenceData, setPresenceData] = useState({});
  const presenceInterval = useRef(null);
  const ONLINE_THRESHOLD = 3 * 60 * 1000; // 3 دقائق
  const isUserOnline = (userId) => {
    // إذا فعّل المستخدم إخفاء الاتصال → يظهر دائماً كغير متصل لغير المدير
    const user = users.find(u => String(u.id) === String(userId));
    if (user?.hideOnline && !isAdmin) return false;
    const ts = presenceData[String(userId)];
    return ts && (Date.now() - ts) < ONLINE_THRESHOLD;
  };
  const updateMyPresence = async (userId, online) => {
    const snap = await storage.get("presence-data");
    const current = snap?.value ? JSON.parse(snap.value) : {};
    const updated = { ...current, [String(userId)]: online ? Date.now() : 0 };
    setPresenceData(updated);
    await storage.set("presence-data", JSON.stringify(updated));
  };

  // helper: لون اسم المستخدم — يُستخدم في كل الأماكن
  const nc = (user) => user?.nameColor || "inherit";

  // helper: حفظ آمن إلى Firebase — لا يكتب قبل اكتمال التحميل
  const saveToCloud = (key, value) => {
    if (!dataLoadedRef.current) return;
    storage.set(key, JSON.stringify(value));
  };

  // helper: تحديث users مع حفظ فوري
  const updateUsers = (updaterFn) => {
    setUsers(prev => {
      const updated = updaterFn(prev);
      saveToCloud("users-data", updated);
      return updated;
    });
  };


  // helper: الستوريات
  const saveStories = (updated) => saveToCloud("stories-data", updated);
  const addStory = (storyObj) => {
    setStories(prev => {
      const filtered = prev.filter(s => s.expiresAt > Date.now());
      const updated = [...filtered, storyObj];
      saveStories(updated);
      return updated;
    });
  };
  const markStoryViewed = (storyId, viewerId) => {
    setStories(prev => {
      const updated = prev.map(s => s.id === storyId ? { ...s, viewers: [...new Set([...(s.viewers||[]), String(viewerId)])] } : s);
      saveStories(updated);
      return updated;
    });
  };
  const deleteStory = (storyId) => {
    setStories(prev => {
      const updated = prev.filter(s => s.id !== storyId);
      saveStories(updated);
      return updated;
    });
  };

  // helper: تحديث naifDiary مع حفظ فوري
  const updateNaifDiary = (updaterFn) => {
    setNaifDiary(prev => {
      const updated = updaterFn(prev);
      saveToCloud("naif-diary-data", updated);
      return updated;
    });
  };

  // ── Toast: new stories ──
  useEffect(() => {
    const myId = currentUser?.id ?? (isAdmin ? "admin" : null);
    const prevIds = new Set(prevStoriesRef.current.map(s => s.id));
    if (prevIds.size > 0) { // don't fire on first load
      const newOnes = stories.filter(s => !prevIds.has(s.id) && String(s.userId) !== String(myId));
      newOnes.forEach(s => addToast({ type: "story", avatar: s.userAvatar || null, name: s.userName || "?", text: lang === "ar" ? "أضاف ستوري جديد" : "Added a new story" }));
    }
    prevStoriesRef.current = stories;
  }, [stories]); // eslint-disable-line

  // ── Toast: new naif diary ──
  useEffect(() => {
    const prevIds = new Set(prevNaifRef.current.map(a => a.id));
    if (prevIds.size > 0) {
      const newOnes = naifDiary.filter(a => !prevIds.has(a.id));
      if (newOnes.length > 0) {
        setLastSeenNaifTs(0); // mark as unseen so badge shows
        localStorage.setItem("last-seen-naif", "0");
        newOnes.forEach(a => addToast({ type: "naif", avatar: null, name: "مذكرات نفنف", text: a.title || "مقال جديد" }));
      }
    }
    prevNaifRef.current = naifDiary;
  }, [naifDiary]); // eslint-disable-line

  // ── Toast: new announcements (red dot on home) ──
  useEffect(() => {
    if (announcements.length > 0) {
      const newest = Math.max(...announcements.map(a => a.time || a.ts || 0));
      if (newest > lastSeenHomeTs) {
        // badge will show; toast only if this isn't first load
        if (lastSeenHomeTs > 0) {
          addToast({ type: "home", avatar: null, name: lang === "ar" ? "إعلان جديد" : "New Announcement", text: announcements[0]?.text || "" });
        }
      }
    }
  }, [announcements]); // eslint-disable-line

  // ── Toast: new chat messages ──
  useEffect(() => {
    const myId = currentUser?.id ?? (isAdmin ? "admin" : null);
    if (!myId) return;
    Object.entries(chatMessages).forEach(([key, msgs]) => {
      const prev = prevChatRef.current[key] || [];
      if (prev.length > 0 && msgs.length > prev.length) {
        const newMsgs = msgs.slice(prev.length);
        newMsgs.forEach(m => {
          if (String(m.from) !== String(myId) && openChat?.chatKey !== key) {
            // find sender
            const sender = users.find(u => String(u.id) === String(m.from));
            addToast({ type: "message", avatar: sender?.avatar || m.avatar || null, name: m.name || sender?.name || "?", text: m.text || "..." });
          }
        });
      }
    });
    prevChatRef.current = chatMessages;
  }, [chatMessages]); // eslint-disable-line

  // helper: تحديث diary مع حفظ فوري
  const updateDiary = (updaterFn) => {
    setDiary(prev => {
      const updated = updaterFn(prev);
      saveToCloud("diary-data", updated);
      return updated;
    });
  };

  // helper: تحديث announcements مع حفظ فوري
  const updateAnnouncements = (updaterFn) => {
    setAnnouncements(prev => {
      const updated = updaterFn(prev);
      saveToCloud("announcements-data", updated);
      return updated;
    });
  };

  // helper: تحديث broadcasts مع حفظ فوري
  const updateBroadcasts = (updaterFn) => {
    setBroadcasts(prev => {
      const updated = updaterFn(prev);
      saveToCloud("broadcasts-data", updated);
      return updated;
    });
  };

  const modCan = (section, action) => {
    if (isAdmin) return true;
    if (!currentUser || currentUser.role !== "moderator") return false;
    const perms = currentUser.moderatorPerms || DEFAULT_MOD_PERMS;
    return !!(perms[section]?.[action]);
  };

  // ── Real-time Firestore listeners — جميع البيانات حية من Firebase ──
  useEffect(() => {
    const unsubs = [
      onSnapshot(doc(db, "agency_data", "users-data"), snap => {
        if (snap.exists()) {
          const updated = JSON.parse(snap.data().v);
          setUsers(updated);
          setCurrentUser(cu => {
            if (!cu) return cu;
            const fresh = updated.find(u => u.id === cu.id);
            return fresh || cu;
          });
        }
      }),
      onSnapshot(doc(db, "agency_data", "performers-data"), snap => {
        if (snap.exists()) {
          const p = JSON.parse(snap.data().v);
          setData(d => ({ ...d, topPerformers: p.performers || [], performerMonth: p.monthName || d.performerMonth, performerMonthKey: p.monthKey || d.performerMonthKey }));
        }
      }),
      onSnapshot(doc(db, "agency_data", "votes-results"), snap => {
        if (snap.exists()) setData(d => ({ ...d, votes: JSON.parse(snap.data().v) }));
      }),
      onSnapshot(doc(db, "agency_data", "events-data"), snap => {
        if (snap.exists()) setData(d => ({ ...d, events: JSON.parse(snap.data().v) }));
      }),
      onSnapshot(doc(db, "agency_data", "members-visible"), snap => {
        if (snap.exists()) setShowMembersSection(snap.data().v === "true");
      }),
      onSnapshot(doc(db, "agency_data", "presence-data"), snap => {
        if (snap.exists()) setPresenceData(JSON.parse(snap.data().v));
      }),
      onSnapshot(doc(db, "agency_data", "broadcasts-data"), snap => {
        if (snap.exists()) setBroadcasts(JSON.parse(snap.data().v));
      }),
      onSnapshot(doc(db, "agency_data", "announcements-data"), snap => {
        if (snap.exists()) setAnnouncements(JSON.parse(snap.data().v));
      }),
      onSnapshot(doc(db, "agency_data", "diary-data"), snap => {
        if (snap.exists()) setDiary(JSON.parse(snap.data().v));
      }),
      onSnapshot(doc(db, "agency_data", "naif-diary-data"), snap => {
        if (snap.exists()) setNaifDiary(JSON.parse(snap.data().v));
      }),
      onSnapshot(doc(db, "agency_data", "stories-data"), snap => {
        if (snap.exists()) {
          const now = Date.now();
          const all = JSON.parse(snap.data().v);
          setStories(all.filter(s => s.expiresAt > now));
        }
      }),
    ];
    return () => unsubs.forEach(u => u());
  }, []); // eslint-disable-line

  // ── Real-time listener for open chat ──
  useEffect(() => {
    if (!openChat?.chatKey) return;
    // علّم المحادثة كمقروءة فور فتحها
    const markRead = (key) => {
      const now = Date.now();
      setLastReadTimes(prev => { const next = { ...prev, [key]: now }; localStorage.setItem("chat-last-read", JSON.stringify(next)); return next; });
    };
    markRead(openChat.chatKey);
    const unsub = onSnapshot(doc(db, "agency_data", openChat.chatKey), snap => {
      if (snap.exists()) {
        const msgs = JSON.parse(snap.data().v);
        setChatMessages(prev => ({ ...prev, [openChat.chatKey]: msgs }));
        markRead(openChat.chatKey);
      }
    });
    return () => unsub();
  }, [openChat?.chatKey]);

  // ── Background listener: محادثة المدير دائماً مراقَبة لإظهار badge ──
  useEffect(() => {
    if (!currentUser) return;
    const adminKey = `chat-admin-${currentUser.id}`;
    const unsub = onSnapshot(doc(db, "agency_data", adminKey), snap => {
      if (snap.exists()) {
        const msgs = JSON.parse(snap.data().v);
        setChatMessages(prev => ({ ...prev, [adminKey]: msgs }));
      }
    });
    return () => unsub();
  }, [currentUser?.id]); // eslint-disable-line

  // ── Close members nav on outside click ──
  useEffect(() => {
    const handler = (e) => { if (membersNavRef.current && !membersNavRef.current.contains(e.target)) setShowMembersNav(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Mobile hardware back button closes chat ──
  useEffect(() => {
    if (openChat) {
      window.history.pushState({ chat: true }, "");
      const handler = () => setOpenChat(null);
      window.addEventListener("popstate", handler);
      return () => window.removeEventListener("popstate", handler);
    }
  }, [!!openChat]); // eslint-disable-line

  // ── Gold price fetch ── أسعار الذهب — عبر Vercel serverless function
  useEffect(() => {
    let firstLoad = true;
    const fetchGold = async () => {
      if (firstLoad) setGoldLoading(true);
      let parsed = null;

      // ── المصدر الأول: /api/gold serverless (بعد deploy على Vercel)
      try {
        const r = await fetch("/api/gold");
        if (r.ok) {
          const j = await r.json();
          if (j?.k24sar && j.k24sar > 100) parsed = j;
        }
      } catch { /* fallback */ }

      // ── المصدر الثاني: CoinGecko — CORS مفتوح، PAXG = 1 أونصة ذهب حقيقية
      if (!parsed) {
        try {
          const r = await fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=pax-gold&vs_currencies=usd",
            { headers: { "Accept": "application/json" } }
          );
          if (r.ok) {
            const j = await r.json();
            const usd = j?.["pax-gold"]?.usd;
            if (usd && Number(usd) > 500) {
              const oz = Number(usd);
              const g = oz / 31.1035;
              const s = 3.75;
              parsed = {
                ozUSD: +oz.toFixed(2),
                ozSAR: +(oz * s).toFixed(2),
                k24sar: +(g * s).toFixed(2),
                k22sar: +(g * s * (22/24)).toFixed(2),
                k21sar: +(g * s * (21/24)).toFixed(2),
                k18sar: +(g * s * (18/24)).toFixed(2),
              };
            }
          }
        } catch { /* fallback */ }
      }

      // ── المصدر الثالث: fawazahmed0 (يومي — آخر احتياطي)
      if (!parsed) {
        const urls = [
          "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/xau.json",
          "https://latest.currency-api.pages.dev/v1/currencies/xau.json",
        ];
        for (const url of urls) {
          try {
            const r = await fetch(url);
            if (!r.ok) continue;
            const j = await r.json();
            const usd = j?.xau?.usd;
            if (usd && Number(usd) > 500) {
              const oz = Number(usd);
              const g = oz / 31.1035;
              const s = 3.75;
              parsed = {
                ozUSD: +oz.toFixed(2),
                ozSAR: +(oz * s).toFixed(2),
                k24sar: +(g * s).toFixed(2),
                k22sar: +(g * s * (22/24)).toFixed(2),
                k21sar: +(g * s * (21/24)).toFixed(2),
                k18sar: +(g * s * (18/24)).toFixed(2),
              };
              break;
            }
          } catch { continue; }
        }
      }

      if (parsed) {
        setGoldPrice(parsed.ozUSD);
        setGoldData(parsed);
        setGoldError(false);
        setGoldLastUpdated(new Date());
      } else {
        setGoldError(true);
      }
      if (firstLoad) { setGoldLoading(false); firstLoad = false; }
    };

    fetchGold();
    const gi = setInterval(fetchGold, 5 * 60 * 1000);
    return () => clearInterval(gi);
  }, []);

  // ── Social helpers ──
  const getChatKey = (id1, id2) => `chat-${Math.min(Number(id1), Number(id2))}-${Math.max(Number(id1), Number(id2))}`;

  const getFriendStatus = (targetId) => {
    if (!currentUser) return "none";
    const cu = users.find(u => u.id === currentUser.id) || currentUser;
    const friends = cu.friends || [];
    const sent = cu.sentRequests || [];
    const received = cu.receivedRequests || [];
    if (friends.includes(targetId)) return "friends";
    if (sent.includes(targetId)) return "requested";
    if (received.includes(targetId)) return "receivedRequest";
    return "none";
  };

  const sendFriendRequest = (targetId) => {
    if (!currentUser) return;
    updateUsers(us => us.map(u => {
      if (u.id === currentUser.id) return { ...u, sentRequests: [...(u.sentRequests || []), targetId] };
      if (u.id === targetId) return { ...u, receivedRequests: [...(u.receivedRequests || []), currentUser.id] };
      return u;
    }));
    setCurrentUser(u => ({ ...u, sentRequests: [...(u.sentRequests || []), targetId] }));
  };

  const acceptFriendRequest = (fromId) => {
    if (!currentUser) return;
    updateUsers(us => us.map(u => {
      if (u.id === currentUser.id) return { ...u, friends: [...(u.friends || []), fromId], receivedRequests: (u.receivedRequests || []).filter(id => id !== fromId) };
      if (u.id === fromId) return { ...u, friends: [...(u.friends || []), currentUser.id], sentRequests: (u.sentRequests || []).filter(id => id !== currentUser.id) };
      return u;
    }));
    setCurrentUser(u => ({ ...u, friends: [...(u.friends || []), fromId], receivedRequests: (u.receivedRequests || []).filter(id => id !== fromId) }));
  };

  const declineFriendRequest = (fromId) => {
    if (!currentUser) return;
    updateUsers(us => us.map(u => {
      if (u.id === currentUser.id) return { ...u, receivedRequests: (u.receivedRequests || []).filter(id => id !== fromId) };
      if (u.id === fromId) return { ...u, sentRequests: (u.sentRequests || []).filter(id => id !== currentUser.id) };
      return u;
    }));
    setCurrentUser(u => ({ ...u, receivedRequests: (u.receivedRequests || []).filter(id => id !== fromId) }));
  };

  const removeFriend = (targetId) => {
    if (!currentUser) return;
    updateUsers(us => us.map(u => {
      if (u.id === currentUser.id) return { ...u, friends: (u.friends || []).filter(id => id !== targetId) };
      if (u.id === targetId) return { ...u, friends: (u.friends || []).filter(id => id !== currentUser.id) };
      return u;
    }));
    setCurrentUser(u => ({ ...u, friends: (u.friends || []).filter(id => id !== targetId) }));
  };

  const loadChat = async (chatKey) => {
    const snap = await storage.get(chatKey);
    const msgs = snap?.value ? JSON.parse(snap.value) : [];
    setChatMessages(prev => ({ ...prev, [chatKey]: msgs }));
  };

  const sendMessage = async (chatKey, text) => {
    if (!text.trim() || (!currentUser && !isAdmin)) return;
    const msg = currentUser
      ? { from: currentUser.id, name: currentUser.name, text: text.trim(), time: Date.now() }
      : { from: "admin", name: lang === "ar" ? "المدير" : "Admin", text: text.trim(), time: Date.now() };
    const current = chatMessages[chatKey] || [];
    const updated = [...current, msg];
    setChatMessages(prev => ({ ...prev, [chatKey]: updated }));
    await storage.set(chatKey, JSON.stringify(updated));
  };

  // إرسال تعليق على ستوري كرسالة خاصة
  const sendStoryReply = async (story, text) => {
    if (!text.trim()) return;
    const myId = currentUser?.id ?? (isAdmin ? "admin" : null);
    if (!myId) return;
    const ownerId = story.userId;
    if (String(ownerId) === String(myId)) return;

    let chatKey;
    if (ownerId === "admin") {
      chatKey = currentUser ? `chat-admin-${currentUser.id}` : null;
    } else if (isAdmin) {
      chatKey = `chat-admin-${ownerId}`;
    } else {
      chatKey = getChatKey(currentUser.id, ownerId);
    }
    if (!chatKey) return;

    // قراءة الرسائل الحالية مباشرة من التخزين
    const snap = await storage.get(chatKey);
    const current = snap?.value ? JSON.parse(snap.value) : [];

    const storyPreview = story.type === "text"
      ? story.content.slice(0, 60) + (story.content.length > 60 ? "..." : "")
      : "📷 صورة";

    const senderName = isAdmin ? (lang === "ar" ? "المدير" : "Admin") : currentUser.name;
    const msg = {
      from: myId,
      name: senderName,
      text: `💬 رد على ستوري:\n"${storyPreview}"\n\n${text.trim()}`,
      time: Date.now(),
      storyReply: true,
    };
    const updated = [...current, msg];
    setChatMessages(prev => ({ ...prev, [chatKey]: updated }));
    await storage.set(chatKey, JSON.stringify(updated));
  };

  const sendBroadcast = () => {
    if (!broadcastInput.trim()) return;
    const senderName = isAdmin ? (lang === "ar" ? "المدير" : "Admin") : currentUser?.name || "";
    const msg = { id: Date.now(), from: isAdmin ? "admin" : currentUser?.id, userId: isAdmin ? "admin" : currentUser?.id, name: senderName, text: broadcastInput.trim(), time: Date.now() };
    updateBroadcasts(prev => [...prev, msg]);
    setBroadcastInput("");
  };

  // Password visibility toggles
  const [showPw, setShowPw] = useState({ login: false, reg: false, regConfirm: false, profCur: false, profNew: false, profConfirm: false, admCur: false, admNew: false, admConfirm: false, editU: false });
  const togglePw = (key) => setShowPw(s => ({ ...s, [key]: !s[key] }));
  const eyeBtn = (key) => (<button type="button" onClick={() => togglePw(key)} style={{ position: "absolute", [dir === "rtl" ? "left" : "right"]: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: theme.textMuted, padding: 0 }}>{showPw[key] ? "🙈" : "👁"}</button>);
  const pwInput = (value, onChange, placeholder, pwKey, extra = {}) => (<div style={{ position: "relative" }}><input type={showPw[pwKey] ? "text" : "password"} value={value} onChange={onChange} placeholder={placeholder} style={{ ...S.input, paddingLeft: dir === "rtl" ? 36 : 14, paddingRight: dir === "rtl" ? 14 : 36 }} {...extra} />{eyeBtn(pwKey)}</div>);

  // ── Load — بيانات الجلسة فقط (باقي البيانات تأتي من onSnapshot) ──
  useEffect(() => {
    setMounted(true);
    const load = async () => {
      try {
        // تفضيل اللغة (localStorage)
        const savedLang = localStorage.getItem("lang-pref");
        if (savedLang) setLang(savedLang);

        // جلسة المدير
        const r2 = await storage.get("admin-session");
        const isAdminSession = r2?.value === "authenticated";
        if (isAdminSession) setIsAdmin(true);

        // بيانات اعتماد المدير
        const r7 = await storage.get("admin-credentials");
        if (r7?.value) setAdminCreds(JSON.parse(r7.value));

        // جلسة العضو — نحتاج users-data لتحديد العضو الحالي
        // نستخدم getDoc مرة واحدة فقط لتحديد الجلسة، بعدها onSnapshot يتولى التحديثات
        const r5 = await storage.get("users-data");
        const allUsers = r5?.value ? JSON.parse(r5.value) : [];
        const r6 = await storage.get("user-session");
        let sessionUserId = null;
        if (r6?.value) {
          const u = allUsers.find(u => String(u.id) === r6.value);
          if (u?.approved) { setCurrentUser(u); sessionUserId = u.id; }
        }

        // سجل التصويت الخاص بالمستخدم
        const votedKey = isAdminSession ? "voted-admin" : sessionUserId ? `voted-${sessionUserId}` : null;
        if (votedKey) {
          const rv2 = await storage.get(votedKey);
          if (rv2?.value) setVoted(JSON.parse(rv2.value));
        }

        // مكافأة تسجيل الدخول اليومية + إشعار الكوينز
        if (sessionUserId) {
          const saudiToday = new Date(Date.now() + 3*3600000).toISOString().split('T')[0];
          const lastLogin = localStorage.getItem(`lastLogin-${sessionUserId}`);
          if (lastLogin !== saudiToday) {
            localStorage.setItem(`lastLogin-${sessionUserId}`, saudiToday);
            const r5b = await storage.get("users-data");
            const usersArr = r5b?.value ? JSON.parse(r5b.value) : allUsers;
            const updated = usersArr.map(u => u.id === sessionUserId ? { ...u, xcoins: (u.xcoins || 0) + 10000 } : u);
            await storage.set("users-data", JSON.stringify(updated));
            // إشعار الكوينز اليومي
            setTimeout(() => setCoinToast({ msg: "تسجيل دخولك اليومي", amount: 10000, type:"daily" }), 1500);
          }
          // فحص صندوق الكوينز من المدير
          const r5c = await storage.get("users-data");
          const usersArr2 = r5c?.value ? JSON.parse(r5c.value) : allUsers;
          const meUser = usersArr2.find(u => u.id === sessionUserId);
          if (meUser?.coinInbox?.length > 0) {
            const inbox = meUser.coinInbox;
            const totalAmt = inbox.reduce((s,x) => s + (x.amount||0), 0);
            const lastMsg = inbox[inbox.length-1]?.msg || "";
            setTimeout(() => setCoinToast({ msg: lastMsg, amount: totalAmt, type:"admin" }), 2000);
            // مسح الصندوق
            const cleared = usersArr2.map(u => u.id === sessionUserId ? { ...u, coinInbox: [] } : u);
            await storage.set("users-data", JSON.stringify(cleared));
          }
        }

        // تحديث الحضور عند استعادة الجلسة
        if (sessionUserId) {
          const sessionUser = usersArr2.find(u => String(u.id) === String(sessionUserId));
          if (!sessionUser?.hideOnline) {
            const snap2 = await storage.get("presence-data");
            const pc = snap2?.value ? JSON.parse(snap2.value) : {};
            const upd = { ...pc, [String(sessionUserId)]: Date.now() };
            setPresenceData(upd);
            await storage.set("presence-data", JSON.stringify(upd));
            presenceInterval.current = setInterval(() => updateMyPresence(sessionUserId, true), 60000);
          } else {
            // مخفي — أرسل 0 لإظهاره كغير متصل
            await updateMyPresence(sessionUserId, false);
          }
        }
      } catch (e) { console.error(e); }

      // اكتمل التحميل — يسمح الآن بالكتابة إلى Firebase
      dataLoadedRef.current = true;
      setVotedLoading(false);
    };
    load();
  }, []);

  // ── حفظ تفضيل اللغة محلياً فقط ──
  useEffect(() => {
    localStorage.setItem("lang-pref", lang);
  }, [lang]);

  // ── Auto-logout after 1 hour of inactivity ──
  useEffect(() => {
    if (!currentUser && !isAdmin) {
      if (inactivityTimer.current) { clearInterval(inactivityTimer.current); inactivityTimer.current = null; }
      return;
    }
    const LIMIT = 60 * 60 * 1000; // 1 hour
    const lastActivity = { t: Date.now() };
    const onActivity = () => { lastActivity.t = Date.now(); };
    const events = ["mousemove", "mousedown", "keypress", "scroll", "touchstart", "click"];
    events.forEach(e => window.addEventListener(e, onActivity, { passive: true }));
    inactivityTimer.current = setInterval(() => {
      if (Date.now() - lastActivity.t > LIMIT) {
        handleLogout();
        setLogoutNotice(true);
        setTimeout(() => setLogoutNotice(false), 5000);
      }
    }, 60000);
    return () => {
      events.forEach(e => window.removeEventListener(e, onActivity));
      if (inactivityTimer.current) { clearInterval(inactivityTimer.current); inactivityTimer.current = null; }
    };
  }, [currentUser?.id, isAdmin]); // eslint-disable-line

  // ── Unified Auth ──
  const handleLogin = async () => {
    // Check admin first
    if (loginForm.username === adminCreds.username && loginForm.password === adminCreds.password) {
      setIsAdmin(true); setLoginError(""); setShowLogin(false);
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
    // تحديث الحضور — لا يُرسل إذا فعّل إخفاء الاتصال
    if (presenceInterval.current) clearInterval(presenceInterval.current);
    if (!u.hideOnline) {
      await updateMyPresence(u.id, true);
      presenceInterval.current = setInterval(() => updateMyPresence(u.id, true), 60000);
    } else {
      await updateMyPresence(u.id, false); // يظهر كغير متصل
    }
    // لوحة التحكم لا تُفتح تلقائياً عند الدخول
  };

  const handleLogout = async () => {
    if (presenceInterval.current) { clearInterval(presenceInterval.current); presenceInterval.current = null; }
    if (currentUser) { await updateMyPresence(currentUser.id, false); setCurrentUser(null); await storage.delete("user-session"); }
    if (isAdmin) { setIsAdmin(false); setShowAdmin(false); await storage.delete("admin-session"); }
    setVoted({});
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
    updateUsers(us => [...us, { id: Date.now(), username, password, name, role: "member", approved: false, createdAt: new Date().toISOString(), avatar: null, hideOnline: false, moderatorPerms: null }]);
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
    const updated = { ...currentUser, name: profileForm.name, avatar: profileForm.avatar, hideOnline: profileForm.hideOnline, ...(profileForm.newPw ? { password: profileForm.newPw } : {}) };
    setCurrentUser(updated); updateUsers(us => us.map(u => u.id === currentUser.id ? updated : u));
    // طبّق الحضور فوراً بناءً على الخيار الجديد
    if (presenceInterval.current) clearInterval(presenceInterval.current);
    if (!profileForm.hideOnline) {
      updateMyPresence(currentUser.id, true);
      presenceInterval.current = setInterval(() => updateMyPresence(currentUser.id, true), 60000);
    } else {
      updateMyPresence(currentUser.id, false); // يظهر كغير متصل فوراً
    }
    setProfileError(""); setProfileSuccess(t("savedSuccess")); setTimeout(() => setProfileSuccess(""), 3000);
  };

  // ── Admin User Mgmt ──
  const handleAdminResetPw = () => {
    if (!resetPwValue || resetPwValue.length < 6) { alert(lang === "ar" ? "6 أحرف على الأقل" : "Min 6 characters"); return; }
    updateUsers(us => us.map(u => u.id === resetPwUserId ? { ...u, password: resetPwValue } : u));
    if (currentUser?.id === resetPwUserId) setCurrentUser(u => ({ ...u, password: resetPwValue }));
    alert(t("resetDone")); setResetPwUserId(null); setResetPwValue("");
  };
  // ── Xcoins helpers ──
  const addCoinsToUser = (userId, delta) => {
    updateUsers(us => us.map(u => u.id === userId ? { ...u, xcoins: Math.max(0, (u.xcoins || 0) + delta) } : u));
    if (currentUser?.id === userId) setCurrentUser(u => ({ ...u, xcoins: Math.max(0, (u.xcoins || 0) + delta) }));
  };
  const farmCoinsChange = (delta) => { if (currentUser) addCoinsToUser(currentUser.id, delta); };

  const approveUser = (id) => updateUsers(us => us.map(u => u.id === id ? { ...u, approved: true, xcoins: (u.xcoins || 0) + 10000 } : u));
  const rejectUser = (id) => { if (confirm(lang === "ar" ? "هل تريد رفض وحذف هذا الحساب؟" : "Reject and delete this account?")) updateUsers(us => us.filter(u => u.id !== id)); };
  const deleteUser = (id) => { if (confirm(lang === "ar" ? "هل تريد حذف هذا المستخدم؟" : "Delete this user?")) { updateUsers(us => us.filter(u => u.id !== id)); if (currentUser?.id === id) { setCurrentUser(null); storage.delete("user-session"); } } };
  const saveEditUser = () => {
    if (!editUserForm.name) return;
    const updated = (u) => ({ ...u, name: editUserForm.name, role: editUserForm.role, moderatorPerms: editUserForm.role === "moderator" ? editUserForm.moderatorPerms : null, ...(editUserForm.password ? { password: editUserForm.password } : {}) });
    updateUsers(us => us.map(u => u.id === editingUser ? updated(u) : u));
    if (currentUser?.id === editingUser) setCurrentUser(u => updated(u));
    setEditingUser(null); setEditUserForm({ name: "", password: "", role: "member", moderatorPerms: DEFAULT_MOD_PERMS });
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
    const votedKey = isAdmin ? "voted-admin" : currentUser ? `voted-${currentUser.id}` : null;
    if (votedKey) storage.set(votedKey, JSON.stringify(newVoted));
    setData(d => {
      const updated = d.votes.map(v => v.id === voteId ? { ...v, options: v.options.map((o, i) => i === optIdx ? { ...o, votes: o.votes + 1 } : o), totalVoters: v.totalVoters + 1 } : v);
      saveToCloud("votes-results", updated);
      return { ...d, votes: updated };
    });
    setVoteMessage({ id: voteId, text: t("voteSuccess") }); setTimeout(() => setVoteMessage(null), 3000);
  };

  const addComment = (eventId) => {
    if (!newComment.trim()) return;
    const username = isAdmin ? (lang === "ar" ? "المدير" : "Admin") : currentUser ? currentUser.name : (lang === "ar" ? "زائر" : "Guest");
    setData(d => {
      const updated = d.events.map(e => e.id === eventId ? { ...e, comments: [...e.comments, { user: username, text: newComment, time: lang === "ar" ? "الآن" : "Now" }] } : e);
      saveToCloud("events-data", updated);
      return { ...d, events: updated };
    });
    setNewComment("");
  };

  // ── Admin Performer Mgmt ──
  const rankColors = { 1: "#D4AF37", 2: "#C0C0C0", 3: "#CD7F32" };
  const savePerformers = (performers, month, monthKey) => {
    saveToCloud("performers-data", { performers, monthName: month, monthKey });
  };
  const addPerformer = () => {
    if (!newPerformer.name) return;
    const r = parseInt(newPerformer.rank) || 1;
    setData(d => {
      const updated = [...d.topPerformers, { id: Date.now(), name: newPerformer.name, avatar: newPerformer.name.charAt(0), color: rankColors[r] || "#1E3A5F", image: newPerformer.image, rank: r }].sort((a, b) => a.rank - b.rank);
      savePerformers(updated, d.performerMonth, d.performerMonthKey);
      return { ...d, topPerformers: updated };
    });
    setNewPerformer({ name: "", image: null, rank: newPerformer.rank });
  };
  const updatePerformerRank = (id, r) => setData(d => {
    const updated = d.topPerformers.map(p => p.id === id ? { ...p, rank: r, color: rankColors[r] || "#1E3A5F" } : p).sort((a, b) => a.rank - b.rank);
    savePerformers(updated, d.performerMonth, d.performerMonthKey);
    return { ...d, topPerformers: updated };
  });
  const handleImageUpload = (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert(lang === "ar" ? "حجم الصورة يجب أن يكون أقل من 2 ميجابايت" : "Image must be less than 2MB"); return; }
    const reader = new FileReader(); reader.onload = (ev) => setNewPerformer(p => ({ ...p, image: ev.target.result })); reader.readAsDataURL(file);
  };

  // ── Admin Event Mgmt ──
  const addEvent = () => {
    if (!newEvent.title) return;
    setData(d => {
      const updated = [{ id: Date.now(), title: newEvent.title, date: new Date().toISOString().split("T")[0], desc: newEvent.desc, comments: [] }, ...d.events];
      saveToCloud("events-data", updated);
      return { ...d, events: updated };
    });
    setNewEvent({ title: "", desc: "" });
  };
  const deleteEvent = (id) => {
    if (confirm(t("deleteEventConfirm"))) setData(d => {
      const updated = d.events.filter(e => e.id !== id);
      saveToCloud("events-data", updated);
      return { ...d, events: updated };
    });
  };
  const saveEditEvent = () => {
    if (!editingEvent?.title) return;
    setData(d => {
      const updated = d.events.map(e => e.id === editingEvent.id ? { ...e, title: editingEvent.title, desc: editingEvent.desc } : e);
      saveToCloud("events-data", updated);
      return { ...d, events: updated };
    });
    setEditingEvent(null);
  };

  // ── Admin Vote Mgmt ──
  const addVoteItem = () => {
    const opts = newVote.options.filter(o => o.trim());
    if (!newVote.title || opts.length < 2) return;
    setData(d => {
      const updated = [{ id: Date.now(), title: newVote.title, status: "active", visibility: newVote.visibility, allowedUsers: newVote.allowedUsers, options: opts.map(o => ({ text: o, votes: 0 })), totalVoters: 0 }, ...d.votes];
      saveToCloud("votes-results", updated);
      return { ...d, votes: updated };
    });
    setNewVote({ title: "", options: ["", ""], visibility: "open", allowedUsers: [] });
  };
  const updateVoteVisibility = (voteId, vis, allowed) => {
    setData(d => {
      const updated = d.votes.map(v => v.id === voteId ? { ...v, visibility: vis, allowedUsers: allowed } : v);
      saveToCloud("votes-results", updated);
      return { ...d, votes: updated };
    });
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
    input: { width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, fontFamily: "'Cairo',sans-serif", fontSize: 16, outline: "none", boxSizing: "border-box", WebkitAppearance: "none", appearance: "none" },
    overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 },
    modal: { background: theme.card, borderRadius: 20, border: `1px solid ${theme.border}`, maxWidth: 620, width: "100%", maxHeight: "88vh", overflow: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.4)" },
    backBtn: { width: 40, height: 40, borderRadius: "50%", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: darkMode ? "rgba(50,20,80,0.85)" : "rgba(200,190,220,0.7)", backdropFilter: "blur(6px)", color: darkMode ? "#fff" : "#3a1a6e", fontSize: 20, fontWeight: 900, flexShrink: 0, transition: "opacity 0.2s" },
  };
  const fade = (d = 0) => ({ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(20px)", transition: `opacity 0.6s ${d}s,transform 0.6s ${d}s` });

  const approvedUsers = users.filter(u => u.approved);
  const pendingUsers = users.filter(u => !u.approved);

  // ══════════════════════════════════════════
  return (
    <div style={S.global}>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes adminGoldShine {
          0%   { text-shadow: 0 0 4px #D4AF37, 0 0 8px #D4AF37; }
          50%  { text-shadow: 0 0 14px #FFD700, 0 0 24px #FFD700, 0 0 36px #FFA500; }
          100% { text-shadow: 0 0 4px #D4AF37, 0 0 8px #D4AF37; }
        }
        .admin-gold { color: #D4AF37 !important; animation: adminGoldShine 2.2s ease-in-out infinite; font-weight: 800 !important; }
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: block !important; }
          .show-mobile-flex { display: flex !important; }
          .ticker-bar { top: 0 !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
          .show-mobile-flex { display: none !important; }
        }
        @keyframes tickerScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes fadeIn    { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp   { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes sheetUp   { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes sheetDown { from { transform: translateY(0); } to { transform: translateY(100%); } }
        @keyframes fadeInBg  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOutBg { from { opacity: 1; } to { opacity: 0; } }
      `}</style>

      {/* ── NAV ── */}
      <nav style={S.nav} className="hidden-mobile">
        <div style={S.navInner}>
          <div style={S.logo}>{t("agencyName")}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }} className="hidden-mobile">
            <button onClick={() => setShowVoting(true)} style={{ ...S.btn, ...S.gold }}>{t("voting")}</button>
            {/* ── Members nav bubble ── */}
            {(currentUser || isAdmin) && approvedUsers.length > 0 && (
              <div ref={membersNavRef} style={{ position: "relative" }}>
                {/* Bubble trigger */}
                <div
                  onClick={() => setShowMembersNav(v => !v)}
                  style={{ display: "flex", alignItems: "center", cursor: "pointer", padding: "4px 2px" }}
                  title={t("membersDropTitle")}
                >
                  {[...approvedUsers].sort((a, b) => (isUserOnline(b.id) ? 1 : 0) - (isUserOnline(a.id) ? 1 : 0)).slice(0, 3).map((u, i) => (
                    <div key={u.id} style={{ width: 30, height: 30, borderRadius: "50%", border: `2px solid ${theme.card}`, marginLeft: i === 0 ? 0 : -8, overflow: "hidden", background: u.avatar ? "none" : `linear-gradient(135deg,${theme.accent},${theme.accent}66)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff", position: "relative", zIndex: 3 - i, flexShrink: 0 }}>
                      {u.avatar ? <img src={u.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : u.name.charAt(0)}
                    </div>
                  ))}
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: theme.accentDim, border: `2px solid ${theme.accent}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: theme.accent, marginLeft: -8, flexShrink: 0 }}>
                    {approvedUsers.length > 3 ? `+${approvedUsers.length - 3}` : approvedUsers.length}
                  </div>
                </div>

                {/* Dropdown */}
                {showMembersNav && (() => {
                  const sortedMems = [...approvedUsers].sort((a, b) => (isUserOnline(b.id) ? 1 : 0) - (isUserOnline(a.id) ? 1 : 0));
                  const pendingReqs = currentUser ? (currentUser.receivedRequests || []) : [];
                  return (
                    <div style={{ position: "absolute", top: "calc(100% + 10px)", [dir === "rtl" ? "right" : "left"]: 0, width: 290, background: theme.card, borderRadius: 16, border: `1px solid ${theme.border}`, boxShadow: "0 8px 32px rgba(0,0,0,0.35)", zIndex: 300, overflow: "hidden", animation: "fadeIn 0.15s ease" }}>
                      {/* Header */}
                      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${theme.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontWeight: 800, fontSize: 14 }}>👥 {t("membersDropTitle")} ({approvedUsers.length})</span>
                        <button onClick={() => setShowMembersNav(false)} style={{ ...S.backBtn, width:32, height:32, fontSize:16 }}>{dir==="rtl"?"❮":"❯"}</button>
                      </div>

                      {/* Follow requests */}
                      {pendingReqs.length > 0 && (
                        <div style={{ padding: "10px 16px", borderBottom: `1px solid ${theme.border}`, background: "rgba(212,175,55,0.04)" }}>
                          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: theme.accent }}>🔔 {t("followRequests")} ({pendingReqs.length})</p>
                          {pendingReqs.map(fromId => {
                            const fromUser = users.find(u => u.id === fromId);
                            if (!fromUser) return null;
                            return (
                              <div key={fromId} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                <div style={{ width: 26, height: 26, borderRadius: "50%", overflow: "hidden", background: fromUser.avatar ? "none" : theme.accentDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                                  {fromUser.avatar ? <img src={fromUser.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : fromUser.name.charAt(0)}
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 700, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fromUser.name}</span>
                                <button onClick={() => acceptFriendRequest(fromId)} style={{ ...S.btn, fontSize: 10, padding: "3px 7px", background: "rgba(46,204,113,0.15)", color: "#2ecc71", border: "1px solid rgba(46,204,113,0.3)" }}>{t("accept")}</button>
                                <button onClick={() => declineFriendRequest(fromId)} style={{ ...S.btn, fontSize: 10, padding: "3px 7px", background: "rgba(231,76,60,0.1)", color: "#e74c3c", border: "1px solid rgba(231,76,60,0.2)" }}>{t("decline")}</button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Members list */}
                      <div style={{ maxHeight: 340, overflowY: "auto" }}>
                        {sortedMems.map(u => {
                          if (currentUser && u.id === currentUser.id) return null;
                          const online = isUserOnline(u.id); // يأخذ hideOnline بالحسبان
                          const status = currentUser ? getFriendStatus(u.id) : "none";
                          const chatKey = currentUser ? getChatKey(currentUser.id, u.id) : isAdmin ? `chat-admin-${u.id}` : null;
                          return (
                            <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: `1px solid ${theme.border}` }}>
                              {/* Avatar + dot */}
                              <div style={{ position: "relative", flexShrink: 0 }}>
                                <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", background: u.avatar ? "none" : `linear-gradient(135deg,${theme.accent},${theme.accent}66)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff" }}>
                                  {u.avatar ? <img src={u.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : u.name.charAt(0)}
                                </div>
                                <span style={{ position: "absolute", bottom: 0, right: 0, width: 9, height: 9, borderRadius: "50%", background: online ? "#2ecc71" : "#95a5a6", border: `2px solid ${theme.card}` }} />
                              </div>
                              {/* Info */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: u.nameColor || "inherit" }}>{u.name}</div>
                                <div style={{ fontSize: 10, color: online ? "#2ecc71" : theme.textMuted }}>{online ? `● ${t("online")}` : t("offline")}</div>
                              </div>
                              {/* Actions */}
                              {(currentUser || isAdmin) && (
                                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                                  {(status === "friends" || isAdmin) && (
                                    <>
                                      <button onClick={() => { const key = chatKey; setOpenChat({ user: u, chatKey: key }); loadChat(key); setShowMembersNav(false); }} style={{ ...S.btn, fontSize: 10, padding: "3px 8px", background: theme.accentDim, color: theme.accent, border: `1px solid ${theme.border}` }}>💬</button>
                                      {status === "friends" && <button onClick={() => removeFriend(u.id)} style={{ ...S.btn, fontSize: 10, padding: "3px 8px", background: "rgba(231,76,60,0.1)", color: "#e74c3c", border: "1px solid rgba(231,76,60,0.2)" }} title={t("removeFriend")}>✕</button>}
                                    </>
                                  )}
                                  {!isAdmin && status === "requested" && <span style={{ fontSize: 10, color: theme.textMuted, fontWeight: 700, padding: "3px 7px" }}>{t("requested")}</span>}
                                  {!isAdmin && status === "receivedRequest" && (
                                    <>
                                      <button onClick={() => acceptFriendRequest(u.id)} style={{ ...S.btn, fontSize: 10, padding: "3px 7px", background: "rgba(46,204,113,0.15)", color: "#2ecc71", border: "1px solid rgba(46,204,113,0.3)" }}>{t("accept")}</button>
                                      <button onClick={() => declineFriendRequest(u.id)} style={{ ...S.btn, fontSize: 10, padding: "3px 7px", background: "rgba(231,76,60,0.1)", color: "#e74c3c", border: "1px solid rgba(231,76,60,0.2)" }}>{t("decline")}</button>
                                    </>
                                  )}
                                  {!isAdmin && status === "none" && <button onClick={() => sendFriendRequest(u.id)} style={{ ...S.btn, fontSize: 10, padding: "3px 8px", background: theme.accentDim, color: theme.accent, border: `1px solid ${theme.border}` }}>+ {t("addFriend")}</button>}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
            {/* Logged-in user/admin name */}
            {(currentUser || isAdmin) && (
              <span style={{ fontSize: 13, fontWeight: 700, color: isAdmin ? "#D4AF37" : theme.accent, padding: "0 4px" }}>
                👤 {isAdmin ? <span className="admin-gold">{lang === "ar" ? "المدير" : "Admin"}</span> : currentUser.name}
                {currentUser?.role === "moderator" && <span style={{ fontSize: 10, marginRight: 4, background: "rgba(52,152,219,0.2)", color: "#3498db", borderRadius: 99, padding: "1px 6px" }}>{t("roleModerator")}</span>}
              </span>
            )}
            {/* Profile button for regular users */}
            {currentUser && <button onClick={() => { setProfileForm({ name: currentUser.name, currentPw: "", newPw: "", confirmPw: "", avatar: currentUser.avatar || null, hideOnline: currentUser.hideOnline || false }); setProfileError(""); setProfileSuccess(""); setShowProfile(true); }} style={{ ...S.btn, ...S.ghost, fontSize: 12 }}>{currentUser.avatar ? <img src={currentUser.avatar} alt="" style={{ width: 18, height: 18, borderRadius: "50%", objectFit: "cover", verticalAlign: "middle", marginLeft: 5 }} /> : "👤"} {t("myAccount")}</button>}
            {/* Games button for logged-in users on desktop */}
            {currentUser && (
              <button
                onClick={() => { if(showGamesLobby && closeLobbyRef.current){ closeLobbyRef.current(); } else { setShowGamesLobby(true); setShowFarmGame(false); setShowMarioGame(false); } }}
                style={{ ...S.btn, ...S.ghost, fontSize: 12, background: (showGamesLobby || showFarmGame || showMarioGame || showFoodWheel) ? "rgba(212,175,55,0.15)" : undefined, color: (showGamesLobby || showFarmGame || showMarioGame || showFoodWheel) ? "#D4AF37" : undefined }}
              >
                🎮 {lang === "ar" ? "العاب" : "Games"}
              </button>
            )}
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
            {!showFarmGame && !showMarioGame && !showFoodWheel && <button onClick={() => setLang(l => l === "ar" ? "en" : "ar")} style={{ ...S.btn, ...S.ghost, padding: "7px 12px", fontWeight: 800, fontSize: 12 }}>🌐 {t("langToggle")}</button>}
          </div>
          <button onClick={() => setMobileMenu(!mobileMenu)} style={{ ...S.btn, ...S.ghost, padding: "8px 12px", display: "none" }} className="show-mobile">☰</button>
        </div>
        {mobileMenu && (
          <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 8 }} className="show-mobile-flex">
            <button onClick={() => { setShowVoting(true); setMobileMenu(false); }} style={{ ...S.btn, ...S.gold, width: "100%" }}>{t("voting")}</button>
            {currentUser && <button onClick={() => { setProfileForm({ name: currentUser.name, currentPw: "", newPw: "", confirmPw: "", avatar: currentUser.avatar || null, hideOnline: currentUser.hideOnline || false }); setShowProfile(true); setMobileMenu(false); }} style={{ ...S.btn, ...S.ghost, width: "100%" }}>{t("myAccount")}</button>}
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

      {/* ══════════════ MOBILE STICKY HEADER (members bar + ticker) ══════════════ */}
      <div className="show-mobile" style={{ position: "sticky", top: 0, zIndex: 90 }}>

      {/* ── MOBILE MEMBERS BAR ── */}
      {(currentUser || isAdmin) && approvedUsers.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
            padding: "10px 16px",
            background: darkMode ? "rgba(10,10,15,0.97)" : "rgba(245,243,238,0.97)",
            backdropFilter: "blur(16px)",
            borderBottom: `1px solid ${theme.border}`,
            direction: "ltr",
          }}
        >
          {/* 3 avatars + count bubble */}
          <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
            {(() => {
              const sorted = [...approvedUsers].sort((a, b) =>
                (isUserOnline(b.id) ? 1 : 0) - (isUserOnline(a.id) ? 1 : 0)
              );
              const visible = sorted.slice(0, 3);
              const rest    = sorted.length - 3;
              return (
                <>
                  {/* count bubble — LEFT side */}
                  <div
                    onClick={() => setShowMobileMembers(true)}
                    style={{
                      width: 40, height: 40, borderRadius: "50%",
                      border: `2px solid ${theme.accent}`,
                      background: theme.accentDim,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 900, color: theme.accent,
                      marginLeft: 0, zIndex: 4, flexShrink: 0,
                      cursor: "pointer", userSelect: "none",
                    }}
                  >
                    {rest > 0 ? `+${rest}` : sorted.length}
                  </div>

                  {visible.map((u, i) => (
                    <div
                      key={u.id}
                      style={{
                        width: 40, height: 40, borderRadius: "50%",
                        border: `2px solid ${theme.card}`,
                        marginLeft: -10,
                        overflow: "hidden",
                        background: u.avatar ? "none" : `linear-gradient(135deg,${theme.accent},${theme.accent}66)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 16, fontWeight: 800, color: "#fff",
                        position: "relative", zIndex: 3 - i, flexShrink: 0,
                      }}
                    >
                      {u.avatar
                        ? <img src={u.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : u.name.charAt(0)}
                    </div>
                  ))}
                </>
              );
            })()}
          </div>

          {/* online count label */}
          <div style={{ fontSize: 11, fontWeight: 700, color: "#2ecc71", fontFamily: "'Cairo',sans-serif", direction: "rtl", whiteSpace: "nowrap" }}>
            <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#2ecc71", marginLeft: 5, verticalAlign: "middle" }} />
            {approvedUsers.filter(u => isUserOnline(u.id)).length} {lang === "ar" ? "متصل" : "online"}
          </div>
        </div>
      )}
      </div>{/* end mobile sticky header */}

      {/* ══════════════ MOBILE MEMBERS SHEET ══════════════ */}
      {showMobileMembers && (currentUser || isAdmin) && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 480, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
          onClick={() => setShowMobileMembers(false)}
        >
          <div
            style={{ background: theme.card, borderRadius: "22px 22px 0 0", border: `1px solid ${theme.border}`, maxHeight: "85vh", display: "flex", flexDirection: "column", animation: "slideUp 0.25s ease" }}
            onClick={e => e.stopPropagation()}
          >
            {/* drag handle */}
            <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px", flexShrink: 0 }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: theme.border }} />
            </div>

            {/* header */}
            <div style={{ padding: "10px 20px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${theme.border}`, direction: dir, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h3 style={{ margin: 0, fontFamily: "'Cairo',sans-serif", fontWeight: 900, fontSize: 18 }}>
                  👥 {lang === "ar" ? "الأعضاء" : "Members"}
                </h3>
                <span style={{ fontSize: 12, padding: "2px 10px", borderRadius: 20, background: theme.accentDim, color: theme.accent, fontWeight: 700 }}>
                  {approvedUsers.length}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#2ecc71", fontFamily: "'Cairo',sans-serif" }}>
                  ● {approvedUsers.filter(u => isUserOnline(u.id)).length} {lang === "ar" ? "متصل" : "online"}
                </span>
                <button onClick={() => setShowMobileMembers(false)} style={S.backBtn}>{dir==="rtl"?"❮":"❯"}</button>
              </div>
            </div>

            {/* members list: online first */}
            <div style={{ overflowY: "auto", flex: 1, direction: dir }}>
              {[...approvedUsers]
                .sort((a, b) => (isUserOnline(b.id) ? 1 : 0) - (isUserOnline(a.id) ? 1 : 0))
                .map((u, i, arr) => {
                  const online = isUserOnline(u.id); // يأخذ hideOnline بالحسبان تلقائياً
                  const isFirstOffline = i > 0 && !online && isUserOnline(arr[i - 1].id);
                  const status = currentUser ? getFriendStatus(u.id) : "none";
                  const isSelf = currentUser?.id === u.id;
                  return (
                    <div key={u.id}>
                      {/* divider between online and offline groups */}
                      {isFirstOffline && (
                        <div style={{ padding: "8px 20px 4px", display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ flex: 1, height: 1, background: theme.border }} />
                          <span style={{ fontSize: 11, color: theme.textMuted, fontWeight: 700, whiteSpace: "nowrap" }}>
                            {lang === "ar" ? "غير متصل" : "Offline"}
                          </span>
                          <div style={{ flex: 1, height: 1, background: theme.border }} />
                        </div>
                      )}

                      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 20px", borderBottom: `1px solid ${theme.border}` }}>
                        {/* avatar + dot */}
                        <div style={{ position: "relative", flexShrink: 0 }}>
                          <div style={{ width: 48, height: 48, borderRadius: "50%", overflow: "hidden", background: u.avatar ? "none" : `linear-gradient(135deg,${theme.accent},${theme.accent}66)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "#fff" }}>
                            {u.avatar ? <img src={u.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : u.name.charAt(0)}
                          </div>
                          <span style={{ position: "absolute", bottom: 1, right: 1, width: 12, height: 12, borderRadius: "50%", background: online ? "#2ecc71" : "#95a5a6", border: `2px solid ${theme.card}` }} />
                        </div>

                        {/* name + status */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: "'Cairo',sans-serif", fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ color: nc(u) }}>{u.name}</span>
                            {isSelf && <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 99, background: theme.accentDim, color: theme.accent, fontWeight: 700 }}>{lang === "ar" ? "أنت" : "You"}</span>}
                            {u.role === "moderator" && <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 99, background: "rgba(52,152,219,0.15)", color: "#3498db", fontWeight: 700 }}>{t("roleModerator")}</span>}
                          </div>
                          <div style={{ fontSize: 11, color: online ? "#2ecc71" : theme.textMuted, fontWeight: 600, fontFamily: "'Cairo',sans-serif", marginTop: 2 }}>
                            {online ? `● ${t("onlineNow")}` : t("offline")}
                          </div>
                        </div>

                        {/* actions (only for other members when logged in as user or admin) */}
                        {(currentUser || isAdmin) && !isSelf && (
                          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                            {(status === "friends" || isAdmin) && (
                              <>
                                <button
                                  onClick={() => { const key = currentUser ? getChatKey(currentUser.id, u.id) : `chat-admin-${u.id}`; setOpenChat({ user: u, chatKey: key }); loadChat(key); setShowMobileMembers(false); }}
                                  style={{ ...S.btn, fontSize: 11, padding: "5px 10px", background: theme.accentDim, color: theme.accent, border: `1px solid ${theme.border}` }}
                                >💬</button>
                                {status === "friends" && <button
                                  onClick={() => removeFriend(u.id)}
                                  style={{ ...S.btn, fontSize: 11, padding: "5px 10px", background: "rgba(231,76,60,0.1)", color: "#e74c3c", border: "1px solid rgba(231,76,60,0.2)" }}
                                >✕</button>}
                              </>
                            )}
                            {!isAdmin && status === "requested" && (
                              <span style={{ fontSize: 11, color: theme.textMuted, fontWeight: 700, padding: "5px 8px" }}>{t("requested")}</span>
                            )}
                            {!isAdmin && status === "receivedRequest" && (
                              <>
                                <button onClick={() => acceptFriendRequest(u.id)} style={{ ...S.btn, fontSize: 11, padding: "5px 10px", background: "rgba(46,204,113,0.15)", color: "#2ecc71", border: "1px solid rgba(46,204,113,0.3)" }}>{t("accept")}</button>
                                <button onClick={() => declineFriendRequest(u.id)} style={{ ...S.btn, fontSize: 11, padding: "5px 10px", background: "rgba(231,76,60,0.1)", color: "#e74c3c", border: "1px solid rgba(231,76,60,0.2)" }}>{t("decline")}</button>
                              </>
                            )}
                            {!isAdmin && status === "none" && (
                              <button onClick={() => sendFriendRequest(u.id)} style={{ ...S.btn, fontSize: 11, padding: "5px 10px", background: theme.accentDim, color: theme.accent, border: `1px solid ${theme.border}` }}>+ {t("addFriend")}</button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              <div style={{ height: 70, flexShrink: 0 }} />
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ CLUB BAR ══════════════
           • Logged in  → scrolling member ticker
           • Guest      → static "Join the Club" CTA
      ══════════════════════════════════════ */}
      {(currentUser || isAdmin) ? (

        /* ─────────── MEMBER VIEW: Ticker ─────────── */
        <div
          dir="ltr"
          style={{
            display: "flex",
            alignItems: "center",
            height: 46,
            overflow: "hidden",
            position: "sticky",
            top: 64,
            zIndex: 90,
            background: darkMode
              ? "linear-gradient(90deg,rgba(212,175,55,0.18) 0%,rgba(10,10,15,0.97) 100%)"
              : "linear-gradient(90deg,rgba(184,148,31,0.14) 0%,rgba(245,243,238,0.97) 100%)",
            backdropFilter: "blur(16px)",
            borderTop: `1px solid ${theme.border}`,
            borderBottom: `1px solid ${theme.border}`,
            boxShadow: "0 2px 12px rgba(0,0,0,0.18)",
          }}
        >
          {/* ── Scrolling viewport ── */}
          <div style={{
            flex: 1,
            overflow: "hidden",
            position: "relative",
            height: "100%",
            display: "flex",
            alignItems: "center",
          }}>
            {/* Fade: left edge */}
            <div style={{
              position: "absolute", left: 0, top: 0, width: 40, height: "100%", zIndex: 1, pointerEvents: "none",
              background: `linear-gradient(to right, ${darkMode ? "#0A0A0F" : "#F5F3EE"}, transparent)`,
            }} />
            {/* Fade: right edge */}
            <div style={{
              position: "absolute", right: 0, top: 0, width: 40, height: "100%", zIndex: 1, pointerEvents: "none",
              background: `linear-gradient(to left, ${darkMode ? "#0A0A0F" : "#F5F3EE"}, transparent)`,
            }} />

            {/*
              ── Double-content technique ──────────────────────────
              Two identical copies of all items are placed end-to-end
              in a single inline-flex row.  The animation shifts the
              entire row by exactly −50 % (= one copy's pixel width).
              When it reaches −50 % the browser resets to 0 % —
              and because both ends are identical, the eye never sees
              the jump.  Result: a perfectly seamless infinite loop.
              ─────────────────────────────────────────────────────
            */}
            {(() => {
                const baseItems = announcements.length > 0 ? announcements : [
                  { id: "d1", text: lang === "ar" ? "مرحباً بكم في نادي وكالة مش مسؤول 🏅" : "Welcome to Mash Mas'ool Agency Club 🏅" },
                  { id: "d2", text: lang === "ar" ? "تابعوا آخر الأخبار والإعلانات الحصرية للأعضاء" : "Stay tuned for exclusive member news & updates" },
                  { id: "d3", text: lang === "ar" ? "نادي وكالة مش مسؤول — حيث يلتقي المبدعون" : "Mash Mas'ool Club — where creators meet" },
                ];
                // كرّر حتى يصل إلى 6 عناصر على الأقل للحصول على لوب سلس بلا فجوات
                const minCount = Math.max(6, baseItems.length * 2);
                const repeated = Array.from({ length: Math.ceil(minCount / baseItems.length) }, () => baseItems).flat();
                // نسختان للـ double-content technique
                const allItems = [...repeated, ...repeated];
                const duration = Math.max(45, baseItems.length * 18);
                return (
                  <div
                    onMouseEnter={() => setTickerPaused(true)}
                    onMouseLeave={() => setTickerPaused(false)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      whiteSpace: "nowrap",
                      animation: `tickerScroll ${duration}s linear infinite`,
                      animationPlayState: tickerPaused ? "paused" : "running",
                      willChange: "transform",
                      cursor: "default",
                    }}
                  >
                    {allItems.map((ann, i) => (
                      <span
                        key={i}
                        dir="rtl"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "0 30px",
                          fontFamily: "'Cairo','Tajawal',sans-serif",
                          fontSize: 13,
                          fontWeight: 600,
                          color: theme.text,
                          lineHeight: 1,
                        }}
                      >
                        <span style={{ color: theme.accent, fontSize: 17, lineHeight: 1, flexShrink: 0 }}>𖠉</span>
                        {ann.text}
                      </span>
                    ))}
                  </div>
                );
              })()}
          </div>
        </div>

      ) : null}

      {(currentUser || isAdmin) ? (<>

        {/* ── HERO ── */}
        <div style={{ ...fade(0.1), textAlign: "center", padding: "60px 24px 20px", position: "relative" }}>
          <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 400, height: 400, background: "radial-gradient(circle,rgba(212,175,55,0.08) 0%,transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
          <h1 style={{ fontSize: "clamp(28px,6vw,52px)", fontWeight: 900, margin: 0 }}>
            <span style={{ background: "linear-gradient(135deg,#D4AF37,#F5E6A3,#D4AF37)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{t("agencyName")}</span>
          </h1>
          <p style={{ color: theme.textMuted, fontSize: 17, marginTop: 10, fontWeight: 600 }}>{t("heroSubtitle")}</p>
        </div>

      {false && (showMembersSection || isAdmin) && approvedUsers.length > 0 && (
        <div style={{ ...fade(0.15), maxWidth: 1200, margin: "0 auto", padding: "0 24px 32px" }}>
          <div style={{ ...S.card, overflow: "hidden" }}>

            {/* ── Header (قابل للنقر لفتح/إغلاق) ── */}
            <div
              onClick={() => setMembersExpanded(e => !e)}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", cursor: "pointer", userSelect: "none" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>👥</span>
                <span style={{ fontSize: 17, fontWeight: 800 }}>{t("membersSection")}</span>
                <span style={{ fontSize: 12, padding: "2px 10px", borderRadius: 20, background: theme.accentDim, color: theme.accent, fontWeight: 700 }}>{approvedUsers.length} {t("membersCount")}</span>
                {!showMembersSection && isAdmin && (
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "rgba(243,156,18,0.15)", color: "#f39c12", fontWeight: 700 }}>
                    {lang === "ar" ? "مخفي عن الزوار" : "Hidden from visitors"}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {/* زر المدير للإخفاء العام */}
                {isAdmin && (
                  <button
                    onClick={e => { e.stopPropagation(); const nv = !showMembersSection; setShowMembersSection(nv); if (dataLoadedRef.current) storage.set("members-visible", String(nv)); }}
                    style={{ ...S.btn, background: showMembersSection ? "rgba(46,204,113,0.15)" : "rgba(149,165,166,0.15)", color: showMembersSection ? "#2ecc71" : theme.textMuted, border: `1px solid ${showMembersSection ? "rgba(46,204,113,0.3)" : theme.border}`, fontSize: 11, padding: "5px 10px" }}
                  >
                    {showMembersSection ? `👁 ${t("membersVisible")}` : `🙈 ${t("membersHidden")}`}
                  </button>
                )}
                {/* سهم الطي/الفتح */}
                <span style={{ fontSize: 18, color: theme.accent, transition: "transform 0.3s", display: "inline-block", transform: membersExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
              </div>
            </div>

            {/* ── قائمة الأعضاء (تظهر/تختفي) ── */}
            {membersExpanded && (
              <div style={{ padding: "0 24px 20px", borderTop: `1px solid ${theme.border}` }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 14, paddingTop: 16 }}>
                  {approvedUsers.map(u => (
                    <div key={u.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 70 }}>
                      <div style={{ position: "relative" }}>
                        <div style={{ width: 52, height: 52, borderRadius: "50%", overflow: "hidden", background: u.avatar ? "none" : `linear-gradient(135deg,${theme.accent},${theme.accent}66)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "#fff", border: `2px solid ${theme.border}` }}>
                          {u.avatar ? <img src={u.avatar} alt={u.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : u.name.charAt(0)}
                        </div>
                        <span style={{ position: "absolute", bottom: 1, right: 1, width: 11, height: 11, borderRadius: "50%", background: isUserOnline(u.id) ? "#2ecc71" : "#95a5a6", border: `2px solid ${theme.card}` }} title={isUserOnline(u.id) ? t("onlineNow") : t("offline")} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, textAlign: "center", maxWidth: 70, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: nc(u) }}>{u.name}</span>
                      {u.role === "moderator" && <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 99, background: "rgba(52,152,219,0.15)", color: "#3498db", fontWeight: 700 }}>{t("roleModerator")}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}


      {/* ══════════════ STORIES BAR ══════════════ */}
      {(currentUser || isAdmin) && (
        <div style={{ background: darkMode ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.03)", borderBottom: `1px solid ${theme.border}`, marginBottom: 8 }}>
          <StoriesBar
            stories={stories}
            currentUser={currentUser}
            isAdmin={isAdmin}
            lang={lang}
            dir={dir}
            onAdd={() => { setStoryText(""); setStoryImage(null); setStoryBg(STORY_COLORS[0]); setStoryType("text"); setShowStoryCreator(true); }}
            onView={(group) => setShowStoryViewer(group)}
          />
        </div>
      )}

      <div style={S.container}>
        {/* ── PERFORMERS ── */}
        <section style={{ ...fade(0.2), marginBottom: 48 }}>
          <div style={S.secTitle}><span style={{ fontSize: 24 }}>🏆</span><span>{t("honorBoard")} {getDisplayMonth()}</span></div>

          {/* ── Desktop grid (unchanged) ── */}
          <div className="hidden-mobile" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 16 }}>
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

          {/* ── Mobile: single card with podium layout ── */}
          <div className="show-mobile">
            {data.topPerformers.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: theme.textMuted }}>
                <span style={{ fontSize: 40, display: "block", marginBottom: 12 }}>🏅</span>
                <p style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>{t("noPerformersMsg")} {getDisplayMonth()} {t("noPerformersYet")}</p>
                <p style={{ fontSize: 13, margin: 0 }}>{t("noPerformersNote")}</p>
              </div>
            ) : (
              <div style={{
                borderRadius: 24,
                overflow: "hidden",
                background: darkMode
                  ? "linear-gradient(160deg,#1a1200 0%,#2a1e00 40%,#0d0d0d 100%)"
                  : "linear-gradient(160deg,#fffbea 0%,#fff8d6 40%,#f5f5f5 100%)",
                border: "2px solid rgba(212,175,55,0.35)",
                boxShadow: "0 12px 48px rgba(212,175,55,0.15)",
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(24px)",
                transition: "all 0.6s 0.2s",
              }}>
                {/* Gold top bar */}
                <div style={{ height: 5, background: "linear-gradient(90deg,#B8860B,#FFD700,#D4AF37,#FFD700,#B8860B)" }} />

                {/* Header inside card */}
                <div style={{ textAlign: "center", padding: "20px 16px 4px" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 3, color: "#D4AF37", textTransform: "uppercase" }}>
                    ✦ أبطال شهر {getDisplayMonth()} ✦
                  </div>
                </div>

                {/* Podium — top 3 first */}
                {(() => {
                  const top3 = data.topPerformers.filter(p => p.rank <= 3).sort((a,b) => a.rank - b.rank);
                  const rest = data.topPerformers.filter(p => p.rank > 3).sort((a,b) => a.rank - b.rank);
                  const podiumOrder = [
                    top3.find(p=>p.rank===2),
                    top3.find(p=>p.rank===1),
                    top3.find(p=>p.rank===3),
                  ].filter(Boolean);
                  const podiumH = { 1: 90, 2: 68, 3: 56 };
                  const podiumCol = { 1: "#FFD700", 2: "#C0C0C0", 3: "#CD7F32" };
                  return (
                    <>
                      {/* Podium avatars */}
                      {podiumOrder.length > 0 && (
                        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "20px 12px 0", gap: 8 }}>
                          {podiumOrder.map((p) => (
                            <div key={p.id} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                              {/* Glow ring */}
                              <div style={{ position: "relative" }}>
                                {p.rank === 1 && (
                                  <div style={{ position: "absolute", inset: -6, borderRadius: "50%", background: "radial-gradient(circle,rgba(255,215,0,0.35) 0%,transparent 70%)", animation: "pulse 2s infinite" }} />
                                )}
                                <div style={{
                                  width: p.rank === 1 ? 80 : 64,
                                  height: p.rank === 1 ? 80 : 64,
                                  borderRadius: "50%",
                                  border: `3px solid ${podiumCol[p.rank]}`,
                                  overflow: "hidden",
                                  background: p.image ? "none" : `linear-gradient(135deg,${p.color},${p.color}88)`,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: p.rank === 1 ? 28 : 22, fontWeight: 900, color: "#fff",
                                  boxShadow: `0 0 ${p.rank===1?24:12}px ${podiumCol[p.rank]}66`,
                                }}>
                                  {p.image ? <img src={p.image} alt={p.name} style={{ width:"100%",height:"100%",objectFit:"cover" }} /> : p.avatar}
                                </div>
                                {/* Medal badge */}
                                <div style={{ position: "absolute", bottom: -4, right: -4, fontSize: 18, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}>
                                  {p.rank===1?"🥇":p.rank===2?"🥈":"🥉"}
                                </div>
                              </div>
                              <div style={{ fontSize: 12, fontWeight: 800, textAlign: "center", maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: podiumCol[p.rank] }}>{p.name}</div>
                              {/* Podium block */}
                              <div style={{
                                width: "100%",
                                height: podiumH[p.rank],
                                borderRadius: "10px 10px 0 0",
                                background: p.rank===1
                                  ? "linear-gradient(180deg,#FFD700,#B8860B)"
                                  : p.rank===2
                                    ? "linear-gradient(180deg,#D8D8D8,#888)"
                                    : "linear-gradient(180deg,#CD7F32,#7A4B1E)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 22, fontWeight: 900, color: "rgba(0,0,0,0.35)",
                                boxShadow: `inset 0 2px 8px rgba(255,255,255,0.2)`,
                              }}>
                                {p.rank}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Rest of performers */}
                      {rest.length > 0 && (
                        <div style={{ padding: "16px 16px 4px", display: "flex", flexDirection: "column", gap: 10 }}>
                          <div style={{ height: 1, background: "rgba(212,175,55,0.2)", marginBottom: 4 }} />
                          {rest.map((p, i) => (
                            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 14, background: darkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", border: "1px solid rgba(212,175,55,0.12)" }}>
                              <div style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0, overflow: "hidden", background: p.image ? "none" : `linear-gradient(135deg,${p.color},${p.color}88)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: "#fff", border: `2px solid ${theme.border}` }}>
                                {p.image ? <img src={p.image} alt={p.name} style={{ width:"100%",height:"100%",objectFit:"cover" }} /> : p.avatar}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 800, fontSize: 14 }}>{p.name}</div>
                              </div>
                              <Badge rank={p.rank} />
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}

                {/* Bottom shimmer bar */}
                <div style={{ height: 4, margin: "16px 0 0", background: "linear-gradient(90deg,transparent,rgba(212,175,55,0.4),transparent)" }} />
              </div>
            )}
          </div>
        </section>

        {/* ── مذكرات نفنف ── */}
        <section style={{ ...fade(0.45), marginBottom: 48 }}>
          <div style={{ ...S.secTitle, position: "relative", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 22 }}>🌙</span>
            <span>مذكرات نفنف</span>
            {naifDiary.length > 0 && Math.max(...naifDiary.map(a => a.ts || a.time || 0)) > lastSeenNaifTs && (
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#E53935", boxShadow: "0 0 6px rgba(229,57,53,0.8)", display: "inline-block", flexShrink: 0 }} />
            )}
          </div>
          <div
            onClick={() => { setShowNaifDiary(true); const now = Date.now(); setLastSeenNaifTs(now); localStorage.setItem("last-seen-naif", String(now)); }}
            style={{
              cursor: "pointer",
              borderRadius: 20,
              overflow: "hidden",
              position: "relative",
              background: darkMode
                ? "linear-gradient(135deg,#1a0533 0%,#2d0a5c 40%,#1a2a6c 100%)"
                : "linear-gradient(135deg,#e8d5ff 0%,#c8b0ff 40%,#a8c4ff 100%)",
              border: `1.5px solid rgba(168,130,255,0.4)`,
              transition: "transform 0.2s, box-shadow 0.2s",
              boxShadow: "0 8px 32px rgba(120,60,220,0.2)",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 18px 48px rgba(120,60,220,0.35)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(120,60,220,0.2)"; }}
          >
            {/* Stars decoration */}
            {["10%","25%","60%","80%","45%","90%"].map((left,i) => (
              <div key={i} style={{ position:"absolute", top:`${10+i*12}%`, left, width:3+i%3, height:3+i%3, borderRadius:"50%", background:"rgba(255,255,255,0.6)", animation:`pulse ${1.5+i*0.3}s infinite` }} />
            ))}
            <div style={{ padding: "32px 28px", display: "flex", alignItems: "center", gap: 24, position: "relative", zIndex: 1 }}>
              {/* Moon + pen icon */}
              <div style={{ flexShrink: 0, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "2px solid rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38, boxShadow: "0 0 30px rgba(200,160,255,0.4)" }}>
                🌙
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: darkMode ? "#E8D5FF" : "#3d0088", marginBottom: 6 }}>مذكرات نفنف</div>
                <div style={{ fontSize: 14, color: darkMode ? "rgba(232,213,255,0.7)" : "rgba(61,0,136,0.65)", lineHeight: 1.7 }}>
                  {naifDiary.length > 0
                    ? `${naifDiary.length} مقال — اضغط لقراءة المذكرات`
                    : "لا توجد مذكرات بعد"}
                </div>
              </div>
              <div style={{ fontSize: 28, color: darkMode ? "rgba(232,213,255,0.5)" : "rgba(61,0,136,0.4)", flexShrink: 0 }}>←</div>
            </div>
          </div>
        </section>

        {/* ── GOLD PRICE — لعيون عبدالعزيز ── */}
        <section style={{ ...fade(0.5), marginBottom: 48 }}>
          <div style={S.secTitle}><span style={{ fontSize: 24 }}>🥇</span><span>لعيون عبدالعزيز — أسعار الذهب</span></div>
          <div style={{ ...S.card, padding: 28, background: "linear-gradient(135deg,rgba(212,175,55,0.12),rgba(212,175,55,0.04))", border: "1.5px solid rgba(212,175,55,0.35)" }}>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <p style={{ margin: 0, fontSize: 13, color: theme.textMuted }}>
                أسعار الذهب بالريال السعودي — سعر عالمي مباشر
              </p>
              {goldLastUpdated && (
                <span style={{ display: "block", fontSize: 11, marginTop: 4, color: "#2ecc71", fontWeight: 700 }}>
                  ● آخر تحديث: {goldLastUpdated.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              )}
            </div>

            {goldLoading ? (
              <div style={{ textAlign: "center", color: theme.textMuted, padding: "20px 0" }}>
                <span style={{ fontSize: 28, display: "block", marginBottom: 8 }}>⏳</span>جاري تحميل السعر...
              </div>
            ) : goldError ? (
              <div style={{ textAlign: "center", color: "#e74c3c", padding: "20px 0" }}>
                <span style={{ fontSize: 28, display: "block", marginBottom: 8 }}>⚠️</span>تعذّر تحميل السعر — تحقق من الاتصال
              </div>
            ) : goldData ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 14 }}>
                {[
                  { label: "عيار 24", value: goldData.k24sar, icon: "🥇", color: "#FFD700" },
                  { label: "عيار 22", value: goldData.k22sar, icon: "🥈", color: "#D4AF37" },
                  { label: "عيار 21", value: goldData.k21sar, icon: "✨", color: "#C9A227" },
                  { label: "عيار 18", value: goldData.k18sar, icon: "💛", color: "#B8960C" },
                ].map((item, i) => (
                  <div key={i} style={{ background: darkMode ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.7)", borderRadius: 14, padding: "18px 16px", textAlign: "center", border: `1px solid ${item.color}44` }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>{item.icon}</div>
                    <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 6, fontWeight: 800 }}>{item.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: item.color, direction: "ltr" }}>
                      {item.value ? item.value.toLocaleString("ar-SA") : "—"}
                    </div>
                    <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>ريال / جرام</div>
                  </div>
                ))}
              </div>
            ) : null}

            {goldData && (
              <p style={{ margin: "16px 0 0", fontSize: 11, color: theme.textMuted, textAlign: "center" }}>
                سعر الأونصة: {goldData.ozUSD?.toLocaleString()} USD · يتحدث كل 5 دقائق · 1 USD = 3.75 SAR
              </p>
            )}
          </div>
        </section>

        {/* ── MARIO — شخصية LV المفضلة ── */}
        <section style={{ ...fade(0.6), marginBottom: 48 }}>
          <div style={S.secTitle}><span style={{ fontSize: 24 }}>🎮</span><span>شخصية LV المفضلة</span></div>
          <div
            onClick={() => setShowMarioGame(true)}
            style={{ ...S.card, padding: 0, overflow: "hidden", cursor: "pointer", position: "relative", border: "2px solid rgba(231,76,60,0.5)", transition: "transform 0.2s, box-shadow 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 16px 48px rgba(231,76,60,0.3)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
          >
            {/* Sky scene */}
            <div style={{ background: "linear-gradient(180deg,#5C94FC 0%,#5C94FC 65%,#5FA020 65%,#3D7A10 100%)", minHeight: 200, position: "relative", overflow: "hidden" }}>
              {/* Clouds */}
              <div style={{ position: "absolute", top: 20, left: "8%", background: "#fff", borderRadius: 999, width: 56, height: 20, boxShadow: "18px -7px 0 7px #fff, 36px 0 0 3px #fff" }} />
              <div style={{ position: "absolute", top: 32, right: "12%", background: "#fff", borderRadius: 999, width: 42, height: 15, boxShadow: "14px -5px 0 5px #fff, 28px 0 0 3px #fff" }} />
              {/* Question blocks */}
              <div style={{ position: "absolute", bottom: 68, left: "18%", width: 34, height: 34, background: "#E8A000", border: "3px solid #000", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 18, color: "#fff", boxShadow: "inset 2px 2px 0 rgba(255,255,255,0.3)" }}>?</div>
              <div style={{ position: "absolute", bottom: 68, right: "18%", width: 34, height: 34, background: "#E8A000", border: "3px solid #000", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 18, color: "#fff", boxShadow: "inset 2px 2px 0 rgba(255,255,255,0.3)" }}>?</div>
              {/* Pixel Mario SVG — made from scratch */}
              <div style={{ position: "absolute", bottom: 38, left: "50%", transform: "translateX(-50%)" }}>
                <svg width="64" height="80" viewBox="0 0 16 20" style={{ imageRendering: "pixelated" }} xmlns="http://www.w3.org/2000/svg">
                  {/* hat top */}
                  <rect x="4" y="0" width="8" height="2" fill="#CC0000"/>
                  <rect x="2" y="2" width="12" height="2" fill="#CC0000"/>
                  {/* face */}
                  <rect x="2" y="4" width="10" height="4" fill="#FAB077"/>
                  <rect x="12" y="5" width="2" height="2" fill="#FAB077"/>
                  {/* eyes */}
                  <rect x="8" y="5" width="2" height="2" fill="#333"/>
                  {/* mustache */}
                  <rect x="3" y="7" width="8" height="1" fill="#5C3010"/>
                  {/* shirt */}
                  <rect x="1" y="8" width="5" height="4" fill="#CC0000"/>
                  <rect x="10" y="8" width="5" height="4" fill="#CC0000"/>
                  {/* overalls */}
                  <rect x="3" y="8" width="10" height="5" fill="#1144CC"/>
                  <rect x="5" y="9" width="2" height="1" fill="#FFD700"/>
                  <rect x="9" y="9" width="2" height="1" fill="#FFD700"/>
                  {/* legs */}
                  <rect x="3" y="13" width="4" height="4" fill="#CC0000"/>
                  <rect x="9" y="13" width="4" height="4" fill="#CC0000"/>
                  {/* shoes */}
                  <rect x="2" y="17" width="6" height="3" fill="#5C3010"/>
                  <rect x="8" y="17" width="6" height="3" fill="#5C3010"/>
                </svg>
              </div>
              {/* Ground brick strip */}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 38, background: "#8B6914", borderTop: "3px solid #5C4510" }}>
                {[0,1,2,3,4,5,6,7,8].map(i => (
                  <div key={i} style={{ position: "absolute", left: i*48, top: 3, width: 44, height: 14, background: "#A07820", border: "1px solid #5C4510" }} />
                ))}
              </div>
            </div>
            {/* Bottom bar */}
            <div style={{ background: "linear-gradient(90deg,#CC0000,#990000)", padding: "14px 22px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 900, color: "#fff", letterSpacing: 1 }}>🍄 SUPER MARIO BROS</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 3 }}>اضغط للعب الآن! 🕹️</div>
              </div>
              <div style={{ width: 46, height: 46, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>▶️</div>
            </div>
          </div>
        </section>


      </div>

      </> ) : (

        /* ══════════════ CLUB GATE PAGE (guests) ══════════════ */
        <div style={{
          minHeight: "calc(100vh - 64px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 24px",
          position: "relative",
          overflow: "hidden",
          direction: dir,
        }}>

          {/* ── Decorative background glows ── */}
          <div style={{ position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(212,175,55,0.10) 0%,transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "5%", right: "-5%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(30,58,95,0.18) 0%,transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: "20%", left: "-5%", width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle,rgba(30,58,95,0.14) 0%,transparent 70%)", pointerEvents: "none" }} />

          {/* ── Card ── */}
          <div style={{
            position: "relative",
            zIndex: 1,
            maxWidth: 500,
            width: "100%",
            textAlign: "center",
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.7s, transform 0.7s",
          }}>

            {/* Medallion */}
            <div style={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              margin: "0 auto 28px",
              background: "linear-gradient(135deg,#D4AF37 0%,#C49B2A 60%,#F5E6A3 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 48,
              boxShadow: "0 0 0 8px rgba(212,175,55,0.12), 0 0 0 16px rgba(212,175,55,0.06), 0 20px 48px rgba(212,175,55,0.35)",
            }}>🏅</div>

            {/* Club name */}
            <h1 style={{
              margin: "0 0 6px",
              fontSize: "clamp(22px,5vw,38px)",
              fontWeight: 900,
              fontFamily: "'Cairo',sans-serif",
              background: "linear-gradient(135deg,#D4AF37,#F5E6A3,#D4AF37)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              lineHeight: 1.3,
            }}>
              {lang === "ar" ? "نادي وكالة مش مسؤول" : "Mash Mas'ool Agency Club"}
            </h1>

            {/* Sub brand */}
            <p style={{ margin: "0 0 16px", fontSize: 14, color: theme.textMuted, fontWeight: 600, fontFamily: "'Cairo',sans-serif", letterSpacing: "0.04em" }}>
              Mash Mas'ool Agency
            </p>

            {/* Divider */}
            <div style={{ width: 56, height: 2, background: `linear-gradient(90deg,transparent,${theme.accent},transparent)`, margin: "0 auto 22px", borderRadius: 2 }} />

            {/* Description */}
            <p style={{
              margin: "0 0 36px",
              fontSize: 14,
              fontWeight: 600,
              color: theme.textMuted,
              lineHeight: 1.9,
              fontFamily: "'Cairo',sans-serif",
            }}>
              {lang === "ar"
                ? "المحتوى الحصري للأعضاء فقط — سجّل دخولك أو أنشئ حساباً جديداً للوصول إلى الأعضاء والأحداث والتصويتات والمزيد"
                : "Exclusive content for members only — log in or create a new account to access members, events, voting and more"}
            </p>

            {/* CTA Buttons */}
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 44 }}>
              <button
                onClick={() => { setShowLogin(true); setLoginTab("login"); setLoginError(""); setLoginForm({ username: "", password: "" }); }}
                style={{ ...S.btn, ...S.gold, fontSize: 14, padding: "13px 34px", borderRadius: 12 }}
              >
                🔑 {lang === "ar" ? "تسجيل الدخول" : "Log In"}
              </button>
              <button
                onClick={() => { setShowLogin(true); setLoginTab("register"); setRegisterError(""); setRegisterForm({ name: "", username: "", password: "", confirm: "" }); }}
                style={{ ...S.btn, ...S.ghost, fontSize: 14, padding: "13px 34px", borderRadius: 12 }}
              >
                ✨ {lang === "ar" ? "إنشاء حساب جديد" : "Create Account"}
              </button>
            </div>

            {/* Feature chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
              {[
                { icon: "🏆", ar: "لوحة الشرف",    en: "Hall of Fame"  },
                { icon: "📢", ar: "الأحداث",        en: "Events"        },
                { icon: "⬡",  ar: "التصويتات",      en: "Voting"        },
                { icon: "👥", ar: "الأعضاء",        en: "Members"       },
                { icon: "💬", ar: "المراسلة",       en: "Messaging"     },
              ].map(f => (
                <div key={f.en} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 14px",
                  borderRadius: 20,
                  background: theme.accentDim,
                  border: `1px solid ${theme.border}`,
                  fontSize: 12,
                  fontWeight: 700,
                  color: theme.textMuted,
                  fontFamily: "'Cairo',sans-serif",
                  opacity: 0.75,
                  userSelect: "none",
                }}>
                  <span>{f.icon}</span>
                  <span>{lang === "ar" ? f.ar : f.en}</span>
                </div>
              ))}
            </div>

          </div>
        </div>

      )}

      {/* ══════════════ VOTING MODAL ══════════════ */}
      {showVoting && (
        <div style={{ position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.65)",backdropFilter:"blur(8px)",display:"flex",flexDirection:"column",justifyContent:"flex-end", animation: closingVoting ? "fadeOutBg 0.32s ease forwards" : "fadeInBg 0.25s ease forwards" }} onClick={() => closeWithAnim(setClosingVoting,setShowVoting)}>
          <div style={{ ...S.modal, borderRadius:"20px 20px 0 0", maxHeight:"92dvh", maxWidth:"100%", width:"100%" }} className="hidden-mobile" onClick={e => e.stopPropagation()} />
          <div style={{ background:theme.card, borderRadius:"22px 22px 0 0", border:`1px solid ${theme.border}`, maxHeight:"92dvh", display:"flex", flexDirection:"column", animation: closingVoting ? "sheetDown 0.32s cubic-bezier(0.4,0,1,1) forwards" : "sheetUp 0.35s cubic-bezier(0,0,0.2,1) forwards", overflowY:"auto", paddingBottom:"calc(72px + env(safe-area-inset-bottom,0px))" }} onClick={e => e.stopPropagation()}>
            {/* drag handle */}
            <div style={{ display:"flex", justifyContent:"center", padding:"10px 0 0", flexShrink:0 }}>
              <div style={{ width:40, height:4, borderRadius:2, background:theme.border }} />
            </div>
            <div style={{ padding: "16px 20px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>⬡ {t("votingSystem")}</h2>
                <button onClick={() => closeWithAnim(setClosingVoting,setShowVoting)} style={S.backBtn}>{dir==="rtl"?"❮":"❯"}</button>
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
      {showAdmin && (() => {
        const isMobileSection = !!mobileAdminSection;
        const sectionMeta = {
          performers:    { icon: "🏆", ar: "المتميزون",  en: "Performers"    },
          events:        { icon: "📢", ar: "الأحداث",    en: "Events"        },
          votes:         { icon: "⬡",  ar: "التصويتات",  en: "Votes"         },
          announcements: { icon: "📣", ar: "الإعلانات",  en: "Announcements" },
          users:         { icon: "👥", ar: "المستخدمون", en: "Users"         },
        };
        const closeMobile = () => { setShowAdmin(false); setMobileAdminSection(null); setShowMobileProfile(true); const u = currentUser; if (u) { setMpName(u.name); setMpAvatar(u.avatar||null); setMpHideOnline(u.hideOnline||false); setMpNameColor(u.nameColor||null); } setMpAdminOpen(true); };
        const overlayStyle = isMobileSection
          ? { ...S.overlay, justifyContent: "flex-end", padding: 0, alignItems: "flex-end" }
          : S.overlay;
        const boxStyle = isMobileSection
          ? { background: theme.card, borderRadius: "22px 22px 0 0", border: `1px solid ${theme.border}`, width: "100%", maxWidth: "100%", height: "calc(100vh - 70px)", overflowY: "auto", boxShadow: "0 -8px 32px rgba(0,0,0,0.3)", animation: "slideUp 0.25s ease" }
          : { ...S.modal, maxWidth: 680 };
        return (
        <div style={overlayStyle} onClick={() => isMobileSection ? closeMobile() : setShowAdmin(false)}>
          <div style={boxStyle} onClick={e => e.stopPropagation()}>

            {/* ── Mobile section header ── */}
            {isMobileSection ? (
              <div style={{ direction: dir, flexShrink: 0 }}>
                {/* drag handle */}
                <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
                  <div style={{ width: 40, height: 4, borderRadius: 2, background: theme.border }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px 14px", borderBottom: `1px solid ${theme.border}` }}>
                  {/* back button */}
                  <button
                    onClick={closeMobile}
                    style={{ ...S.btn, ...S.ghost, padding: "7px 12px", fontSize: 18, lineHeight: 1, flexShrink: 0 }}
                  >{dir === "rtl" ? "›" : "‹"}</button>
                  <span style={{ fontSize: 22 }}>{sectionMeta[mobileAdminSection]?.icon}</span>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, flex: 1, fontFamily: "'Cairo',sans-serif" }}>
                    {lang === "ar" ? sectionMeta[mobileAdminSection]?.ar : sectionMeta[mobileAdminSection]?.en}
                  </h2>
                  <button onClick={closeMobile} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: theme.textMuted, padding: 0 }}>✕</button>
                </div>
              </div>
            ) : (
              /* ── Desktop header ── */
              <div style={{ padding: "24px 28px 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>{t("adminPanelTitle")}</h2>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setShowAdminChangePw(true)} style={{ ...S.btn, ...S.ghost, fontSize: 11, padding: "6px 10px" }}>🔑 {t("changeAdminPassword")}</button>
                    <button onClick={() => setShowAdmin(false)} style={{ ...S.btn, ...S.ghost, padding: "6px 12px" }}>✕</button>
                  </div>
                </div>
                {/* tab bar — hidden on mobile section mode */}
                <div style={{ display: "flex", gap: 0, borderBottom: `2px solid ${theme.border}`, flexWrap: "wrap" }}>
                  {[{ key: "performers", label: t("tabPerformers") }, { key: "votes", label: t("tabVotes") }, { key: "announcements", label: t("tabAnnouncements") }, { key: "diary", label: t("tabDiary") }, { key: "naif", label: "🌙 مذكرات نفنف" }, { key: "users", label: <>{t("tabUsers")}{pendingUsers.length > 0 && <span style={{ background: "#e74c3c", color: "#fff", borderRadius: 99, padding: "1px 6px", fontSize: 10, marginRight: 4 }}>{pendingUsers.length}</span>}</> }].map(tab => (
                    <button key={tab.key} onClick={() => setAdminTab(tab.key)} style={{ ...S.btn, background: "transparent", borderRadius: "10px 10px 0 0", color: adminTab === tab.key ? theme.accent : theme.textMuted, borderBottom: adminTab === tab.key ? `2px solid ${theme.accent}` : "2px solid transparent", marginBottom: -2, fontWeight: 700, fontSize: 13 }}>{tab.label}</button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ padding: isMobileSection ? "20px 20px 32px" : "24px 28px 28px" }}>

              {/* ── PERFORMERS TAB ── */}
              {adminTab === "performers" && (
                <div>
                  <div style={{ marginBottom: 20, padding: 16, borderRadius: 12, background: theme.accentDim, border: `1px solid ${theme.border}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 700, color: theme.textMuted, display: "block", marginBottom: 6 }}>{t("honorMonth")}</label>
                        <select value={data.performerMonth} onChange={e => { const nm = e.target.value; setData(d => { const upd = { ...d, performerMonth: nm }; savePerformers(d.topPerformers, nm, d.performerMonthKey); return upd; }); }} style={{ ...S.input, width: "auto", minWidth: 140, cursor: "pointer" }}>
                          {ARABIC_MONTHS.map((m, idx) => <option key={m} value={m}>{lang === "en" ? ENGLISH_MONTHS[idx] : m}</option>)}
                        </select>
                      </div>
                      <button onClick={() => { if (confirm(t("newMonthConfirm"))) { const nm = getCurrentMonthName(); const nk = getCurrentMonthKey(); setData(d => { savePerformers([], nm, nk); return { ...d, topPerformers: [], performerMonth: nm, performerMonthKey: nk }; }); } }} style={{ ...S.btn, ...S.ghost, fontSize: 12, color: "#f39c12", borderColor: "rgba(243,156,18,0.3)" }}>{t("newMonthBtn")}</button>
                    </div>
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>{t("addPerformerTitle")}</h3>

                  {/* إضافة من الأعضاء المسجلين — أكورديون بسهم */}
                  {approvedUsers.length > 0 && (() => {
                    const selUser = approvedUsers.find(u => String(u.id) === newPerformerFromMember);
                    return (
                      <div style={{ marginBottom: 14, borderRadius: 10, border: `1px solid ${newPerformerFromMember ? theme.accent : theme.border}`, overflow: "hidden", transition: "border-color 0.2s" }}>
                        {/* رأس القائمة — قابل للضغط */}
                        <div
                          onClick={() => setNewPerformerFromMember(v => v === "__open__" ? "" : v || "__open__")}
                          style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", background: theme.accentDim, userSelect: "none" }}
                        >
                          {/* صورة العضو المختار أو أيقونة */}
                          {selUser ? (
                            <div style={{ width: 32, height: 32, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: selUser.avatar ? "none" : `linear-gradient(135deg,${theme.accent},${theme.accent}88)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff", border: `2px solid ${theme.accent}` }}>
                              {selUser.avatar ? <img src={selUser.avatar} alt={selUser.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : selUser.name.charAt(0)}
                            </div>
                          ) : (
                            <span style={{ fontSize: 18, flexShrink: 0 }}>👥</span>
                          )}
                          <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: selUser ? theme.accent : theme.textMuted }}>
                            {selUser ? selUser.name : t("addFromMembers")}
                          </span>
                          {selUser && <span style={{ fontSize: 11, color: theme.textMuted, background: theme.bg, padding: "1px 7px", borderRadius: 99 }}>ID: {selUser.username}</span>}
                          {selUser && (
                            <button
                              type="button"
                              onClick={e => { e.stopPropagation(); setNewPerformerFromMember(""); setNewPerformer(p => ({ ...p, name: "", image: null })); }}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "#e74c3c", fontSize: 16, padding: "0 2px", flexShrink: 0 }}
                            >✕</button>
                          )}
                          {/* السهم */}
                          <span style={{ fontSize: 12, color: theme.textMuted, flexShrink: 0, transition: "transform 0.25s", display: "inline-block", transform: (newPerformerFromMember === "__open__" || !newPerformerFromMember) && newPerformerFromMember === "__open__" ? "rotate(180deg)" : newPerformerFromMember && newPerformerFromMember !== "__open__" ? "rotate(0deg)" : "rotate(0deg)" }}>▼</span>
                        </div>
                        {/* قائمة الأعضاء — تظهر عند الضغط */}
                        {newPerformerFromMember === "__open__" && (
                          <div style={{ maxHeight: 220, overflowY: "auto", background: theme.bg }}>
                            {approvedUsers.map(u => (
                              <div
                                key={u.id}
                                onClick={() => { setNewPerformerFromMember(String(u.id)); setNewPerformer(p => ({ ...p, name: u.name, image: u.avatar || null })); }}
                                style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 14px", cursor: "pointer", borderTop: `1px solid ${theme.border}`, transition: "background 0.15s" }}
                                onMouseEnter={e => e.currentTarget.style.background = theme.accentDim}
                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                              >
                                <div style={{ width: 38, height: 38, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: u.avatar ? "none" : `linear-gradient(135deg,${theme.accent},${theme.accent}88)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: "#fff", border: `2px solid ${theme.border}` }}>
                                  {u.avatar ? <img src={u.avatar} alt={u.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : u.name.charAt(0)}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontWeight: 700, fontSize: 13, color: theme.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name}</div>
                                  <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2, display: "flex", gap: 6 }}>
                                    <span style={{ background: theme.accentDim, padding: "1px 7px", borderRadius: 99, fontWeight: 700 }}>ID: {u.username}</span>
                                    {u.role === "moderator" && <span style={{ color: "#3498db", fontWeight: 700 }}>{t("roleModerator")}</span>}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

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
                    <button onClick={() => { addPerformer(); setNewPerformerFromMember(""); }} style={{ ...S.btn, ...S.gold }}>{t("addBtn")}</button>
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
                          <button onClick={() => setData(d => { const updated = d.topPerformers.filter(x => x.id !== p.id); savePerformers(updated, d.performerMonth, d.performerMonthKey); return { ...d, topPerformers: updated }; })} style={{ ...S.btn, ...S.ghost, padding: "3px 10px", fontSize: 12, color: "#e74c3c" }}>{t("deleteBtn")}</button>
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
                      {modCan("events","add") && <>
                      <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>{t("addNewEvent")}</h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <input value={newEvent.title} onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))} placeholder={t("eventTitlePh")} style={S.input} />
                        <textarea value={newEvent.desc} onChange={e => setNewEvent(p => ({ ...p, desc: e.target.value }))} placeholder={t("eventDescPh")} rows={3} style={{ ...S.input, resize: "vertical" }} />
                        <button onClick={addEvent} style={{ ...S.btn, ...S.gold }}>{t("addEventBtn")}</button>
                      </div>
                      </>}
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
                          {modCan("events","edit") && <button onClick={() => setEditingEvent({ id: ev.id, title: ev.title, desc: ev.desc })} style={{ ...S.btn, ...S.ghost, padding: "3px 10px", fontSize: 12, color: theme.accent }}>{t("editBtn")}</button>}
                          {modCan("events","delete") && <button onClick={() => deleteEvent(ev.id)} style={{ ...S.btn, ...S.ghost, padding: "3px 10px", fontSize: 12, color: "#e74c3c" }}>{t("deleteBtn")}</button>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── VOTES TAB ── */}
              {adminTab === "votes" && (
                <div>
                  {modCan("votes","add") && (
                    <>
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
                    </>
                  )}

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
                            {modCan("votes","edit") && <button onClick={() => setEditingVoteVis(editingVoteVis === v.id ? null : v.id)} style={{ ...S.btn, ...S.ghost, padding: "3px 10px", fontSize: 11, color: theme.accent }}>🔐</button>}
                            {v.status === "active" && modCan("votes","edit") && <button onClick={() => setData(d => { const updated = d.votes.map(x => x.id === v.id ? { ...x, status: "ended" } : x); saveToCloud("votes-results", updated); return { ...d, votes: updated }; })} style={{ ...S.btn, ...S.ghost, padding: "3px 10px", fontSize: 12, color: "#f39c12" }}>{t("endVoteBtn")}</button>}
                            {modCan("votes","delete") && <button onClick={() => { if (confirm(t("deleteVoteConfirm"))) setData(d => { const updated = d.votes.filter(x => x.id !== v.id); saveToCloud("votes-results", updated); return { ...d, votes: updated }; }); }} style={{ ...S.btn, ...S.ghost, padding: "3px 10px", fontSize: 12, color: "#e74c3c" }}>{t("deleteBtn")}</button>}
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

              {/* ── ANNOUNCEMENTS TAB ── */}
              {adminTab === "announcements" && (
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>📣 {t("announcementsTitle")}</h3>
                  {modCan("announcements", "add") && (
                    <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                      <input
                        value={newAnnouncement}
                        onChange={e => setNewAnnouncement(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && newAnnouncement.trim()) { updateAnnouncements(a => [...a, { id: Date.now(), text: newAnnouncement.trim() }]); setNewAnnouncement(""); } }}
                        placeholder={t("addAnnouncementPh")}
                        style={{ ...S.input, flex: 1 }}
                      />
                      <button
                        onClick={() => { if (newAnnouncement.trim()) { updateAnnouncements(a => [...a, { id: Date.now(), text: newAnnouncement.trim() }]); setNewAnnouncement(""); } }}
                        style={{ ...S.btn, ...S.gold, whiteSpace: "nowrap" }}
                      >{t("addAnnouncementBtn")}</button>
                    </div>
                  )}
                  {announcements.length === 0 ? (
                    <p style={{ textAlign: "center", color: theme.textMuted, padding: "24px 0", fontSize: 14 }}>{t("noAnnouncements")}</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {announcements.map((ann) => (
                        <div key={ann.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: theme.accentDim, border: `1px solid ${theme.border}` }}>
                          <span style={{ color: theme.accent, fontSize: 16, flexShrink: 0 }}>𖠉</span>
                          <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{ann.text}</span>
                          {modCan("announcements", "delete") && (
                            <button onClick={() => { if (window.confirm(t("deleteAnnouncementConfirm"))) updateAnnouncements(a => a.filter(x => x.id !== ann.id)); }} style={{ ...S.btn, background: "transparent", color: "#e74c3c", fontSize: 12, padding: "4px 8px", border: "none" }}>✕</button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── Broadcast section ── */}
                  {(isAdmin || modCan("broadcast", "send")) && (
                    <div style={{ marginTop: 28, paddingTop: 20, borderTop: `1px solid ${theme.border}` }}>
                      <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>📢 {t("sectionBroadcast")}</h3>
                      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                        <input
                          value={broadcastInput}
                          onChange={e => setBroadcastInput(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") sendBroadcast(); }}
                          placeholder={t("broadcastPh")}
                          style={{ ...S.input, flex: 1 }}
                        />
                        <button onClick={sendBroadcast} style={{ ...S.btn, ...S.gold, whiteSpace: "nowrap" }}>{t("sendBroadcast")}</button>
                      </div>
                      {broadcasts.length === 0 ? (
                        <p style={{ textAlign: "center", color: theme.textMuted, fontSize: 13, padding: "16px 0" }}>{t("noBroadcasts")}</p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 200, overflowY: "auto" }}>
                          {[...broadcasts].reverse().map(msg => (
                            <div key={msg.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", borderRadius: 10, background: "rgba(212,175,55,0.06)", border: `1px solid ${theme.border}` }}>
                              <span style={{ fontSize: 16, flexShrink: 0 }}>📢</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div className={msg.userId === "admin" ? "admin-gold" : ""} style={{ fontSize: 11, fontWeight: 700, color: msg.userId === "admin" ? "#D4AF37" : (() => { const u = users.find(x => String(x.id) === String(msg.userId)); return u?.nameColor || theme.accent; })(), marginBottom: 2 }}>{msg.name}</div>
                                <div style={{ fontSize: 13, fontWeight: 600, wordBreak: "break-word" }}>{msg.text}</div>
                              </div>
                              {isAdmin && (
                                <button onClick={() => updateBroadcasts(b => b.filter(x => x.id !== msg.id))} style={{ ...S.btn, background: "transparent", color: "#e74c3c", fontSize: 12, padding: "2px 6px", border: "none", flexShrink: 0 }}>✕</button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── DIARY TAB ── */}
              {adminTab === "diary" && (
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>📓 {t("diaryTitle")}</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                    <input
                      value={newDiaryTitle}
                      onChange={e => setNewDiaryTitle(e.target.value)}
                      placeholder={t("diaryAddTitle")}
                      style={S.input}
                    />
                    <textarea
                      value={newDiaryContent}
                      onChange={e => setNewDiaryContent(e.target.value)}
                      placeholder={t("diaryAddContent")}
                      rows={4}
                      style={{ ...S.input, resize: "vertical", lineHeight: 1.7 }}
                    />
                    <button
                      onClick={() => {
                        if (!newDiaryTitle.trim() || !newDiaryContent.trim()) return;
                        const entry = {
                          id: Date.now(),
                          title: newDiaryTitle.trim(),
                          content: newDiaryContent.trim(),
                          author: isAdmin ? "المدير" : currentUser?.name || "مجهول",
                          date: new Date().toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US"),
                        };
                        updateDiary(d => [entry, ...d]);
                        setNewDiaryTitle("");
                        setNewDiaryContent("");
                      }}
                      style={{ ...S.btn, ...S.gold }}
                    >{t("diaryAddBtn")}</button>
                  </div>
                  {diary.length === 0 ? (
                    <p style={{ textAlign: "center", color: theme.textMuted, fontSize: 13, padding: "16px 0" }}>{t("diaryEmpty")}</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {diary.map(entry => (
                        <div key={entry.id} style={{ padding: "14px 16px", borderRadius: 12, background: theme.accentDim, border: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>{entry.title}</div>
                            <div style={{ fontSize: 12, color: theme.textMuted }}>🖊 {entry.author} · 📅 {entry.date}</div>
                            <p style={{ fontSize: 13, color: theme.text, margin: "6px 0 0", lineHeight: 1.7, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{entry.content}</p>
                          </div>
                          <button onClick={() => { if (confirm(t("diaryDeleteConfirm"))) updateDiary(d => d.filter(x => x.id !== entry.id)); }} style={{ ...S.btn, background: "transparent", color: "#e74c3c", fontSize: 13, padding: "4px 8px", border: "none", flexShrink: 0 }}>{t("deleteBtn")}</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── NAIF DIARY TAB ── */}
              {adminTab === "naif" && (
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14, color: "#9b59b6" }}>🌙 مذكرات نفنف — كتابة مقال جديد</h3>
                  {modCan("naifDiary","add") && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                    <input
                      value={newNaifTitle}
                      onChange={e => setNewNaifTitle(e.target.value)}
                      placeholder="عنوان المقال..."
                      style={S.input}
                    />
                    <textarea
                      value={newNaifContent}
                      onChange={e => setNewNaifContent(e.target.value)}
                      placeholder="اكتب مذكرتك هنا..."
                      rows={6}
                      style={{ ...S.input, resize: "vertical", lineHeight: 1.8 }}
                    />
                    {/* Images in admin tab */}
                    <div>
                      <div style={{ fontSize:12,fontWeight:700,color:"#9b59b6",marginBottom:8 }}>📷 الصور (اختياري)</div>
                      <div style={{ display:"flex",flexWrap:"wrap",gap:8,alignItems:"flex-start" }}>
                        {naifWriteImages.map((img,idx) => (
                          <div key={idx} style={{ position:"relative",width:80,height:80,borderRadius:10,overflow:"hidden",border:"2px solid rgba(155,89,182,0.3)" }}>
                            <img src={img} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }} />
                            <button onClick={() => setNaifWriteImages(imgs => imgs.filter((_,i)=>i!==idx))} style={{ position:"absolute",top:2,right:2,background:"rgba(0,0,0,0.6)",border:"none",color:"#fff",width:18,height:18,borderRadius:"50%",cursor:"pointer",fontSize:10,fontWeight:900 }}>✕</button>
                          </div>
                        ))}
                        <label htmlFor="naif-admin-img" style={{ width:80,height:80,borderRadius:10,border:"2px dashed rgba(155,89,182,0.4)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",background:"rgba(155,89,182,0.05)" }}>
                          <span style={{ fontSize:22 }}>📷</span>
                          <span style={{ fontSize:10,color:"#9b59b6",fontWeight:700,marginTop:4 }}>إضافة</span>
                          <input id="naif-admin-img" type="file" accept="image/*" multiple style={{ display:"none" }}
                            onChange={e => { Array.from(e.target.files).forEach(file => { if (file.size>3*1024*1024){alert("الصورة أكبر من 3MB");return;} const reader=new FileReader(); reader.onload=ev=>setNaifWriteImages(imgs=>[...imgs,ev.target.result]); reader.readAsDataURL(file); }); e.target.value=""; }} />
                        </label>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (!newNaifTitle.trim() || !newNaifContent.trim()) return;
                        const entry = {
                          id: Date.now(),
                          title: newNaifTitle.trim(),
                          content: newNaifContent.trim(),
                          date: new Date().toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US"),
                          images: [...naifWriteImages],
                          reactions: {},
                          userReactions: {},
                          comments: [],
                        };
                        updateNaifDiary(d => [entry, ...d]);
                        setNewNaifTitle("");
                        setNewNaifContent("");
                        setNaifWriteImages([]);
                      }}
                      style={{ ...S.btn, background: "linear-gradient(90deg,#9b59b6,#6c5ce7)", color: "#fff", border: "none", fontWeight: 800, padding: "12px" }}
                    >+ نشر المقال</button>
                  </div>
                  )}
                  <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 16 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 12, color: theme.textMuted }}>المقالات المنشورة ({naifDiary.length})</h4>
                    {naifDiary.length === 0 ? (
                      <p style={{ fontSize: 13, color: theme.textMuted, textAlign: "center", padding: "16px 0" }}>لا توجد مقالات بعد</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {naifDiary.map(entry => (
                          <div key={entry.id} style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(155,89,182,0.07)", border: "1px solid rgba(155,89,182,0.2)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 2, color: "#9b59b6" }}>{entry.title}</div>
                              <div style={{ fontSize: 11, color: theme.textMuted }}>📅 {entry.date} · 💬 {(entry.comments||[]).length} تعليق · 🔥 {Object.values(entry.reactions||{}).reduce((a,b)=>a+b,0)} تفاعل</div>
                            </div>
                            {modCan("naifDiary","delete") && <button onClick={() => { if (window.confirm("هل تريد حذف هذا المقال؟")) updateNaifDiary(d => d.filter(x => x.id !== entry.id)); }} style={{ ...S.btn, background: "transparent", color: "#e74c3c", fontSize: 13, padding: "4px 8px", border: "none", flexShrink: 0 }}>حذف</button>}
                          </div>
                        ))}
                      </div>
                    )}
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
                            <select value={editUserForm.role} onChange={e => { const r = e.target.value; setEditUserForm(f => ({ ...f, role: r, moderatorPerms: r === "moderator" ? (f.moderatorPerms || DEFAULT_MOD_PERMS) : DEFAULT_MOD_PERMS })); }} style={{ ...S.input, cursor: "pointer" }}>
                              <option value="member">{t("roleMember")}</option>
                              <option value="moderator">{t("roleModerator")}</option>
                            </select>
                            {editUserForm.role === "moderator" && (
                              <div style={{ borderRadius: 10, background: theme.accentDim, border: `1px solid ${theme.border}`, padding: "10px 12px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                                  <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: theme.accent }}>🛡 {t("moderatorPerms")}</p>
                                  <div style={{ display: "flex", gap: 4 }}>
                                    <button type="button" onClick={() => setEditUserForm(f => ({ ...f, moderatorPerms: DEFAULT_MOD_PERMS }))} style={{ ...S.btn, ...S.ghost, padding: "2px 8px", fontSize: 10 }}>{t("allPerms")}</button>
                                    <button type="button" onClick={() => setEditUserForm(f => ({ ...f, moderatorPerms: { performers:{add:false,edit:false,delete:false}, events:{add:false,edit:false,delete:false}, votes:{add:false,edit:false,delete:false}, users:{view:false,approve:false}, announcements:{add:false,delete:false}, broadcast:{send:false}, naifDiary:{add:false,edit:false,delete:false} } }))} style={{ ...S.btn, ...S.ghost, padding: "2px 8px", fontSize: 10, color:"#e74c3c" }}>{t("noPerms")}</button>
                                  </div>
                                </div>
                                {[
                                  { sec: "performers",   label: t("sectionPerformers"),   actions: [["add",t("permAdd")],["edit",t("permEdit")],["delete",t("permDelete")]] },
                                  { sec: "events",       label: t("sectionEvents"),        actions: [["add",t("permAdd")],["edit",t("permEdit")],["delete",t("permDelete")]] },
                                  { sec: "votes",        label: t("sectionVotes"),         actions: [["add",t("permAdd")],["edit",t("permEdit")],["delete",t("permDelete")]] },
                                  { sec: "announcements",label: t("sectionAnnouncements"), actions: [["add",t("permAdd")],["delete",t("permDelete")]] },
                                  { sec: "broadcast",    label: t("sectionBroadcast"),     actions: [["send",t("permSend")]] },
                                  { sec: "naifDiary",    label: t("sectionNaifDiary"),     actions: [["add",t("permAdd")],["edit",t("permEdit")],["delete",t("permDelete")]] },
                                  { sec: "users",        label: t("sectionUsers"),         actions: [["view",t("permView")],["approve",t("permApprove")]] },
                                ].map(({ sec, label, actions }) => {
                                  const allOn = actions.every(([act]) => !!(editUserForm.moderatorPerms?.[sec]?.[act]));
                                  const anyOn = actions.some(([act]) => !!(editUserForm.moderatorPerms?.[sec]?.[act]));
                                  return (
                                  <div key={sec} style={{ marginBottom: 8, borderRadius: 10, background: theme.card, border: `1px solid ${anyOn ? theme.accent : theme.border}`, overflow: "hidden", transition: "border-color 0.2s" }}>
                                    {/* Section header row — tap to toggle all */}
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", cursor: "pointer", borderBottom: `1px solid ${theme.border}` }}
                                      onClick={() => setEditUserForm(f => { const newSec = {}; actions.forEach(([act]) => newSec[act] = !allOn); return { ...f, moderatorPerms: { ...f.moderatorPerms, [sec]: { ...(f.moderatorPerms?.[sec]||{}), ...newSec } } }; })}>
                                      <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: anyOn ? theme.accent : theme.textMuted }}>{label}</p>
                                      <div style={{ width: 36, height: 20, borderRadius: 99, background: allOn ? theme.accent : theme.border, position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                                        <div style={{ position: "absolute", top: 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "all 0.2s", [dir==="rtl"?"right":"left"]: allOn ? "calc(100% - 18px)" : 2 }} />
                                      </div>
                                    </div>
                                    {/* Individual permissions */}
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "8px 12px" }}>
                                      {actions.map(([act, actLabel]) => {
                                        const on = !!(editUserForm.moderatorPerms?.[sec]?.[act]);
                                        return (
                                          <label key={act} onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 99, border: `1px solid ${on ? theme.accent : theme.border}`, background: on ? theme.accentDim : "transparent", cursor: "pointer", userSelect: "none", transition: "all 0.15s" }}>
                                            <input type="checkbox" style={{ display:"none" }} checked={on} onChange={e => setEditUserForm(f => ({ ...f, moderatorPerms: { ...f.moderatorPerms, [sec]: { ...(f.moderatorPerms?.[sec] || {}), [act]: e.target.checked } } }))} />
                                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: on ? theme.accent : theme.border, flexShrink: 0, transition: "background 0.15s" }} />
                                            <span style={{ fontSize: 12, fontWeight: 700, color: on ? theme.accent : theme.textMuted }}>{actLabel}</span>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  </div>
                                  );
                                })}
                              </div>
                            )}
                            <div style={{ display: "flex", gap: 8 }}>
                              <button onClick={() => saveEditUser()} style={{ ...S.btn, ...S.gold, flex: 1 }}>{t("saveChanges")}</button>
                              <button onClick={() => setEditingUser(null)} style={{ ...S.btn, ...S.ghost }}>{t("cancelBtn")}</button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              {/* Avatar */}
                              <div style={{ width: 34, height: 34, borderRadius: "50%", overflow: "hidden", background: u.avatar ? "none" : theme.accentDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: theme.accent, flexShrink: 0, border: `1px solid ${theme.border}` }}>
                                {u.avatar ? <img src={u.avatar} alt={u.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : u.name.charAt(0)}
                              </div>
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <span style={{ fontWeight: 700, fontSize: 14 }}>{u.name}</span>
                                  {/* مؤشر الاتصال - المدير يرى الحقيقة دائماً */}
                                  {isAdmin ? (
                                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: isUserOnline(u.id) ? "#2ecc71" : "#95a5a6", display: "inline-block", title: isUserOnline(u.id) ? t("onlineNow") : t("offline") }} title={isUserOnline(u.id) ? t("onlineNow") : t("offline")} />
                                  ) : (!u.hideOnline && isUserOnline(u.id) && (
                                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2ecc71", display: "inline-block" }} />
                                  ))}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                  <span style={{ color: theme.textMuted, fontSize: 11 }}>@{u.username}</span>
                                  <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 20, background: u.role === "moderator" ? "rgba(52,152,219,0.15)" : theme.accentDim, color: u.role === "moderator" ? "#3498db" : theme.textMuted }}>{u.role === "moderator" ? t("roleModerator") : t("roleMember")}</span>
                                  {isAdmin && isUserOnline(u.id) && <span style={{ fontSize: 10, color: "#2ecc71" }}>● {t("onlineNow")}</span>}
                                </div>
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 11, color: "#fbbf24", fontWeight: 700, padding: "3px 8px", borderRadius: 8, background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)", alignSelf: "center" }}>🪙 {(u.xcoins||0).toLocaleString()}</span>
                              <button onClick={() => { setEditingUser(u.id); setEditUserForm({ name: u.name, password: "", role: u.role || "member", moderatorPerms: u.moderatorPerms || DEFAULT_MOD_PERMS }); }} style={{ ...S.btn, ...S.ghost, padding: "3px 10px", fontSize: 12, color: theme.accent }}>{t("editBtn")}</button>
                              {isAdmin && <button onClick={() => setAdminXcoinsForm({ userId: u.id, amount: "", op: "add" })} style={{ ...S.btn, ...S.ghost, padding: "3px 10px", fontSize: 11, color: "#fbbf24", borderColor: "rgba(251,191,36,0.3)" }}>🪙</button>}
                              {isAdmin && <button onClick={() => { setResetPwUserId(u.id); setResetPwValue(""); }} style={{ ...S.btn, ...S.ghost, padding: "3px 10px", fontSize: 11, color: "#f39c12", borderColor: "rgba(243,156,18,0.3)" }}>🔑</button>}
                              {isAdmin && <button onClick={() => { const key = `chat-admin-${u.id}`; setShowAdmin(false); setOpenChat({ user: u, chatKey: key }); loadChat(key); }} style={{ ...S.btn, ...S.ghost, padding: "3px 10px", fontSize: 12, color: "#7C3AED", borderColor: "rgba(124,58,237,0.3)" }}>💬</button>}
                              {isAdmin && <button onClick={() => deleteUser(u.id)} style={{ ...S.btn, ...S.ghost, padding: "3px 10px", fontSize: 12, color: "#e74c3c" }}>{t("deleteBtn")}</button>}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {isMobileSection && <div style={{ height: 70, flexShrink: 0 }} />}
            </div>
          </div>
        </div>
        );
      })()}

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
                <button onClick={() => { setShowLogin(false); setLoginError(""); setRegisterError(""); setRegisterDone(false); }} style={S.backBtn}>{dir==="rtl"?"❮":"❯"}</button>
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

      {/* ══════════════ RESET USER PASSWORD ══════════════ */}
      {resetPwUserId && (
        <div style={S.overlay} onClick={() => { setResetPwUserId(null); setResetPwValue(""); }}>
          <div style={{ ...S.modal, maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: 28 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 900 }}>🔑 {t("resetPassword")}</h2>
                <button onClick={() => { setResetPwUserId(null); setResetPwValue(""); }} style={{ ...S.btn, ...S.ghost, padding: "6px 12px" }}>✕</button>
              </div>
              {(() => { const u = users.find(u => u.id === resetPwUserId); return u ? (
                <p style={{ margin: "0 0 16px", fontSize: 13, color: theme.textMuted }}>
                  {t("resetPasswordFor")}: <strong style={{ color: theme.accent }}>{u.name}</strong>
                </p>
              ) : null; })()}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {pwInput(resetPwValue, e => setResetPwValue(e.target.value), t("newPwForUser"), "admNew", { onKeyDown: e => e.key === "Enter" && handleAdminResetPw() })}
                <button onClick={handleAdminResetPw} style={{ ...S.btn, ...S.gold, width: "100%" }}>{t("saveChanges")}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ ADMIN XCOINS MODAL ══════════════ */}
      {adminXcoinsForm.userId && (
        <div style={S.overlay} onClick={() => setAdminXcoinsForm({ userId: null, amount: "", op: "add" })}>
          <div style={{ ...S.modal, maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>🪙 {lang === "ar" ? "إدارة الكوينز" : "Manage Coins"}</h2>
                <button onClick={() => setAdminXcoinsForm({ userId: null, amount: "", op: "add" })} style={{ ...S.btn, ...S.ghost, padding: "6px 12px" }}>✕</button>
              </div>
              {(() => {
                const u = users.find(x => x.id === adminXcoinsForm.userId);
                if (!u) return null;
                return (
                  <>
                    <p style={{ margin: "0 0 12px", fontSize: 13, color: theme.textMuted }}>
                      {u.name} — <span style={{ color: "#fbbf24", fontWeight: 800 }}>🪙 {(u.xcoins||0).toLocaleString()}</span>
                    </p>
                    <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                      {[["add", lang==="ar"?"إضافة":"Add"], ["subtract", lang==="ar"?"خصم":"Subtract"], ["set", lang==="ar"?"تعيين":"Set"]].map(([op, label]) => (
                        <button key={op} onClick={() => setAdminXcoinsForm(f => ({ ...f, op }))} style={{ ...S.btn, flex: 1, padding: "6px", fontSize: 12, background: adminXcoinsForm.op === op ? theme.accent : "transparent", color: adminXcoinsForm.op === op ? "#000" : theme.textMuted, border: `1px solid ${adminXcoinsForm.op === op ? theme.accent : theme.border}` }}>{label}</button>
                      ))}
                    </div>
                    <input type="number" value={adminXcoinsForm.amount} onChange={e => setAdminXcoinsForm(f => ({ ...f, amount: e.target.value }))} placeholder={lang==="ar"?"المبلغ":"Amount"} style={S.input} />
                    <button onClick={() => {
                      const amt = parseInt(adminXcoinsForm.amount);
                      if (isNaN(amt) || amt < 0) return;
                      let newCoins = u.xcoins || 0;
                      const oldCoins = newCoins;
                      if (adminXcoinsForm.op === "add")      newCoins = newCoins + amt;
                      else if (adminXcoinsForm.op === "subtract") newCoins = Math.max(0, newCoins - amt);
                      else                                   newCoins = amt;
                      const delta = newCoins - oldCoins;
                      // أضف إشعاراً في صندوق الكوينز للعضو
                      const inboxMsg = delta > 0
                        ? (lang==="ar" ? `أرسل لك المدير ${delta.toLocaleString()} كوينز` : `Admin sent you ${delta.toLocaleString()} coins`)
                        : (lang==="ar" ? `تم خصم ${Math.abs(delta).toLocaleString()} كوينز من رصيدك` : `${Math.abs(delta).toLocaleString()} coins deducted`);
                      updateUsers(us => us.map(x => x.id === u.id ? { ...x, xcoins: newCoins, coinInbox: delta !== 0 ? [...(x.coinInbox||[]), { msg: inboxMsg, amount: delta, ts: Date.now() }] : (x.coinInbox||[]) } : x));
                      setAdminXcoinsForm({ userId: null, amount: "", op: "add" });
                    }} style={{ ...S.btn, ...S.gold, width: "100%", marginTop: 12 }}>{lang === "ar" ? "حفظ" : "Save"}</button>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ PROFILE ══════════════ */}
      {showProfile && currentUser && (
        <div style={{ ...S.overlay, alignItems: "flex-end" }} onClick={() => setShowProfile(false)}>
          <div style={{ ...S.modal, maxWidth: 420, width: "100%", borderRadius: "20px 20px 0 0", maxHeight: "92dvh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
            {/* drag handle */}
            <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 0", flexShrink: 0 }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: theme.border }} />
            </div>
            <div style={{ padding: "16px 24px", overflowY: "auto", flex: 1, paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>👤 {t("profileTitle")}</h2>
                <button onClick={() => setShowProfile(false)} style={S.backBtn}>{dir==="rtl"?"❮":"❯"}</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* صورة شخصية */}
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <label htmlFor="prof-avatar" style={{ width: 68, height: 68, borderRadius: "50%", overflow: "hidden", background: profileForm.avatar ? "none" : theme.accentDim, border: `2px dashed ${profileForm.avatar ? theme.accent : theme.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}>
                    {profileForm.avatar ? <img src={profileForm.avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 28, color: theme.textMuted }}>👤</span>}
                  </label>
                  <div>
                    <input id="prof-avatar" type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={e => {
                      const file = e.target.files?.[0]; if (!file) return;
                      if (file.size > 5 * 1024 * 1024) { alert(lang === "ar" ? "الصورة أكبر من 5MB" : "Image > 5MB"); return; }
                      const reader = new FileReader(); reader.onload = ev => setProfileForm(f => ({ ...f, avatar: ev.target.result })); reader.readAsDataURL(file);
                    }} />
                    <label htmlFor="prof-avatar" style={{ ...S.btn, ...S.ghost, fontSize: 12, padding: "5px 12px", cursor: "pointer", display: "inline-block" }}>📷 {t("uploadAvatar")}</label>
                    {profileForm.avatar && <button type="button" onClick={() => setProfileForm(f => ({ ...f, avatar: null }))} style={{ ...S.btn, background: "transparent", color: "#e74c3c", fontSize: 12, padding: "5px 8px", border: "none", display: "block", marginTop: 4 }}>{t("removeAvatar")}</button>}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: theme.textMuted, display: "block", marginBottom: 5 }}>{t("fullName")}</label>
                  <input value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} placeholder={t("fullName")} style={S.input} />
                </div>
                {/* إخفاء حالة الاتصال */}
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "10px 14px", borderRadius: 10, background: theme.accentDim, border: `1px solid ${theme.border}` }}>
                  <input type="checkbox" checked={profileForm.hideOnline} onChange={e => setProfileForm(f => ({ ...f, hideOnline: e.target.checked }))} />
                  <span style={{ fontSize: 13, fontWeight: 700 }}>🕵️ {t("hideOnlineStatus")}</span>
                </label>
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

      {/* ══════════════ CHAT WINDOW ══════════════ */}
      {openChat && (currentUser || isAdmin) && (() => {
        const isMobile = window.innerWidth <= 768;
        const chatMsgs = chatMessages[openChat.chatKey] || [];
        const myId = currentUser ? currentUser.id : "admin";
        if (isMobile) {
          // Full-screen mobile chat
          return (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: "calc(72px + env(safe-area-inset-bottom, 0px))", zIndex: 550, background: theme.bg, display: "flex", flexDirection: "column", direction: dir, WebkitOverflowScrolling: "touch" }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: theme.card, borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }}>
                <button onClick={() => setOpenChat(null)} style={S.backBtn}>{dir==="rtl"?"❮":"❯"}</button>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", overflow: "hidden", background: openChat.user.avatar ? "none" : theme.accentDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: theme.accent }}>
                    {openChat.user.avatar ? <img src={openChat.user.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : openChat.user.name.charAt(0)}
                  </div>
                  {openChat.user.id !== "admin" && isUserOnline(openChat.user.id) && <span style={{ position:"absolute", bottom:1, right:1, width:10, height:10, borderRadius:"50%", background:"#2ecc71", border:`2px solid ${theme.card}` }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: nc(openChat.user) }}>{openChat.user.name}</div>
                  {openChat.user.id !== "admin" && <div style={{ fontSize: 11, color: isUserOnline(openChat.user.id) ? "#2ecc71" : theme.textMuted, fontWeight: 600 }}>{isUserOnline(openChat.user.id) ? (lang==="ar"?"متصل الآن":"Online") : (lang==="ar"?"غير متصل":"Offline")}</div>}
                </div>
              </div>
              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 10 }}>
                {!chatMsgs.length && <p style={{ textAlign: "center", color: theme.textMuted, fontSize: 13, margin: "auto" }}>{t("noMessages")}</p>}
                {chatMsgs.map((msg, i) => {
                  const isMine = String(msg.from) === String(myId);
                  return (
                    <div key={i} style={{ display: "flex", justifyContent: isMine ? (dir==="rtl"?"flex-end":"flex-start") : (dir==="rtl"?"flex-start":"flex-end"), alignItems: "flex-end", gap: 6 }}>
                      {!isMine && (
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#A855F7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: "#fff", flexShrink: 0 }}>
                          {(msg.name || "?").charAt(0)}
                        </div>
                      )}
                      <div style={{ maxWidth: "72%", padding: "10px 14px", borderRadius: isMine ? (dir==="rtl"?"18px 4px 18px 18px":"4px 18px 18px 18px") : (dir==="rtl"?"4px 18px 18px 18px":"18px 4px 18px 18px"), background: isMine ? "linear-gradient(135deg,#7C3AED,#9D4EDD)" : (darkMode?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.07)"), color: isMine ? "#fff" : theme.text, fontSize: 14, fontWeight: 600, wordBreak: "break-word", boxShadow: isMine ? "0 2px 12px rgba(124,58,237,0.35)" : "none" }}>{msg.text}</div>
                    </div>
                  );
                })}
                {/* anchor للتمرير لآخر رسالة */}
                <div ref={el => { if(el) el.scrollIntoView({ behavior: "smooth" }); }} />
              </div>
              {/* Input — above bottom nav */}
              {/* Emoji picker popup */}
              {showEmojiPicker && (
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div style={{ position: "absolute", bottom: "8px", [dir==="rtl"?"left":"right"]: 14, background: darkMode?"rgba(20,15,35,0.98)":"rgba(245,243,255,0.98)", border: `1px solid ${theme.border}`, borderRadius: 18, padding: "10px 12px", display: "flex", flexWrap: "wrap", gap: 4, width: 272, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", zIndex: 20 }}>
                    {["😀","😂","😍","🥰","😎","🤣","😢","😡","👍","👎","❤️","🔥","💯","🎉","🙏","💪","😴","🤔","😏","👀","🥳","😭","🤩","😬","💀","🫡","🤝","✅","⚡","💬"].map(em => (
                      <button key={em} onClick={() => { setChatInput(v => v + em); setShowEmojiPicker(false); }} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", padding: "3px 4px", borderRadius: 8, lineHeight: 1 }}>{em}</button>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ display: "flex", gap: 10, padding: "10px 14px", borderTop: `1px solid ${theme.border}`, background: theme.card, flexShrink: 0, alignItems: "center" }}>
                {/* Input with emoji button inside */}
                <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center" }}>
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && chatInput.trim()) { sendMessage(openChat.chatKey, chatInput); setChatInput(""); setShowEmojiPicker(false); } }}
                    placeholder={t("typeMessage")}
                    style={{ ...S.input, width: "100%", padding: dir==="rtl" ? "10px 14px 10px 44px" : "10px 44px 10px 14px", fontSize: 14, borderRadius: 24, boxSizing: "border-box" }}
                  />
                  {/* زر الإيموجي داخل الحقل */}
                  <button
                    onClick={() => setShowEmojiPicker(v => !v)}
                    style={{ position: "absolute", [dir==="rtl"?"left":"right"]: 6, width: 32, height: 32, borderRadius: "50%", border: "none", background: showEmojiPicker ? "rgba(139,92,246,0.3)" : darkMode?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.2s" }}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke={showEmojiPicker?"#8b5cf6":theme.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
                    </svg>
                  </button>
                </div>
                {/* زر الإرسال - pill بنفسجي */}
                <button
                  onClick={() => { if (chatInput.trim()) { sendMessage(openChat.chatKey, chatInput); setChatInput(""); setShowEmojiPicker(false); } }}
                  style={{ flexShrink: 0, height: 44, padding: "0 20px", borderRadius: 24, border: "none", background: "linear-gradient(135deg,#7C3AED,#9D4EDD)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: chatInput.trim()?"0 4px 16px rgba(124,58,237,0.5)":"none", opacity: chatInput.trim()?1:0.6, transition: "all 0.2s" }}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="white" style={{ transform: dir==="rtl"?"scaleX(-1)":"none" }}>
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                </button>
              </div>
            </div>
          );
        }
        // Desktop floating window
        return (
          <div style={{ position: "fixed", bottom: 20, [dir === "rtl" ? "left" : "right"]: 20, zIndex: 400, width: 300, background: theme.card, borderRadius: 16, border: `1px solid ${theme.border}`, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", display: "flex", flexDirection: "column", maxHeight: 420, animation: "fadeIn 0.15s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", overflow: "hidden", background: openChat.user.avatar ? "none" : theme.accentDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: theme.accent, flexShrink: 0 }}>
                {openChat.user.avatar ? <img src={openChat.user.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : openChat.user.name.charAt(0)}
              </div>
              <span style={{ flex: 1, fontWeight: 800, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: nc(openChat.user) }}>{openChat.user.name}</span>
              <button onClick={() => setOpenChat(null)} style={{ ...S.backBtn, width:32, height:32, fontSize:16 }}>{dir==="rtl"?"❮":"❯"}</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8, minHeight: 200 }}>
              {!chatMsgs.length && <p style={{ textAlign: "center", color: theme.textMuted, fontSize: 12, margin: "auto" }}>{t("noMessages")}</p>}
              {chatMsgs.map((msg, i) => {
                const isMine = msg.from === myId;
                return (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start" }}>
                    <div style={{ maxWidth: "80%", padding: "7px 12px", borderRadius: isMine ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: isMine ? theme.accent : theme.accentDim, color: isMine ? "#0A0A0F" : theme.text, fontSize: 13, fontWeight: 600, wordBreak: "break-word" }}>{msg.text}</div>
                  </div>
                );
              })}
              {/* anchor للتمرير لآخر رسالة */}
              <div ref={el => { if(el) el.scrollIntoView({ behavior: "smooth" }); }} />
            </div>
            <div style={{ display: "flex", gap: 6, padding: "10px 12px", borderTop: `1px solid ${theme.border}`, flexShrink: 0 }}>
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && chatInput.trim()) { sendMessage(openChat.chatKey, chatInput); setChatInput(""); } }} placeholder={t("typeMessage")} style={{ ...S.input, flex: 1, padding: "8px 12px", fontSize: 13 }} />
              <button onClick={() => { if (chatInput.trim()) { sendMessage(openChat.chatKey, chatInput); setChatInput(""); } }} style={{ ...S.btn, ...S.gold, padding: "8px 12px", fontSize: 14, flexShrink: 0 }}>{dir === "rtl" ? "←" : "→"}</button>
            </div>
          </div>
        );
      })()}

      {/* ══════════════ BROADCAST CHAT WINDOW ══════════════ */}
      {openBroadcast && (currentUser || isAdmin) && (
        <div style={{ position: "fixed", bottom: 20, [dir === "rtl" ? "left" : "right"]: 20, zIndex: 400, width: 320, background: theme.card, borderRadius: 16, border: `1px solid ${theme.border}`, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", display: "flex", flexDirection: "column", maxHeight: 460, animation: "fadeIn 0.15s ease" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: `1px solid ${theme.border}`, flexShrink: 0, background: "linear-gradient(135deg,rgba(212,175,55,0.12),transparent)", borderRadius: "16px 16px 0 0" }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#D4AF37,#C49B2A)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>📢</div>
            <span style={{ flex: 1, fontWeight: 800, fontSize: 14, color: theme.accent }}>{t("broadcastChat")}</span>
            <button onClick={() => setOpenBroadcast(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: theme.textMuted, padding: 0 }}>✕</button>
          </div>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8, minHeight: 160 }}>
            {broadcasts.length === 0 && (
              <p style={{ textAlign: "center", color: theme.textMuted, fontSize: 13, margin: "auto" }}>{t("noBroadcasts")}</p>
            )}
            {broadcasts.map((msg) => (
              <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 3, paddingRight: 4, color: (() => { const u = users.find(x => String(x.id) === String(msg.userId)); return u?.nameColor || theme.textMuted; })() }}>
                  📢 {msg.name}
                </div>
                <div style={{ maxWidth: "90%", padding: "8px 13px", borderRadius: "14px 14px 14px 4px", background: "linear-gradient(135deg,rgba(212,175,55,0.15),rgba(212,175,55,0.08))", border: `1px solid ${theme.border}`, color: theme.text, fontSize: 13, fontWeight: 600, wordBreak: "break-word" }}>{msg.text}</div>
              </div>
            ))}
          </div>
          {/* Input — only for admin or moderator with broadcast.send */}
          {(isAdmin || modCan("broadcast", "send")) && (
            <div style={{ display: "flex", gap: 6, padding: "10px 12px", borderTop: `1px solid ${theme.border}`, flexShrink: 0 }}>
              <input
                value={broadcastInput}
                onChange={e => setBroadcastInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && broadcastInput.trim()) sendBroadcast(); }}
                placeholder={t("broadcastPh")}
                style={{ ...S.input, flex: 1, padding: "8px 12px", fontSize: 13 }}
              />
              <button
                onClick={sendBroadcast}
                style={{ ...S.btn, ...S.gold, padding: "8px 12px", fontSize: 14, flexShrink: 0 }}
              >{dir === "rtl" ? "←" : "→"}</button>
            </div>
          )}
        </div>
      )}

      {/* ══════════════ LOGOUT NOTICE TOAST ══════════════ */}
      {/* ══ Toast Notifications ══ */}
      <div style={{ position: "fixed", top: "env(safe-area-inset-top, 0px)", left: 0, right: 0, zIndex: 99999, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "12px 16px", pointerEvents: "none" }}>
        {toasts.map(toast => (
          <div key={toast.id} onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} style={{
            pointerEvents: "auto", display: "flex", alignItems: "center", gap: 12,
            background: "rgba(18,14,36,0.96)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.12)", borderRadius: 18,
            padding: "10px 16px 10px 12px", maxWidth: 340, width: "100%",
            boxShadow: "0 8px 32px rgba(0,0,0,0.6)", cursor: "pointer",
            animation: "slideDownFade 0.35s cubic-bezier(0.34,1.56,0.64,1)",
            direction: "rtl", fontFamily: "'Cairo',sans-serif",
          }}>
            {/* Avatar */}
            <div style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0, overflow: "hidden", border: "2px solid rgba(124,58,237,0.6)", background: toast.type === "naif" ? "linear-gradient(135deg,#2d0a5c,#1a2a6c)" : "linear-gradient(135deg,#7C3AED,#A855F7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: toast.avatar ? 0 : 20 }}>
              {toast.avatar
                ? <img src={toast.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : toast.type === "naif" ? "🌙" : toast.type === "home" ? "📣" : "💬"}
            </div>
            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{toast.name}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>{toast.text}</div>
            </div>
            {/* Type pill */}
            <div style={{ fontSize: 10, fontWeight: 900, padding: "3px 8px", borderRadius: 99, background: toast.type === "message" ? "rgba(236,72,153,0.2)" : toast.type === "naif" ? "rgba(124,58,237,0.2)" : toast.type === "story" ? "rgba(249,115,22,0.2)" : "rgba(14,165,233,0.2)", color: toast.type === "message" ? "#F472B6" : toast.type === "naif" ? "#A78BFA" : toast.type === "story" ? "#FB923C" : "#38BDF8", flexShrink: 0 }}>
              {toast.type === "message" ? "رسالة" : toast.type === "naif" ? "مذكرات" : toast.type === "story" ? "ستوري" : "إعلان"}
            </div>
          </div>
        ))}
      </div>

      {logoutNotice && (
        <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", zIndex: 600, background: "#e74c3c", color: "#fff", borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: 700, fontFamily: "'Cairo',sans-serif", boxShadow: "0 4px 24px rgba(0,0,0,0.4)", animation: "fadeIn 0.2s ease", whiteSpace: "nowrap", direction: dir }}>
          ⏱ {t("autoLoggedOut")}
        </div>
      )}

      {/* ══════════════ MOBILE PROFILE SHEET ══════════════ */}
      {showMobileProfile && (currentUser || isAdmin) && (() => {
        const u = currentUser;
        const friendsCount   = u ? (u.friends        || []).length : 0;
        const followersCount = u ? (u.receivedRequests|| []).length : 0;

        // admin-panel sections this user can access
        const adminSections = [
          { key: "performers",   icon: "🏆", ar: "المتميزون",     en: "Performers",    check: modCan("performers","add")||modCan("performers","edit")||modCan("performers","delete") },
          { key: "votes",        icon: "⬡",  ar: "التصويتات",     en: "Votes",         check: modCan("votes","add")||modCan("votes","edit")||modCan("votes","delete") },
          { key: "announcements",icon: "📣", ar: "الإعلانات",     en: "Announcements", check: modCan("announcements","add")||modCan("announcements","delete")||modCan("broadcast","send") },
          { key: "naif",         icon: "🌙", ar: "مذكرات نفنف",   en: "Naif Diary",    check: modCan("naifDiary","add")||modCan("naifDiary","edit")||modCan("naifDiary","delete") },
          { key: "users",        icon: "👥", ar: "المستخدمون",    en: "Users",         check: modCan("users","view")||modCan("users","approve") },
        ].filter(s => s.check);
        const hasAdminAccess = adminSections.length > 0;

        const mpSave = () => {
          if (!mpName.trim()) return;
          if (u) {
            const updated = { ...u, name: mpName.trim(), avatar: mpAvatar, hideOnline: mpHideOnline, nameColor: mpNameColor || null };
            setCurrentUser(updated);
            updateUsers(us => us.map(x => x.id === u.id ? updated : x));
          }
          closeWithAnim(setClosingProfile, setShowMobileProfile);
        };

        const rowStyle = { display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: `1px solid ${theme.border}`, cursor: "pointer", direction: dir };
        const chevron  = <span style={{ color: theme.textMuted, fontSize: 18, flexShrink: 0 }}>{dir === "rtl" ? "‹" : "›"}</span>;

        return (
          <div
            style={{ position: "fixed", inset: 0, zIndex: 490, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", display: "flex", flexDirection: "column", justifyContent: "flex-end", animation: closingProfile ? "fadeOutBg 0.32s ease forwards" : "fadeInBg 0.25s ease forwards" }}
            onClick={() => closeWithAnim(setClosingProfile, setShowMobileProfile)}
          >
            <div
              style={{ background: theme.card, borderRadius: "22px 22px 0 0", border: `1px solid ${theme.border}`, maxHeight: "92vh", display: "flex", flexDirection: "column", animation: closingProfile ? "sheetDown 0.32s cubic-bezier(0.4,0,1,1) forwards" : "sheetUp 0.35s cubic-bezier(0,0,0.2,1) forwards" }}
              onClick={e => e.stopPropagation()}
            >
              {/* drag handle */}
              <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px", flexShrink: 0 }}>
                <div style={{ width: 40, height: 4, borderRadius: 2, background: theme.border }} />
              </div>

              {/* ── SCROLLABLE CONTENT ── */}
              <div style={{ overflowY: "auto", flex: 1 }}>

              {/* ── PROFILE HEADER ── */}
              <div style={{ padding: "16px 24px 20px", direction: dir, flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>

                  {/* Avatar — clickable */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div
                      onClick={() => document.getElementById("mp-avatar-input").click()}
                      style={{ width: 76, height: 76, borderRadius: "50%", overflow: "hidden", background: mpAvatar ? "none" : `linear-gradient(135deg,${theme.accent},${theme.accent}66)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 900, color: "#fff", border: `3px solid ${theme.accent}`, cursor: "pointer", boxShadow: "0 4px 16px rgba(212,175,55,0.3)" }}
                    >
                      {mpAvatar ? <img src={mpAvatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (u?.name || "A").charAt(0)}
                    </div>
                    <div onClick={() => document.getElementById("mp-avatar-input").click()} style={{ position: "absolute", bottom: 0, right: 0, width: 24, height: 24, borderRadius: "50%", background: theme.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, cursor: "pointer", border: `2px solid ${theme.card}` }}>✏</div>
                    <input id="mp-avatar-input" type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
                      const file = e.target.files[0]; if (!file) return;
                      if (file.size > 2 * 1024 * 1024) { alert(lang === "ar" ? "الصورة أكبر من 2MB" : "Image > 2MB"); return; }
                      const reader = new FileReader(); reader.onload = ev => setMpAvatar(ev.target.result); reader.readAsDataURL(file);
                    }} />
                  </div>

                  {/* Name + username */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <input
                        value={mpName}
                        onChange={e => setMpName(e.target.value)}
                        style={{ ...S.input, fontWeight: 800, fontSize: 17, padding: "6px 10px", flex: 1, color: mpNameColor || theme.text }}
                        placeholder={lang === "ar" ? "الاسم الكامل" : "Full Name"}
                      />
                    </div>
                    {/* ── Name color picker ── */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      {[
                        { color: null,      label: "افتراضي", bg: theme.accentDim, border: theme.accent, text: theme.accent },
                        { color: "#ffffff", label: "أبيض",    bg: "#ffffff",       border: "#cccccc",    text: "#333" },
                        { color: "#A855F7", label: "بنفسجي",  bg: "#A855F7",       border: "#7C3AED",    text: "#fff" },
                        { color: "#EF4444", label: "أحمر",    bg: "#EF4444",       border: "#DC2626",    text: "#fff" },
                        { color: "#22C55E", label: "أخضر",    bg: "#22C55E",       border: "#16A34A",    text: "#fff" },
                      ].map(opt => (
                        <div
                          key={opt.label}
                          onClick={() => setMpNameColor(opt.color)}
                          title={opt.label}
                          style={{
                            width: 26, height: 26, borderRadius: "50%",
                            background: opt.bg,
                            border: `2px solid ${mpNameColor === opt.color ? "#fff" : opt.border}`,
                            cursor: "pointer",
                            boxShadow: mpNameColor === opt.color ? `0 0 0 2px ${opt.bg}` : "none",
                            flexShrink: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 12, color: opt.text, fontWeight: 800,
                            transition: "box-shadow 0.15s",
                          }}
                        >
                          {mpNameColor === opt.color && "✓"}
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 13, color: theme.textMuted, fontWeight: 600, fontFamily: "'Cairo',sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ opacity: 0.6 }}>🪪</span>
                      <span>{u?.username || adminCreds.username}</span>
                      <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 99, background: theme.accentDim, color: theme.accent, fontWeight: 700 }}>
                        {lang === "ar" ? "لا يمكن تعديله" : "read-only"}
                      </span>
                    </div>
                    {u?.role === "moderator" && (
                      <span style={{ fontSize: 10, marginTop: 4, display: "inline-block", padding: "2px 8px", borderRadius: 99, background: "rgba(52,152,219,0.15)", color: "#3498db", fontWeight: 700 }}>{t("roleModerator")}</span>
                    )}
                  </div>
                </div>

                {/* ── STATS ROW ── */}
                {u && (
                  <div style={{ display: "flex", gap: 0, borderRadius: 14, overflow: "hidden", border: `1px solid ${theme.border}` }}>
                    {[
                      { key: "friends",   value: friendsCount,                       ar: "أصدقاء",  en: "Friends"   },
                      { key: "followers", value: followersCount,                     ar: "متابِعون", en: "Followers" },
                      { key: "following", value: (u.sentRequests||[]).length,        ar: "أتابِعهم", en: "Following" },
                    ].map((stat, i, arr) => (
                      <div
                        key={i}
                        onClick={() => setMpSocialSheet(stat.key)}
                        style={{ flex: 1, textAlign: "center", padding: "12px 8px", background: theme.accentDim, borderRight: i < arr.length - 1 ? `1px solid ${theme.border}` : "none", cursor: "pointer", transition: "background 0.15s" }}
                      >
                        <div style={{ fontSize: 20, fontWeight: 900, color: theme.accent, fontFamily: "'Cairo',sans-serif" }}>{stat.value}</div>
                        <div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 700, fontFamily: "'Cairo',sans-serif" }}>{lang === "ar" ? stat.ar : stat.en}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── XCOINS CARD ── */}
              {u && (
                <div style={{ padding: "8px 20px 4px", direction: dir }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", borderRadius: 12, background: "linear-gradient(135deg,rgba(251,191,36,0.15),rgba(251,191,36,0.05))", border: "1px solid rgba(251,191,36,0.3)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 22 }}>🪙</span>
                      <div>
                        <div style={{ fontFamily: "'Cairo',sans-serif", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>{lang==="ar"?"رصيد الكوينز":"Xcoins Balance"}</div>
                        <div style={{ fontFamily: "'Cairo',sans-serif", fontSize: 20, fontWeight: 900, color: "#fbbf24" }}>{(u.xcoins||0).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── HIDE ONLINE TOGGLE ── */}
              {u && (
                <div style={{ padding: "0 20px 0px", direction: dir }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderRadius: 12, background: theme.accentDim, border: `1px solid ${theme.border}`, cursor: "pointer" }}>
                    <span style={{ fontSize: 18 }}>🕵️</span>
                    <span style={{ flex: 1, fontFamily: "'Cairo',sans-serif", fontSize: 14, fontWeight: 700 }}>{t("hideOnlineStatus")}</span>
                    <div
                      onClick={() => setMpHideOnline(v => !v)}
                      style={{ width: 44, height: 24, borderRadius: 12, background: mpHideOnline ? theme.accent : theme.border, position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}
                    >
                      <div style={{ position: "absolute", top: 2, left: mpHideOnline ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
                    </div>
                  </label>
                </div>
              )}

              {/* ── LANGUAGE TOGGLE ── */}
              <div style={{ padding: "8px 20px 4px", direction: dir }}>
                <div
                  onClick={() => setLang(l => l === "ar" ? "en" : "ar")}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderRadius: 12, background: theme.accentDim, border: `1px solid ${theme.border}`, cursor: "pointer" }}
                >
                  <span style={{ fontSize: 18 }}>🌐</span>
                  <span style={{ flex: 1, fontFamily: "'Cairo',sans-serif", fontSize: 14, fontWeight: 700 }}>
                    {lang === "ar" ? "Switch to English" : "التبديل إلى العربية"}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: theme.accent, padding: "3px 10px", borderRadius: 99, background: "rgba(212,175,55,0.15)", border: `1px solid ${theme.border}` }}>
                    {lang === "ar" ? "EN" : "عربي"}
                  </span>
                </div>
              </div>

              {/* ── ADMIN PANEL SECTION ── */}
              {hasAdminAccess && (
                <div style={{ margin: "12px 20px 4px", borderRadius: 14, border: `1px solid ${theme.border}`, overflow: "hidden", direction: dir }}>
                  {/* accordion header */}
                  <div
                    onClick={() => setMpAdminOpen(v => !v)}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: theme.accentDim, cursor: "pointer", userSelect: "none" }}
                  >
                    <span style={{ fontSize: 18 }}>⚙</span>
                    <span style={{ flex: 1, fontFamily: "'Cairo',sans-serif", fontSize: 15, fontWeight: 800 }}>
                      {lang === "ar" ? "لوحة التحكم" : "Admin Panel"}
                    </span>
                    {isAdmin && pendingUsers.length > 0 && (
                      <span style={{ background: "#e74c3c", color: "#fff", borderRadius: 99, padding: "1px 7px", fontSize: 11, fontWeight: 800 }}>{pendingUsers.length}</span>
                    )}
                    <span style={{ fontSize: 16, color: theme.accent, transition: "transform 0.25s", display: "inline-block", transform: mpAdminOpen ? "rotate(90deg)" : "rotate(0deg)" }}>
                      {dir === "rtl" ? "‹" : "›"}
                    </span>
                  </div>

                  {/* sections list */}
                  {mpAdminOpen && adminSections.map((sec, i) => (
                    <div
                      key={sec.key}
                      onClick={() => { setAdminTab(sec.key); setMobileAdminSection(sec.key); setShowAdmin(true); setShowMobileProfile(false); }}
                      style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderTop: `1px solid ${theme.border}`, cursor: "pointer", background: theme.card }}
                    >
                      <span style={{ fontSize: 20, width: 28, textAlign: "center", flexShrink: 0 }}>{sec.icon}</span>
                      <span style={{ flex: 1, fontFamily: "'Cairo',sans-serif", fontSize: 14, fontWeight: 700 }}>{lang === "ar" ? sec.ar : sec.en}</span>
                      {sec.key === "users" && pendingUsers.length > 0 && (
                        <span style={{ background: "#e74c3c", color: "#fff", borderRadius: 99, padding: "1px 7px", fontSize: 11, fontWeight: 800 }}>{pendingUsers.length}</span>
                      )}
                      <span style={{ color: theme.textMuted, fontSize: 18, flexShrink: 0 }}>{dir === "rtl" ? "‹" : "›"}</span>
                    </div>
                  ))}
                </div>
              )}

              </div>{/* ── END SCROLLABLE CONTENT ── */}

              {/* ── ACTION BUTTONS (sticky footer) ── */}
              <div style={{ padding: "12px 20px 80px", display: "flex", flexDirection: "column", gap: 10, direction: dir, flexShrink: 0, borderTop: `1px solid ${theme.border}`, background: theme.card }}>
                <button onClick={mpSave} style={{ ...S.btn, ...S.gold, width: "100%", padding: "13px", fontSize: 15, borderRadius: 12 }}>
                  ✓ {lang === "ar" ? "حفظ التغييرات" : "Save Changes"}
                </button>
                <button
                  onClick={() => { setShowMobileProfile(false); handleLogout(); }}
                  style={{ ...S.btn, ...S.ghost, width: "100%", padding: "13px", fontSize: 14, borderRadius: 12, color: "#e74c3c", borderColor: "rgba(231,76,60,0.3)" }}
                >
                  ↩ {lang === "ar" ? "تسجيل الخروج" : "Log Out"}
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ══════════════ SOCIAL SHEET (Friends / Followers / Following) ══════════════ */}
      {mpSocialSheet && currentUser && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 490, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
          onClick={() => setMpSocialSheet(null)}
        >
          <div
            style={{ background: theme.card, borderRadius: "22px 22px 0 0", border: `1px solid ${theme.border}`, maxHeight: "82vh", display: "flex", flexDirection: "column", animation: "slideUp 0.25s ease" }}
            onClick={e => e.stopPropagation()}
          >
            {/* drag handle */}
            <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px", flexShrink: 0 }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: theme.border }} />
            </div>

            {/* tab switcher */}
            <div style={{ display: "flex", borderBottom: `1px solid ${theme.border}`, flexShrink: 0, direction: dir }}>
              {[
                { key: "friends",   ar: "الأصدقاء",  en: "Friends"   },
                { key: "followers", ar: "المتابِعون", en: "Followers" },
                { key: "following", ar: "أتابِعهم",  en: "Following" },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setMpSocialSheet(tab.key)}
                  style={{ flex: 1, padding: "13px 8px", background: "none", border: "none", borderBottom: mpSocialSheet === tab.key ? `2px solid ${theme.accent}` : "2px solid transparent", color: mpSocialSheet === tab.key ? theme.accent : theme.textMuted, fontFamily: "'Cairo',sans-serif", fontSize: 13, fontWeight: 800, cursor: "pointer", transition: "all 0.2s" }}
                >
                  {lang === "ar" ? tab.ar : tab.en}
                </button>
              ))}
            </div>

            {/* list */}
            <div style={{ overflowY: "auto", flex: 1, direction: dir }}>
              {(() => {
                let ids = [];
                if (mpSocialSheet === "friends")   ids = currentUser.friends || [];
                if (mpSocialSheet === "followers")  ids = currentUser.receivedRequests || [];
                if (mpSocialSheet === "following")  ids = currentUser.sentRequests || [];

                if (ids.length === 0) return (
                  <div style={{ padding: "48px 24px", textAlign: "center", color: theme.textMuted }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>
                      {mpSocialSheet === "friends" ? "🤝" : mpSocialSheet === "followers" ? "👥" : "💫"}
                    </div>
                    <p style={{ fontFamily: "'Cairo',sans-serif", fontSize: 14, fontWeight: 600, margin: 0 }}>
                      {lang === "ar"
                        ? mpSocialSheet === "friends" ? "لا يوجد أصدقاء بعد" : mpSocialSheet === "followers" ? "لا يوجد متابعون بعد" : "لا تتابع أحداً بعد"
                        : mpSocialSheet === "friends" ? "No friends yet" : mpSocialSheet === "followers" ? "No followers yet" : "Not following anyone yet"}
                    </p>
                  </div>
                );

                return ids.map(uid => {
                  const person = users.find(u => u.id === uid);
                  if (!person) return null;
                  const online = isUserOnline(person.id);
                  const showOnline = !person.hideOnline;
                  const isFriend = (currentUser.friends || []).includes(person.id);
                  const chatKey = getChatKey(currentUser.id, person.id);

                  return (
                    <div key={uid} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: `1px solid ${theme.border}` }}>
                      {/* avatar */}
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <div style={{ width: 48, height: 48, borderRadius: "50%", overflow: "hidden", background: person.avatar ? "none" : `linear-gradient(135deg,${theme.accent},${theme.accent}66)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "#fff" }}>
                          {person.avatar ? <img src={person.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : person.name.charAt(0)}
                        </div>
                        {showOnline && <span style={{ position: "absolute", bottom: 1, right: 1, width: 11, height: 11, borderRadius: "50%", background: online ? "#2ecc71" : "#95a5a6", border: `2px solid ${theme.card}` }} />}
                      </div>

                      {/* name + status */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'Cairo',sans-serif", fontWeight: 800, fontSize: 15, color: person.nameColor || "inherit" }}>{person.name}</div>
                        <div style={{ fontSize: 11, color: showOnline && online ? "#2ecc71" : theme.textMuted, fontWeight: 600 }}>
                          {showOnline ? (online ? `● ${t("online")}` : t("offline")) : ""}
                        </div>
                      </div>

                      {/* دردشة button — left side (end of RTL row) */}
                      {isFriend && (
                        <button
                          onClick={() => {
                            setOpenChat({ user: person, chatKey });
                            loadChat(chatKey);
                            setMpSocialSheet(null);
                            setShowMobileProfile(false);
                          }}
                          style={{ ...S.btn, background: theme.accentDim, color: theme.accent, border: `1px solid ${theme.border}`, fontSize: 13, padding: "8px 16px", borderRadius: 10, flexShrink: 0, fontFamily: "'Cairo',sans-serif" }}
                        >
                          💬 {lang === "ar" ? "دردشة" : "Chat"}
                        </button>
                      )}
                      {mpSocialSheet === "followers" && !isFriend && (
                        <button
                          onClick={() => acceptFriendRequest(uid)}
                          style={{ ...S.btn, background: "rgba(46,204,113,0.15)", color: "#2ecc71", border: "1px solid rgba(46,204,113,0.3)", fontSize: 12, padding: "7px 14px", borderRadius: 10, flexShrink: 0 }}
                        >
                          {t("accept")}
                        </button>
                      )}
                      {mpSocialSheet === "following" && !isFriend && (
                        <span style={{ fontSize: 11, color: theme.textMuted, fontWeight: 700, padding: "6px 10px", borderRadius: 10, background: theme.accentDim }}>
                          {t("requested")}
                        </span>
                      )}
                    </div>
                  );
                });
              })()}
              <div style={{ height: 70, flexShrink: 0 }} />
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ MESSAGES LIST (bottom sheet) ══════════════ */}
      {showMsgList && currentUser && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 480, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", display: "flex", flexDirection: "column", justifyContent: "flex-end", animation: closingMsgList ? "fadeOutBg 0.32s ease forwards" : "fadeInBg 0.25s ease forwards" }}
          onClick={() => closeWithAnim(setClosingMsgList, setShowMsgList)}
        >
          <div
            style={{ background: theme.card, borderRadius: "22px 22px 0 0", border: `1px solid ${theme.border}`, maxHeight: "82vh", display: "flex", flexDirection: "column", animation: closingMsgList ? "sheetDown 0.32s cubic-bezier(0.4,0,1,1) forwards" : "sheetUp 0.35s cubic-bezier(0,0,0.2,1) forwards", paddingBottom:"calc(72px + env(safe-area-inset-bottom,0px))" }}
            onClick={e => e.stopPropagation()}
          >
            {/* drag handle */}
            <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: theme.border }} />
            </div>

            {/* header */}
            <div style={{ padding: "10px 20px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${theme.border}`, direction: dir }}>
              <h3 style={{ margin: 0, fontFamily: "'Cairo',sans-serif", fontWeight: 900, fontSize: 18 }}>
                💬 {lang === "ar" ? "الرسائل" : "Messages"}
              </h3>
              <button onClick={() => closeWithAnim(setClosingMsgList,setShowMsgList)} style={S.backBtn}>{dir==="rtl"?"❮":"❯"}</button>
            </div>

            {/* friend requests inside sheet */}
            {(currentUser.receivedRequests || []).length > 0 && (
              <div style={{ padding: "10px 20px", borderBottom: `1px solid ${theme.border}`, background: "rgba(212,175,55,0.04)", direction: dir }}>
                <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: theme.accent }}>🔔 {t("followRequests")} ({(currentUser.receivedRequests || []).length})</p>
                {(currentUser.receivedRequests || []).map(fromId => {
                  const fu = users.find(u => u.id === fromId);
                  if (!fu) return null;
                  return (
                    <div key={fromId} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", overflow: "hidden", background: fu.avatar ? "none" : theme.accentDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, flexShrink: 0 }}>
                        {fu.avatar ? <img src={fu.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : fu.name.charAt(0)}
                      </div>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{fu.name}</span>
                      <button onClick={() => acceptFriendRequest(fromId)} style={{ ...S.btn, fontSize: 11, padding: "4px 10px", background: "rgba(46,204,113,0.15)", color: "#2ecc71", border: "1px solid rgba(46,204,113,0.3)" }}>{t("accept")}</button>
                      <button onClick={() => declineFriendRequest(fromId)} style={{ ...S.btn, fontSize: 11, padding: "4px 10px", background: "rgba(231,76,60,0.1)", color: "#e74c3c", border: "1px solid rgba(231,76,60,0.2)" }}>{t("decline")}</button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── 📢 Broadcast pinned entry ── */}
            <div
              onClick={() => { setOpenBroadcast(true); setShowMsgList(false); }}
              style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: `1px solid ${theme.border}`, cursor: "pointer", background: "rgba(212,175,55,0.05)", direction: dir }}
            >
              <div style={{ width: 50, height: 50, borderRadius: "50%", background: "linear-gradient(135deg,#D4AF37,#C49B2A)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>📢</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Cairo',sans-serif", fontWeight: 800, fontSize: 15, color: theme.accent }}>{t("broadcastChat")}</div>
                <div style={{ fontFamily: "'Cairo',sans-serif", fontSize: 12, color: theme.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>
                  {broadcasts.length > 0 ? broadcasts[broadcasts.length - 1].text : t("noBroadcasts")}
                </div>
              </div>
              {broadcasts.length > 0 && <span style={{ background: theme.accent, color: "#0A0A0F", fontSize: 10, fontWeight: 800, borderRadius: 99, padding: "2px 7px", flexShrink: 0 }}>{broadcasts.length}</span>}
            </div>

            {/* ── 👑 Admin pinned entry ── */}
            {(() => {
              const adminChatKey = `chat-admin-${currentUser.id}`;
              const adminMsgs = chatMessages[adminChatKey] || [];
              const lastAdminMsg = adminMsgs[adminMsgs.length - 1];
              const adminUser = { id: "admin", name: lang === "ar" ? "المدير" : "Admin", avatar: null };
              return (
                <div
                  onClick={() => { setOpenChat({ user: adminUser, chatKey: adminChatKey }); loadChat(adminChatKey); setShowMsgList(false); }}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: `1px solid ${theme.border}`, cursor: "pointer", background: "rgba(124,58,237,0.04)", direction: dir }}
                >
                  <div style={{ width: 50, height: 50, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#9D4EDD)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>👑</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Cairo',sans-serif", fontWeight: 800, fontSize: 15, color: theme.accent }}>{lang === "ar" ? "المدير" : "Admin"}</div>
                    <div style={{ fontFamily: "'Cairo',sans-serif", fontSize: 12, color: theme.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>
                      {lastAdminMsg ? lastAdminMsg.text : (lang === "ar" ? "راسل المدير مباشرة..." : "Message admin directly...")}
                    </div>
                  </div>
                  <span style={{ color: theme.textMuted, fontSize: 20, flexShrink: 0 }}>{dir === "rtl" ? "‹" : "›"}</span>
                </div>
              );
            })()}

            {/* conversations list */}
            <div style={{ overflowY: "auto", flex: 1, direction: dir }}>
              {(() => {
                const friends = currentUser.friends || [];
                if (friends.length === 0) return (
                  <div style={{ padding: "48px 24px", textAlign: "center", color: theme.textMuted }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                    <p style={{ fontFamily: "'Cairo',sans-serif", fontSize: 14, fontWeight: 600, margin: 0 }}>
                      {lang === "ar" ? "لا توجد محادثات بعد — أضف أصدقاء من قائمة الأعضاء" : "No conversations yet — add friends from the members list"}
                    </p>
                  </div>
                );
                return friends.map(fId => {
                  const friend = users.find(u => u.id === fId);
                  if (!friend) return null;
                  const chatKey = getChatKey(currentUser.id, fId);
                  const msgs = chatMessages[chatKey] || [];
                  const lastMsg = msgs[msgs.length - 1];
                  const online = isUserOnline(fId);
                  return (
                    <div
                      key={fId}
                      onClick={() => { setOpenChat({ user: friend, chatKey }); loadChat(chatKey); setShowMsgList(false); }}
                      style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: `1px solid ${theme.border}`, cursor: "pointer", transition: "background 0.15s" }}
                    >
                      {/* avatar + online dot */}
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <div style={{ width: 50, height: 50, borderRadius: "50%", overflow: "hidden", background: friend.avatar ? "none" : `linear-gradient(135deg,${theme.accent},${theme.accent}66)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "#fff" }}>
                          {friend.avatar ? <img src={friend.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : friend.name.charAt(0)}
                        </div>
                        <span style={{ position: "absolute", bottom: 1, right: 1, width: 12, height: 12, borderRadius: "50%", background: online ? "#2ecc71" : "#95a5a6", border: `2px solid ${theme.card}` }} />
                      </div>
                      {/* name + last message */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'Cairo',sans-serif", fontWeight: 800, fontSize: 15, color: friend.nameColor || "inherit" }}>{friend.name}</div>
                        <div style={{ fontFamily: "'Cairo',sans-serif", fontSize: 12, color: theme.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>
                          {lastMsg
                            ? (lastMsg.from === currentUser.id ? (lang === "ar" ? "أنت: " : "You: ") : "") + lastMsg.text
                            : (lang === "ar" ? "ابدأ المحادثة..." : "Start chatting...")}
                        </div>
                      </div>
                      {/* arrow */}
                      <span style={{ color: theme.textMuted, fontSize: 20, flexShrink: 0 }}>{dir === "rtl" ? "‹" : "›"}</span>
                    </div>
                  );
                });
              })()}
              <div style={{ height: 70, flexShrink: 0 }} />
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ MOBILE BOTTOM NAV ══════════════ */}
      {(currentUser || isAdmin) && (() => {
        const pendingCount = (currentUser?.receivedRequests || []).length;
        const myIdForBadge = currentUser ? currentUser.id : (isAdmin ? "admin" : null);
        const unreadMsgsCount = Object.entries(chatMessages).reduce((total, [key, msgs]) => {
          if (openChat?.chatKey === key) return total;
          const lastRead = lastReadTimes[key] || 0;
          const unread = msgs.filter(m => m.from !== String(myIdForBadge) && (m.time || 0) > lastRead).length;
          return total + unread;
        }, 0);
        const msgBadge = pendingCount + unreadMsgsCount;
        const tabs = [
          {
            key: "home",
            icon: "🏠",
            labelAr: "الرئيسية",
            labelEn: "Home",
            active: !showVoting && !showMsgList && !showMobileProfile && !showGamesLobby && !showFarmGame && !showMarioGame && !showFoodWheel,
            action: () => { setOpenChat(null); setShowVoting(false); setShowMsgList(false); setShowProfile(false); setShowAdmin(false); setShowMobileProfile(false); setShowGamesLobby(false); setShowFarmGame(false); setShowMarioGame(false); setShowFoodWheel(false); window.scrollTo({ top: 0, behavior: "smooth" }); const now = Date.now(); setLastSeenHomeTs(now); localStorage.setItem("last-seen-home", String(now)); },
            badge: announcements.length > 0 && Math.max(...announcements.map(a => a.time || a.ts || 0)) > lastSeenHomeTs ? 1 : 0,
          },
          {
            key: "voting",
            icon: "⬡",
            labelAr: "التصويت",
            labelEn: "Voting",
            active: showVoting,
            action: () => { setOpenChat(null); setShowGamesLobby(false); setShowFarmGame(false); setShowMarioGame(false); setShowFoodWheel(false); if(showVoting){ closeWithAnim(setClosingVoting,setShowVoting); } else { setShowVoting(true); closeWithAnim(setClosingMsgList,setShowMsgList); closeWithAnim(setClosingProfile,setShowMobileProfile); } },
            badge: 0,
          },
          {
            key: "games",
            icon: "🎮",
            labelAr: "الألعاب",
            labelEn: "Games",
            active: showGamesLobby || showFarmGame || showMarioGame || showFoodWheel,
            action: () => { if (!currentUser) return; setOpenChat(null); const anyGame = showGamesLobby || showFarmGame || showMarioGame || showFoodWheel; if(anyGame){ if(showGamesLobby && closeLobbyRef.current){ closeLobbyRef.current(); } else { setShowGamesLobby(false); setShowFarmGame(false); setShowMarioGame(false); setShowFoodWheel(false); } } else { setShowGamesLobby(true); setShowMsgList(false); setShowVoting(false); setShowMobileProfile(false); } },
            badge: 0,
          },
          {
            key: "messages",
            icon: "💬",
            labelAr: "الرسائل",
            labelEn: "Messages",
            active: showMsgList,
            action: () => { setOpenChat(null); setShowGamesLobby(false); setShowFarmGame(false); setShowMarioGame(false); setShowFoodWheel(false); if(showMsgList){ closeWithAnim(setClosingMsgList,setShowMsgList); } else { setShowMsgList(true); closeWithAnim(setClosingVoting,setShowVoting); closeWithAnim(setClosingProfile,setShowMobileProfile); } },
            badge: msgBadge,
          },
          {
            key: "profile",
            icon: "👤",
            labelAr: "حسابي",
            labelEn: "Profile",
            active: showMobileProfile,
            action: () => {
              setOpenChat(null); setShowMsgList(false); setShowVoting(false); setShowGamesLobby(false); setShowFarmGame(false); setShowMarioGame(false); setShowFoodWheel(false);
              const u = currentUser || (isAdmin ? { name: lang === "ar" ? "المدير" : "Admin", username: adminCreds.username, avatar: null, hideOnline: false } : null);
              if (u) { setMpName(u.name); setMpAvatar(u.avatar || null); setMpHideOnline(u.hideOnline || false); setMpNameColor(u.nameColor || null); }
              setMpAdminOpen(false);
              if(showMobileProfile){ closeWithAnim(setClosingProfile,setShowMobileProfile); } else { setShowMobileProfile(true); closeWithAnim(setClosingVoting,setShowVoting); closeWithAnim(setClosingMsgList,setShowMsgList); }
            },
            badge: isAdmin ? pendingUsers.length : 0,
            avatar: !isAdmin ? currentUser?.avatar : null,
          },
        ];
        // Icon SVG paths for clean look
        const tabIcons = {
          home:     <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>,
          voting:   <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 3H3a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h13.586l3.707 3.707A1 1 0 0 0 22 21V4a1 1 0 0 0-1-1z"/><line x1="7" y1="8" x2="7" y2="13"/><line x1="11" y1="10" x2="11" y2="13"/><line x1="15" y1="6" x2="15" y2="13"/></svg>,
          games:    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" x2="10" y1="11" y2="11"/><line x1="8" x2="8" y1="9" y2="13"/><line x1="15" x2="15.01" y1="12" y2="12"/><line x1="18" x2="18.01" y1="10" y2="10"/><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z"/></svg>,
          messages: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,13 22,4"/></svg>,
          profile:  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>,
        };
        const tabColors = {
          home:     { active: "linear-gradient(135deg,#7C3AED,#A855F7)", glow: "rgba(124,58,237,0.4)" },
          voting:   { active: "linear-gradient(135deg,#0EA5E9,#38BDF8)", glow: "rgba(14,165,233,0.4)" },
          games:    { active: "linear-gradient(135deg,#10B981,#34D399)", glow: "rgba(16,185,129,0.4)" },
          messages: { active: "linear-gradient(135deg,#EC4899,#F472B6)", glow: "rgba(236,72,153,0.4)" },
          profile:  { active: "linear-gradient(135deg,#F59E0B,#FCD34D)", glow: "rgba(245,158,11,0.4)" },
        };
        return (
          <nav className="mobile-bottom-nav" style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            /* height يمتد لأسفل ليغطي منطقة safe-area في iPhone */
            height: "calc(72px + env(safe-area-inset-bottom, 0px))",
            background: "rgba(10,8,20,0.96)",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            zIndex: 9500,
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
            direction: dir,
          }}>
            {tabs.map(tab => {
              const colors = tabColors[tab.key];
              return (
                <button
                  key={tab.key}
                  onClick={tab.action}
                  style={{
                    flex: 1, height: "100%",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    gap: 5, background: "none", border: "none", cursor: "pointer",
                    fontFamily: "'Cairo',sans-serif", padding: "0 4px", position: "relative",
                    transition: "all 0.25s",
                  }}
                >
                  {/* icon bubble */}
                  <div style={{
                    width: 44, height: 44, borderRadius: 14,
                    background: tab.active ? colors.active : "rgba(255,255,255,0.06)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: tab.active ? `0 4px 18px ${colors.glow}` : "none",
                    transition: "all 0.25s",
                    position: "relative",
                    transform: tab.active ? "translateY(-2px)" : "none",
                  }}>
                    {tab.avatar && tab.key === "profile" ? (
                      <img src={tab.avatar} alt="" style={{ width: 30, height: 30, borderRadius: 8, objectFit: "cover" }} />
                    ) : (
                      <span style={{ color: tab.active ? "#fff" : "rgba(255,255,255,0.45)", display: "flex", alignItems: "center" }}>
                        {tabIcons[tab.key]}
                      </span>
                    )}
                    {/* badge */}
                    {tab.badge > 0 && (
                      <span style={{ position: "absolute", top: -6, right: -6, minWidth: 20, height: 20, borderRadius: 10, background: "#E53935", color: "#fff", fontSize: 11, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px", border: "2.5px solid rgba(10,8,20,0.96)", boxShadow: "0 2px 8px rgba(229,57,53,0.6)", fontFamily: "system-ui,sans-serif" }}>
                        {tab.badge > 99 ? "99+" : tab.badge}
                      </span>
                    )}
                  </div>
                  {/* label */}
                  <span style={{ fontSize: 10, fontWeight: 700, color: tab.active ? "#fff" : "rgba(255,255,255,0.35)", lineHeight: 1, transition: "color 0.25s" }}>
                    {lang === "ar" ? tab.labelAr : tab.labelEn}
                  </span>
                </button>
              );
            })}
          </nav>
        );
      })()}

      {/* spacer so content isn't hidden behind the bottom nav on mobile */}
      {(currentUser || isAdmin) && <div className="show-mobile" style={{ height: "calc(72px + env(safe-area-inset-bottom, 0px))" }} />}

      {/* ══════════════ MARIO GAME ══════════════ */}
      {/* ══════════════ GAMES LOBBY ══════════════ */}
      {showGamesLobby && currentUser && (
        <GamesLobby
          onClose={() => setShowGamesLobby(false)}
          closeLobbyRef={closeLobbyRef}
          onSelectGame={(key) => {
            setShowGamesLobby(false);
            if (key === "farm") setShowFarmGame(true);
            if (key === "food-wheel") setShowFoodWheel(true);
          }}
          currentUser={currentUser}
          lang={lang}
          dir={lang === "ar" ? "rtl" : "ltr"}
        />
      )}
      {showMarioGame && <MarioGame onClose={() => setShowMarioGame(false)} />}
      {showFarmGame && currentUser && <FarmGame onClose={() => setShowFarmGame(false)} currentUser={currentUser} lang={lang} onCoinsChange={farmCoinsChange} users={users} />}
      {showFoodWheel && currentUser && (
        <div style={{ position:"fixed", inset:0, zIndex:9999, overflowY:"auto" }}>
          <FoodWheel onBack={() => setShowFoodWheel(false)} currentUser={currentUser} onCoinsChange={farmCoinsChange} users={users} />
        </div>
      )}

      {/* ══════════════ COIN TOAST ══════════════ */}
      {coinToast && (
        <div style={{ position:"fixed", bottom:90, left:"50%", transform:"translateX(-50%)", zIndex:9000, pointerEvents:"none", animation:"slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}
          ref={el => { if (el) setTimeout(() => setCoinToast(null), 4500); }}>
          <div style={{ background:"linear-gradient(135deg,#ffd700,#f59e0b)", borderRadius:20, padding:"14px 24px", display:"flex", flexDirection:"column", alignItems:"center", gap:5, boxShadow:"0 8px 40px rgba(255,215,0,0.5),0 2px 12px rgba(0,0,0,0.4)", minWidth:220 }}>
            <div style={{ fontSize:28 }}>🪙</div>
            <div style={{ fontSize:13, fontWeight:900, color:"#000", textAlign:"center" }}>
              {coinToast.type==="daily" ? (lang==="ar"?"مبروك! وصلك":"Congrats! You received") : (lang==="ar"?"مبروك!":"Congrats!")}
            </div>
            <div style={{ fontSize:22, fontWeight:900, color:"#000" }}>+{(coinToast.amount||0).toLocaleString()} 🪙</div>
            <div style={{ fontSize:11, color:"rgba(0,0,0,0.6)", fontWeight:700, textAlign:"center" }}>{coinToast.msg}</div>
          </div>
        </div>
      )}

      {/* ══════════════ STORY VIEWER ══════════════ */}
      {showStoryViewer && (
        <StoryViewer
          group={showStoryViewer}
          myId={currentUser?.id ?? (isAdmin ? "admin" : null)}
          lang={lang}
          dir={dir}
          onClose={() => setShowStoryViewer(null)}
          onMarkViewed={markStoryViewed}
          onDelete={deleteStory}
          onComment={sendStoryReply}
          users={users}
        />
      )}

      {/* ══════════════ STORY CREATOR ══════════════ */}
      {showStoryCreator && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9700, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end", direction: dir }} onClick={() => setShowStoryCreator(false)}>
          <div style={{ width: "100%", background: darkMode ? "#12101a" : "#fff", borderRadius: "22px 22px 0 0", padding: "20px 20px 36px", animation: "sheetUp 0.3s ease" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: theme.border }} />
            </div>
            <h3 style={{ fontFamily: "'Cairo',sans-serif", fontWeight: 900, fontSize: 18, margin: "0 0 16px", color: theme.text }}>{lang === "ar" ? "إضافة ستوري" : "Add Story"}</h3>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {["text","image"].map(tp => (
                <button key={tp} onClick={() => setStoryType(tp)} style={{ flex: 1, padding: "10px", borderRadius: 12, border: `2px solid ${storyType===tp?"#7C3AED":theme.border}`, background: storyType===tp?"rgba(124,58,237,0.1)":"transparent", color: storyType===tp?"#7C3AED":theme.textMuted, fontFamily: "'Cairo',sans-serif", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
                  {tp === "text" ? (lang==="ar"?"✏️ نص":"✏️ Text") : (lang==="ar"?"📷 صورة":"📷 Image")}
                </button>
              ))}
            </div>
            {storyType === "text" ? (
              <>
                <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                  {STORY_COLORS.map(c => (
                    <div key={c} onClick={() => setStoryBg(c)} style={{ width: 32, height: 32, borderRadius: "50%", background: c, cursor: "pointer", border: storyBg===c?"3px solid #fff":"3px solid transparent", boxShadow: storyBg===c?"0 0 0 2px "+c:"none", transition: "all 0.15s" }} />
                  ))}
                </div>
                <div style={{ borderRadius: 16, background: storyBg, minHeight: 140, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, padding: 16 }}>
                  <textarea value={storyText} onChange={e => setStoryText(e.target.value)} placeholder={lang==="ar"?"اكتب ستوريتك...":"Write your story..."} style={{ background: "none", border: "none", outline: "none", color: "#fff", fontFamily: "'Cairo',sans-serif", fontSize: 20, fontWeight: 800, textAlign: "center", width: "100%", resize: "none", caretColor: "#fff", minHeight: 80 }} rows={3} />
                </div>
              </>
            ) : (
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "30px 20px", borderRadius: 16, border: `2px dashed ${theme.border}`, cursor: "pointer", background: theme.bg }}>
                  {storyImage
                    ? <img src={storyImage} alt="" style={{ maxHeight: 160, borderRadius: 12, objectFit: "contain" }} />
                    : <><span style={{ fontSize: 36 }}>📷</span><span style={{ fontFamily: "'Cairo',sans-serif", color: theme.textMuted, fontSize: 13 }}>{lang==="ar"?"اختر صورة":"Choose image"}</span></>}
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
                    const f = e.target.files[0];
                    if (!f) return;
                    const reader = new FileReader();
                    reader.onload = ev => setStoryImage(ev.target.result);
                    reader.readAsDataURL(f);
                  }} />
                </label>
              </div>
            )}
            <button
              onClick={() => {
                const myId = currentUser?.id ?? (isAdmin ? "admin" : null);
                if (!myId) return;
                if (storyType === "text" && !storyText.trim()) return;
                if (storyType === "image" && !storyImage) return;
                const story = {
                  id: Date.now(),
                  userId: String(myId),
                  userName: isAdmin ? "نايف" : currentUser.name,
                  userAvatar: isAdmin ? null : currentUser.avatar,
                  userColor: isAdmin ? "#D4AF37" : (currentUser.nameColor || "#7C3AED"),
                  type: storyType,
                  content: storyType === "text" ? storyText.trim() : storyImage,
                  bgColor: storyBg,
                  createdAt: Date.now(),
                  expiresAt: Date.now() + 24*60*60*1000,
                  viewers: [],
                };
                addStory(story);
                setShowStoryCreator(false);
              }}
              style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#7C3AED,#EC4899)", color: "#fff", fontFamily: "'Cairo',sans-serif", fontWeight: 900, fontSize: 15, cursor: "pointer", opacity: (storyType==="text"&&storyText.trim()) || (storyType==="image"&&storyImage) ? 1 : 0.5 }}
            >
              {lang === "ar" ? "✓ نشر الستوري" : "✓ Post Story"}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════ NAIF DIARY FULL SCREEN ══════════════ */}

      {/* ══ مودال تأكيد التعديل/الحذف ══ */}
      {naifConfirm && (
        <div style={{ position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",padding:24,direction:dir }} onClick={() => setNaifConfirm(null)}>
          <div style={{ background: darkMode?"#1a1030":"#fff",borderRadius:20,padding:"28px 24px",maxWidth:360,width:"100%",boxShadow:"0 24px 64px rgba(0,0,0,0.4)",border:`1px solid ${darkMode?"rgba(168,130,255,0.2)":"rgba(155,89,182,0.15)"}` }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontSize:36,textAlign:"center",marginBottom:12 }}>
              {naifConfirm.type==="delete" ? "🗑" : "✏️"}
            </div>
            <h3 style={{ margin:"0 0 8px",textAlign:"center",fontFamily:"'Cairo',sans-serif",fontWeight:900,fontSize:17,color: darkMode?"#E8D5FF":"#3d0088" }}>
              {naifConfirm.type==="delete" ? "حذف المذكرة" : "تعديل المذكرة"}
            </h3>
            <p style={{ margin:"0 0 24px",textAlign:"center",fontFamily:"'Cairo',sans-serif",fontSize:13,color: darkMode?"rgba(232,213,255,0.6)":"#666",lineHeight:1.7 }}>
              {naifConfirm.type==="delete"
                ? `هل أنت متأكد من حذف "${naifConfirm.article.title}"؟ لا يمكن التراجع عن هذا الإجراء.`
                : `هل تريد تعديل "${naifConfirm.article.title}"؟`}
            </p>
            <div style={{ display:"flex",gap:10,direction:"rtl" }}>
              <button
                onClick={() => {
                  if (naifConfirm.type==="delete") {
                    updateNaifDiary(d => d.filter(x => x.id !== naifConfirm.article.id));
                    setOpenNaifArticle(null);
                  } else {
                    setEditingNaifId(naifConfirm.article.id);
                    setNewNaifTitle(naifConfirm.article.title);
                    setNewNaifContent(naifConfirm.article.content);
                    setNaifWriteImages(naifConfirm.article.images||[]);
                    setShowNaifWrite(true);
                  }
                  setNaifConfirm(null);
                }}
                style={{ flex:1,padding:"12px",borderRadius:12,border:"none",cursor:"pointer",fontFamily:"'Cairo',sans-serif",fontWeight:900,fontSize:14,background: naifConfirm.type==="delete"?"linear-gradient(135deg,#e74c3c,#c0392b)":"linear-gradient(135deg,#7C3AED,#9D4EDD)",color:"#fff" }}
              >
                {naifConfirm.type==="delete" ? "نعم، احذف" : "نعم، عدّل"}
              </button>
              <button
                onClick={() => setNaifConfirm(null)}
                style={{ flex:1,padding:"12px",borderRadius:12,border:`1px solid ${darkMode?"rgba(168,130,255,0.3)":"rgba(155,89,182,0.2)"}`,cursor:"pointer",fontFamily:"'Cairo',sans-serif",fontWeight:700,fontSize:14,background:"transparent",color: darkMode?"rgba(232,213,255,0.7)":"#666" }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {showNaifDiary && (
        <div style={{ position:"fixed",inset:0,zIndex:2000,background:"#000",direction:dir }}>

          {/* ── Header شفاف عائم ── */}
          <div style={{ position:"absolute",top:0,left:0,right:0,zIndex:20,padding:"env(safe-area-inset-top,0px) 16px 0",background:"linear-gradient(to bottom,rgba(0,0,0,0.75) 0%,transparent 100%)",pointerEvents:"none" }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",height:60 }}>
              <button onClick={() => { if(openNaifArticle) setOpenNaifArticle(null); else setShowNaifDiary(false); }} style={{ pointerEvents:"auto",width:40,height:40,borderRadius:"50%",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.4)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",color:"#fff",fontSize:20,fontWeight:900,flexShrink:0 }}>{dir==="rtl"?"❮":"❯"}</button>
              <div style={{ color:"#fff",fontWeight:900,fontSize:16,textShadow:"0 2px 8px rgba(0,0,0,0.6)",display:"flex",alignItems:"center",gap:7 }}>🌙 مذكرات نفنف</div>
              {modCan("naifDiary","add") && !openNaifArticle ? (
                <button onClick={() => { setEditingNaifId(null); setNewNaifTitle(""); setNewNaifContent(""); setNaifWriteImages([]); setShowNaifWrite(true); }} style={{ pointerEvents:"auto",width:40,height:40,borderRadius:"50%",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.4)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",padding:0 }}>
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
              ) : <div style={{ width:40 }} />}
            </div>
          </div>

          {/* ── Reels scroll (قائمة المذكرات) ── */}
          {!openNaifArticle && (
            naifDiary.length === 0 ? (
              <div style={{ height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,color:"rgba(232,213,255,0.5)" }}>
                <div style={{ fontSize:56 }}>🌙</div>
                <div style={{ fontSize:15,fontWeight:700 }}>لا توجد مذكرات بعد</div>
              </div>
            ) : (
              <div style={{ height:"100%",overflowY:"scroll",scrollSnapType:"y mandatory",WebkitOverflowScrolling:"touch" }}>
                {naifDiary.map((article,i) => {
                  const myId = currentUser?.id ?? (isAdmin?"admin":null);
                  const likedUserIds = Object.keys(article.userReactions||{});
                  const likeCount = likedUserIds.length;
                  const iLiked = myId ? likedUserIds.includes(String(myId)) : false;
                  const commentCount = (article.comments||[]).length;
                  const REEL_GRADIENTS = [
                    "linear-gradient(160deg,#2d0a5c 0%,#0d1a3a 100%)",
                    "linear-gradient(160deg,#1a0533 0%,#0a2a1a 100%)",
                    "linear-gradient(160deg,#3a0a0a 0%,#1a0a3a 100%)",
                    "linear-gradient(160deg,#0a1a3a 0%,#2d0a5c 100%)",
                    "linear-gradient(160deg,#0a2a2a 0%,#1a0a3a 100%)",
                  ];

                  const quickLike = (e) => {
                    e.stopPropagation();
                    if (!myId) return;
                    updateNaifDiary(nd => nd.map(a => {
                      if (a.id !== article.id) return a;
                      const ur = {...(a.userReactions||{})};
                      const reactions = {...(a.reactions||{})};
                      const prev = ur[String(myId)];
                      if (prev) { reactions[prev]=Math.max(0,(reactions[prev]||1)-1); if(!reactions[prev])delete reactions[prev]; delete ur[String(myId)]; }
                      else { reactions["❤️"]=(reactions["❤️"]||0)+1; ur[String(myId)]="❤️"; }
                      return {...a,reactions,userReactions:ur};
                    }));
                  };

                  return (
                    <div key={article.id} style={{ height:"100vh",height:"100svh",scrollSnapAlign:"start",position:"relative",overflow:"hidden",flexShrink:0,display:"flex",flexDirection:"column" }}>
                      {/* ── الخلفية ── */}
                      {article.images?.[0] ? (
                        <img src={article.images[0]} alt="" style={{ position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",filter:"brightness(0.5) saturate(0.8)" }} />
                      ) : (
                        <div style={{ position:"absolute",inset:0,background:REEL_GRADIENTS[i%REEL_GRADIENTS.length],display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16 }}>
                          <div style={{ fontSize:52,opacity:0.18 }}>🌙</div>
                          <span style={{ fontFamily:"'Cairo',sans-serif",fontSize:22,fontWeight:900,color:"rgba(255,255,255,0.15)",letterSpacing:2,textAlign:"center" }}>مذكرات نفنف</span>
                        </div>
                      )}

                      {/* ── Gradient overlays ── */}
                      <div style={{ position:"absolute",inset:0,background:"linear-gradient(to bottom,rgba(0,0,0,0.45) 0%,transparent 35%,transparent 45%,rgba(0,0,0,0.75) 80%,rgba(0,0,0,0.92) 100%)" }} />

                      {/* ── منطقة الضغط لفتح المقال ── */}
                      <div style={{ position:"absolute",inset:0,zIndex:3,cursor:"pointer" }} onClick={() => { setOpenNaifArticle(article); setNaifComment(""); setNaifMenuOpen(false); }} />

                      {/* ── أزرار اليمين (لايك / تعليق) ── */}
                      <div style={{ position:"absolute",right:14,bottom:120,zIndex:10,display:"flex",flexDirection:"column",alignItems:"center",gap:22 }} onClick={e=>e.stopPropagation()}>
                        {/* لايك */}
                        <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:4 }}>
                          <button onClick={quickLike} style={{ width:50,height:50,borderRadius:"50%",border:"none",background:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"transform 0.15s",transform:iLiked?"scale(1.18)":"scale(1)",padding:0 }}>
                            <svg viewBox="0 0 24 24" width="30" height="30" fill={iLiked?"#fff":"none"} stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                          </button>
                          {likeCount>0 && <span style={{ color:"#fff",fontSize:12,fontWeight:800,textShadow:"0 1px 4px rgba(0,0,0,0.7)" }}>{likeCount}</span>}
                        </div>
                        {/* تعليق */}
                        <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:4 }}>
                          <button onClick={() => { setOpenNaifArticle(article); setNaifComment(""); }} style={{ width:50,height:50,borderRadius:"50%",border:"none",background:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0 }}>
                            <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                          </button>
                          {commentCount>0 && <span style={{ color:"#fff",fontSize:12,fontWeight:800,textShadow:"0 1px 4px rgba(0,0,0,0.7)" }}>{commentCount}</span>}
                        </div>
                      </div>

                      {/* ── النص السفلي ── */}
                      <div style={{ position:"absolute",bottom:0,left:0,right:70,padding:`0 20px calc(env(safe-area-inset-bottom,0px) + 72px + 24px)`,zIndex:5,pointerEvents:"none" }}>
                        {/* مؤشر الصور */}
                        {(article.images||[]).length>1 && (
                          <div style={{ display:"flex",gap:4,marginBottom:10 }}>
                            {article.images.map((_,idx) => (
                              <div key={idx} style={{ height:2,flex:1,borderRadius:1,background:idx===0?"#fff":"rgba(255,255,255,0.35)" }} />
                            ))}
                          </div>
                        )}
                        <h2 style={{ margin:"0 0 8px",fontSize:21,fontWeight:900,color:"#fff",lineHeight:1.35,textShadow:"0 2px 12px rgba(0,0,0,0.5)" }}>{article.title}</h2>
                        <p style={{ margin:"0 0 10px",fontSize:13,color:"rgba(255,255,255,0.8)",lineHeight:1.75,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical",textShadow:"0 1px 6px rgba(0,0,0,0.5)" }}>{article.content}</p>
                        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                          <div style={{ width:26,height:26,borderRadius:"50%",background:"linear-gradient(135deg,#9b59b6,#6c5ce7)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,color:"#fff",flexShrink:0 }}>ن</div>
                          <span style={{ fontSize:12,color:"rgba(255,255,255,0.7)",fontWeight:700 }}>نايف · {article.date}</span>
                        </div>
                      </div>

                      {/* ── نقطة الرقم (مؤشر الترتيب) ── */}
                      <div style={{ position:"absolute",top:"50%",right:6,transform:"translateY(-50%)",zIndex:8,display:"flex",flexDirection:"column",gap:5 }}>
                        {naifDiary.map((_,di) => (
                          <div key={di} style={{ width:3,height: di===i?18:5,borderRadius:2,background: di===i?"#fff":"rgba(255,255,255,0.3)",transition:"all 0.3s" }} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* ── المقال المفتوح (overlay يصعد من الأسفل) ── */}
          {openNaifArticle && (() => {
            const art = naifDiary.find(a=>a.id===openNaifArticle.id) || openNaifArticle;
            const EMOJIS = ["❤️","🔥","😂","😮","👏","💯","🎉","💜"];
            const myId = currentUser?.id ?? (isAdmin?"admin":null);
            const myReaction = myId ? (art.userReactions||{})[String(myId)] : null;
            const toggleReaction = (emoji) => {
              if (!myId) return;
              updateNaifDiary(nd => nd.map(a => {
                if (a.id !== art.id) return a;
                const ur = {...(a.userReactions||{})};
                const prev = ur[String(myId)];
                const reactions = {...(a.reactions||{})};
                if (prev) { reactions[prev]=Math.max(0,(reactions[prev]||1)-1); if(!reactions[prev])delete reactions[prev]; }
                if (prev !== emoji) { reactions[emoji]=(reactions[emoji]||0)+1; ur[String(myId)]=emoji; }
                else { delete ur[String(myId)]; }
                return {...a,reactions,userReactions:ur};
              }));
            };
            const sendComment = () => {
              if (!naifComment.trim() || !myId) return;
              const comment = { id:Date.now(), userId:myId, userName: isAdmin?"نايف":(currentUser?.name||"عضو"), text:naifComment.trim(), time: new Date().toLocaleTimeString(lang==="ar"?"ar-SA":"en-US",{hour:"2-digit",minute:"2-digit"}) };
              updateNaifDiary(nd => nd.map(a => a.id===art.id ? {...a,comments:[...(a.comments||[]),comment]} : a));
              setNaifComment("");
            };
            return (
              <div style={{ position:"absolute",inset:0,zIndex:25,display:"flex",flexDirection:"column",background: darkMode?"#0d0820":"#f3eeff",animation:"sheetUp 0.32s cubic-bezier(0.32,0.72,0,1)" }}>
                {/* header المقال */}
                <div style={{ flexShrink:0,display:"flex",alignItems:"center",gap:12,padding:"calc(env(safe-area-inset-top,0px) + 14px) 16px 14px",background: darkMode?"linear-gradient(90deg,#2d0a5c,#1a2a6c)":"linear-gradient(90deg,#9b59b6,#6c5ce7)",boxShadow:"0 4px 20px rgba(0,0,0,0.3)" }}>
                  <button onClick={() => { setOpenNaifArticle(null); setNaifMenuOpen(false); }} style={{ width:40,height:40,borderRadius:"50%",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(255,255,255,0.15)",backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)",color:"#fff",fontSize:20,fontWeight:900,flexShrink:0 }}>{dir==="rtl"?"❮":"❯"}</button>
                  <span style={{ flex:1,color:"#fff",fontWeight:900,fontSize:16,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{art.title}</span>
                  {/* ⋮ النقاط الثلاث */}
                  {(modCan("naifDiary","edit") || modCan("naifDiary","delete")) && (
                    <div style={{ position:"relative",flexShrink:0 }}>
                      <button onClick={e=>{e.stopPropagation();setNaifMenuOpen(v=>!v);}} style={{ width:40,height:40,borderRadius:"50%",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,background:"rgba(255,255,255,0.15)",backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)" }}>
                        {[0,1,2].map(d=><span key={d} style={{ width:4,height:4,borderRadius:"50%",background:"#fff",display:"block" }}/>)}
                      </button>
                      {naifMenuOpen && (
                        <>
                          <div style={{ position:"fixed",inset:0,zIndex:900 }} onClick={()=>setNaifMenuOpen(false)} />
                          <div style={{ position:"absolute",top:46,left:0,zIndex:901,background: darkMode?"#1a1030":"#fff",borderRadius:14,boxShadow:"0 8px 32px rgba(0,0,0,0.3)",border:`1px solid ${darkMode?"rgba(168,130,255,0.2)":"rgba(155,89,182,0.15)"}`,overflow:"hidden",minWidth:150 }}>
                            {modCan("naifDiary","edit") && (
                              <button onClick={e=>{e.stopPropagation();setNaifMenuOpen(false);setNaifConfirm({type:"edit",article:art});}} style={{ width:"100%",padding:"13px 18px",border:"none",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",gap:10,fontFamily:"'Cairo',sans-serif",fontWeight:700,fontSize:14,color: darkMode?"#a78bfa":"#7c3aed" }}>
                                <span style={{ fontSize:17 }}>✏️</span> تعديل
                              </button>
                            )}
                            {modCan("naifDiary","edit")&&modCan("naifDiary","delete") && <div style={{ height:1,background: darkMode?"rgba(168,130,255,0.1)":"rgba(155,89,182,0.1)" }}/>}
                            {modCan("naifDiary","delete") && (
                              <button onClick={e=>{e.stopPropagation();setNaifMenuOpen(false);setNaifConfirm({type:"delete",article:art});}} style={{ width:"100%",padding:"13px 18px",border:"none",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",gap:10,fontFamily:"'Cairo',sans-serif",fontWeight:700,fontSize:14,color:"#e74c3c" }}>
                                <span style={{ fontSize:17 }}>🗑</span> حذف
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* body المقال */}
                <div style={{ flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"20px 16px calc(env(safe-area-inset-bottom,0px) + 20px)" }}>
                  <div style={{ maxWidth:680,margin:"0 auto" }}>
                    {/* صور الغلاف */}
                    {(art.images||[]).length>0 && (
                      <div style={{ borderRadius:16,overflow:"hidden",marginBottom:16,aspectRatio:"16/8",position:"relative" }}>
                        <img src={art.images[0]} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }} />
                        {art.images.length>1&&<span style={{ position:"absolute",bottom:10,right:12,background:"rgba(0,0,0,0.6)",color:"#fff",fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:99 }}>📷 {art.images.length}</span>}
                      </div>
                    )}

                    {/* المحتوى */}
                    <div style={{ borderRadius:16,background: darkMode?"rgba(255,255,255,0.05)":"#fff",border:`1px solid ${darkMode?"rgba(168,130,255,0.2)":"rgba(155,89,182,0.15)"}`,overflow:"hidden",marginBottom:16 }}>
                      <div style={{ height:4,background:"linear-gradient(90deg,#9b59b6,#6c5ce7,#a29bfe)" }}/>
                      <div style={{ padding:"20px 20px 18px" }}>
                        <div style={{ fontSize:11,color: darkMode?"rgba(232,213,255,0.45)":"#999",marginBottom:14 }}>✍️ نايف · 📅 {art.date}</div>
                        <p style={{ margin:0,fontSize:15,lineHeight:2,color: darkMode?"rgba(232,213,255,0.85)":"#333",whiteSpace:"pre-wrap" }}>{art.content}</p>
                      </div>
                      {/* باقي الصور */}
                      {(art.images||[]).length>1 && (
                        <div style={{ padding:"0 16px 16px",display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:8 }}>
                          {art.images.slice(1).map((img,idx)=>(
                            <div key={idx} style={{ borderRadius:10,overflow:"hidden",aspectRatio:"1",cursor:"pointer" }} onClick={()=>window.open(img,"_blank")}>
                              <img src={img} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* التفاعلات */}
                    <div style={{ borderRadius:14,background: darkMode?"rgba(255,255,255,0.04)":"#fff",border:`1px solid ${darkMode?"rgba(168,130,255,0.12)":"rgba(155,89,182,0.1)"}`,padding:"14px 16px",marginBottom:14 }}>
                      <div style={{ fontSize:11,fontWeight:700,color: darkMode?"rgba(232,213,255,0.45)":"#999",marginBottom:10 }}>تفاعل مع المقال</div>
                      <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
                        {EMOJIS.map(emoji=>{
                          const count=(art.reactions||{})[emoji]||0;
                          const mine=myReaction===emoji;
                          return (
                            <button key={emoji} onClick={()=>toggleReaction(emoji)} style={{ display:"flex",alignItems:"center",gap:5,padding:"7px 13px",borderRadius:99,border:`2px solid ${mine?"rgba(168,130,255,0.7)":"rgba(168,130,255,0.18)"}`,background: mine?(darkMode?"rgba(168,130,255,0.2)":"rgba(168,130,255,0.1)"):"transparent",cursor:myId?"pointer":"default",fontSize:18,transition:"all 0.15s" }}>
                              {emoji}{count>0&&<span style={{ fontSize:12,fontWeight:800,color: darkMode?"#E8D5FF":"#3d0088" }}>{count}</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* التعليقات */}
                    <div style={{ borderRadius:14,background: darkMode?"rgba(255,255,255,0.04)":"#fff",border:`1px solid ${darkMode?"rgba(168,130,255,0.12)":"rgba(155,89,182,0.1)"}`,padding:"14px 16px" }}>
                      <div style={{ fontSize:13,fontWeight:800,color: darkMode?"#E8D5FF":"#3d0088",marginBottom:14 }}>💬 التعليقات ({(art.comments||[]).length})</div>
                      {(art.comments||[]).length===0 && <p style={{ fontSize:13,color: darkMode?"rgba(232,213,255,0.35)":"#bbb",textAlign:"center",padding:"12px 0" }}>لا توجد تعليقات بعد</p>}
                      <div style={{ display:"flex",flexDirection:"column",gap:12,marginBottom:16 }}>
                        {(art.comments||[]).map(c=>(
                          <div key={c.id} style={{ display:"flex",gap:10,alignItems:"flex-start" }}>
                            <div style={{ width:34,height:34,borderRadius:"50%",flexShrink:0,background:"linear-gradient(135deg,#9b59b6,#6c5ce7)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,color:"#fff" }}>{c.userName.charAt(0)}</div>
                            <div style={{ flex:1,background: darkMode?"rgba(255,255,255,0.06)":"rgba(155,89,182,0.07)",borderRadius:12,padding:"9px 14px" }}>
                              <div style={{ display:"flex",gap:8,alignItems:"center",marginBottom:4 }}>
                                <span className={c.userId==="admin"?"admin-gold":""} style={{ fontSize:13,fontWeight:800,color: c.userId==="admin"?"#D4AF37":(()=>{const cu=users.find(u=>String(u.id)===String(c.userId));return cu?.nameColor||(darkMode?"#E8D5FF":"#3d0088");})() }}>{c.userName}</span>
                                <span style={{ fontSize:11,color: darkMode?"rgba(232,213,255,0.35)":"#aaa" }}>{c.time}</span>
                              </div>
                              <p style={{ margin:0,fontSize:14,lineHeight:1.7,color: darkMode?"rgba(232,213,255,0.8)":"#444" }}>{c.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {myId ? (
                        <div style={{ display:"flex",gap:8 }}>
                          <input value={naifComment} onChange={e=>setNaifComment(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendComment()} placeholder="أضف تعليقًا..." style={{ ...S.input,flex:1,background: darkMode?"rgba(255,255,255,0.07)":"rgba(155,89,182,0.07)",border:`1px solid rgba(168,130,255,0.3)` }} />
                          <button onClick={sendComment} style={{ ...S.btn,background:"linear-gradient(90deg,#9b59b6,#6c5ce7)",color:"#fff",border:"none",fontWeight:800 }}>إرسال</button>
                        </div>
                      ) : (
                        <p style={{ fontSize:12,color: darkMode?"rgba(232,213,255,0.35)":"#aaa",textAlign:"center" }}>سجّل دخولك للتعليق</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ══════════════ NAIF WRITE COMPOSE SCREEN ══════════════ */}
          {showNaifWrite && (
            <div style={{ position:"absolute",inset:0,zIndex:25,display:"flex",flexDirection:"column",background: darkMode?"#0d0820":"#f3eeff",direction:dir,animation:"sheetUp 0.28s cubic-bezier(0.32,0.72,0,1)" }}>
              {/* Header */}
              <div style={{ flexShrink:0,padding:"calc(env(safe-area-inset-top,0px) + 14px) 20px 14px",background: darkMode?"linear-gradient(135deg,#1a0533,#0d1a3a)":"linear-gradient(135deg,#7c3aed,#4f46e5)",display:"flex",alignItems:"center",gap:12,boxShadow:"0 4px 24px rgba(0,0,0,0.4)" }}>
                <button onClick={() => { setShowNaifWrite(false); setEditingNaifId(null); }} style={{ background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",fontWeight:900,fontSize:18,width:38,height:38,borderRadius:10,cursor:"pointer",flexShrink:0 }}>✕</button>
                <div style={{ flex:1,color:"#fff",fontWeight:900,fontSize:17 }}>{editingNaifId ? "✏️ تعديل المذكرة" : "✍️ مذكرة جديدة"}</div>
                <button
                  onClick={() => {
                    if (!newNaifTitle.trim() || !newNaifContent.trim()) return;
                    if (editingNaifId) {
                      updateNaifDiary(d => d.map(a => a.id===editingNaifId ? {...a, title:newNaifTitle.trim(), content:newNaifContent.trim(), images:[...naifWriteImages]} : a));
                      if (openNaifArticle?.id===editingNaifId) setOpenNaifArticle(a => ({...a, title:newNaifTitle.trim(), content:newNaifContent.trim(), images:[...naifWriteImages]}));
                      setEditingNaifId(null);
                    } else {
                      const entry = { id:Date.now(), title:newNaifTitle.trim(), content:newNaifContent.trim(), date:new Date().toLocaleDateString(lang==="ar"?"ar-SA":"en-US"), images:[...naifWriteImages], reactions:{}, userReactions:{}, comments:[] };
                      updateNaifDiary(d => [entry,...d]);
                    }
                    setNewNaifTitle(""); setNewNaifContent(""); setNaifWriteImages([]);
                    setShowNaifWrite(false);
                  }}
                  style={{ background: newNaifTitle.trim()&&newNaifContent.trim() ? "linear-gradient(90deg,#a78bfa,#818cf8)" : "rgba(255,255,255,0.1)", border:"none",color:"#fff",fontWeight:900,fontSize:14,padding:"8px 20px",borderRadius:10,cursor:newNaifTitle.trim()&&newNaifContent.trim()?"pointer":"default",flexShrink:0,transition:"all 0.2s",boxShadow: newNaifTitle.trim()&&newNaifContent.trim()?"0 4px 16px rgba(139,92,246,0.5)":"none" }}
                >{editingNaifId ? "💾 حفظ" : "نشر ✨"}</button>
              </div>

              {/* Body */}
              <div style={{ flex:1,overflowY:"auto",display:"flex",flexDirection:"column" }}>
                {/* Title */}
                <div style={{ padding:"24px 20px 0" }}>
                  <input
                    value={newNaifTitle}
                    onChange={e=>setNewNaifTitle(e.target.value)}
                    placeholder="عنوان المذكرة..."
                    style={{ width:"100%",background:"transparent",border:"none",outline:"none",fontSize:24,fontWeight:900,color: darkMode?"#E8D5FF":"#3d0088",fontFamily:"'Cairo',sans-serif",direction:dir,boxSizing:"border-box" }}
                  />
                  <div style={{ height:2,background: darkMode?"rgba(168,130,255,0.2)":"rgba(124,58,237,0.15)",borderRadius:2,marginTop:8 }} />
                </div>

                {/* Content */}
                <div style={{ padding:"16px 20px 0",flex:1,display:"flex",flexDirection:"column" }}>
                  <textarea
                    value={newNaifContent}
                    onChange={e=>setNewNaifContent(e.target.value)}
                    placeholder="اكتب مذكرتك هنا... شاركنا ما يدور في خاطرك 🌙"
                    style={{ flex:1,minHeight:220,background:"transparent",border:"none",outline:"none",fontSize:16,lineHeight:2,color: darkMode?"rgba(232,213,255,0.85)":"#333",fontFamily:"'Cairo',sans-serif",resize:"none",direction:dir,boxSizing:"border-box" }}
                  />
                </div>

                {/* Images section */}
                <div style={{ padding:"16px 20px 32px" }}>
                  <div style={{ fontSize:13,fontWeight:800,color: darkMode?"rgba(232,213,255,0.5)":"#9b59b6",marginBottom:12 }}>📷 الصور ({naifWriteImages.length})</div>
                  <div style={{ display:"flex",flexWrap:"wrap",gap:10,alignItems:"flex-start" }}>
                    {naifWriteImages.map((img,idx) => (
                      <div key={idx} style={{ position:"relative",width:100,height:100,borderRadius:12,overflow:"hidden",border:`2px solid ${darkMode?"rgba(168,130,255,0.3)":"rgba(124,58,237,0.2)"}`,flexShrink:0 }}>
                        <img src={img} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }} />
                        <button onClick={() => setNaifWriteImages(imgs => imgs.filter((_,i)=>i!==idx))} style={{ position:"absolute",top:4,right:4,background:"rgba(0,0,0,0.65)",border:"none",color:"#fff",width:22,height:22,borderRadius:"50%",cursor:"pointer",fontSize:12,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1 }}>✕</button>
                        {idx===0 && <span style={{ position:"absolute",bottom:4,left:4,background:"rgba(124,58,237,0.8)",color:"#fff",fontSize:9,fontWeight:700,padding:"1px 5px",borderRadius:99 }}>غلاف</span>}
                      </div>
                    ))}
                    {/* Add image button */}
                    <label htmlFor="naif-img-upload" style={{ width:100,height:100,borderRadius:12,border:`2px dashed ${darkMode?"rgba(168,130,255,0.4)":"rgba(124,58,237,0.35)"}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",background: darkMode?"rgba(168,130,255,0.06)":"rgba(124,58,237,0.04)",transition:"all 0.2s",flexShrink:0 }}
                      onMouseEnter={e=>{e.currentTarget.style.background=darkMode?"rgba(168,130,255,0.12)":"rgba(124,58,237,0.09)";}}
                      onMouseLeave={e=>{e.currentTarget.style.background=darkMode?"rgba(168,130,255,0.06)":"rgba(124,58,237,0.04)";}}
                    >
                      <span style={{ fontSize:28,lineHeight:1 }}>📷</span>
                      <span style={{ fontSize:11,fontWeight:700,color: darkMode?"rgba(232,213,255,0.5)":"#9b59b6",marginTop:6 }}>إضافة صورة</span>
                      <input id="naif-img-upload" type="file" accept="image/*" multiple style={{ display:"none" }}
                        onChange={e => {
                          Array.from(e.target.files).forEach(file => {
                            if (file.size > 3*1024*1024) { alert("الصورة أكبر من 3MB"); return; }
                            const reader = new FileReader();
                            reader.onload = ev => setNaifWriteImages(imgs => [...imgs, ev.target.result]);
                            reader.readAsDataURL(file);
                          });
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                  {naifWriteImages.length>0 && <div style={{ fontSize:11,color: darkMode?"rgba(232,213,255,0.35)":"#bbb",marginTop:8 }}>الصورة الأولى ستكون غلاف المذكرة · اضغط على الصورة لتكبيرها</div>}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════ DIARY ENTRY MODAL ══════════════ */}
      {openDiaryEntry && (
        <div style={S.overlay} onClick={() => setOpenDiaryEntry(null)}>
          <div style={{ ...S.modal, maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div style={{ height: 5, background: "linear-gradient(90deg,#7C3AED,#A855F7,#EC4899)", borderRadius: "20px 20px 0 0" }} />
            <div style={{ padding: "24px 28px", direction: dir }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, gap: 12 }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, flex: 1 }}>{openDiaryEntry.title}</h2>
                <button onClick={() => setOpenDiaryEntry(null)} style={{ ...S.btn, ...S.ghost, padding: "6px 12px", flexShrink: 0 }}>✕</button>
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: theme.textMuted, background: theme.accentDim, padding: "4px 12px", borderRadius: 20 }}>🖊 {openDiaryEntry.author}</span>
                <span style={{ fontSize: 12, color: theme.textMuted, background: theme.accentDim, padding: "4px 12px", borderRadius: 20 }}>📅 {openDiaryEntry.date}</span>
              </div>
              <p style={{ fontSize: 15, lineHeight: 2, color: theme.text, margin: 0, whiteSpace: "pre-wrap" }}>{openDiaryEntry.content}</p>
              <button onClick={() => setOpenDiaryEntry(null)} style={{ ...S.btn, ...S.gold, width: "100%", marginTop: 24, padding: "12px" }}>{t("diaryClose")}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer style={{ textAlign: "center", padding: "28px 24px", paddingBottom: (currentUser || isAdmin) ? "96px" : "28px", borderTop: `1px solid ${theme.border}`, marginTop: 40, background: theme.card }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: theme.text, opacity: 0.75 }}>{t("footer")}</p>
      </footer>

      <style>{`
        @media (max-width: 768px) { .hidden-mobile { display: none !important; } .show-mobile { display: block !important; } .show-mobile-flex { display: flex !important; } }
        @media (min-width: 769px) { .show-mobile { display: none !important; } .show-mobile-flex { display: none !important; } }

        /* ── Mobile bottom nav ── */
        .mobile-bottom-nav { display: none; }
        @media (max-width: 768px) { .mobile-bottom-nav { display: flex !important; } }

        /* ── Stories / hide scrollbar (all browsers) ── */
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        /* ── Reels snap scroll ── */
        .naif-reels-scroll { scrollbar-width: none; }
        .naif-reels-scroll::-webkit-scrollbar { display: none; }
        .naif-reel-item { height: 100vh; height: 100svh; }

        /* ── Messages sheet slide-up ── */
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        /* ── Cross-browser base resets ── */
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        button { touch-action: manipulation; -webkit-tap-highlight-color: transparent; cursor: pointer; }
        input, textarea, select {
          -webkit-appearance: none;
          appearance: none;
          border-radius: 10px;
          font-family: 'Cairo', sans-serif;
          /* 16px prevents iOS auto-zoom */
          font-size: 16px !important;
        }
        input:focus, textarea:focus, select:focus { border-color: #D4AF37 !important; box-shadow: 0 0 0 3px rgba(212,175,55,0.15); outline: none; }

        /* ── Scrollable areas: smooth on iOS ── */
        [data-scroll], .overflow-scroll-touch {
          -webkit-overflow-scrolling: touch;
          overflow-y: auto;
        }

        /* ── Backdrop-filter fallback for Android/Huawei browsers that don't support it ── */
        @supports not (backdrop-filter: blur(1px)) {
          nav.mobile-bottom-nav, .mobile-bottom-nav {
            background: rgba(10,8,20,0.99) !important;
          }
        }

        /* ── Desktop scrollbar ── */
        @media (min-width: 769px) {
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.3); border-radius: 3px; }
        }

        /* ── Animations ── */
        @keyframes fadeIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:0.5; transform:scale(1); } 50% { opacity:1; transform:scale(1.08); } }

        /* ── Ticker ── */
        @keyframes tickerScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        /* ── Mobile content spacing (safe area) ── */
        @media (max-width: 768px) {
          .mobile-page-content {
            padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
          }
        }
      `}</style>
    </div>
  );
}
