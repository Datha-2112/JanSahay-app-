import { useEffect, useRef, useState } from 'react';
import { ArrowUp, AudioLines, BookOpen, Check, ChevronDown, CircleHelp, FileText, Headphones, Menu, Mic, Plus, Search, ShieldCheck, Sparkles, Volume2, X } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';
type Message = { role: 'user' | 'assistant'; text: string; citations?: any[]; results?: any[]; intent?: string };
const languageNames: Record<string,string> = { en: 'English', te: 'తెలుగు', hi: 'हिन्दी' };
const examples = [
  { icon: '✳', text: 'What is PM-KISAN?' },
  { icon: '⌂', text: 'I am a farmer. Which schemes can I get?' },
  { icon: '▤', text: 'Help me understand a government notice' },
];

export default function App() {
  const [lang, setLang] = useState('en');
  const [messages, setMessages] = useState<Message[]>([]);
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'chat'|'schemes'>('chat');
  const [schemes, setSchemes] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [voiceUnavailable, setVoiceUnavailable] = useState(false);
  const [notice, setNotice] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const session = useRef(crypto.randomUUID());

  useEffect(() => { fetch(`${API}/api/schemes?lang=${lang}`).then(r=>r.json()).then(setSchemes).catch(()=>{}); }, [lang]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  async function send(text = value) {
    const clean = text.trim(); if (!clean || loading) return;
    setMessages(m => [...m, { role: 'user', text: clean }]); setValue(''); setLoading(true);
    try {
      const res = await fetch(`${API}/api/chat`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ session_id: session.current, message: clean, input_mode: 'text', language: lang }) });
      const data = await res.json();
      setMessages(m => [...m, { role: 'assistant', text: data.reply || 'I could not process that right now.', citations: data.citations, results: data.eligibility_results, intent: data.intent }]);
    } catch { setMessages(m => [...m, { role: 'assistant', text: 'I could not reach JanSahay. Please check that the local API is running.' }]); }
    finally { setLoading(false); }
  }
  function listen(text: string) {
    const synth = window.speechSynthesis;
    if (!synth) { setVoiceUnavailable(true); return; }
    const utterance = new SpeechSynthesisUtterance(text); utterance.lang = lang === 'te' ? 'te-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.onerror = () => setVoiceUnavailable(true); synth.speak(utterance);
  }
  function dictate() {
    const w = window as any; const Speech = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Speech) { setVoiceUnavailable(true); return; }
    const rec = new Speech(); rec.lang = lang === 'te' ? 'te-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN'; rec.onresult = (e: any) => setValue(e.results[0][0].transcript); rec.onerror = () => setVoiceUnavailable(true); rec.start();
  }
  async function explainFile(file?: File) {
    if (!file) return;
    const fd = new FormData(); fd.append('file', file); fd.append('language', lang);
    setLoading(true);
    try { const res = await fetch(`${API}/api/notice/explain`, { method: 'POST', body: fd }); setNotice(await res.json()); }
    catch { setNotice({ plain_summary: 'Unable to process the file. Please try a clearer image or PDF.', uncertain_parts: ['The notice service could not be reached.'] }); }
    finally { setLoading(false); }
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <button className="brand" onClick={()=>{setView('chat');setMessages([])}}><span className="brand-mark">ज</span><span>JanSahay</span><span className="beta">BETA</span></button>
      <div className="side-actions"><button className="new-chat" onClick={()=>{setMessages([]);setView('chat')}}><Plus size={18}/> New conversation</button>
        <button className={view==='chat'?'nav-link active':'nav-link'} onClick={()=>setView('chat')}><Sparkles size={17}/> Ask JanSahay</button>
        <button className={view==='schemes'?'nav-link active':'nav-link'} onClick={()=>setView('schemes')}><BookOpen size={17}/> Scheme library</button>
      </div>
      <div className="sidebar-note"><div className="note-icon"><ShieldCheck size={17}/></div><div><b>Grounded in official sources</b><span>Answers are based on verified government information.</span></div></div>
      <div className="sidebar-bottom"><div className="avatar">JS</div><div className="profile"><b>Welcome</b><span>Your session stays private</span></div><button className="icon-plain" aria-label="More options"><Menu size={18}/></button></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="crumb"><span>JanSahay</span><span className="slash">/</span><b>{view==='chat'?'Ask anything':'Scheme library'}</b></div><div className="top-actions"><span className="secure"><span/> Private session</span><label className="language"><span>{languageNames[lang]}</span><ChevronDown size={15}/><select aria-label="Choose language" value={lang} onChange={e=>setLang(e.target.value)}><option value="en">English</option><option value="te">తెలుగు</option><option value="hi">हिन्दी</option></select></label></div></header>
      {view === 'schemes' ? <section className="library"><div className="eyebrow">YOUR BENEFIT GUIDE</div><h1>Find support that fits your life.</h1><p className="lead">Explore central and Andhra Pradesh schemes, in words that are easier to understand.</p><div className="searchbox"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search schemes or topics"/></div><div className="scheme-grid">{schemes.filter(s=>`${s.name} ${s.category}`.toLowerCase().includes(query.toLowerCase())).map(s=><SchemeCard key={s.scheme_id} scheme={s} lang={lang}/>)}</div></section> : <>
        {messages.length === 0 ? <section className="welcome"><div className="welcome-inner"><div className="spark-icon"><Sparkles size={23}/></div><div className="eyebrow">YOUR PUBLIC BENEFITS GUIDE</div><h1>Clear answers.<br/><em>In your language.</em></h1><p className="welcome-copy">Understand government schemes, check what you may qualify for, and make sense of official notices.</p><div className="prompt-label">HERE ARE A FEW THINGS YOU CAN ASK</div><div className="suggestions">{examples.map(item=><button key={item.text} onClick={()=>send(item.text)}><span className="suggestion-icon">{item.icon}</span><span>{item.text}</span><ArrowUp size={15} className="suggestion-arrow"/></button>)}</div></div></section> : <section className="conversation">{messages.map((m,i)=><div className={`message ${m.role}`} key={i}><div className="message-avatar">{m.role==='assistant'?<span className="mini-mark">ज</span>:<span>Y</span>}</div><div className="message-content"><div className="message-label">{m.role==='assistant'?'JANSAHAY':'YOU'}</div><p>{m.text}</p>{m.results?.length ? <div className="result-list">{m.results.slice(0,6).map((r:any)=><div className="result" key={r.scheme_id}><span className={`status ${r.status}`}>{r.status.replace('_',' ')}</span><b>{schemes.find(s=>s.scheme_id===r.scheme_id)?.name||r.scheme_id}</b>{r.missing_fields?.length>0&&<small>Needs: {r.missing_fields.join(', ')}</small>}</div>)}</div>:null}{m.citations?.length ? <div className="sources-label">SOURCES</div>:null}{m.citations?.map((c:any)=><a className="citation" key={c.scheme_id} href={c.url} target="_blank" rel="noreferrer"><span>{c.title}</span><small>Last verified: {c.last_verified}</small></a>)}{m.role==='assistant'&&<div className="message-tools"><button onClick={()=>listen(m.text)}><Volume2 size={15}/> Listen</button><span className="verified"><ShieldCheck size={13}/> Source-grounded</span></div>}</div></div>)}{loading&&<div className="typing"><span/><span/><span/> Finding a clear answer…</div>}<div ref={endRef}/></section>}
        <div className="composer-wrap"><div className="composer"><button className="attach" onClick={()=>fileRef.current?.click()} aria-label="Upload a notice"><FileText size={19}/></button><input value={value} onChange={e=>setValue(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&(e.preventDefault(),send())} placeholder="Ask about a scheme, benefit, or notice…"/><button className="mic" onClick={dictate} aria-label="Speak your question"><Mic size={18}/></button><button className="send" onClick={()=>send()} aria-label="Send question"><ArrowUp size={19}/></button><input ref={fileRef} type="file" accept="image/jpeg,image/png,application/pdf" hidden onChange={e=>explainFile(e.target.files?.[0])}/></div><div className="composer-hint"><span><ShieldCheck size={13}/> Your personal details are never saved</span><span>JanSahay can make mistakes. Check official sources.</span></div>{voiceUnavailable&&<div className="voice-note">Voice unavailable in this browser. You can still type your question.</div>}</div>
      </>}
      <footer className="footer"><span>This is general information, not an official decision. Please confirm at your nearest Mee Seva / CSC / government office.</span><a href="https://www.india.gov.in/" target="_blank" rel="noreferrer">Official portals <ArrowUp size={12}/></a></footer>
    </main>
    {notice&&<div className="modal-backdrop" onClick={()=>setNotice(null)}><section className="notice-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" aria-label="Close" onClick={()=>setNotice(null)}><X size={19}/></button><div className="eyebrow">NOTICE EXPLAINER</div><h2>Here’s what we could read</h2><p>{notice.plain_summary}</p>{notice.deadlines?.length>0&&<><h3>Deadlines</h3>{notice.deadlines.map((d:any)=><p key={d.date}><b>{d.date}</b> — {d.description}</p>)}</>}{notice.actions_required?.length>0&&<><h3>What to do next</h3><ul>{notice.actions_required.map((x:string)=><li key={x}>{x}</li>)}</ul></>}{notice.uncertain_parts?.length>0&&<div className="uncertain"><b>Parts we’re unsure about</b>{notice.uncertain_parts.map((x:string)=><p key={x}>{x}</p>)}</div>}</section></div>}
  </div>;
}

function SchemeCard({scheme,lang}:{scheme:any,lang:string}) { const [open,setOpen]=useState(false); const [detail,setDetail]=useState<any>(null); async function toggle(){if(!open&&!detail){try{setDetail(await (await fetch(`${API}/api/schemes/${scheme.scheme_id}?lang=${lang}`)).json())}catch{}} setOpen(!open)} return <article className="scheme-card"><div className="scheme-card-top"><span className="scheme-category">{scheme.category}</span><span className="scheme-level">{scheme.level==='state'?'ANDHRA PRADESH':'CENTRAL'}</span></div><h3>{scheme.name}</h3><p>{detail?.summary||'Get a simple overview, eligibility details, and official next steps.'}</p><button onClick={toggle}>{open?'Hide details':'View scheme details'} <ChevronDown size={15}/></button>{open&&detail&&<div className="detail"><b>Documents to prepare</b><ul>{detail.required_documents.map((d:string)=><li key={d}>{d}</li>)}</ul><b>Next steps</b><ul>{detail.how_to_apply.map((d:string)=><li key={d}>{d}</li>)}</ul><a href={detail.official_urls[0]} target="_blank" rel="noreferrer">Visit official source ↗</a><small>Last verified: {detail.last_verified}</small></div>}</article> }
