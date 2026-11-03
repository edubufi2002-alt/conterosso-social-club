import {createRoot} from 'react-dom/client';
import ClubApp from '../src/components/ClubApp';
import {demoExport} from './browser-api';
document.addEventListener('click',event=>{
 const a=(event.target as HTMLElement).closest('a');
 if(a?.getAttribute('href')?.startsWith('/api/export')){
  event.preventDefault();const url=new URL(a.getAttribute('href')!, 'https://demo.example');
  void demoExport(url.searchParams.get('activity')||undefined).catch(e=>alert(e.message));
 }
});
createRoot(document.getElementById('app')!).render(<ClubApp initialView="home"/>);
