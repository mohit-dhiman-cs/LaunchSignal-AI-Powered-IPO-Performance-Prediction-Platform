import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';
import TiltCard from '../components/TiltCard';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const TAGS = ['All', 'Bullish 📈', 'Bearish 📉', 'Analysis 🧠', 'Question ❓',
              'GMP Update 💹', 'Allotment 🎯', 'Listing Day 🚀', 'Discussion 💬', 'Warning ⚠️'];

const SENTIMENTS = ['Bullish', 'Bearish', 'Neutral'];
const SECTORS = ['', 'IT', 'Fintech', 'Consumer Tech', 'Pharma', 'Healthcare', 'EV / Clean Energy',
                 'Banking', 'Finance', 'Insurance', 'Logistics', 'Manufacturing', 'Retail', 'FMCG', 'EdTech', 'E-Commerce'];

const TAG_COLORS = {
  'Bullish 📈': '#18B981', 'Bearish 📉': '#EF4444', 'Analysis 🧠': '#2563EB',
  'Question ❓': '#F59E0B', 'GMP Update 💹': '#8B5CF6', 'Allotment 🎯': '#EC4899',
  'Listing Day 🚀': '#F97316', 'Discussion 💬': '#64748B', 'Warning ⚠️': '#EF4444',
};

const SENTIMENT_COLORS = { Bullish: '#18B981', Bearish: '#EF4444', Neutral: '#94A3B8', Positive: '#18B981', Negative: '#EF4444' };

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60)  return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

