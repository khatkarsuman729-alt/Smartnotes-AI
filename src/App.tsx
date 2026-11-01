import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { App as CapApp } from '@capacitor/app';
import { CHAPTERS, GROUPS, SUBJECTS, TYPES, answer, type Chapter } from './data';

type Note = { id: string; title: string; subject: string; type: string; cue: string; body: string; summary: string; ts: number };
type User = { name: string; cls: string; board: string; h: string };
type QResult = { id: string; title: string; score: number; total: number; ts: number };
type Store = {
  users: Record<string, User>; me: string | null; notes: Note[]; quiz: QResult[]; marks: string[];
  last: string | null; theme: 'light' | 'dark'; lang: 'en' | 'hi'; cls: string; fs: number;
};
type View = 'home' | 'books' | 'sub' | 'chap' | 'quiz' | 'ai' | 'notes' | 'note' | 'me';
type Route = { v: View; sub?: string; chap?: string; note?: Note | null };
type Msg = { r: 'u' | 'a'; t: string };

const KEY = 'smartnotes-ai-v1';
const EMPTY: Store = { users: {}, me: null, notes: [], quiz: [], marks: [], last: null, theme: 'dark', lang: 'en', cls: '10', fs: 17 };
const TABS: [View, string, string][] = [
  ['home', 'Home', 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z'],
  ['books', 'Books', 'M4 4h6v16H4zM14 4h6v16h-6z'],
  ['ai', 'AI Tutor', 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9 10h.01M15 10h.01M9 15c1.5 1.2 4.5 1.2 6 0'],
  ['notes', 'My Notes', 'M6 3h9l3 3v15H6zM9 9h6M9 13h6M9 17h4'],
  ['me', 'Profile', 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1-4 4-6 8-6s7 2 8 6'],
];
const HI: Record<string, string> = { Home: 'होम', Books: 'किताबें', 'AI Tutor': 'AI ट्यूटर', 'My Notes': 'मेरे नोट्स', Profile: 'प्रोफ़ाइल', Hello: 'नमस्ते' };
const TONE = ['#2456D6', '#0E8FB0', '#1E9E6A', '#7A4FD6', '#C7782A', '#C2427A'];

const load = (): Store => {
  try { return { ...EMPTY, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return EMPTY; }
};
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const hash = async (p: string) => {
  try {
    const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(p));
    return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('');
  } catch { return 'x' + btoa(unescape(encodeURIComponent(p))); }
};
const tone = (s: string) => TONE[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % TONE.length];
const mono = (s: string) => s.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
const initials = (n: string) => n.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase();

function Tile({ k, title, sub, onClick, grid }: { k: string; title: string; sub: string; onClick: () => void; grid?: boolean }) {
  return (
    <button className="card tile" onClick={onClick} style={grid ? { margin: 0 } : undefined}>
      <span className="mg" style={{ background: tone(k) }}>{mono(k)}</span>
      <span className="grow"><b>{title}</b><span className="muted sm block">{sub}</span></span>
    </button>
  );
}

function NoteCard({ n, onOpen }: { n: Note; onOpen: () => void }) {
  return (
    <button className="card" onClick={onOpen}>
      <span className="row"><b>{n.title}</b><span className="pill">{n.type}</span></span>
      <span className="muted sm block">{n.subject} · {new Date(n.ts).toLocaleDateString()}</span>
    </button>
  );
}

function Search({ notes, onChap, onNote }: { notes: Note[]; onChap: (id: string) => void; onNote: (n: Note) => void }) {
  const [q, setQ] = useState('');
  const t = q.trim().toLowerCase();
  const cs = t ? CHAPTERS.filter(c => (c.title + c.sub + JSON.stringify(c.sec)).toLowerCase().includes(t)) : [];
  const ns = t ? notes.filter(n => (n.title + n.body).toLowerCase().includes(t)) : [];
  return (
    <>
      <input className="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search chapters and notes" aria-label="Search" />
      {t && (
        <div className="card">
          {cs.map(c => <button key={c.id} className="sr" onClick={() => onChap(c.id)}><b>{c.title}</b> <span className="muted">{c.sub}</span></button>)}
          {ns.map(n => <button key={n.id} className="sr" onClick={() => onNote(n)}>Note: {n.title}</button>)}
          {!cs.length && !ns.length && <span className="muted">No matches yet.</span>}
        </div>
      )}
    </>
  );
}

function Reader({ c, fs, saved, onFont, onSave, onQuiz, onBack }: {
  c: Chapter; fs: number; saved: boolean; onFont: (d: number) => void; onSave: () => void; onQuiz: () => void; onBack: () => void;
}) {
  return (
    <>
      <div className="row">
        <button className="btn sm ghost" onClick={onBack}>‹ Back</button>
        <div className="row end">
          <button className="btn sm ghost" onClick={() => onFont(-1)} aria-label="Smaller text">A−</button>
          <button className="btn sm ghost" onClick={() => onFont(1)} aria-label="Larger text">A+</button>
          <button className="btn sm ghost" onClick={onSave}>{saved ? '★ Saved' : '☆ Save'}</button>
        </div>
      </div>
      <p style={{ marginTop: 14 }}><span className="pill">AI-generated notes · verify with NCERT</span></p>
      <h1>{c.title}</h1>
      <p className="muted">{c.sub} · Class {c.cls}</p>
      <article className="card reader" style={{ fontSize: fs }}>
        {c.sec.map(([h, b]) => (
          <section key={h}>
            <h3>{h}</h3>
            {Array.isArray(b) ? <ul>{b.map(i => <li key={i}>{i}</li>)}</ul> : <p>{b}</p>}
          </section>
        ))}
      </article>
      <div className="grid">
        <button className="btn" onClick={onQuiz}>Practice quiz ({c.quiz.length})</button>
        <button className="btn ghost noprint" onClick={() => window.print()}>Print / Save PDF</button>
      </div>
    </>
  );
}

function Quiz({ c, onBack, onDone }: { c: Chapter; onBack: () => void; onDone: (score: number) => void }) {
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const reset = () => { setI(0); setScore(0); setPick(null); };
  if (i >= c.quiz.length) {
    return (
      <div className="card center pad">
        <div className="muted">Your score</div>
        <h1 className="big">{score}/{c.quiz.length}</h1>
        <p className="muted">{score / c.quiz.length >= 0.6 ? 'Good work. Practice again to lock it in.' : 'Revise the notes, then try again.'}</p>
        <div className="grid" style={{ marginTop: 16 }}>
          <button className="btn ghost" onClick={onBack}>Back to notes</button>
          <button className="btn" onClick={reset}>Practice again</button>
        </div>
      </div>
    );
  }
  const q = c.quiz[i];
  const choose = (k: number) => { if (pick !== null) return; setPick(k); if (k === q.a) setScore(score + 1); };
  const next = () => { if (i === c.quiz.length - 1) onDone(score); setI(i + 1); setPick(null); };
  return (
    <>
      <div className="row"><button className="btn sm ghost" onClick={onBack}>‹ Notes</button><span className="muted sm">Question {i + 1} of {c.quiz.length}</span></div>
      <h2>{q.q}</h2>
      {q.o.map((o, k) => (
        <button key={k} className={`opt ${pick === null ? '' : k === q.a ? 'ok' : k === pick ? 'bad' : ''}`} disabled={pick !== null} onClick={() => choose(k)}>
          {'ABCD'[k]}. {o}
        </button>
      ))}
      {pick !== null && (
        <>
          <div className="card"><b>{pick === q.a ? 'Correct.' : 'Not quite.'}</b> {q.e}</div>
          <button className="btn" onClick={next}>{i < c.quiz.length - 1 ? 'Next question' : 'See result'}</button>
        </>
      )}
    </>
  );
}

function Tutor({ cls }: { cls: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const ask = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = String(new FormData(e.currentTarget).get('q') ?? '').trim();
    if (!q) return;
    setMsgs(m => [...m, { r: 'u', t: q }, { r: 'a', t: answer(q) }]);
    e.currentTarget.reset();
  };
  return (
    <>
      <h1>AI Tutor</h1>
      <p className="muted">Class {cls} · Answers from the library notes</p>
      <div className="row" style={{ margin: '12px 0' }}>
        <span className="pill">Local mode</span>
        <button className="btn sm ghost" onClick={() => setMsgs([])}>New chat</button>
      </div>
      {msgs.length
        ? msgs.map((m, i) => <div key={i} className={`bub ${m.r}`}>{m.t}</div>)
        : <div className="card empty">Ask about balancing equations, reaction types, energy changes, rancidity or corrosion.</div>}
      <form className="card ask" onSubmit={ask}>
        <input name="q" placeholder="Ask a question" maxLength={300} required autoComplete="off" />
        <button className="btn sm" type="submit">Send</button>
      </form>
    </>
  );
}

function NoteEditor({ n, onSave, onDelete, onBack }: {
  n: Note | null; onSave: (n: Note) => void; onDelete: (id: string) => void; onBack: () => void;
}) {
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    onSave({ id: n?.id ?? uid(), title: f.title.trim(), subject: f.subject, type: f.type, cue: f.cue ?? '', body: f.body ?? '', summary: f.summary ?? '', ts: Date.now() });
  };
  return (
    <>
      <div className="row">
        <button className="btn sm ghost" onClick={onBack}>‹ Notes</button>
        {n && <button className="btn sm ghost" onClick={() => onDelete(n.id)}>Delete</button>}
      </div>
      <h1>{n ? 'Edit note' : 'New note'}</h1>
      <form className="card" onSubmit={submit}>
        <label>Title<input name="title" required maxLength={80} defaultValue={n?.title} /></label>
        <div className="two">
          <label>Subject<select name="subject" defaultValue={n?.subject ?? 'Chemistry'}>{SUBJECTS.map(x => <option key={x}>{x}</option>)}</select></label>
          <label>Type<select name="type" defaultValue={n?.type ?? TYPES[0]}>{TYPES.map(x => <option key={x}>{x}</option>)}</select></label>
        </div>
        <label>Cues and questions (Cornell)<textarea name="cue" defaultValue={n?.cue} /></label>
        <label>Notes<textarea name="body" rows={8} defaultValue={n?.body} /></label>
        <label>Summary (Cornell)<textarea name="summary" defaultValue={n?.summary} /></label>
        <button className="btn" type="submit">Save note</button>
      </form>
    </>
  );
}

export default function App() {
  const [s, setS] = useState<Store>(load);
  const [route, setRoute] = useState<Route>({ v: 'home' });
  const [stack, setStack] = useState<Route[]>([]);
  const [mode, setMode] = useState<'login' | 'reg'>('login');
  const [msg, setMsg] = useState('');
  const me = s.me ? s.users[s.me] : undefined;
  const L = (k: string) => (s.lang === 'hi' && HI[k]) || k;

  const up = (f: (p: Store) => Store) => setS(p => {
    const n = f(p);
    try { localStorage.setItem(KEY, JSON.stringify(n)); } catch { /* storage blocked: keep in memory */ }
    return n;
  });
  const say = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 2200); };
  const go = (r: Route) => {
    if (r.v === 'chap' && r.chap) up(p => ({ ...p, last: r.chap! }));
    setStack(st => [...st, route]);
    setRoute(r);
    window.scrollTo(0, 0);
  };
  const tab = (v: View) => { setStack([]); setRoute({ v }); window.scrollTo(0, 0); };
  const back = () => {
    const prev = stack[stack.length - 1];
    if (!prev) return;
    setRoute(prev);
    setStack(stack.slice(0, -1));
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    document.documentElement.dataset.theme = s.theme;
    document.documentElement.lang = s.lang;
  }, [s.theme, s.lang]);

  useEffect(() => {
    const h = CapApp.addListener('backButton', () => {
      if (stack.length) back();
      else if (route.v !== 'home') tab('home');
      else CapApp.exitApp();
    });
    return () => { void h.then(x => x.remove()); };
  }, [stack, route]);

  const submitAuth = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const em = d.email.trim().toLowerCase();
    const h = await hash(d.pw);
    if (mode === 'reg') {
      if (s.users[em]) { say('This email already has an account. Log in instead.'); return; }
      up(p => ({ ...p, me: em, cls: d.cls, users: { ...p.users, [em]: { name: d.name.trim(), cls: d.cls, board: d.board, h } } }));
      say('Account created');
    } else {
      const u = s.users[em];
      if (!u || u.h !== h) { say('Email or password is incorrect'); return; }
      up(p => ({ ...p, me: em, cls: u.cls }));
      say('Welcome back');
    }
    tab('home');
  };

  const saveNote = (n: Note) => {
    up(p => ({ ...p, notes: p.notes.some(x => x.id === n.id) ? p.notes.map(x => (x.id === n.id ? n : x)) : [n, ...p.notes] }));
    say('Note saved');
    tab('notes');
  };
  const deleteNote = (id: string) => {
    up(p => ({ ...p, notes: p.notes.filter(x => x.id !== id) }));
    say('Note deleted');
    tab('notes');
  };
  const saveProfile = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    up(p => {
      const u = p.users[p.me!];
      return { ...p, cls: d.cls, users: { ...p.users, [p.me!]: { ...u, name: d.name.trim() || u.name, cls: d.cls, board: d.board } } };
    });
    say('Settings saved');
  };
  const toggleMark = (id: string) => up(p => ({ ...p, marks: p.marks.includes(id) ? p.marks.filter(x => x !== id) : [...p.marks, id] }));
  const setFs = (d: number) => up(p => ({ ...p, fs: Math.min(24, Math.max(14, p.fs + 2 * d)) }));
  const addResult = (c: Chapter, score: number) => up(p => ({ ...p, quiz: [{ id: c.id, title: c.title, score, total: c.quiz.length, ts: Date.now() }, ...p.quiz].slice(0, 30) }));

  if (!me) {
    return (
      <>
        <main className="wrap authbox">
          <div className="brand" style={{ fontSize: 26 }}>Smartnotes <b>AI</b></div>
          <p className="muted tag">Learn Smarter. Understand Better.</p>
          <form className="card" onSubmit={submitAuth}>
            <h2 style={{ marginTop: 0 }}>{mode === 'reg' ? 'Create your account' : 'Welcome back'}</h2>
            {mode === 'reg' && (
              <>
                <label>Name<input name="name" required maxLength={40} /></label>
                <div className="two">
                  <label>Class<select name="cls" defaultValue="10">{['9', '10', '11', '12'].map(c => <option key={c} value={c}>Class {c}</option>)}</select></label>
                  <label>Board<select name="board">{['CBSE', 'NCERT', 'HBSE'].map(b => <option key={b}>{b}</option>)}</select></label>
                </div>
              </>
            )}
            <label>Email<input name="email" type="email" required /></label>
            <label>Password (min 6 characters)<input name="pw" type="password" minLength={6} required /></label>
            <button className="btn" type="submit">{mode === 'reg' ? 'Create account' : 'Log in'}</button>
          </form>
          <p className="center muted" style={{ marginTop: 14 }}>
            {mode === 'reg' ? 'Already registered?' : 'New student?'}{' '}
            <button className="link" type="button" onClick={() => setMode(mode === 'reg' ? 'login' : 'reg')}>{mode === 'reg' ? 'Log in' : 'Register'}</button>
          </p>
        </main>
        {msg && <div className="toast" role="status">{msg}</div>}
      </>
    );
  }

  const chap = CHAPTERS.find(c => c.id === route.chap);
  const today = new Date().toDateString();
  const done = s.notes.filter(n => new Date(n.ts).toDateString() === today).length + s.quiz.filter(q => new Date(q.ts).toDateString() === today).length;
  const group: View = route.v === 'sub' || route.v === 'chap' || route.v === 'quiz' ? 'books' : route.v === 'note' ? 'notes' : route.v;
  const chapsFor = (sub: string) => CHAPTERS.filter(c => c.cls === s.cls && c.sub === sub);
  const openChap = (id: string) => go({ v: 'chap', chap: id });

  let screen: ReactNode = null;
  switch (route.v) {
    case 'home': {
      const last = CHAPTERS.find(c => c.id === s.last);
      screen = (
        <>
          <div className="row"><div className="brand">Smartnotes <b>AI</b></div><span className="pill">{me.board} · Class {me.cls}</span></div>
          <p className="greet">{L('Hello')}, <b>{me.name.split(' ')[0]}</b>. Learn Smarter. Understand Better.</p>
          <Search notes={s.notes} onChap={openChap} onNote={n => go({ v: 'note', note: n })} />
          <div className="hero">
            <div className="muted sm">Daily study goal</div>
            <h2 style={{ color: '#fff', margin: '6px 0 0' }}>{Math.min(done, 2)} of 2 done today</h2>
            <div className="bar"><i style={{ width: `${Math.min(done, 2) * 50}%` }} /></div>
          </div>
          <h2>Continue learning</h2>
          {last
            ? <Tile k={last.sub} title={last.title} sub={`Chapter · ${last.sub}`} onClick={() => openChap(last.id)} />
            : <div className="card empty">Open a chapter from Books to pick up where you left off.</div>}
          <h2>Recent notes</h2>
          {s.notes.length
            ? s.notes.slice(0, 3).map(n => <NoteCard key={n.id} n={n} onOpen={() => go({ v: 'note', note: n })} />)
            : <div className="card empty">No notes yet. Create your first one in My Notes.</div>}
          <h2>Popular subjects</h2>
          <div className="grid">
            {['Physics', 'Chemistry', 'Mathematics', 'Biology'].map(sub => (
              <Tile key={sub} k={sub} title={sub} sub={`Class ${s.cls}`} grid onClick={() => go({ v: 'sub', sub })} />
            ))}
          </div>
          <h2>Quick access</h2>
          <div className="grid">
            <button className="btn ghost" onClick={() => tab('ai')}>Ask AI Tutor</button>
            <button className="btn ghost" onClick={() => go({ v: 'note', note: null })}>New note</button>
          </div>
        </>
      );
      break;
    }
    case 'books':
      screen = (
        <>
          <h1>Books</h1>
          <p className="muted">NCERT · CBSE · HBSE library</p>
          <div className="chips">
            {['9', '10', '11', '12'].map(c => (
              <button key={c} className={`chip ${s.cls === c ? 'on' : ''}`} onClick={() => up(p => ({ ...p, cls: c }))}>Class {c}</button>
            ))}
          </div>
          {Object.entries(GROUPS).map(([g, list]) => (
            <section key={g}>
              <h2>{g}</h2>
              {list.map(sub => {
                const n = chapsFor(sub).length;
                return <Tile key={sub} k={sub} title={sub} sub={n ? `${n} chapter${n > 1 ? 's' : ''}` : 'Chapters coming soon'} onClick={() => go({ v: 'sub', sub })} />;
              })}
            </section>
          ))}
        </>
      );
      break;
    case 'sub': {
      const list = chapsFor(route.sub ?? '');
      screen = (
        <>
          <button className="btn sm ghost" onClick={back}>‹ Back</button>
          <h1>{route.sub}</h1>
          <p className="muted">Class {s.cls} · {me.board}</p>
          {list.length
            ? list.map(c => <Tile key={c.id} k={c.sub} title={c.title} sub="Notes · Definitions · Quiz" onClick={() => openChap(c.id)} />)
            : <div className="card empty"><b>No chapters published yet</b><p>Chapters for this subject will appear here once they are added.</p></div>}
        </>
      );
      break;
    }
    case 'chap':
      screen = chap
        ? <Reader c={chap} fs={s.fs} saved={s.marks.includes(chap.id)} onFont={setFs} onSave={() => toggleMark(chap.id)} onQuiz={() => go({ v: 'quiz', chap: chap.id })} onBack={back} />
        : <div className="card empty">This chapter is not available.</div>;
      break;
    case 'quiz':
      screen = chap ? <Quiz c={chap} onBack={back} onDone={score => addResult(chap, score)} /> : null;
      break;
    case 'ai':
      screen = <Tutor cls={me.cls} />;
      break;
    case 'notes':
      screen = (
        <>
          <h1>My Notes</h1>
          <p className="muted">{s.notes.length} saved on this device</p>
          <button className="btn" onClick={() => go({ v: 'note', note: null })}>+ New note</button>
          <div className="spacer" />
          {s.notes.length
            ? s.notes.map(n => <NoteCard key={n.id} n={n} onOpen={() => go({ v: 'note', note: n })} />)
            : <div className="card empty"><b>No notes yet</b><p>Write short, detailed, Cornell or exam notes.</p></div>}
        </>
      );
      break;
    case 'note':
      screen = <NoteEditor n={route.note ?? null} onSave={saveNote} onDelete={deleteNote} onBack={back} />;
      break;
    case 'me': {
      const qs = s.quiz;
      const avg = qs.length ? Math.round((qs.reduce((a, q) => a + q.score / q.total, 0) / qs.length) * 100) : 0;
      const weak = [...new Set(qs.filter(q => q.score / q.total < 0.6).map(q => q.title))];
      const marks = CHAPTERS.filter(c => s.marks.includes(c.id));
      screen = (
        <>
          <h1>Profile</h1>
          <div className="card row">
            <span className="row start">
              <span className="mg" style={{ width: 52, height: 52, background: 'var(--royal)' }}>{initials(me.name)}</span>
              <span><b>{me.name}</b><span className="muted sm block">{s.me}</span></span>
            </span>
          </div>
          <div className="grid">
            <div className="card stat"><span className="muted sm block">Notes</span><h2>{s.notes.length}</h2></div>
            <div className="card stat"><span className="muted sm block">Average quiz</span><h2>{avg}%</h2></div>
            <div className="card stat"><span className="muted sm block">Bookmarks</span><h2>{marks.length}</h2></div>
            <div className="card stat"><span className="muted sm block">Quizzes taken</span><h2>{qs.length}</h2></div>
          </div>
          <h2>Study settings</h2>
          <form className="card" onSubmit={saveProfile}>
            <label>Name<input name="name" defaultValue={me.name} maxLength={40} /></label>
            <div className="two">
              <label>Class<select name="cls" defaultValue={me.cls}>{['9', '10', '11', '12'].map(c => <option key={c} value={c}>Class {c}</option>)}</select></label>
              <label>Board<select name="board" defaultValue={me.board}>{['CBSE', 'NCERT', 'HBSE'].map(b => <option key={b}>{b}</option>)}</select></label>
            </div>
            <button className="btn" type="submit">Save settings</button>
          </form>
          <div className="card row"><span>Dark mode</span><button className="btn sm ghost" onClick={() => up(p => ({ ...p, theme: p.theme === 'dark' ? 'light' : 'dark' }))}>{s.theme === 'dark' ? 'On' : 'Off'}</button></div>
          <div className="card row"><span>Hindi labels</span><button className="btn sm ghost" onClick={() => up(p => ({ ...p, lang: p.lang === 'en' ? 'hi' : 'en' }))}>{s.lang === 'hi' ? 'हिंदी' : 'English'}</button></div>
          <h2>Bookmarks</h2>
          {marks.length
            ? marks.map(c => <button key={c.id} className="card" onClick={() => openChap(c.id)}><b>{c.title}</b></button>)
            : <div className="card empty">Save a chapter to see it here.</div>}
          <h2>Weak topics</h2>
          <div className="card">{weak.length ? weak.map(w => <div key={w}>• {w}</div>) : <span className="muted">No weak topics yet. Take a quiz to check.</span>}</div>
          <h2>Quiz history</h2>
          {qs.length
            ? qs.slice(0, 6).map((q, i) => <div key={i} className="card row"><span>{q.title}</span><b>{q.score}/{q.total}</b></div>)
            : <div className="card empty">No quizzes taken yet.</div>}
          <button className="btn ghost" onClick={() => { up(p => ({ ...p, me: null })); tab('home'); }}>Log out</button>
        </>
      );
      break;
    }
  }

  return (
    <>
      <main className="wrap">{screen}</main>
      <nav className="nav" aria-label="Main">
        {TABS.map(([v, label, d]) => (
          <button key={v} className={group === v ? 'on' : ''} onClick={() => tab(v)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d={d} /></svg>
            {L(label)}
          </button>
        ))}
      </nav>
      {msg && <div className="toast" role="status">{msg}</div>}
    </>
  );
}
