import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { api } from '../../services/api';
import PublicHeader from '../../components/PublicHeader';
import PublicFooter from '../../components/PublicFooter';
import LoadingScreen from '../../components/LoadingScreen';
import Alert from '../../components/Alert';

export default function PolicyDocumentPage({ type: fixedType }) {
  const params=useParams();const type=fixedType||params.type;const[document,setDocument]=useState(null);const[loading,setLoading]=useState(true);const[error,setError]=useState('');
  useEffect(()=>{let active=true;api.get(`/policies/public/${type}`).then(({data})=>active&&setDocument(data.data)).catch((e)=>active&&setError(e.message)).finally(()=>active&&setLoading(false));return()=>{active=false};},[type]);
  return <div className="min-h-screen bg-slate-50 dark:bg-slate-950"><PublicHeader/><main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8"><Link to="/login" className="btn-secondary"><ArrowLeft size={17}/>Back to Sign In</Link>{loading?<LoadingScreen compact/>:error?<div className="mt-6"><Alert>{error}</Alert></div>:document&&<article className="mt-6 rounded-[2rem] border bg-white p-6 shadow-sm sm:p-10 dark:border-slate-800 dark:bg-slate-900"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-kld-700 dark:bg-emerald-500/15 dark:text-emerald-300"><FileText/></div><h1 className="mt-5 text-3xl font-black text-slate-950 dark:text-white">{document.title}</h1><p className="mt-2 text-sm font-semibold text-slate-500">Version {document.version}{document.publishedAt?` · Published ${new Intl.DateTimeFormat('en-PH',{dateStyle:'long'}).format(new Date(document.publishedAt))}`:''}</p><div className="mt-8 whitespace-pre-line text-base leading-8 text-slate-700 dark:text-slate-300">{document.body}</div></article>}</main><PublicFooter/></div>;
}
