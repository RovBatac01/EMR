import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, CalendarDays, Clock3, HeartPulse, MapPin, Megaphone,
  Phone, ShieldCheck, Sparkles, Stethoscope, UsersRound
} from 'lucide-react';
import { api, apiOrigin } from '../../services/api';
import { useSettings } from '../../context/SettingsContext';
import PublicHeader from '../../components/PublicHeader';
import PublicFooter from '../../components/PublicFooter';
import Alert from '../../components/Alert';

const mediaUrl = (value) => {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `${apiOrigin}${value}`;
};
const readableDate = (value) => value ? new Intl.DateTimeFormat('en-PH', { year:'numeric', month:'long', day:'numeric' }).format(new Date(value)) : '';

function PostCard({ item }) {
  return <motion.article whileHover={{ y: -4 }} className="group overflow-hidden rounded-3xl border border-emerald-950/10 bg-white shadow-sm transition hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
    <Link to={`/announcements/${item.id}`} className="block">
      <div className="relative aspect-[16/10] overflow-hidden bg-emerald-50 dark:bg-slate-800">
        {item.cover_image_path ? <img src={mediaUrl(item.cover_image_path)} alt={item.media?.find((entry) => Number(entry.is_cover) === 1)?.alt_text || item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy"/> : <div className="flex h-full items-center justify-center text-kld-700"><Megaphone size={46}/></div>}
        <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-black uppercase tracking-wider text-kld-800 shadow-sm dark:bg-slate-950/90 dark:text-emerald-300">{item.section_type === 'PROMOTION' ? 'Promotion' : 'Announcement'}</span>
      </div>
      <div className="p-6">
        <time className="text-xs font-bold uppercase tracking-[.14em] text-kld-700 dark:text-emerald-300">{readableDate(item.publication_date || item.publish_from || item.created_at)}</time>
        <h3 className="mt-2 text-xl font-black text-slate-950 group-hover:text-kld-700 dark:text-white dark:group-hover:text-emerald-300">{item.title}</h3>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{item.summary || item.body || 'Open this post for complete information.'}</p>
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-kld-700 dark:text-emerald-300">Read full post <ArrowRight size={16}/></span>
      </div>
    </Link>
  </motion.article>;
}

function ServiceCard({ title, description, duration, capacity }) {
  return <motion.article whileHover={{ y: -4 }} className="rounded-3xl border border-emerald-950/10 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-kld-700 dark:bg-emerald-500/15 dark:text-emerald-300"><HeartPulse/></div>
    <h3 className="mt-5 text-lg font-black text-slate-950 dark:text-white">{title}</h3>
    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{description || 'School clinic assessment and appropriate health support.'}</p>
    {(duration || capacity) && <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-slate-500"><span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">{duration} minutes</span><span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">Capacity {capacity}</span></div>}
  </motion.article>;
}

export default function LandingPage() {
  const { settings } = useSettings();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    api.get('/public/landing').then(({data:response}) => {
      if (active) { setData(response.data); setError(''); }
    }).catch((requestError) => active && setError(requestError.message)).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const grouped = useMemo(() => {
    const sections = { ANNOUNCEMENT:[], PROMOTION:[], SERVICE:[], TEAM:[] };
    for (const row of data?.items || []) sections[row.section_type]?.push(row);
    return sections;
  }, [data]);
  const posts = [...grouped.ANNOUNCEMENT, ...grouped.PROMOTION].sort((a,b) => new Date(b.publication_date || b.created_at) - new Date(a.publication_date || a.created_at)).slice(0, 6);
  const config = data?.config || {};
  const hasHeroMedia = config.hero_media_type !== 'NONE' && config.hero_media_path;

  return <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
    <PublicHeader/>
    <main>
      <section id="home" className="relative overflow-hidden bg-white py-16 sm:py-20 lg:py-24 dark:bg-slate-950">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_15%,rgba(16,185,129,.12),transparent_27%),radial-gradient(circle_at_90%_20%,rgba(10,92,54,.10),transparent_30%)]"/>
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.02fr_.98fr] lg:px-8">
          <motion.div initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{duration:.5}}>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[.16em] text-kld-700 dark:border-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300"><Sparkles size={15}/>Health support for the KLD community</span>
            <h1 className="mt-7 max-w-3xl text-4xl font-black leading-[1.08] tracking-tight text-kld-950 sm:text-5xl lg:text-6xl dark:text-white">{config.hero_heading || settings.clinic_name}</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg dark:text-slate-300">{config.hero_description || 'Accessible, confidential, and coordinated healthcare support for students and employees.'}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="btn-primary px-6 py-3" to={config.primary_cta_url || '/student/appointments'}>{config.primary_cta_label || 'Book an Appointment'}<CalendarDays size={18}/></Link>
              <a className="btn-secondary px-6 py-3" href={config.secondary_cta_url || '#services'}>{config.secondary_cta_label || 'View Services'}<ArrowRight size={18}/></a>
            </div>
            <div className="mt-9 grid gap-3 sm:grid-cols-3">
              {[[ShieldCheck,'Private and role-protected'],[HeartPulse,'Student and employee care'],[Clock3,'Appointment and walk-in support']].map(([Icon,label]) => <div key={label} className="rounded-2xl border border-emerald-950/10 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"><Icon className="text-kld-700 dark:text-emerald-300" size={21}/><div className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-200">{label}</div></div>)}
            </div>
          </motion.div>

          <motion.div initial={{opacity:0,scale:.96}} animate={{opacity:1,scale:1}} transition={{duration:.55,delay:.1}} className="relative">
            <div className="absolute -inset-5 -z-10 rounded-[2.5rem] bg-gradient-to-br from-emerald-200/60 to-yellow-100/50 blur-2xl dark:from-emerald-800/30 dark:to-transparent"/>
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2.25rem] border border-emerald-950/10 bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-2xl dark:border-slate-800 dark:from-slate-900 dark:to-emerald-950/30">
              {config.hero_media_type === 'VIDEO' && config.hero_media_path ? <video key={config.hero_media_path} className="h-full w-full object-cover" controls playsInline preload="metadata" poster={mediaUrl(config.hero_fallback_path)} aria-label="Clinic introduction video"><source src={mediaUrl(config.hero_media_path)}/>Your browser does not support the clinic video.</video> : config.hero_media_type === 'IMAGE' && config.hero_media_path ? <img src={mediaUrl(config.hero_media_path)} alt="KLD School Clinic" className="h-full w-full object-cover"/> : <div className="flex h-full flex-col items-center justify-center p-8 text-center text-kld-800 dark:text-emerald-200"><div className="flex h-28 w-28 items-center justify-center rounded-full bg-white shadow-xl dark:bg-slate-900"><Stethoscope size={58} strokeWidth={1.5}/></div><p className="mt-6 max-w-sm text-sm font-semibold leading-6">Professional, student-centered healthcare within the KLD campus community.</p></div>}
            </div>
          </motion.div>
        </div>
      </section>

      {error && <div className="mx-auto max-w-7xl px-4 pb-8"><Alert>{error}</Alert></div>}
      {loading && <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-slate-500">Loading clinic information…</div>}

      <section className="border-y border-emerald-950/10 bg-emerald-50/70 py-10 dark:border-slate-800 dark:bg-emerald-950/20">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
          <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900"><Clock3 className="text-kld-700 dark:text-emerald-300"/><h2 className="mt-3 font-black">Operating Hours</h2><p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-400">{config.operating_hours || settings.clinic_operating_info || 'Contact the clinic for current operating hours.'}</p></div>
          <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900"><MapPin className="text-kld-700 dark:text-emerald-300"/><h2 className="mt-3 font-black">Clinic Location</h2><p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-400">{config.location_text || settings.clinic_address || 'KLD campus clinic'}</p>{config.location_url && <a href={config.location_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm font-bold text-kld-700 hover:underline dark:text-emerald-300">Open map</a>}</div>
          <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900"><Phone className="text-kld-700 dark:text-emerald-300"/><h2 className="mt-3 font-black">Contact the Clinic</h2><p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-400">{config.contact_content || settings.clinic_contact || 'Use the contact details published by the school clinic.'}</p></div>
        </div>
      </section>

      {posts.length > 0 && <section id="announcements" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-black uppercase tracking-[.18em] text-kld-700 dark:text-emerald-300">Clinic updates</p><h2 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">Announcements and promotions</h2><p className="mt-3 text-slate-600 dark:text-slate-400">Important clinic notices, services, and health campaigns.</p></div><Link to="/announcements" className="btn-secondary shrink-0">View All <ArrowRight size={17}/></Link></div>
          <div className="mt-9 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{posts.map((item) => <PostCard key={item.id} item={item}/>)}</div>
        </div>
      </section>}

      <section id="services" className="bg-emerald-50/70 py-20 dark:bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl"><p className="text-sm font-black uppercase tracking-[.18em] text-kld-700 dark:text-emerald-300">Clinic services</p><h2 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">Care that works with the school day</h2><p className="mt-3 leading-7 text-slate-600 dark:text-slate-400">Available services are configured by the clinic and may be requested through authenticated appointment scheduling.</p></div>
          <div className="mt-9 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {(data?.services || []).map((service) => <ServiceCard key={service.id} title={service.name} description={service.description} duration={service.duration_minutes} capacity={service.slot_capacity}/>) }
            {grouped.SERVICE.map((item) => <ServiceCard key={item.id} title={item.title} description={item.summary || item.body}/>) }
            {!data?.services?.length && !grouped.SERVICE.length && <ServiceCard title="School Clinic Care" description="Clinic services will appear here once published by an administrator."/>}
          </div>
        </div>
      </section>

      <section id="about" className="py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="rounded-[2.25rem] bg-kld-950 p-8 text-white shadow-xl sm:p-10"><Stethoscope className="text-emerald-300" size={42}/><h2 className="mt-5 text-3xl font-black">{config.about_heading || 'About the School Clinic'}</h2><p className="mt-5 whitespace-pre-line text-sm leading-7 text-white/75">{config.about_content || 'The school clinic supports campus wellbeing through first aid, assessment, consultation coordination, medicine management, health records, referrals, and preventive health activities.'}</p></div>
          <div><p className="text-sm font-black uppercase tracking-[.18em] text-kld-700 dark:text-emerald-300">Our approach</p><h2 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">Confidential care, clear coordination</h2><div className="mt-6 space-y-4">{[['Protected records','Role-based access and audit trails protect authorized medical information.'],['Connected clinic workflow','Visits, consultations, medicines, appointments, and follow-ups stay connected.'],['Patient-centered access','Verified students can access permitted information through their own secure portal.']].map(([title,text]) => <div key={title} className="flex gap-4 rounded-2xl border border-emerald-950/10 p-5 dark:border-slate-800"><ShieldCheck className="mt-0.5 shrink-0 text-kld-700 dark:text-emerald-300"/><div><h3 className="font-black">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">{text}</p></div></div>)}</div></div>
        </div>
      </section>

      {grouped.TEAM.length > 0 && <section id="team" className="bg-slate-50 py-20 dark:bg-slate-900/50"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="text-center"><p className="text-sm font-black uppercase tracking-[.18em] text-kld-700 dark:text-emerald-300">Our team</p><h2 className="mt-2 text-3xl font-black">Clinic personnel</h2></div><div className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{grouped.TEAM.map((member) => <article key={member.id} className="overflow-hidden rounded-3xl border bg-white text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">{member.cover_image_path ? <img src={mediaUrl(member.cover_image_path)} alt={member.title} className="aspect-square w-full object-cover" loading="lazy"/> : <div className="flex aspect-square items-center justify-center bg-emerald-50 text-kld-700 dark:bg-slate-800"><UsersRound size={58}/></div>}<div className="p-5"><h3 className="font-black">{member.title}</h3><p className="mt-1 text-sm text-slate-500">{member.summary || member.body}</p></div></article>)}</div></div></section>}

      <section className="px-4 py-16 sm:px-6 lg:px-8"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-[2rem] bg-gradient-to-r from-kld-800 to-kld-600 p-8 text-white shadow-xl sm:p-10 lg:flex-row lg:items-center"><div><p className="text-sm font-black uppercase tracking-[.16em] text-emerald-200">Need clinic assistance?</p><h2 className="mt-2 text-3xl font-black">Request an appointment through your secure account.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">Appointment requests require authentication so the clinic can verify the patient and protect health information.</p></div><Link to="/student/appointments" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-black text-kld-800 shadow-lg hover:bg-emerald-50">Book Appointment <CalendarDays size={18}/></Link></div></section>
    </main>
    <PublicFooter/>
  </div>;
}
