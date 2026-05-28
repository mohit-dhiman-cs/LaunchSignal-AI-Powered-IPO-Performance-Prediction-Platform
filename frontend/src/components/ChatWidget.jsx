import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ── Language Auto-Detection ───────────────────────────────────────────────────
// Detects if user typed in Hinglish/Hindi by matching common Hinglish markers
const HINGLISH_MARKERS = [
  'kya', 'kaise', 'kaisa', 'hai', 'hain', 'bhai', 'batao', 'bata', 'dost',
  'mein', ' ka ', ' ko ', ' se ', ' pe ', ' ke ', 'wala', 'wali', 'wale',
  'nahi', 'nai', 'hota', 'hoti', 'matlab', 'yaar', 'bol', 'pooch', 'poochna',
  'samjho', 'samjha', 'samajh', 'kitna', 'kitne', 'kab', 'kyun', 'kaun',
  'kahan', 'toh', ' aur ', ' ya ', ' bhi ', 'accha', 'theek', 'sahi', 'galat',
  'paise', 'paisa', 'rupaye', 'rupee', 'hoga', 'hogi', 'tha', 'thi', 'the',
  'chahiye', 'milega', 'milta', 'lagao', 'lagta', 'karega', 'karein', 'karo',
  'dekho', 'dekh', 'lekin', 'phir', 'abhi', 'baad', 'pehle', 'aaj', 'kal',
  'sab', 'kuch', 'bahut', 'thoda', 'zyada', 'kam', 'achha', 'bura', 'lena',
  'dena', 'banana', 'sunao', 'sunn', 'kyunki', 'isliye', 'matlab', 'mera',
  'tera', 'uska', 'hamara', 'tumhara', 'yeh', 'woh', 'iske', 'usse', 'inse',
  'jaise', 'tarah', 'seedha', 'seedhe', 'sikha', 'jana', 'aana', 'rehna',
  'poora', 'adha', 'sasta', 'mahnga', 'fayda', 'nuksan', 'ghata', 'faida',
];

function detectLang(msg) {
  const lower = ' ' + msg.toLowerCase() + ' ';
  const hits = HINGLISH_MARKERS.filter(w => lower.includes(w.startsWith(' ') ? w : ` ${w} `) || lower.includes(` ${w},`) || lower.includes(` ${w}?`) || lower.includes(` ${w}!`));
  // Also do a quick check for Devanagari script
  const hasDevanagari = /[\u0900-\u097F]/.test(msg);
  return (hits.length >= 1 || hasDevanagari) ? 'hi' : 'en';
}

// ── System contexts ───────────────────────────────────────────────────────────
const CONTEXT_EN = `You are IPO Genie, an AI assistant embedded in LaunchSignal — an AI-powered IPO prediction platform for Indian stock markets.

Key knowledge:
- GMP (Grey Market Premium): Unofficial demand indicator before listing
- QIB: Qualified Institutional Buyers — smart money signal
- NII/HNI: Non-Institutional Investors / High Net Worth Individuals
- Subscription ratio: How many times an IPO was oversubscribed
- SEBI: Securities and Exchange Board of India
- NSE/BSE: National/Bombay Stock Exchange
- Listing gain: % gain on IPO allotment price on day 1
- RHP: Red Herring Prospectus (IPO document)

Respond in English. Keep answers concise and practical. Always recommend consulting a SEBI-registered advisor for investment decisions.`;

const CONTEXT_HI = `Tu IPO Genie hai — LaunchSignal ka AI assistant. LaunchSignal ek AI-powered IPO prediction platform hai Indian stock markets ke liye.

Teri knowledge base:
- GMP (Grey Market Premium): Listing se pehle unofficial demand ka indicator
- QIB: Qualified Institutional Buyers — smart money ka signal
- NII/HNI: Non-Institutional / High Net Worth Investors
- Subscription ratio: IPO kitne guna subscribe hua
- SEBI: Securities and Exchange Board of India
- NSE/BSE: National/Bombay Stock Exchange
- Listing gain: IPO allotment price pe listing day ka % return
- RHP: Red Herring Prospectus (IPO ka official document)

Tu Hinglish mein jawab deta hai — Hindi aur English mix karke, casual aur friendly tone mein. Emojis use karo. Hamesha recommend karo ki SEBI-registered advisor se baat karo. Jawab short aur practical rakho.`;