function Avatar({ name, size = 36 }) {
  const initials = (name || 'A').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const colors = ['#2563EB','#18B981','#F59E0B','#8B5CF6','#EC4899','#F97316','#06B6D4'];
  const color = colors[name?.charCodeAt(0) % colors.length || 0];
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: `linear-gradient(135deg, ${color}, ${color}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 800, color: '#fff', fontFamily: 'Space Grotesk', flexShrink: 0, userSelect: 'none' }}>
      {initials}
    </div>
  );
}

// ── Create Post Modal ─────────────────────────────────────────────────────────
function CreatePostModal({ onClose, onCreated, user }) {
  const [form, setForm] = useState({ title: '', body: '', tag: 'Discussion 💬', company: '', sector: '', sentiment: 'Neutral' });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return setError('Title and body are required');
    setSaving(true); setError('');
    try {
      await axios.post(`${API}/community/posts`, form);
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to post');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(2,6,23,0.75)', backdropFilter:'blur(12px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--r-xl)', width:'100%', maxWidth:560, boxShadow:'var(--shadow-lg)', overflow:'hidden', animation:'slideUp 0.22s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
        {/* Gradient strip */}
        <div style={{ height:4, background:'linear-gradient(90deg, var(--royal) 0%, var(--emerald) 100%)' }} />
        <div style={{ padding:'24px 28px 28px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
            <div>
              <h2 style={{ fontFamily:'Space Grotesk', fontSize:'1.2rem', fontWeight:800, color:'var(--text-primary)', marginBottom:3 }}>✍️ New Post</h2>
              <p style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>Posting as <strong style={{ color:'var(--royal-bright)' }}>{user ? user.name : 'Anonymous'}</strong></p>
            </div>
            <button onClick={onClose} style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:8, padding:'6px 10px', cursor:'pointer', color:'var(--text-muted)' }}>✕</button>
          </div>

          {error && <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, padding:'10px 14px', color:'var(--crimson)', fontSize:'0.83rem', marginBottom:14 }}>⚠️ {error}</div>}

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <label style={{ display:'block', fontSize:'0.68rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:5 }}>Title *</label>
              <input className="form-input" placeholder="What's your prediction or analysis?" maxLength={200} required
                value={form.title} onChange={e => setForm(f=>({...f, title:e.target.value}))} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'0.68rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:5 }}>Body *</label>
              <textarea className="form-input" rows={5} placeholder="Share your analysis, data points, thesis, or question..." maxLength={5000} required
                value={form.body} onChange={e => setForm(f=>({...f, body:e.target.value}))}
                style={{ resize:'vertical', minHeight:100 }} />
              <div style={{ textAlign:'right', fontSize:'0.68rem', color:'var(--text-muted)', marginTop:3 }}>{form.body.length}/5000</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
              <div>
                <label style={{ display:'block', fontSize:'0.68rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:5 }}>Tag</label>
                <select className="form-select" value={form.tag} onChange={e => setForm(f=>({...f, tag:e.target.value}))}>
                  {TAGS.slice(1).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display:'block', fontSize:'0.68rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:5 }}>Sector</label>
                <select className="form-select" value={form.sector} onChange={e => setForm(f=>({...f, sector:e.target.value}))}>
                  {SECTORS.map(s => <option key={s} value={s}>{s || 'Any sector'}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display:'block', fontSize:'0.68rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:5 }}>Sentiment</label>
                <select className="form-select" value={form.sentiment} onChange={e => setForm(f=>({...f, sentiment:e.target.value}))}>
                  {SENTIMENTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{ display:'block', fontSize:'0.68rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:5 }}>Company (optional)</label>
              <input className="form-input" placeholder="e.g. Swiggy, Ola Electric..." maxLength={100}
                value={form.company} onChange={e => setForm(f=>({...f, company:e.target.value}))} />
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:4 }}>
              <button type="button" onClick={onClose} className="btn" style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', color:'var(--text-secondary)', padding:'10px 18px' }}>Cancel</button>
              <button type="submit" disabled={saving} className="btn btn-primary" style={{ padding:'10px 24px' }}>
                {saving ? '⏳ Posting...' : '🚀 Post'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Comment Section ───────────────────────────────────────────────────────────
function CommentSection({ postId, user }) {
  const [comments, setComments] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [body,     setBody]     = useState('');
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    axios.get(`${API}/community/posts/${postId}/comments`)
      .then(r => setComments(r.data.comments || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId]);

  const submit = async e => {
    e.preventDefault();
    if (!body.trim()) return;
    setSaving(true);
    try {
      await axios.post(`${API}/community/posts/${postId}/comments`, { body });
      const r = await axios.get(`${API}/community/posts/${postId}/comments`);
      setComments(r.data.comments || []);
      setBody('');
    } catch(err) { alert(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ marginTop:16, borderTop:'1px solid var(--border)', paddingTop:16 }}>
      <div style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:12 }}>
        💬 {comments.length} Comment{comments.length !== 1 ? 's' : ''}
      </div>

      {/* Comment input */}
      <form onSubmit={submit} style={{ display:'flex', gap:8, marginBottom:14 }}>
        {user && <Avatar name={user.name} size={30} />}
        <div style={{ flex:1, display:'flex', gap:8 }}>
          <input className="form-input" placeholder={user ? 'Add a comment...' : 'Comment as Anonymous...'} value={body}
            onChange={e => setBody(e.target.value)} style={{ flex:1, padding:'8px 12px', fontSize:'0.83rem' }} />
          <button type="submit" disabled={saving || !body.trim()} className="btn btn-primary" style={{ padding:'8px 14px', fontSize:'0.82rem', whiteSpace:'nowrap' }}>
            {saving ? '...' : 'Post'}
          </button>
        </div>
      </form>

      {/* Comments list */}
      {loading ? (
        <div className="skeleton-box" style={{ height:60, borderRadius:8 }} />
      ) : comments.length === 0 ? (
        <p style={{ fontSize:'0.82rem', color:'var(--text-muted)', textAlign:'center', padding:'12px 0' }}>Be the first to comment!</p>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {comments.map(c => (
            <div key={c.id} style={{ display:'flex', gap:10, padding:'10px 0' }}>
              <Avatar name={c.author_name} size={28} />
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:4 }}>
                  <span style={{ fontSize:'0.82rem', fontWeight:700, color:'var(--text-primary)' }}>{c.author_name}</span>
                  <span style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>{timeAgo(c.created_at)}</span>
                </div>
                <p style={{ fontSize:'0.83rem', color:'var(--text-secondary)', lineHeight:1.55, margin:0, whiteSpace:'pre-wrap' }}>{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Post Card ─────────────────────────────────────────────────────────────────
function PostCard({ post, user, onVoted, onDeleted }) {
  const [votes,        setVotes]        = useState({ upvotes: post.upvotes, downvotes: post.downvotes, score: post.score });
  const [showComments, setShowComments] = useState(false);
  const [expanded,     setExpanded]     = useState(false);
  const [voting,       setVoting]       = useState(false);

  const tagColor = TAG_COLORS[post.tag] || '#64748B';
  const sentColor = SENTIMENT_COLORS[post.sentiment] || '#94A3B8';
  const isLong = post.body.length > 300;

  const vote = async dir => {
    if (voting) return;
    setVoting(true);
    try {
      const r = await axios.post(`${API}/community/posts/${post.id}/vote`, { vote: dir });
      setVotes({ upvotes: r.data.upvotes, downvotes: r.data.downvotes, score: r.data.score });
      if (onVoted) onVoted();
    } catch(e) { console.error(e); }
    finally { setVoting(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Remove this post?')) return;
    try {
      await axios.delete(`${API}/community/posts/${post.id}`);
      if (onDeleted) onDeleted(post.id);
    } catch(e) { alert('Could not delete'); }
  };

  return (
    <TiltCard intensity={3} style={{ background: post.is_pinned ? 'var(--bg-elevated)' : 'var(--bg-card)', border: `1px solid ${post.is_pinned ? 'rgba(37,99,235,0.3)' : 'var(--border)'}`, borderRadius:'var(--r-md)', padding:'20px 22px', transition:'all 0.2s' }}>
      {post.is_pinned && (
        <div style={{ fontSize:'0.68rem', fontWeight:700, color:'var(--royal-bright)', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
          <span>📌</span> Pinned by LaunchSignal
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex', gap:12, alignItems:'flex-start', marginBottom:12 }}>
        <Avatar name={post.author_name} size={38} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:4 }}>
            <span style={{ fontWeight:700, color:'var(--text-primary)', fontSize:'0.88rem' }}>{post.author_name}</span>
            <span style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>{timeAgo(post.created_at)}</span>
            {post.company && <span style={{ fontSize:'0.7rem', fontWeight:700, background:'rgba(37,99,235,0.1)', color:'var(--royal-bright)', padding:'1px 8px', borderRadius:10 }}>{post.company}</span>}
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            <span style={{ fontSize:'0.7rem', fontWeight:700, padding:'2px 10px', borderRadius:12, background:`${tagColor}18`, color:tagColor, border:`1px solid ${tagColor}30` }}>{post.tag}</span>
            {post.sector && <span style={{ fontSize:'0.7rem', color:'var(--text-muted)', background:'var(--bg-elevated)', padding:'2px 8px', borderRadius:10, border:'1px solid var(--border)' }}>{post.sector}</span>}
            {post.sentiment && post.sentiment !== 'Neutral' && (
              <span style={{ fontSize:'0.68rem', fontWeight:700, color:sentColor, background:`${sentColor}12`, padding:'2px 8px', borderRadius:10 }}>
                {post.sentiment === 'Bullish' ? '📈' : '📉'} {post.sentiment}
              </span>
            )}
          </div>
        </div>

        {/* Delete (own post) */}
        {user && post.author_name === user.name && (
          <button onClick={handleDelete} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:'0.8rem', padding:4, opacity:0.5, transition:'opacity 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.opacity='1'}
            onMouseLeave={e => e.currentTarget.style.opacity='0.5'}>🗑️</button>
        )}
      </div>

      {/* Title */}
      <h3 style={{ fontFamily:'Space Grotesk', fontSize:'1rem', fontWeight:800, color:'var(--text-primary)', margin:'0 0 10px', lineHeight:1.35 }}>{post.title}</h3>

      {/* Body */}
      <div style={{ position:'relative' }}>
        <p style={{ fontSize:'0.86rem', color:'var(--text-secondary)', lineHeight:1.65, margin:0, whiteSpace:'pre-wrap',
          maxHeight: !expanded && isLong ? '120px' : 'none', overflow: !expanded && isLong ? 'hidden' : 'visible' }}>
          {post.body}
        </p>
        {isLong && !expanded && (
          <div style={{ position:'absolute', bottom:0, left:0, right:0, height:50, background:'linear-gradient(transparent, var(--bg-card))', display:'flex', alignItems:'flex-end', paddingBottom:4 }}>
            <button onClick={() => setExpanded(true)} style={{ background:'none', border:'none', color:'var(--royal-bright)', cursor:'pointer', fontSize:'0.8rem', fontWeight:600 }}>Read more ▼</button>
          </div>
        )}
        {isLong && expanded && (
          <button onClick={() => setExpanded(false)} style={{ background:'none', border:'none', color:'var(--royal-bright)', cursor:'pointer', fontSize:'0.8rem', fontWeight:600, marginTop:6 }}>Show less ▲</button>
        )}
      </div>

      {/* Actions */}
      <div style={{ display:'flex', alignItems:'center', gap:16, marginTop:16, paddingTop:12, borderTop:'1px solid var(--border)' }}>
        {/* Vote buttons */}
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          <button onClick={() => vote('up')} disabled={voting}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:20, border:'1px solid var(--border)', background:'var(--bg-elevated)', cursor:'pointer', color:'var(--text-muted)', fontSize:'0.82rem', fontWeight:600, transition:'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='#18B981'; e.currentTarget.style.color='#18B981'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-muted)'; }}>
            ▲ {votes.upvotes}
          </button>
          <span style={{ fontSize:'0.82rem', fontWeight:800, color: votes.score > 0 ? 'var(--emerald)' : votes.score < 0 ? 'var(--crimson)' : 'var(--text-muted)', padding:'0 4px', minWidth:20, textAlign:'center' }}>
            {votes.score > 0 ? '+' : ''}{votes.score}
          </span>
          <button onClick={() => vote('down')} disabled={voting}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:20, border:'1px solid var(--border)', background:'var(--bg-elevated)', cursor:'pointer', color:'var(--text-muted)', fontSize:'0.82rem', fontWeight:600, transition:'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='#EF4444'; e.currentTarget.style.color='#EF4444'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-muted)'; }}>
            ▼ {votes.downvotes}
          </button>
        </div>

        {/* Comments toggle */}
        <button onClick={() => setShowComments(v => !v)}
          style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:'0.82rem', fontWeight:600, transition:'color 0.15s', padding:'5px 8px', borderRadius:8 }}
          onMouseEnter={e => e.currentTarget.style.color='var(--royal-bright)'}
          onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}>
          💬 {post.comment_count} Comment{post.comment_count !== 1 ? 's' : ''}
          <span style={{ fontSize:'0.7rem' }}>{showComments ? '▲' : '▼'}</span>
        </button>

        <div style={{ flex:1 }} />

        {/* Share placeholder */}
        <button style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:'0.78rem', padding:'5px 8px' }}
          onClick={() => { navigator.clipboard?.writeText(window.location.href); }}
          title="Copy link">🔗</button>
      </div>

      {/* Comments */}
      {showComments && <CommentSection postId={post.id} user={user} />}
    </TiltCard>
  );
}

// ── Main Community Page ───────────────────────────────────────────────────────
export default function CommunityPage() {
  const { user }                   = useAuth();
  const [posts,      setPosts]     = useState([]);
  const [loading,    setLoading]   = useState(true);
  const [sort,       setSort]      = useState('hot');
  const [tag,        setTag]       = useState('');
  const [page,       setPage]      = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total,      setTotal]     = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [showAuth,   setShowAuth]  = useState(false);
  const topRef                     = useRef(null);

  const fetchPosts = useCallback((p = 1, s = sort, t = tag) => {
    setLoading(true);
    const params = { sort: s, page: p, limit: 15 };
    if (t && t !== 'All') params.tag = t;
    axios.get(`${API}/community/posts`, { params })
      .then(r => {
        setPosts(r.data.posts || []);
        setTotal(r.data.total || 0);
        setTotalPages(r.data.pages || 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sort, tag]);

  useEffect(() => { fetchPosts(1, sort, tag); }, [sort, tag]);

  const handleSortChange = s => { setSort(s); setPage(1); };
  const handleTagChange  = t => { setTag(t === 'All' ? '' : t); setPage(1); };

  const goPage = p => {
    setPage(p);
    fetchPosts(p, sort, tag);
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const removePost = id => setPosts(prev => prev.filter(p => p.id !== id));

  return (
    <div style={{ paddingTop: 88, minHeight: '100vh', background: 'var(--bg-base)' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 20px 80px' }} ref={topRef}>

        {/* ── Hero Header ── */}
        <div style={{ marginBottom: 28, paddingTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-1px', marginBottom: 6, lineHeight: 1.1 }}>
                🌐 Community
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {total.toLocaleString()} discussion{total !== 1 ? 's' : ''} · India's IPO intelligence hub
              </p>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => { if (!user) setShowAuth(true); else setShowCreate(true); }}
              style={{ padding: '11px 22px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
              ✍️ New Post
            </button>
          </div>
        </div>

        {/* ── Controls ── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Sort buttons */}
          <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: 3, gap: 3 }}>
            {[['🔥 Hot', 'hot'], ['✨ New', 'new'], ['🏆 Top', 'top']].map(([label, val]) => (
              <button key={val} onClick={() => handleSortChange(val)}
                style={{ padding: '7px 14px', borderRadius: 'calc(var(--r-sm) - 1px)', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, fontFamily: 'var(--font-primary)', transition: 'all 0.15s',
                  background: sort === val ? 'linear-gradient(135deg, var(--royal) 0%, var(--royal-bright) 100%)' : 'transparent',
                  color: sort === val ? '#fff' : 'var(--text-secondary)',
                  boxShadow: sort === val ? '0 2px 8px rgba(37,99,235,0.25)' : 'none' }}>
                {label}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: 14 }}>
            <span>📋 {total} posts</span>
          </div>
        </div>

        {/* ── Tag Filter Pills ── */}
        <div style={{ display: 'flex', gap: 7, marginBottom: 24, overflowX: 'auto', paddingBottom: 4, flexWrap: 'wrap' }}>
          {TAGS.map(t => {
            const active = (tag === '' && t === 'All') || tag === t;
            const tColor = TAG_COLORS[t] || '#64748B';
            return (
              <button key={t} onClick={() => handleTagChange(t)} style={{
                padding: '6px 14px', borderRadius: 20, border: `1px solid ${active ? tColor : 'var(--border)'}`,
                background: active ? `${tColor}18` : 'var(--bg-card)',
                color: active ? tColor : 'var(--text-secondary)',
                fontSize: '0.78rem', fontWeight: active ? 700 : 500, cursor: 'pointer',
                whiteSpace: 'nowrap', transition: 'all 0.15s', fontFamily: 'var(--font-primary)',
              }}>{t}</button>
            );
          })}
        </div>

        {/* ── Post Feed ── */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '22px' }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                  <div className="skeleton-box" style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton-box" style={{ height: 14, width: '30%', marginBottom: 6 }} />
                    <div className="skeleton-box" style={{ height: 11, width: '20%' }} />
                  </div>
                </div>
                <div className="skeleton-box" style={{ height: 18, width: '70%', marginBottom: 10 }} />
                <div className="skeleton-box" style={{ height: 12, marginBottom: 5 }} />
                <div className="skeleton-box" style={{ height: 12, width: '80%' }} />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>🌐</div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>No posts yet</h3>
            <p style={{ marginBottom: 20 }}>Be the first to share an IPO prediction or analysis!</p>
            <button className="btn btn-primary" onClick={() => { if (!user) setShowAuth(true); else setShowCreate(true); }}>
              ✍️ Write the first post
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {posts.map(post => (
              <PostCard key={post.id} post={post} user={user} onVoted={() => fetchPosts(page, sort, tag)} onDeleted={removePost} />
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32 }}>
            <button disabled={page === 1} onClick={() => goPage(page - 1)} className="btn" style={{ padding: '8px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>← Prev</button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = i + 1;
              return (
                <button key={p} onClick={() => goPage(p)} className="btn"
                  style={{ padding: '8px 14px', background: page === p ? 'var(--royal)' : 'var(--bg-card)', border: `1px solid ${page === p ? 'var(--royal)' : 'var(--border)'}`, color: page === p ? '#fff' : 'var(--text-secondary)', fontWeight: page === p ? 700 : 400 }}>
                  {p}
                </button>
              );
            })}
            <button disabled={page === totalPages} onClick={() => goPage(page + 1)} className="btn" style={{ padding: '8px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>Next →</button>
          </div>
        )}

        {/* ── Community Guidelines ── */}
        <div style={{ marginTop: 40, background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 'var(--r-md)', padding: '16px 20px', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--text-primary)' }}>📋 Community Guidelines:</strong> Share analysis, not tips. Mark speculative posts clearly. Be respectful — no spam, misleading info, or guaranteed return claims. All posts are user-generated opinions, not financial advice. <strong style={{ color: 'var(--amber)' }}>Always do your own research before investing.</strong>
        </div>
      </div>

      {/* ── Modals ── */}
      {showCreate && (
        <CreatePostModal user={user} onClose={() => setShowCreate(false)} onCreated={() => { fetchPosts(1, 'new', ''); setSort('new'); setTag(''); setPage(1); }} />
      )}
      {showAuth && <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />}
    </div>
  );
}
