import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
export default function SearchSelect({ label, placeholder='Search…', value, onChange, search, renderItem, required }) {
  const [query,setQuery]=useState('');const [items,setItems]=useState([]);const [open,setOpen]=useState(false);const timer=useRef();
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  const handle=(text)=>{setQuery(text);onChange(null);clearTimeout(timer.current);if(text.trim().length<2){setItems([]);return;}timer.current=setTimeout(async()=>{setItems(await search(text.trim()));setOpen(true);},250);};
  return <div className="relative"><label className="label">{label}{required&&<span className="text-red-500"> *</span>}</label><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17}/><input className="input pl-9" value={value?.label||query} onChange={e=>handle(e.target.value)} onFocus={()=>items.length&&setOpen(true)} placeholder={placeholder}/></div>{open&&items.length>0&&<div className="absolute z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">{items.map(item=><button type="button" key={item.id} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-kld-50 dark:hover:bg-slate-800" onClick={()=>{onChange(item);setQuery('');setOpen(false);}}>{renderItem?renderItem(item):item.label}</button>)}</div>}</div>;
}
