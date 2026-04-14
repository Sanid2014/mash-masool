import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coins, Info, Volume2, VolumeX, Star, Trophy, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { db } from './firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

const TRANSLATIONS = {
  EN: {
    premiumPlayer: 'Premium Player', lastWin: 'Last Win', round: 'Round',
    placeBets: 'Place Your Bets', tapItems: 'Tap items on the wheel',
    showTime: 'Show Time!', payout: 'PAYOUT', totalStaked: 'Total Staked',
    masterWheel: 'Master the Wheel', enterArena: 'Enter Arena',
    rule1: 'Select your chip value and click directly on the wheel segments to place your bets.',
    rule2: 'You can bet on up to 6 different items. Stack your bets by clicking multiple times!',
    pizzaBonus: 'Pizza Bonus', pizzaDesc: 'Wins all Meat items (Cow, Chicken, Shrimp, Fish).',
    saladBonus: 'Salad Bonus', saladDesc: 'Wins all Veggie items (Tomato, Carrot, Corn).',
    dailyProfit: 'Daily Profit', myWallet: 'My Wallet',
    items: { chicken:'Chicken', tomato:'Tomato', cow:'Cow', carrot:'Carrot', fish:'Fish', corn:'Corn', shrimp:'Shrimp', pepper:'Pepper' }
  },
  AR: {
    premiumPlayer: 'لاعب متميز', lastWin: 'آخر فوز', round: 'جولة',
    placeBets: 'ضع رهاناتك', tapItems: 'اضغط على العناصر في العجلة',
    showTime: 'وقت العرض!', payout: 'دفع', totalStaked: 'إجمالي الرهان',
    masterWheel: 'احترف العجلة', enterArena: 'دخول الساحة',
    rule1: 'اختر قيمة الرقاقة واضغط مباشرة على أقسام العجلة لوضع رهاناتك.',
    rule2: 'يمكنك المراهنة على ما يصل إلى 6 عناصر مختلفة. ضاعف رهاناتك بالضغط المتكرر!',
    pizzaBonus: 'مكافأة البيتزا', pizzaDesc: 'تفوز بجميع عناصر اللحوم (بقرة، دجاج، جمبري، سمك).',
    saladBonus: 'مكافأة السلطة', saladDesc: 'تفوز بجميع عناصر الخضروات (طماطم، جزر، ذرة).',
    dailyProfit: 'مجمع الأرباح اليومي', myWallet: 'رصيد محفظتي',
    items: { chicken:'دجاج', tomato:'طماطم', cow:'بقرة', carrot:'جزر', fish:'سمك', corn:'ذرة', shrimp:'جمبري', pepper:'فلفل' }
  }
};

const ITEMS = [
  { id: 'chicken', name: 'Chicken', multiplier: 45, icon: '/chick.png',  color: '#FF7F50', category: 'MEAT' },
  { id: 'tomato',  name: 'Tomato',  multiplier: 5,  icon: '/tomato.png', color: '#FF4757', category: 'VEGGIE' },
  { id: 'cow',     name: 'Cow',     multiplier: 15, icon: '/cow.png',    color: '#8B5E3C', category: 'MEAT' },
  { id: 'pepper',  name: 'Pepper',  multiplier: 5,  icon: '/pepper.png', color: '#FF0000', category: 'VEGGIE' },
  { id: 'fish',    name: 'Fish',    multiplier: 15, icon: '/fish.png',   color: '#1E90FF', category: 'MEAT' },
  { id: 'carrot',  name: 'Carrot',  multiplier: 5,  icon: '/carrot.png', color: '#FFA502', category: 'VEGGIE' },
  { id: 'shrimp',  name: 'Shrimp',  multiplier: 10, icon: '/shrimp.png', color: '#FF6B81', category: 'MEAT' },
  { id: 'corn',    name: 'Corn',    multiplier: 5,  icon: '/corn.png',   color: '#ECCC68', category: 'VEGGIE' },
];

const BET_AMOUNTS = [1000, 5000, 10000, 50000, 100000, 1000000];
const ITEM_MAP = new Map(ITEMS.map(item => [item.id, item]));
const randomId = () => Math.random().toString(36).substring(2, 11);
const resolveIcon = (winner) =>
  typeof winner === 'string' ? (winner === 'PIZZA' ? '/pizza.png' : '/salad.png') : winner.icon;

const AVATAR_COLORS = ['#7C3AED','#2563EB','#DC2626','#D97706','#059669','#DB2777','#0891B2','#9333EA'];
const generateAvatar = (name) => {
  const hash = (name || '?').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const bg = AVATAR_COLORS[hash % AVATAR_COLORS.length];
  const initials = (name || '?').replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '').slice(0, 2).toUpperCase() || '??';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg}"/><stop offset="100%" stop-color="${bg}99"/>
    </linearGradient></defs>
    <rect width="100" height="100" rx="20" fill="url(#g)"/>
    <text x="50" y="67" font-family="Arial Black,Arial" font-size="42" font-weight="900"
      fill="white" text-anchor="middle">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
};