// ── Rule-based replies — English ──────────────────────────────────────────────
function replyEN(msg, result) {
  const m = msg.toLowerCase();

  if (m.includes('gmp') || m.includes('grey market')) return `**GMP (Grey Market Premium)** is the unofficial price at which IPO shares trade before listing. 📊\n\nA high GMP signals strong demand:\n• GMP < 5% → Weak demand\n• GMP 5–20% → Moderate\n• GMP 20%+ → Strong 🚀\n\nLaunchSignal factors GMP into its AI prediction model. Remember: GMP is not guaranteed — market conditions also matter!`;

  if (m.includes('qib')) return `**QIB (Qualified Institutional Buyers)** include mutual funds, banks, and FIIs — the "smart money" of the market. 🏦\n\nReading QIB subscription:\n• 10x+ → Decent\n• 30–50x → Strong ✅\n• 50x+ → Very bullish 🚀\n\nHigh QIB subscription means institutions are confident. LaunchSignal weighs this heavily in its risk analysis.`;

  if (m.includes('allot') || m.includes('allotment')) return `**IPO Allotment** is done by lottery for oversubscribed IPOs. 🎯\n\n**How to improve your chances:**\n• Apply from multiple family demat accounts\n• Apply for exactly 1 lot per account\n• Always bid at cut-off price\n\nAllotment status is available on registrar websites (KFintech, Link Intime) 6 days after IPO closing.`;

  if (m.includes('subscription') || m.includes('oversubscrib') || m.includes('subscrib')) return `**Subscription ratio** shows how many times an IPO was oversubscribed. 📈\n\n• Under 1x → ❌ Concerning\n• 1–10x → 😐 Moderate\n• 10–50x → ✅ Good\n• 50x+ → 🚀 Exceptional\n\nLook at QIB + NII both being strong for the best listing gain potential.`;

  if (m.includes('risk') || m.includes('red flag')) {
    if (result) return `For **${result.company_name || 'this IPO'}**, LaunchSignal assigned **${result.risk} Risk** ⚠️\n\n• Risk score: ${result.risk_analysis?.overall_score || '—'}/100 (${result.risk_analysis?.overall_severity || 'N/A'})\n• ${result.risk_analysis?.red_count > 0 ? `🔴 ${result.risk_analysis.red_count} red flag(s) detected` : '✅ No major red flags'}\n\nCheck the ⚠️ Risk tab for the full breakdown!`;
    return `Common IPO risk factors to watch:\n• High Debt-to-Equity ratio (>2.0)\n• Negative or thin profit margins\n• Promoter share pledging\n• Overpriced vs. sector peers\n• Weak cash flow from operations\n\nRun a prediction and check the Risk tab for a detailed analysis! 🔍`;
  }

  if (m.includes('listing gain') || m.includes('listing price') || m.includes('listing day')) return `**Listing gain** is the % return you earn if you sell on listing day. 💰\n\nFactors that drive listing gains:\n• High GMP (20%+)\n• Strong QIB subscription (30x+)\n• Bullish broader market\n• Hot sector theme\n\nHistorically, 20–30% is considered a decent listing. 50%+ is exceptional! 🎉`;

  if (m.includes('rhp') || m.includes('prospectus') || m.includes('document')) return `**RHP (Red Herring Prospectus)** is the official IPO document filed with SEBI. 📄\n\n**Key sections to read:**\n• Objects of the Issue (where will money go?)\n• Risk Factors (critical!)\n• Financial statements (P&L, Balance Sheet)\n• Promoter background\n• Peer comparison table\n\nAvailable free on NSE, BSE, or SEBI websites. Always read before investing!`;

  if (m.includes('sebi') || m.includes('regulator')) return `**SEBI (Securities and Exchange Board of India)** is the market regulator. 👮\n\nKey IPO rules:\n• Minimum 50% reserved for QIBs\n• 35% for retail investors\n• 15% for NIIs/HNIs\n• Listing must happen within T+6 days\n\nFor complaints: scores.sebi.gov.in`;

  if (m.includes('lot') || m.includes('minimum') || m.includes('how much')) return `**IPO Lot Size** — the minimum number of shares you can apply for.\n\nSEBI mandates that 1 lot = approx ₹14,000–₹15,000 in value.\n\nExample: Issue price ₹500, lot size 30 shares → 1 lot = ₹15,000\n\nRetail limit: Max ₹2 lakh (roughly 13 lots)\nHNI category: Above ₹2 lakh`;

  if (m.includes('hni') || m.includes('nii')) return `**NII (Non-Institutional Investors) / HNI (High Net Worth Individuals)** apply for ₹2L+ in an IPO. 💎\n\nKey differences vs retail:\n• Higher minimum bid amount\n• 15% IPO quota reserved for them\n• Pro-rata allotment (not lottery)\n• Usually better allotment at very high subscription\n\nFor retail investors, 1 lot per account (lottery) is often the smarter strategy.`;

  if (result && (m.includes('predict') || m.includes('result') || m.includes('analysis') || m.includes('this ipo') || m.includes('how') && m.includes('look'))) {
    return `Here's the AI analysis for **${result.company_name}**: 🧞\n\n• Predicted listing gain: **${result.predicted_return >= 0 ? '+' : ''}${result.predicted_return}%** ${result.predicted_return >= 20 ? '🚀' : result.predicted_return >= 10 ? '✅' : '⚠️'}\n• Risk level: **${result.risk}**\n• AI Confidence: **${Math.round((result.confidence || 0) * 100)}%**\n• Profit probability: **${result.profit_probability}%**\n• IPO Score: **${result.score}/100**\n\nCheck the tabs below for Valuation, News, Brokers & more! 👇`;
  }

  return `Great question! I'm **IPO Genie** — here to help with:\n\n• 📊 GMP & subscription data\n• 🎯 Allotment tips\n• ⚠️ Risk analysis\n• 💰 Listing gain expectations\n• 📄 RHP reading guide\n• 🏦 QIB & NII explained\n\nWhat would you like to know?`;
}

