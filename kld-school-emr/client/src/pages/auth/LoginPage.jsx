import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, FileCheck2, LockKeyhole, LogIn, Moon, Sun, UserPlus, UserRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSettings } from '../../context/SettingsContext';
import { api } from '../../services/api';
import MedicalScene from '../../components/MedicalScene';
import LogoMark from '../../components/LogoMark';
import Alert from '../../components/Alert';
import Modal from '../../components/Modal';

const byType = (documents, type) => documents.find((document) => document.documentType === type);

export default function LoginPage() {
  const { user, login } = useAuth();
  const { theme, setTheme } = useTheme();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [form,setForm] = useState({ identifier:'', password:'', remember:false });
  const [show,setShow] = useState(false);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [documents,setDocuments] = useState([]);
  const [policyOpen,setPolicyOpen] = useState(false);
  const [activeDocument,setActiveDocument] = useState('PRIVACY_POLICY');
  const [requiredDocumentTypes,setRequiredDocumentTypes] = useState([]);
  const [privacyAccepted,setPrivacyAccepted] = useState(false);
  const [termsAccepted,setTermsAccepted] = useState(false);

  useEffect(() => { if (user) navigate(user.role === 'STUDENT' ? '/student' : '/dashboard', { replace:true }); }, [user,navigate]);
  useEffect(() => { let active=true; api.get('/policies/public').then(({data}) => active && setDocuments(data.data || [])).catch(() => {}); return () => { active=false; }; }, []);
  const privacy = useMemo(() => byType(documents,'PRIVACY_POLICY'),[documents]);
  const terms = useMemo(() => byType(documents,'TERMS_AND_CONDITIONS'),[documents]);
  const requiredAcceptance = requiredDocumentTypes.length > 0;
  const requiresPrivacy = requiredDocumentTypes.includes('PRIVACY_POLICY');
  const requiresTerms = requiredDocumentTypes.includes('TERMS_AND_CONDITIONS');
  const document = byType(documents,activeDocument);

  const openDocument = (type) => { setActiveDocument(type); setPolicyOpen(true); };
  const completeLogin = async (accepting=false) => {
    const payload = { ...form };
    if (accepting) {
      if (requiresPrivacy) {
        payload.privacyDocumentId = privacy?.id;
        payload.privacyAccepted = privacyAccepted;
      }
      if (requiresTerms) {
        payload.termsDocumentId = terms?.id;
        payload.termsAccepted = termsAccepted;
      }
    }
    const signed = await login(payload);
    const requested = location.state?.from?.pathname;
    navigate(requested || (signed.role === 'STUDENT' ? '/student' : '/dashboard'), { replace:true });
  };

  const submit = async (event) => {
    event?.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    try { await completeLogin(requiredAcceptance); }
    catch (requestError) {
      if (requestError.status === 428 && requestError.details?.code === 'POLICY_ACCEPTANCE_REQUIRED') {
        const missingDocuments = requestError.details.documents || [];
        setDocuments((current) => {
          const merged = [...current];
          for (const item of missingDocuments) {
            const index = merged.findIndex((entry) => entry.documentType === item.documentType);
            if (index >= 0) merged[index] = item; else merged.push(item);
          }
          return merged;
        });
        const missingTypes = missingDocuments.map((item) => item.documentType);
        setRequiredDocumentTypes(missingTypes);
        setPrivacyAccepted(false); setTermsAccepted(false);
        const firstType = missingTypes[0] || 'PRIVACY_POLICY';
        setActiveDocument(firstType); setPolicyOpen(true);
        setError(missingTypes.length > 1
          ? 'Review both current documents and complete the two acknowledgments to finish signing in.'
          : 'Review and accept the updated document to finish signing in.');
      } else setError(requestError.message);
    } finally { setBusy(false); }
  };

  return <div className="grid min-h-screen lg:grid-cols-[1.1fr_.9fr]">
    <section className="mesh-bg relative hidden overflow-hidden bg-kld-950 lg:block"><MedicalScene/><div className="absolute inset-0 bg-gradient-to-br from-kld-950/20 via-transparent to-kld-950/60"/><div className="absolute bottom-10 left-10 right-10 z-10 max-w-xl text-white"><div className="mb-4 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[.16em] text-accent backdrop-blur">Secure school healthcare</div><h1 className="text-4xl font-extrabold leading-tight xl:text-5xl">A healthier campus starts with connected care.</h1><p className="mt-4 max-w-lg text-base leading-7 text-white/70">Manage clinic visits, medical records, medicines, forms, appointments, and student communication from one protected KLD workspace.</p></div></section>
    <section className="relative flex min-h-screen items-center justify-center bg-white px-5 py-10 dark:bg-slate-950 sm:px-10">
      <button type="button" className="icon-button absolute right-5 top-5" aria-label="Toggle color theme" onClick={()=>setTheme(theme==='dark'?'light':'dark')}>{theme==='dark'?<Sun/>:<Moon/>}</button>
      <motion.div initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} className="w-full max-w-md">
        <LogoMark className="h-14 w-14"/>
        <div className="mt-9"><h2 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">Welcome back</h2><p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Sign in to {settings.clinic_name} using your authorized account.</p></div>
        {error&&<div className="mt-5"><Alert onClose={()=>setError('')}>{error}</Alert></div>}
        <form onSubmit={submit} className="mt-7 space-y-5" noValidate>
          <div><label className="label" htmlFor="login-identifier">Username or email <span className="text-red-500">*</span></label><div className="relative"><UserRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input id="login-identifier" className="input pl-10" autoComplete="username" required value={form.identifier} onChange={(e)=>setForm({...form,identifier:e.target.value})} placeholder="Enter username or email"/></div></div>
          <div><label className="label" htmlFor="login-password">Password <span className="text-red-500">*</span></label><div className="relative"><LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input id="login-password" className="input px-10" type={show?'text':'password'} autoComplete="current-password" required value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} placeholder="Enter password"/><button type="button" aria-label={show?'Hide password':'Show password'} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400" onClick={()=>setShow(!show)}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></div>
          <div className="flex items-center justify-between text-sm"><label className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><input type="checkbox" className="h-4 w-4 accent-kld-600" checked={form.remember} onChange={(e)=>setForm({...form,remember:e.target.checked})}/>Remember session</label><Link className="font-bold text-kld-700 hover:underline dark:text-kld-300" to="/forgot-password">Forgot password?</Link></div>
          {requiredAcceptance&&<div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-500/10"><div className="flex items-center gap-2 font-black text-amber-900 dark:text-amber-200"><FileCheck2 size={18}/>Policy acknowledgment required</div><p className="mt-1 text-xs leading-5 text-amber-800 dark:text-amber-300">Your credentials were verified. Review each updated document below. A new acknowledgment is required whenever an applicable version changes.</p><div className="mt-3 space-y-3">{requiresPrivacy&&<label className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-200"><input className="mt-1 h-4 w-4 accent-kld-600" type="checkbox" checked={privacyAccepted} onChange={(e)=>setPrivacyAccepted(e.target.checked)}/><span>I acknowledge the <button type="button" className="font-black text-kld-700 underline dark:text-emerald-300" onClick={()=>openDocument('PRIVACY_POLICY')}>Privacy Policy{privacy?.version?` version ${privacy.version}`:''}</button>.</span></label>}{requiresTerms&&<label className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-200"><input className="mt-1 h-4 w-4 accent-kld-600" type="checkbox" checked={termsAccepted} onChange={(e)=>setTermsAccepted(e.target.checked)}/><span>I accept the <button type="button" className="font-black text-kld-700 underline dark:text-emerald-300" onClick={()=>openDocument('TERMS_AND_CONDITIONS')}>Terms and Conditions{terms?.version?` version ${terms.version}`:''}</button>.</span></label>}</div></div>}
          <button disabled={busy||requiredAcceptance&&((requiresPrivacy&&!privacyAccepted)||(requiresTerms&&!termsAccepted))} className="btn-primary w-full py-3">{busy?<span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white"/>:<LogIn size={19}/>} {busy?'Signing in…':requiredAcceptance?'Accept and Sign In':'Sign in securely'}</button>
        </form>
        <div className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs font-bold text-slate-500"><button type="button" className="hover:text-kld-700 hover:underline" onClick={()=>openDocument('PRIVACY_POLICY')}>Privacy Policy</button><button type="button" className="hover:text-kld-700 hover:underline" onClick={()=>openDocument('TERMS_AND_CONDITIONS')}>Terms and Conditions</button></div>
        <div className="my-7 flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-slate-400"><div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"/>Student access<div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"/></div>
        <Link to="/activate-student" className="btn-secondary w-full py-3"><UserPlus size={19}/>Create KLD Student Account</Link>
        <p className="mt-8 text-center text-xs leading-5 text-slate-400">Authorized use only. Access to medical information is recorded and audited.</p>
      </motion.div>
    </section>

    <Modal open={policyOpen} onClose={()=>setPolicyOpen(false)} title={document?.title || 'Privacy and system terms'} maxWidth="max-w-3xl" footer={<><Link className="btn-secondary" to={activeDocument==='PRIVACY_POLICY'?'/privacy':'/terms'}>Open full page</Link><button type="button" className="btn-primary" onClick={()=>setPolicyOpen(false)}>Done reading</button></>}>
      <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800"><button type="button" className={activeDocument==='PRIVACY_POLICY'?'btn-primary':'btn-secondary'} onClick={()=>setActiveDocument('PRIVACY_POLICY')}>Privacy Policy</button><button type="button" className={activeDocument==='TERMS_AND_CONDITIONS'?'btn-primary':'btn-secondary'} onClick={()=>setActiveDocument('TERMS_AND_CONDITIONS')}>Terms and Conditions</button></div>
      {document?<><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Version {document.version}</p><div className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-700 dark:text-slate-300">{document.body}</div></>:<p className="text-sm text-slate-500">The document could not be loaded. Use the full-page link or contact the clinic administrator.</p>}
    </Modal>
  </div>;
}