const CircularItem = ({ item, index, total, isHighlighted, isTop4, betAmount, onClick, disabled }) => {
  const angle = (360 / total) * index;
  const radius = 155;
  const x = 240 + radius * Math.cos((Math.PI * (angle - 90)) / 180);
  const y = 240 + radius * Math.sin((Math.PI * (angle - 90)) / 180);
  return (
    <g className={`cursor-pointer ${disabled ? 'pointer-events-none' : ''}`} onClick={onClick}>
      {isHighlighted && <circle cx={x} cy={y} r="42" fill="white" className="animate-pulse opacity-50" style={{ filter: 'blur(8px)' }} />}
      <circle cx={x} cy={y} r="38" fill={isHighlighted ? '#FFF' : '#1A1C2C'} stroke={isHighlighted ? '#FFF' : item.color} strokeWidth="3" style={{ filter: isHighlighted ? 'drop-shadow(0 0 15px white)' : 'none' }} />
      <circle cx={x} cy={y} r="32" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <image href={item.icon} x={x - 40} y={y - 44} width="80" height="80" className="select-none pointer-events-none" style={{ filter: isHighlighted ? 'drop-shadow(0 0 6px white)' : 'none' }} />
      <g transform={`translate(${x}, ${y + 12})`}>
        <rect x="-14" y="-6" width="28" height="12" rx="6" fill={isHighlighted ? item.color : 'rgba(0,0,0,0.4)'} />
        <text textAnchor="middle" y="3" fill="white" fontSize="7" fontWeight="900" className="select-none pointer-events-none">{item.multiplier}x</text>
      </g>
      {betAmount > 0 && (
        <g transform={`translate(${x}, ${y + 26})`}>
          <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }}>
            <rect x="-22" y="-8" width="44" height="16" rx="8" fill="#FFD700" stroke="#B8860B" strokeWidth="1.5" />
            <text textAnchor="middle" y="3.5" fill="black" fontSize="9" fontWeight="900" className="select-none">{betAmount.toLocaleString()}</text>
          </motion.g>
        </g>
      )}
      {isTop4 && (
        <g transform={`translate(${x}, ${y + 42})`}>
          <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }}>
            <circle r="8" fill="#FFD700" stroke="white" strokeWidth="1" />
          </motion.g>
        </g>
      )}
    </g>
  );
};

const getSaudiDateStr = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' }); // "YYYY-MM-DD"