// ── Rule-based replies — Hinglish ─────────────────────────────────────────────
function replyHI(msg, result) {
  const m = msg.toLowerCase();

  if (m.includes('gmp') || m.includes('grey market')) return `**GMP matlab Grey Market Premium** — listing se pehle shares ka unofficial price. 📊\n\nIssi se demand pata chalta hai:\n• GMP < 5% → Demand weak hai\n• GMP 5–20% → Theek-thaak\n• GMP 20%+ → Bahut strong! 🚀\n\nExample: Issue price ₹500, GMP ₹150 → Expected listing ₹650 ke aas-paas.\n\n⚠️ Lekin guaranteed nahi hota bhai — market conditions bhi matter karti hain! LaunchSignal apne AI mein GMP ko factor karta hai. 🧞`;

  if (m.includes('qib')) return `**QIB matlab Qualified Institutional Buyers** — mutual funds, banks, FIIs yani "smart money" wale log. 🏦\n\nQIB subscription kaise padhein:\n• 10x → Decent hai\n• 30–50x → Strong ✅\n• 50x+ → Dhamaaka! 🚀\n\nQIB zyada subscribe kare matlab "bade players" confident hain. LaunchSignal isko bahut heavy weightage deta hai apni risk analysis mein. 🎯`;

  if (m.includes('allot') || m.includes('allotment') || m.includes('chances') || m.includes('milega')) return `**IPO Allotment ek lottery system hai** jab IPO oversubscribed ho. 🎯\n\n**Chances kaise badhayein:**\n• Family ke multiple demat accounts se apply karo\n• Har account mein exactly 1 lot apply karo\n• Hamesha cut-off price pe bid lagao\n• Avoid karo same PAN se multiple applications\n\nAllotment status IPO close hone ke 6 din baad registrar ki website pe milega (KFintech, Link Intime). Fingers crossed bhai! 🤞`;

  if (m.includes('subscription') || m.includes('oversubscrib') || m.includes('kitne guna') || m.includes('subscribe')) return `**Subscription ratio** batata hai IPO kitna oversubscribed hua. 📈\n\nExample: 100x matlab 100 crore ke bids aaye sirf 1 crore ke shares ke liye! 😲\n\nKaise samjhein:\n• 1x se kam → ❌ Warning sign!\n• 1–10x → 😐 Theek-thaak\n• 10–50x → ✅ Achha hai\n• 50x+ → 🚀 Dhamaaka!\n\nQIB aur NII dono strong hone chahiye best listing gain ke liye.`;

  if (m.includes('risk') || m.includes('red flag') || m.includes('khatra') || m.includes('safe')) {
    if (result) return `**${result.company_name || 'Is IPO'}** ke liye LaunchSignal ne **${result.risk} Risk** assign kiya hai. ⚠️\n\nRisk score: **${result.risk_analysis?.overall_score || '—'}/100** (${result.risk_analysis?.overall_severity || 'N/A'})\n\n${result.risk_analysis?.red_count > 0 ? `🔴 ${result.risk_analysis.red_count} red flag${result.risk_analysis.red_count > 1 ? 's' : ''} mila — zaroor dhyan do bhai!` : '✅ Koi major red flag nahi mila! Achha sign hai.'}\n\n⚠️ Risk tab pe jaake full breakdown dekh sakte ho! 👇`;
    return `**Common IPO risk factors** jo zaroor check karo:\n• D/E ratio zyada hai? (2.0+)\n• Profit margin bahut kam hai?\n• Promoter ne shares pledge kiye hain?\n• Sector peers se zyada mehenga hai?\n• Cash flow negative hai?\n\nPrediction run karo aur Risk tab check karo — LaunchSignal sab analyze karta hai! 🔍`;
  }

  if (m.includes('listing') || m.includes('gain') || m.includes('profit') || m.includes('fayda') || m.includes('faida')) return `**Listing gain** = listing day pe jo % return milta hai issue price se. 💰\n\nKab zyada gain milta hai:\n• GMP 20%+ ho\n• QIB 30x+ subscribe hua ho\n• Market bullish ho\n• Sector ka trend hot ho\n\nHistorically 20–30% decent maana jaata hai. 50%+ toh ekdum mast! 🚀\n\nLekin listing ke baad hold karna ya sell karna — yeh tera personal decision hai bhai.`;

  if (m.includes('rhp') || m.includes('prospectus') || m.includes('document') || m.includes('padh')) return `**RHP matlab Red Herring Prospectus** — yeh IPO ka official government document hai. 📄\n\n**Isme kya dekho:**\n• Objects of Issue — paisa kahan jayega?\n• Risk Factors section — bahut important!\n• Financials — P&L, Balance Sheet\n• Promoter background check karo\n• Peer comparison table\n\nNSE, BSE ya SEBI ki website pe free milta hai. Invest karne se pehle zaroor padhna chahiye bhai! 🙏`;

  if (m.includes('sebi') || m.includes('regulator') || m.includes('rule') || m.includes('niyam')) return `**SEBI = Securities and Exchange Board of India** — yeh stock market ki police hai! 👮\n\n**IPO ke key SEBI rules:**\n• 50% QIBs ke liye reserved hota hai\n• 35% retail investors (tum jaise log!) ke liye\n• 15% NIIs/HNIs ke liye\n• Listing T+6 din mein honi chahiye\n\nKoi fraud ya problem ho toh: **scores.sebi.gov.in** pe complain karo. 💪`;

  if (m.includes('lot') || m.includes('minimum') || m.includes('kitna lagega') || m.includes('paise')) return `**IPO lot size** — minimum shares jo ek application mein apply karne hote hain. 💵\n\nSEBI ne decide kiya hai ki 1 lot ≈ **₹14,000–₹15,000** ke beech hona chahiye.\n\nExample: Issue price ₹500, lot size 30 shares → 1 lot = ₹15,000\n\n• Retail investors: Maximum ₹2 lakh (roughly 13 lots)\n• HNI category: ₹2 lakh se zyada\n\nBhai, 1 lot se apply karo — lottery mein chances same hote hain! 🎯`;

  if (m.includes('hni') || m.includes('nii') || m.includes('bade investor')) return `**NII / HNI** woh investors hain jo ₹2 lakh se zyada IPO mein apply karte hain. 💎\n\nRetail se farq:\n• Zyada minimum bid\n• 15% IPO quota reserved hai inke liye\n• Pro-rata allotment hoti hai (lottery nahi)\n• Very high subscription pe better allotment\n\nAam investors ke liye, 1 lot per family account waali strategy zyada smart hai! 🧠`;

  if (result && (m.includes('predict') || m.includes('result') || m.includes('yeh ipo') || m.includes('is ipo') || m.includes('batao') || m.includes('kya lagta') || m.includes('kaisa') || m.includes('analysis'))) {
    return `**${result.company_name}** ke baare mein IPO Genie ka analysis: 🧞\n\n• Predicted listing gain: **${result.predicted_return >= 0 ? '+' : ''}${result.predicted_return}%** ${result.predicted_return >= 20 ? '🚀' : result.predicted_return >= 10 ? '✅' : '⚠️'}\n• Risk level: **${result.risk}**\n• AI confidence: **${Math.round((result.confidence || 0) * 100)}%**\n• Profit probability: **${result.profit_probability}%**\n• IPO Score: **${result.score}/100**\n\nNeche wale tabs mein Valuation, News, Brokers sab hai — zaroor dekho bhai! 👇`;
  }

  return `Arre, bilkul sahi jagah aaye ho! 🧞 Main hun IPO Genie — tera IPO wala dost!\n\nYeh pooch sakte ho:\n• 📊 GMP kya hai aur kaise dekhein\n• 🎯 Allotment chances kaise badhayein\n• ⚠️ Risk analysis kaise samjhein\n• 💰 Listing gain expectations\n• 📄 RHP kaise padhein\n• 🏦 QIB aur NII ka fark\n\nKoi bhi sawaal pooch bhai — main dono languages mein samjhunga! 😄`;
}

