import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Megaphone, Search } from 'lucide-react';
import { api, apiOrigin } from '../../services/api';
import PublicHeader from '../../components/PublicHeader';
import PublicFooter from '../../components/PublicFooter';
import Pagination from '../../components/Pagination';
import EmptyState from '../../components/EmptyState';
import Alert from '../../components/Alert';

const mediaUrl = (value) => value ? (/^https?:\/\//i.test(value) ? value : `${apiOrigin}${value}`) : '';
const date = (value) => value ? new Intl.DateTimeFormat('en-PH',{year:'numeric',month:'long',day:'numeric'}).format(new Date(value)) : '';

export default function AnnouncementsPage() {
  const [params,setParams] = useSearchParams();
  const [items,setItems] = useState([]); const [meta,setMeta] = useState(null); const [loading,setLoading] = useState(true); const [error,setError] = useState('');
  const page = Number(params.get('page') || 1); const type = params.get('type') || ''; const search = params.get('search') || '';
  useEffect(() => { let active=true; setLoading(true); api.get('/public/landing/posts',{params:{page,limit:9,type:type||undefined,search:search||undefined}}).then(({data})=>{if(active){setItems(data.data||[]);setMeta(data.meta);setError('');}}).catch((e)=>active&&setError(e.message)).finally(()=>active&&setLoading(false)); return()=>{active=false}; },[page,type,search]);
  const set=(key,value)=>{const next=new URLSearchParams(params);if(value)next.set(key,String(value));else next.delete(key);if(key!=='page')next.set('page','1');setParams(next);};
  return <div className="min-h-screen bg-slate-50 dark:bg-slate-950"><PublicHeader/><main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><div className="max-w-3xl"><p className="text-sm font-black uppercase tracking-[.18em] text-kld-700 dark:text-emerald-300">Clinic updates</p><h1 className="mt-2 text-4xl font-black text-slate-950 dark:text-white">Announcements and Promotions</h1><p className="mt-4 leading-7 text-slate-600 dark:text-slate-400">Read complete clinic notices, campaigns, and service updates with their published image galleries.</p></div>
    <section className="mt-8 grid gap-3 rounded-2xl border bg-white p-4 sm:grid-cols-[1fr_220px] dark:border-slate-800 dark:bg-slate-900"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input className="input pl-10" value={search} onChange={(e)=>set('search',e.target.value)} placeholder="Search published posts…"/></div><select className="input" value={type} onChange={(e)=>set('type',e.target.value)}><option value="">All posts</option><option value="ANNOUNCEMENT">Announcements</option><option value="PROMOTION">Promotions</option></select></section>
    {error&&<div className="mt-5"><Alert>{error}</Alert></div>}
    {loading?<div className="py-20 text-center text-sm text-slate-500">Loading published posts…</div>:items.length?<div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{items.map((item)=><article key={item.id} className="group overflow-hidden rounded-3xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"><Link to={`/announcements/${item.id}`}><div className="aspect-[16/10] overflow-hidden bg-emerald-50 dark:bg-slate-800">{item.cover_image_path?<img src={mediaUrl(item.cover_image_path)} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/>:<div className="flex h-full items-center justify-center text-kld-700"><Megaphone size={48}/></div>}</div><div className="p-6"><div className="flex items-center justify-between gap-3"><time className="text-xs font-black uppercase tracking-wider text-kld-700 dark:text-emerald-300">{date(item.publication_date||item.created_at)}</time><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase text-kld-700 dark:bg-emerald-500/10 dark:text-emerald-300">{item.section_type}</span></div><h2 className="mt-3 text-xl font-black text-slate-950 dark:text-white">{item.title}</h2><p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{item.summary||item.body}</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-kld-700 dark:text-emerald-300">Read more <ArrowRight size={16}/></span></div></Link></article>)}</div>:<div className="mt-8"><EmptyState title="No published posts found" description="Try another search or filter."/></div>}
    <Pagination meta={meta} onPage={(value)=>set('page',value)}/>
  </main><PublicFooter/></div>;
}