export default function FoodWheel({ onBack, currentUser, onCoinsChange, users }) {
  const playerName = currentUser?.name || 'لاعب';

  const getAvatar = (entry) => {
    // Try by userId first (new entries)
    if (entry.userId) {
      if (String(entry.userId) === String(currentUser?.id)) return currentUser?.avatar || null;
      const u = (users || []).find(x => String(x.id) === String(entry.userId));
      if (u?.avatar) return u.avatar;
    }
    // Fallback: match by name for old entries without userId
    const byName = (users || []).find(x => x.name && entry.name && x.name.trim() === entry.name.trim());
    if (byName?.avatar) return byName.avatar;
    if (entry.name && currentUser?.name && entry.name.trim() === currentUser.name.trim()) return currentUser?.avatar || null;
    // Last resort: stored avatar (may be generated SVG)
    return entry.avatar || null;
  };

  const [balance, setBalance] = useState(currentUser?.xcoins ?? 1000000);
  const [dailyProfit, setDailyProfit] = useState(() => {
    try {
      const today = getSaudiDateStr();
      const savedDay = localStorage.getItem('fw_dailyResetDate');
      if (savedDay !== today) {
        localStorage.setItem('fw_dailyResetDate', today);
        localStorage.setItem('fw_dailyProfit', '0');
        return 0;
      }
      return Number(localStorage.getItem('fw_dailyProfit') || '0');
    } catch { return 0; }
  });
  const [gameState, setGameState] = useState('BETTING');
  const [lang, setLang] = useState('AR');
  const [timer, setTimer] = useState(20);
  const [currentBets, setCurrentBets] = useState([]);
  const [selectedAmount, setSelectedAmount] = useState(1000);
  const [highlightedIndex, setHighlightedIndex] = useState(null);
  const [winner, setWinner] = useState(null);
  const [history, setHistory] = useState(() => {
    try { const s = localStorage.getItem('fw_history'); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [isMuted, setIsMuted] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [roundId, setRoundId] = useState(() => {
    try { return Number(localStorage.getItem('fw_roundId') || '1'); } catch { return 1; }
  });
  const [lastWin, setLastWin] = useState(0);
  const [flyingCoins, setFlyingCoins] = useState([]);
  const [lockedHotItemId, setLockedHotItemId] = useState(null);
  const [topWinners, setTopWinners] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [lossStreak, setLossStreak] = useState(0);

  const sessionStartBalance = useRef(currentUser?.xcoins ?? 1000000);
  const currentBetsRef = useRef([]);
  const lossStreakRef = useRef(0);
  const balanceSnapshotRef = useRef(currentUser?.xcoins ?? 1000000);
  const langRef = useRef('AR');
  const isMountedRef = useRef(true);
  const timeoutHandles = useRef(new Set());

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      timeoutHandles.current.forEach(clearTimeout);
      timeoutHandles.current.clear();
    };
  }, []);

  // تحميل الليدربورد الحقيقي من Firebase
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'agency_data', 'food-wheel-leaderboard'), snap => {
      if (!isMountedRef.current) return;
      if (snap.exists()) {
        try {
          const data = JSON.parse(snap.data().v);
          if (Array.isArray(data)) setLeaderboard(data);
        } catch {}
      }
    });
    return () => unsub();
  }, []);

  const computeSmartResult = useCallback((bets, streak, currentBalance) => {
    if (!bets.length) {
      const r = Math.random();
      if (r < 0.75) return { type: 'item', index: Math.floor(Math.random() * ITEMS.length) };
      if (r < 0.875) return { type: 'bonus', bonus: 'PIZZA' };
      return { type: 'bonus', bonus: 'SALAD' };
    }
    const streakBoost = Math.min(streak * 0.09, 0.40);
    const lossRatio = Math.max(0, (sessionStartBalance.current - currentBalance) / sessionStartBalance.current);
    let winProb = Math.min(0.38 + streakBoost + (lossRatio > 0.5 ? 0.13 : lossRatio > 0.3 ? 0.07 : 0), 0.80);
    const nearMissProb = 0.18;
    const bonusProb = streak >= 3 ? 0.22 : 0.125;
    const roll = Math.random();
    if (roll < winProb) {
      const weighted = bets.map(b => { const item = ITEM_MAP.get(b.itemId); return { item, w: Math.sqrt(b.amount) * Math.log1p(item.multiplier) }; });
      const total = weighted.reduce((s, x) => s + x.w, 0);
      let rv = Math.random() * total;
      for (const { item, w } of weighted) { rv -= w; if (rv <= 0) return { type: 'item', index: ITEMS.indexOf(item) }; }
      return { type: 'item', index: ITEMS.indexOf(ITEM_MAP.get(bets[0].itemId)) };
    }
    if (roll < winProb + nearMissProb) {
      const betIndices = bets.map(b => ITEMS.indexOf(ITEM_MAP.get(b.itemId)));
      const picked = betIndices[Math.floor(Math.random() * betIndices.length)];
      return { type: 'item', index: (picked + (Math.random() < 0.5 ? 1 : -1) + ITEMS.length) % ITEMS.length };
    }
    if (roll < winProb + nearMissProb + bonusProb) {
      const hasMeat  = bets.some(b => ITEM_MAP.get(b.itemId)?.category === 'MEAT');
      const hasVeggi = bets.some(b => ITEM_MAP.get(b.itemId)?.category === 'VEGGIE');
      if (hasMeat && !hasVeggi) return { type: 'bonus', bonus: 'PIZZA' };
      if (hasVeggi && !hasMeat) return { type: 'bonus', bonus: 'SALAD' };
      return { type: 'bonus', bonus: Math.random() < 0.5 ? 'PIZZA' : 'SALAD' };
    }
    const bettedIds = new Set(bets.map(b => b.itemId));
    const losers = ITEMS.filter(i => !bettedIds.has(i.id));
    if (!losers.length) return { type: 'item', index: Math.floor(Math.random() * ITEMS.length) };
    return { type: 'item', index: ITEMS.indexOf(losers[Math.floor(Math.random() * losers.length)]) };
  }, []);

  useEffect(() => { currentBetsRef.current = currentBets; }, [currentBets]);
  useEffect(() => { lossStreakRef.current = lossStreak; }, [lossStreak]);
  useEffect(() => { balanceSnapshotRef.current = balance; }, [balance]);
  useEffect(() => { langRef.current = lang; }, [lang]);
  useEffect(() => { try { localStorage.setItem('fw_roundId', String(roundId)); } catch {} }, [roundId]);
  useEffect(() => { try { localStorage.setItem('fw_history', JSON.stringify(history)); } catch {} }, [history]);
  useEffect(() => { try { localStorage.setItem('fw_dailyProfit', String(dailyProfit)); } catch {} }, [dailyProfit]);

  // إعادة تعيين تلقائية عند منتصف الليل بتوقيت الرياض
  useEffect(() => {
    const check = setInterval(() => {
      const today = getSaudiDateStr();
      const saved = localStorage.getItem('fw_dailyResetDate');
      if (saved !== today) {
        localStorage.setItem('fw_dailyResetDate', today);
        localStorage.setItem('fw_dailyProfit', '0');
        setDailyProfit(0);
      }
    }, 60000); // يتحقق كل دقيقة
    return () => clearInterval(check);
  }, []);

  useEffect(() => {
    let interval;
    if (gameState === 'BETTING' && timer > 0) interval = setInterval(() => setTimer(t => t - 1), 1000);
    else if (gameState === 'BETTING' && timer === 0) startSpin();
    return () => clearInterval(interval);
  }, [gameState, timer]); // eslint-disable-line

  const startSpin = async () => {
    setGameState('SPINNING'); setLastWin(0);
    const bets = currentBetsRef.current;
    const streak = lossStreakRef.current;
    const bal = balanceSnapshotRef.current;
    const smartResult = computeSmartResult(bets, streak, bal);
    let finalResult, finalIndex;
    if (smartResult.type === 'item') { finalIndex = smartResult.index; finalResult = ITEMS[finalIndex]; }
    else { finalResult = smartResult.bonus; finalIndex = smartResult.bonus === 'PIZZA' ? -1 : -2; }
    const totalSteps = 50 + (finalIndex >= 0 ? finalIndex : Math.floor(Math.random() * 8));
    setTimer(5);
    const spinTimerInterval = setInterval(() => { if (isMountedRef.current) setTimer(t => Math.max(0, t - 1)); }, 1000);
    const startTime = Date.now(); const duration = 5000;
    for (let i = 0; i <= totalSteps; i++) {
      if (!isMountedRef.current) { clearInterval(spinTimerInterval); return; }
      setHighlightedIndex(i % ITEMS.length);
      const elapsed = Date.now() - startTime; const progress = i / totalSteps;
      const remainingTime = duration - elapsed; const remainingSteps = totalSteps - i;
      let delay = 50;
      if (remainingSteps > 0) delay = (remainingTime / remainingSteps) * (1 + Math.pow(progress, 2) * 2);
      if (elapsed >= duration) break;
      await new Promise(r => setTimeout(r, Math.max(10, delay)));
    }
    clearInterval(spinTimerInterval);
    if (!isMountedRef.current) return;
    setTimer(0);
    setHighlightedIndex(finalIndex >= 0 ? finalIndex : null);
    setWinner(finalResult);
    setGameState('RESULT');

    let winnings = 0;
    if (typeof finalResult === 'string') {
      const cat = finalResult === 'PIZZA' ? 'MEAT' : 'VEGGIE';
      bets.forEach(bet => { const item = ITEM_MAP.get(bet.itemId); if (item?.category === cat) winnings += bet.amount * item.multiplier; });
    } else {
      const bet = bets.find(b => b.itemId === finalResult.id);
      if (bet) winnings = bet.amount * finalResult.multiplier;
    }

    if (winnings > 0) {
      setBalance(b => b + winnings);
      setDailyProfit(p => p + winnings);
      setLastWin(winnings);
      setLossStreak(0);
      if (onCoinsChange) onCoinsChange(winnings);
      confetti({ particleCount: 200, spread: 90, origin: { y: 0.7 }, colors: ['#FFD700', '#FFA500', '#FFFFFF'] });

      // حفظ الفوز في ليدربورد Firebase الحقيقي
      const newEntry = {
        id: `${currentUser?.id || 'guest'}_${Date.now()}`,
        name: playerName,
        avatar: currentUser?.avatar || generateAvatar(playerName),
        userId: currentUser?.id || null,
        winAmount: winnings,
        winningItem: finalResult,
        ts: Date.now(),
      };
      setLeaderboard(prev => {
        const updated = [...prev, newEntry].sort((a, b) => b.winAmount - a.winAmount).slice(0, 10);
        setDoc(doc(db, 'agency_data', 'food-wheel-leaderboard'), { v: JSON.stringify(updated) }).catch(() => {});
        return updated;
      });
      setTopWinners([{ name: playerName, win: winnings }]);
    } else if (bets.length > 0) {
      setLossStreak(s => s + 1);
      setTopWinners([]);
    }

    setHistory(h => [{ id: randomId(), winner: finalResult, timestamp: Date.now() }, ...h].slice(0, 12));
    const resetHandle = setTimeout(() => {
      if (!isMountedRef.current) return;
      setGameState('BETTING'); setTimer(20); setCurrentBets([]); setWinner(null); setHighlightedIndex(null);
      setRoundId(r => r + 1); setLockedHotItemId(null); timeoutHandles.current.delete(resetHandle);
    }, 6000);
    timeoutHandles.current.add(resetHandle);
  };

  const handleBet = useCallback((itemId, event) => {
    if (gameState !== 'BETTING') return;
    const existing = currentBets.find(b => b.itemId === itemId);
    if (!existing && currentBets.length >= 6) return;
    if (balance < selectedAmount) return;
    if (event) {
      const coinId = Date.now();
      setFlyingCoins(prev => [...prev, { id: coinId, startX: event.clientX, startY: event.clientY }]);
      const h = setTimeout(() => { if (isMountedRef.current) setFlyingCoins(prev => prev.filter(c => c.id !== coinId)); timeoutHandles.current.delete(h); }, 600);
      timeoutHandles.current.add(h);
    }
    setBalance(b => b - selectedAmount);
    setDailyProfit(p => p - selectedAmount);
    if (onCoinsChange) onCoinsChange(-selectedAmount);
    setCurrentBets(prev => existing
      ? prev.map(b => b.itemId === itemId ? { ...b, amount: b.amount + selectedAmount } : b)
      : [...prev, { itemId, amount: selectedAmount }]
    );
  }, [gameState, balance, selectedAmount, currentBets, onCoinsChange]);

  const totalBet = currentBets.reduce((s, b) => s + b.amount, 0);
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    if (gameState === 'BETTING' && timer <= 10 && timer > 0 && !lockedHotItemId && currentBets.length > 0) {
      const totals = {};
      currentBets.forEach(bet => { totals[bet.itemId] = (totals[bet.itemId] || 0) + bet.amount; });
      const hotId = Object.entries(totals).sort(([,a],[,b]) => b - a)[0]?.[0];
      if (hotId) setLockedHotItemId(hotId);
    }
  }, [gameState, timer, currentBets, lockedHotItemId]);

  const top4ItemIds = useMemo(() => {
    if (gameState !== 'BETTING' || timer > 5 || !currentBets.length) return [];
    const totals = {};
    currentBets.forEach(bet => { totals[bet.itemId] = (totals[bet.itemId] || 0) + bet.amount; });
    return Object.entries(totals).sort(([,a],[,b]) => b - a).slice(0, 4).map(([id]) => id);
  }, [gameState, timer, currentBets]);

  return (
    <div className={`min-h-screen bg-[#0F0F1A] text-white font-sans flex flex-col ${lang === 'AR' ? 'rtl' : 'ltr'}`}>
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-800/25 blur-[140px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-800/25 blur-[140px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      </div>

      {/* Top Bar */}
      <header className="relative z-20 p-2 sm:p-3 flex items-center justify-between backdrop-blur-md bg-black/30 border-b border-white/10">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} style={{ width:40,height:40,borderRadius:"50%",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(50,20,80,0.85)",backdropFilter:"blur(6px)",color:"#fff",fontSize:20,fontWeight:900,flexShrink:0 }}>
              {lang === 'AR' ? '❮' : '❯'}
            </button>
          )}
          <div className="px-2 py-0.5 bg-white/5 rounded-md border border-white/10">
            <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{t.round} #{roundId}</span>
          </div>
          {currentUser && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-lg border border-white/10">
              <img src={generateAvatar(playerName)} alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
              <span className="text-[11px] font-black text-gray-300 max-w-[80px] truncate">{playerName}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowRules(true)} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all">
            <Info className="w-5 h-5 text-gray-400" />
          </button>
          <button onClick={() => setIsMuted(!isMuted)} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all">
            {isMuted ? <VolumeX className="w-5 h-5 text-gray-400" /> : <Volume2 className="w-5 h-5 text-gray-400" />}
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 relative flex flex-col items-center justify-center p-1 z-10 overflow-hidden">
        <div className="mb-1 w-full max-w-5xl">
          <AnimatePresence mode="wait">
            {gameState === 'BETTING' && (
              <motion.div key="betting" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} className="flex items-center justify-between w-full max-w-4xl px-6">
                <div className="flex flex-col items-start">
                  <h1 className="text-2xl font-black uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 drop-shadow-lg">{t.placeBets}</h1>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{t.tapItems}</p>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm">
                  {lockedHotItemId
                    ? <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 animate-pulse">🔥 HOT: {t.items[lockedHotItemId]}</span>
                    : <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t.placeBets}</span>}
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                </div>
              </motion.div>
            )}
            {gameState === 'SPINNING' && (
              <motion.div key="spinning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
                <div className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-[0_0_40px_rgba(147,51,234,0.4)] border border-white/20 animate-pulse">
                  <span className="text-2xl font-black uppercase italic tracking-[0.2em]">{t.showTime}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative flex items-center justify-center w-full max-w-4xl pt-2 min-h-[420px]">
          {/* Leaderboard trigger */}
          <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute top-0 right-[0%] sm:right-[5%] z-40">
            <button onClick={() => setShowLeaderboard(true)} className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000" />
              <div className="relative w-14 h-14 bg-[#1A1C2C]/80 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center overflow-visible">
                {leaderboard[0]
                  ? <img src={getAvatar(leaderboard[0])} alt="Top" className="w-12 h-12 rounded-full object-cover border-2 border-yellow-400/50" />
                  : <Trophy className="w-6 h-6 text-yellow-400" />}
                <div className="absolute -top-1 -left-1 bg-yellow-400 text-black w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shadow-lg">#1</div>
              </div>
            </button>
          </motion.div>

          {/* Pizza Bonus */}
          <motion.div
            animate={{ scale: winner === 'PIZZA' ? [1,1.1,1] : 1, borderColor: winner === 'PIZZA' ? '#FF7F50' : 'rgba(255,255,255,0.1)', backgroundColor: winner === 'PIZZA' ? 'rgba(255,127,80,0.2)' : 'rgba(255,255,255,0.05)' }}
            className="absolute bottom-4 left-[2%] sm:left-[10%] flex flex-col items-center justify-center w-20 h-20 rounded-full border-2 backdrop-blur-md z-30">
            <img src="/pizza.png" className="w-10 h-10 object-contain" alt="" />
            <span className="text-[10px] font-black uppercase text-white/90 mt-1">{t.pizzaBonus}</span>
          </motion.div>

          {/* Wheel */}
          <div className="relative mx-4">
            <div className="relative w-[340px] h-[340px] sm:w-[420px] sm:h-[420px]">
              <svg viewBox="0 0 480 480" className="w-full h-full drop-shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                <circle cx="240" cy="240" r="155" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <circle cx="240" cy="240" r="195" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                {ITEMS.map((item, i) => (
                  <CircularItem key={item.id} item={item} index={i} total={ITEMS.length}
                    isHighlighted={highlightedIndex === i} isHot={lockedHotItemId === item.id}
                    isTop4={top4ItemIds.includes(item.id)}
                    betAmount={currentBets.find(b => b.itemId === item.id)?.amount || 0}
                    onClick={(e) => handleBet(item.id, e)} disabled={gameState !== 'BETTING'} />
                ))}
                <circle cx="240" cy="240" r="65" fill="#1A1C2C" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                {/* Greedy Cat center image */}
                <clipPath id="centerClip">
                  <circle cx="240" cy="240" r="62" />
                </clipPath>
                <image
                  href="/greedycat.png"
                  x="178" y="178" width="124" height="124"
                  clipPath="url(#centerClip)"
                  className="pointer-events-none"
                  style={{ opacity: gameState === 'RESULT' ? 0 : 0.85 }}
                />
                {/* Result emoji overlay */}
                {gameState === 'RESULT' && (
                  <motion.text x="240" y="258" textAnchor="middle" fontSize="62" className="select-none pointer-events-none"
                    animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6 }}>
                    {lastWin > 0 ? '🤩' : '😤'}
                  </motion.text>
                )}
                <g className="pointer-events-none">
                  {(gameState === 'BETTING' || gameState === 'SPINNING') && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <circle cx="240" cy="240" r="30" fill="rgba(0,0,0,0.6)" />
                      <text x="240" y="252" textAnchor="middle" fontSize="32" fontWeight="900" fill={gameState === 'SPINNING' ? '#FACC15' : 'white'} className="italic">{timer}</text>
                    </motion.g>
                  )}
                </g>
              </svg>
              {/* HOT indicator */}
              <AnimatePresence>
                {lockedHotItemId && (
                  <motion.div key={`hot-${lockedHotItemId}`} initial={{ scale:0, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0, opacity:0 }}
                    className="absolute z-[100] pointer-events-none"
                    style={{ left:'50%', top:'50%', x:`${155 * Math.cos((Math.PI * ((360/ITEMS.length) * ITEMS.findIndex(it => it.id === lockedHotItemId) - 90))/180)}px`, y:`${155 * Math.sin((Math.PI * ((360/ITEMS.length) * ITEMS.findIndex(it => it.id === lockedHotItemId) - 90))/180) - 45}px`, translateX:'-50%', translateY:'-50%' }}>
                    <div className="relative px-2.5 py-0.5 bg-gradient-to-r from-orange-600 to-red-600 border border-white rounded-full flex items-center gap-1">
                      <span className="text-[11px] font-black text-white italic whitespace-nowrap">🔥 HOT</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Salad Bonus */}
          <motion.div
            animate={{ scale: winner === 'SALAD' ? [1,1.1,1] : 1, borderColor: winner === 'SALAD' ? '#4CD137' : 'rgba(255,255,255,0.1)', backgroundColor: winner === 'SALAD' ? 'rgba(76,209,55,0.2)' : 'rgba(255,255,255,0.05)' }}
            className="absolute bottom-4 right-[2%] sm:right-[10%] flex flex-col items-center justify-center w-20 h-20 rounded-full border-2 backdrop-blur-md z-30">
            <img src="/salad.png" className="w-10 h-10 object-contain" alt="" />
            <span className="text-[10px] font-black uppercase text-white/90 mt-1">{t.saladBonus}</span>
          </motion.div>
        </div>

        {/* Chip Selector */}
        <div className="mt-0 w-full max-w-5xl px-2">
          <div className="flex items-center justify-between px-4 py-3 bg-white/5 rounded-[16px] border border-white/10 backdrop-blur-md shadow-inner mb-2">
            <div className="flex flex-col items-start">
              <div className="text-[11px] text-gray-500 font-black uppercase tracking-widest mb-0.5">{t.myWallet}</div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-yellow-400/20 flex items-center justify-center"><Coins className="w-4 h-4 text-yellow-400" /></div>
                <span className="text-lg font-black text-white">{balance.toLocaleString()}</span>
              </div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col items-end">
              <div className="text-[11px] text-gray-500 font-black uppercase tracking-widest mb-0.5">{t.dailyProfit}</div>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-black ${dailyProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{dailyProfit >= 0 ? '+' : ''}{dailyProfit.toLocaleString()}</span>
                <div className="w-7 h-7 rounded-full bg-green-400/20 flex items-center justify-center"><Zap className="w-4 h-4 text-green-400" /></div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-nowrap mb-1">
            {BET_AMOUNTS.map((amount) => (
              <button key={amount} onClick={() => setSelectedAmount(amount)}
                className={`relative flex-1 min-w-0 h-16 sm:h-20 rounded-xl sm:rounded-2xl font-black transition-all overflow-hidden ${selectedAmount === amount ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-black scale-105 shadow-[0_0_20px_rgba(251,191,36,0.4)]' : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'}`}>
                <div className="relative z-10 flex flex-col items-center justify-center gap-0.5">
                  <img src="/Xcoins.png" className="w-10 h-10 object-contain opacity-90" alt="" />
                  <span className="text-xs sm:text-sm leading-none font-black">{amount.toLocaleString()}</span>
                </div>
                {selectedAmount === amount && <motion.div layoutId="activeChip" className="absolute inset-0 bg-white/20" />}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 px-1 overflow-x-auto py-2 mb-1" style={{ scrollbarWidth: 'none' }}>
            <div className="text-[11px] text-gray-400 font-black uppercase tracking-widest whitespace-nowrap border-r border-white/10 pr-3">آخر النتائج</div>
            <div className="flex gap-2">
              {history.map((e) => (
                <motion.div key={e.id} initial={{ scale:0, opacity:0 }} animate={{ scale:1, opacity:1 }}
                  className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <img src={resolveIcon(e.winner)} className="w-14 h-14 object-contain" alt="" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 backdrop-blur-2xl bg-black/50 border-t border-white/10 p-2 rounded-t-[28px]">
        <div className="flex items-center gap-2 px-2">
          <div className="text-[10px] text-gray-500 font-black uppercase mr-2">LIVE</div>
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        </div>
      </footer>

      {/* Result Overlay */}
      <AnimatePresence>
        {gameState === 'RESULT' && (() => {
          const winnerItem = winner && typeof winner === 'object' ? winner : null;
          const winnerLabel = winnerItem
            ? (t.items[winnerItem.id] || winnerItem.name)
            : winner === 'PIZZA' ? t.pizzaBonus : winner === 'SALAD' ? t.saladBonus : '';
          const winnerMultiplier = winnerItem ? `x${winnerItem.multiplier}` : '';
          return (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="fixed inset-0 z-[150] flex items-end justify-center pb-12 sm:pb-20 px-6 bg-black/60 backdrop-blur-sm">
              <motion.div initial={{ y:300, opacity:0 }} animate={{ y:0, opacity:1 }} exit={{ y:300, opacity:0 }} transition={{ type:"spring", damping:25, stiffness:200 }}
                className={`w-full max-w-md rounded-[40px] p-8 border shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden ${lastWin > 0 ? 'bg-[#13182A] border-yellow-500/20' : 'bg-[#1A1C2C] border-white/10'}`}>
                <div className={`absolute inset-0 bg-gradient-to-b pointer-events-none ${lastWin > 0 ? 'from-yellow-500/10 via-purple-500/5 to-transparent' : 'from-white/5 to-transparent'}`} />
                <div className="relative z-10 flex flex-col items-center">
                  {/* Winning item icon */}
                  <motion.div initial={{ scale:0, rotate:-20 }} animate={{ scale:1, rotate:0 }} transition={{ delay:0.2, type:"spring" }}
                    className="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-3 shadow-2xl">
                    <img src={winner ? resolveIcon(winner) : ''} className="w-16 h-16 object-contain drop-shadow-lg" alt="" />
                  </motion.div>
                  {/* Item name + multiplier */}
                  <motion.div initial={{ y:10, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ delay:0.25 }} className="flex flex-col items-center gap-0.5 mb-5">
                    <span className="text-lg font-black text-white">{winnerLabel}</span>
                    {winnerMultiplier && <span className="text-sm font-black text-yellow-400/80">{winnerMultiplier}</span>}
                  </motion.div>
                  {/* Bet & Win stats */}
                  <motion.div initial={{ y:20, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ delay:0.35 }} className="w-full grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-white/5 rounded-2xl p-4 flex flex-col items-center border border-white/5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{lang === 'AR' ? 'الرهان' : 'Bet'}</span>
                      <span className="text-xl font-black text-white">{totalBet.toLocaleString()}</span>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4 flex flex-col items-center border border-white/5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{lang === 'AR' ? 'الربح' : 'Win'}</span>
                      <span className={`text-xl font-black ${lastWin > 0 ? 'text-yellow-400' : 'text-white'}`}>{lastWin.toLocaleString()}</span>
                    </div>
                  </motion.div>
                  {/* Winners / No winners */}
                  <motion.div initial={{ y:20, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ delay:0.5 }} className="w-full space-y-3">
                    {topWinners.length > 0 ? (
                      <>
                        <div className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 mb-3">🏆 {lang === 'AR' ? 'رابحو الجولة' : 'Round Winners'}</div>
                        {topWinners.map((w, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white/5 rounded-xl px-5 py-3 border border-white/5">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full bg-yellow-400 text-black flex items-center justify-center text-[10px] font-black">1</div>
                              <span className="text-sm font-bold text-gray-200">{w.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm font-black text-yellow-400/80">
                              <Coins className="w-3.5 h-3.5" />{w.win.toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="text-center py-2 text-sm font-black text-gray-500">
                        {lang === 'AR' ? 'لا يوجد رابحين في هذه الجولة' : 'No winners this round'}
                      </div>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Leaderboard Modal */}
      <AnimatePresence>
        {showLeaderboard && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl" onClick={() => setShowLeaderboard(false)}>
            <motion.div initial={{ scale:0.9, y:20 }} animate={{ scale:1, y:0 }} exit={{ scale:0.9, y:20 }} className="bg-[#1A1C2C] w-full max-w-md rounded-[48px] p-8 border border-white/10 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-yellow-400/10 rounded-2xl"><Trophy className="w-6 h-6 text-yellow-400" /></div>
                  <div>
                    <h2 className="text-2xl font-black text-white">{lang === 'AR' ? 'أكبر الفائزين' : 'Top Winners'}</h2>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{lang === 'AR' ? 'أعلى 10 فوزات من الأعضاء' : 'Top 10 Member Wins'}</p>
                  </div>
                </div>
                <button onClick={() => setShowLeaderboard(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10">✕</button>
              </div>
              {leaderboard.length === 0 ? (
                <div className="text-center text-gray-500 py-12 text-sm font-black">
                  {lang === 'AR' ? 'لا توجد فوزات بعد — كن الأول!' : 'No wins yet — be the first!'}
                </div>
              ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto" style={{ scrollbarWidth:'none' }}>
                  {leaderboard.map((entry, idx) => (
                    <div key={entry.id} className={`flex items-center justify-between p-4 rounded-3xl border ${idx===0?'bg-yellow-400/10 border-yellow-400/20':'bg-white/5 border-white/5'}`}>
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img src={getAvatar(entry)} alt={entry.name} className={`w-12 h-12 rounded-xl object-cover border-2 ${idx===0?'border-yellow-400':idx===1?'border-gray-300':idx===2?'border-orange-400':'border-white/10'}`} />
                          <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${idx===0?'bg-yellow-400 text-black':idx===1?'bg-gray-300 text-black':idx===2?'bg-orange-400 text-black':'bg-white/10 text-white'}`}>{idx+1}</div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white">{entry.name}</span>
                          <div className="flex items-center gap-1.5 text-yellow-400/80 font-black text-xs"><Coins className="w-3 h-3" />{entry.winAmount.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center">
                        <img src={resolveIcon(entry.winningItem)} className="w-7 h-7 object-contain" alt="" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rules */}
      <AnimatePresence>
        {showRules && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl" onClick={() => setShowRules(false)}>
            <motion.div initial={{ scale:0.9, y:20 }} animate={{ scale:1, y:0 }} exit={{ scale:0.9, y:20 }} className="bg-[#1A1C2C] w-full max-w-lg rounded-[48px] p-10 border border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg"><Star className="w-8 h-8 text-black" /></div>
                <h2 className="text-3xl font-black uppercase italic tracking-tighter">{t.masterWheel}</h2>
              </div>
              <div className="space-y-6">
                <div className="flex gap-4 p-4 bg-white/5 rounded-3xl border border-white/5">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex-shrink-0 flex items-center justify-center font-black text-purple-400">01</div>
                  <p className="text-gray-300 text-sm leading-relaxed">{t.rule1}</p>
                </div>
                <div className="flex gap-4 p-4 bg-white/5 rounded-3xl border border-white/5">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex-shrink-0 flex items-center justify-center font-black text-blue-400">02</div>
                  <p className="text-gray-300 text-sm leading-relaxed">{t.rule2}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-orange-500/10 rounded-3xl border border-orange-500/20">
                    <img src="/pizza.png" className="w-8 h-8 object-contain mb-1" alt="" />
                    <div className="text-xs font-black text-orange-400 uppercase mb-1">{t.pizzaBonus}</div>
                    <p className="text-[10px] text-gray-400">{t.pizzaDesc}</p>
                  </div>
                  <div className="p-4 bg-green-500/10 rounded-3xl border border-green-500/20">
                    <img src="/salad.png" className="w-8 h-8 object-contain mb-1" alt="" />
                    <div className="text-xs font-black text-green-400 uppercase mb-1">{t.saladBonus}</div>
                    <p className="text-[10px] text-gray-400">{t.saladDesc}</p>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowRules(false)} className="w-full mt-10 py-5 bg-white text-black font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-gray-100 transition-all active:scale-95">{t.enterArena}</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flying Coins */}
      <div className="fixed inset-0 pointer-events-none z-[200]">
        <AnimatePresence>
          {flyingCoins.map(coin => (
            <motion.div key={coin.id}
              initial={{ x:coin.startX, y:coin.startY, scale:1, opacity:1 }}
              animate={{ x:window.innerWidth/2, y:window.innerHeight/2-50, scale:0.5, opacity:0 }}
              exit={{ opacity:0 }} transition={{ duration:0.6, ease:"backIn" }}
              className="absolute w-6 h-6 bg-yellow-400 rounded-full border-2 border-yellow-600 flex items-center justify-center shadow-lg">
              <Coins className="w-3 h-3 text-yellow-800" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes gradient-x { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        .animate-gradient-x { background-size:200% 200%; animation:gradient-x 3s ease infinite; }
      `}</style>
    </div>
  );
}