// ── Greeter ───────────────────────────────────────────────────────────────────
const INITIAL_GREETING = (name) =>
  `Namaste${name ? ` **${name}**` : ''}! 🙏 I'm **IPO Genie** — your AI guide for Indian IPOs.\n\n` +
  `**Auto language mode is ON** 🤖\n` +
  `• Type in **English** → I reply in English 🇬🇧\n` +
  `• Type in **Hinglish** → Main Hinglish mein jawab dunga 🇮🇳\n\n` +
  `Kuch bhi pooch — GMP, allotment, listing gain, risk! 😄`;

// ── Quick starters (bilingual) ────────────────────────────────────────────────
const STARTERS = [
  { label: 'GMP kya hota hai? 🇮🇳', msg: 'GMP kya hota hai IPO mein?' },
  { label: 'What is QIB? 🇬🇧', msg: 'What is QIB subscription ratio?' },
  { label: 'Allotment chances kaise badhayein? 🇮🇳', msg: 'Allotment ke chances kaise badhayein?' },
];

// ── Main Component ────────────────────────────────────────────────────────────
export default function ChatWidget({ result }) {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] || null;

  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState([{ role: 'assistant', content: INITIAL_GREETING(firstName) }]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [lastLang, setLastLang] = useState('en');  // track last detected lang for placeholder
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const buildContext = (lang) => {
    let ctx = lang === 'hi' ? CONTEXT_HI : CONTEXT_EN;
    if (result && !result.error) {
      ctx += `\n\nCurrent prediction:
- Company: ${result.company_name || 'Unknown'}
- Predicted listing gain: ${result.predicted_return}%
- Risk level: ${result.risk}
- Confidence: ${Math.round((result.confidence || 0) * 100)}%
- IPO Score: ${result.score}/100
- Profit probability: ${result.profit_probability}%
- Risk severity: ${result.risk_analysis?.overall_severity || 'N/A'}`;
    }
    return ctx;
  };

  const sendMessage = async (userMsg) => {
    if (!userMsg.trim() || loading) return;

    // ── Detect language from this specific message ──
    const lang = detectLang(userMsg);
    setLastLang(lang);

    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const history = newMessages.slice(1).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          system_context: buildContext(lang),
          history: history.slice(-8),
          lang,
        }),
      });

      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'Sorry, could not get a response.' }]);
    } catch {
      // Local fallback — language-matched
      const reply = lang === 'hi' ? replyHI(userMsg, result) : replyEN(userMsg, result);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = e => { e.preventDefault(); sendMessage(input); };

  const placeholder = lastLang === 'hi'
    ? 'Kuch bhi pooch IPO ke baare mein...'
    : 'Ask anything about IPOs...';

  return (
    <>
      {/* ── Floating Button ── */}
      <button
        onClick={() => setOpen(v => !v)}
        id="chat-widget-btn"
        title="IPO Genie — Auto-language AI chat"
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 9000,
          width: 58, height: 58, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--royal) 0%, var(--emerald) 100%)',
          border: 'none', cursor: 'pointer', fontSize: '1.5rem',
          boxShadow: '0 4px 24px rgba(37,99,235,0.45)',
          animation: open ? 'none' : 'genieFloat 2.2s infinite',
          transition: 'transform 0.2s, box-shadow 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <style>{`
          @keyframes genieFloat {
            0%,100%{box-shadow:0 4px 24px rgba(37,99,235,0.45),0 0 0 0 rgba(37,99,235,0.35)}
            60%{box-shadow:0 4px 24px rgba(37,99,235,0.45),0 0 0 14px rgba(37,99,235,0)}
          }
          @keyframes geniePop { from{opacity:0;transform:translateY(18px) scale(0.95)} to{opacity:1;transform:translateY(0) scale(1)} }
          @keyframes msgIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
          .genie-msg { animation: msgIn 0.18s ease; }
          .genie-input:focus { outline:none; border-color:var(--royal-bright)!important; box-shadow:0 0 0 3px rgba(37,99,235,0.18); }
        `}</style>
        {open ? '✕' : '🧞'}
      </button>

      {/* ── Chat Panel ── */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 98, right: 28, zIndex: 8999,
          width: 375, height: 525,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-lg), 0 0 48px rgba(37,99,235,0.13)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          animation: 'geniePop 0.24s cubic-bezier(0.34,1.56,0.64,1)',
        }}>

          {/* ── Header ── */}
          <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, #1e3a8a 0%, #2563EB 50%, #1d4ed8 100%)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ fontSize: '1.4rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>🧞</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 800, color: '#fff', fontSize: '0.93rem', letterSpacing: '-0.2px' }}>IPO Genie</div>
              <div style={{ fontSize: '0.64rem', color: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 5px #4ade80', display: 'inline-block' }} />
                Auto-language · EN / HI 🤖
              </div>
            </div>
            {/* Lang indicator badge */}
            <div style={{
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 16, padding: '3px 10px', fontSize: '0.68rem', fontWeight: 800,
              color: '#fff', backdropFilter: 'blur(4px)', letterSpacing: '0.3px',
            }}>
              {lastLang === 'hi' ? '🇮🇳 HI' : '🇬🇧 EN'}
            </div>
          </div>

          {/* ── Messages ── */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 6px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.map((m, i) => (
              <div key={i} className="genie-msg" style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '88%', padding: '9px 13px',
                  borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                  background: m.role === 'user'
                    ? 'linear-gradient(135deg, #1e3a8a 0%, #2563EB 100%)'
                    : 'var(--bg-elevated)',
                  color: m.role === 'user' ? '#fff' : 'var(--text-primary)',
                  fontSize: '0.82rem', lineHeight: 1.58,
                  border: m.role === 'user' ? 'none' : '1px solid var(--border)',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  boxShadow: m.role === 'user' ? '0 2px 10px rgba(37,99,235,0.25)' : 'none',
                }}>
                  {/* Inline bold markdown */}
                  {m.content.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
                    /^\*\*[^*]+\*\*$/.test(part)
                      ? <strong key={j}>{part.slice(2, -2)}</strong>
                      : part
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="genie-msg" style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '4px 16px 16px 16px', padding: '10px 14px', display: 'flex', gap: 5, alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: 'var(--royal-bright)',
                      animation: `genieFloat ${0.6 + i * 0.18}s ease-in-out infinite`,
                    }} />
                  ))}
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 4 }}>
                    {lastLang === 'hi' ? 'Soch raha hun...' : 'Thinking...'}
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* ── Bilingual Starter Chips ── */}
          {messages.length === 1 && (
            <div style={{ padding: '0 10px 8px', display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {STARTERS.map(s => (
                <button key={s.msg} onClick={() => sendMessage(s.msg)}
                  style={{
                    fontSize: '0.67rem', padding: '5px 10px', borderRadius: 20,
                    border: '1px solid var(--border)', background: 'var(--bg-elevated)',
                    color: 'var(--text-secondary)', cursor: 'pointer',
                    fontFamily: 'var(--font-primary)', transition: 'all 0.15s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-blue)'; e.currentTarget.style.color = 'var(--royal-bright)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                  {s.label}
                </button>
              ))}
            </div>
          )}

          {/* ── Input ── */}
          <form onSubmit={handleSubmit} style={{ padding: '8px 10px', borderTop: '1px solid var(--border)', display: 'flex', gap: 7, flexShrink: 0, alignItems: 'center' }}>
            <input
              className="genie-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={placeholder}
              disabled={loading}
              autoComplete="off"
              style={{
                flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                borderRadius: 22, padding: '9px 15px', color: 'var(--text-primary)',
                fontSize: '0.82rem', fontFamily: 'var(--font-primary)',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
            />
            <button type="submit" disabled={loading || !input.trim()} style={{
              width: 36, height: 36, borderRadius: '50%', border: 'none', flexShrink: 0,
              background: input.trim()
                ? 'linear-gradient(135deg, #1e3a8a 0%, var(--royal-bright) 100%)'
                : 'var(--bg-elevated)',
              cursor: input.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '0.95rem',
              boxShadow: input.trim() ? '0 2px 10px rgba(37,99,235,0.3)' : 'none',
            }}>
              {loading ? '⏳' : '➤'}
            </button>
          </form>

          {/* ── Footer ── */}
          <div style={{ textAlign: 'center', fontSize: '0.61rem', color: 'var(--text-muted)', paddingBottom: 7 }}>
            Not financial advice · SEBI advisor se zaroor baat karo 🙏
          </div>
        </div>
      )}
    </>
  );
}
