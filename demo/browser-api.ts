/** Presentation sandbox. No network requests, credentials or server dependencies. */
import {installProgramme} from '../src/lib/programme';
import template from './seed.json';
import {State,Account,record} from '../src/lib/model';
import {availability,createBooking,cancelBooking,recordCash,checkin,processWaitlist,validMembership,confirmPayment,assertAdmin,assertManage} from '../src/lib/domain';
const KEY='conterosso-presentation-v1',SESSION=KEY+'-role';
export const demoProfiles=[{role:'user',email:'user@example.test',cf:'DEMO-UTENTE'},{role:'manager',email:'manager@example.test',cf:'DEMO-RESPONSABILE'},{role:'admin',email:'admin@example.test',cf:'DEMO-ADMIN'}];
export function demoId(){const b=crypto.getRandomValues(new Uint8Array(16));return Array.from(b,x=>x.toString(16).padStart(2,'0')).join('')}
let memory:State|null=null,role='';
function save(s:State){memory=s;try{localStorage.setItem(KEY,JSON.stringify(s))}catch{/* keep usable in memory when storage is unavailable */}}
function session(id?:string){if(id!==undefined){role=id;try{localStorage.setItem(SESSION,id)}catch{}}else try{role=localStorage.getItem(SESSION)||role}catch{}return role}
export function makeDemo(now=Date.now()):State{
 const s=structuredClone(template) as State;s.bookings={};s.jobs={};s.waitlist={};s.ledger={};s.audit={};s.processed={};s.activities={};
 const year=new Date(now).getFullYear();s.settings.membershipFrom=`${year}-01-01`;s.settings.membershipTo=`${year}-12-31`;s.settings.waitPolicy='fit';s.settings.membershipFeeCents=1000;s.settings.onsiteDelegates=['manager'];
 for(const [i,a] of Object.values(s.accounts).entries()){a.cfKey=['DEMO-UTENTE','DEMO-RESPONSABILE','DEMO-ADMIN'][i];a.name=['Giulia','Marco','Sofia'][i];a.surname='Demo';a.whatsapp=true}
 s.people={};for(const a of Object.values(s.accounts))s.people[a.cfKey]={id:a.cfKey,name:a.name,surname:a.surname,cfCipher:'',membership:[{id:'card-'+a.id,card:'DEMO-'+a.id,from:s.settings.membershipFrom,to:s.settings.membershipTo,status:'active',approvedBy:'admin',feeCents:1000,paidCents:1000}]};
 const items=[
 ['jazz','Jazz sotto le stelle','Musica','music',1500,80,1,'Un quartetto immaginario, un repertorio tra swing e bossa nova e una serata da condividere. Apertura porte alle 20:00, concerto alle 20:30.'],
 ['fotografia','Molfetta attraverso l’obiettivo','Fotografia','art',1200,20,3,'Tre incontri di fotografia: composizione, luce naturale e racconto del territorio. Porta il tuo smartphone o la tua macchina fotografica.'],
 ['libri','Un libro, mille conversazioni','Letteratura','words',0,30,1,'Un salotto di lettura aperto a tutti. Scegli un brano, condividi una storia e scopri nuovi punti di vista. Non serve aver letto un libro specifico.'],
 ['ceramica','Mani nella terra','Laboratori','lab',2000,12,1,'Un laboratorio introduttivo di ceramica per modellare una piccola ciotola. Materiali inclusi nel contributo dimostrativo.'],
 ['vinili','Vinili & aperitivo','Musica','music',1000,25,1,'Un viaggio tra dischi, racconti e ascolti collettivi. Una selezione immaginaria dal soul al cantautorato italiano.'],
 ['teatro','Fuori copione','Teatro','words',1000,80,1,'Giochi teatrali e improvvisazione per riscoprire la spontaneità. Nessuna esperienza richiesta: bastano curiosità e voglia di partecipare.']
 ] as const;
 items.forEach(([id,title,category,cover,priceCents,capacity,count,description],i)=>{const day=new Date(now);day.setDate(day.getDate()+i+3);day.setHours(19,30,0,0);const start=day.getTime();s.activities[id]={id,title,category,cover,description:description+' Attività fittizia creata esclusivamente per questa presentazione.',location:s.settings.address,status:'published',priceCents,cyclePriceCents:count>1?3000:null,methods:['onsite','online'],managers:['manager'],occurrences:Array.from({length:count},(_,j)=>({id:id+'-'+j,startsAt:new Date(start+j*604800000).toISOString(),endsAt:new Date(start+j*604800000+7200000).toISOString(),capacity,bookingDeadline:new Date(start+j*604800000-1800000).toISOString(),cancellationDeadline:new Date(start+j*604800000-86400000).toISOString()})),version:1,refundPercent:100,sample:true}});
 const names=[['Luca','Riva'],['Elena','Costa'],['Andrea','Serra'],['Chiara','Fontana'],['Davide','Marini'],['Sara','Romano']];
 for(let i=0;i<6;i++){const id='guest-'+i;s.people[id]={id,name:names[i][0],surname:names[i][1],cfCipher:'',membership:i%3===0?[]:[{id:'t-'+i,card:'D-'+(100+i),from:s.settings.membershipFrom,to:s.settings.membershipTo,status:'active',approvedBy:'admin',feeCents:1000,paidCents:1000}]}}
 const add=(id:string,eventId:string,pids:string[],ownerId='user',paid=false)=>{const e=s.activities[eventId];const b=createBooking(s,{id,ownerId,activityId:eventId,occurrenceIds:[e.occurrences[0].id],participants:pids.map(pid=>({personId:pid,name:s.people[pid].name,surname:s.people[pid].surname})),method:'onsite',idempotencyKey:id,requestHash:id},now);if(paid&&b.totalCents)recordCash(s,id,b.totalCents,s.accounts.admin,'cash-'+id,now);return b};
 add('demo-jazz','jazz',['DEMO-UTENTE','guest-1']);add('demo-libri','libri',['guest-0'],'manager');add('demo-teatro','teatro',['guest-2','guest-3'],'manager',true);add('demo-foto','fotografia',['guest-4','guest-5'],'manager',true);
 for(const [eventId,n] of [['ceramica',12],['vinili',23]] as const){const pids=Array.from({length:n},(_,i)=>{const id=eventId+'-guest-'+i;s.people[id]={id,name:'Partecipante',surname:'Demo '+(i+1),cfCipher:'',membership:[]};return id});add('demo-'+eventId,eventId,pids,'manager',true)}
 installProgramme(s.activities,now);
 return s;
}
function load(){if(memory)return memory;try{const raw=localStorage.getItem(KEY);if(raw)memory=JSON.parse(raw)}catch{}if(!memory)save(makeDemo());else installProgramme(memory.activities);return memory!}
function publicView(s:State){return {activities:record(s.activities).filter(e=>e.status!=='draft').map(e=>({...e,occurrences:e.occurrences.map(o=>({...o,remaining:o.cancelled?0:Math.max(0,availability(s,e,[o.id],Date.now()))}))})),content:s.settings,mode:'demo',onlineReady:true,demoAccounts:demoProfiles}}
function privateView(s:State,a:Account){const events=record(s.activities).filter(e=>a.role==='admin'||a.role==='manager'&&e.managers.includes(a.id));const ids=new Set(events.map(e=>e.id));const bookings=record(s.bookings).filter(b=>b.ownerId===a.id||ids.has(b.activityId));const pids=new Set(bookings.flatMap(b=>b.participants.map(p=>p.personId)));pids.add(a.cfKey);return {account:a,activities:events,bookings,people:record(s.people).filter(p=>a.role==='admin'||pids.has(p.id)).map(p=>({...p,active:validMembership(s,p.id,Date.now())})),waitlist:record(s.waitlist).filter(w=>w.ownerId===a.id||ids.has(w.activityId)),ledger:record(s.ledger).filter(l=>a.role==='admin'||l.bookingId&&ids.has(s.bookings[l.bookingId]?.activityId)),jobs:record(s.jobs).filter(j=>a.role==='admin'||j.bookingId&&ids.has(s.bookings[j.bookingId]?.activityId)),accounts:a.role==='admin'?record(s.accounts):[],settings:a.role==='user'?null:s.settings,audit:record(s.audit)}}
export async function demoApi(path:string,d:any={}):Promise<any>{
 if(path==='demo/reset'){session('');save(makeDemo());return {ok:true}}
 const s=structuredClone(load()),now=Date.now();processWaitlist(s,now);
 if(path==='public')return publicView(s);
 if(path==='demo/login'){if(!s.accounts[d.role])throw new Error('Scegli un ruolo demo.');session(d.role);return {account:s.accounts[d.role]}}
 if(path==='auth/logout'){session('');return {ok:true}}
 if(path==='auth/request'){const a=record(s.accounts).find(a=>a.email===d.email)||s.accounts.user;return {challengeId:a.id,demoCode:'12345678',message:'Simulazione: nessuna email inviata. Usa 12345678.'}}
 if(path==='auth/verify'){if(d.code!=='12345678')throw new Error('Nella demo usa 12345678.');session(d.challengeId);return {account:s.accounts[d.challengeId]}}
 const a=s.accounts[session()];if(path==='me')return a?privateView(s,a):{account:null};if(!a)throw new Error('Scegli un ruolo nella barra demo.');
 let result:any={ok:true};
 const people=(ps:any[])=>ps.map(p=>{const id=p.cf.trim().toUpperCase()||demoId();s.people[id]||={id,name:p.name,surname:p.surname,cfCipher:'',membership:[]};return {personId:id,name:p.name,surname:p.surname}});
 if(path==='bookings'||path==='wait-accept'){const w=path==='wait-accept'?s.waitlist[d.id]:null;const e=s.activities[w?.activityId||d.activityId];const participants=w?w.participants:people(d.participants);const b=createBooking(s,{id:demoId(),ownerId:a.id,activityId:e.id,occurrenceIds:w?w.occurrenceIds:d.occurrenceIds,participants,method:d.method,idempotencyKey:w?w.id:d.idempotencyKey,requestHash:JSON.stringify(d),...(w?{waitId:w.id}:{})},now);if(d.method==='online'&&b.state==='held')confirmPayment(s,b.id,b.totalCents,'demo-payment-'+b.id,'demo-intent-'+b.id,now);result={booking:b,checkoutUrl:null}}
 else if(path==='waitlist'){const id=demoId();if(record(s.waitlist).some(w=>w.ownerId===a.id&&w.activityId===d.activityId&&['waiting','offered'].includes(w.state)))throw new Error('Sei già in lista per questa attività.');s.waitlist[id]={id,ownerId:a.id,activityId:d.activityId,occurrenceIds:d.occurrenceIds,participants:people(d.participants),quantity:d.participants.length,createdAt:now,state:'waiting',expiresAt:0}}
 else if(path==='wait-withdraw'){if(s.waitlist[d.id]?.ownerId!==a.id)throw new Error('Richiesta non disponibile.');s.waitlist[d.id].state='withdrawn'}
 else if(path==='cancel')cancelBooking(s,d.id,a,now);
 else if(path==='cash')recordCash(s,d.id,d.amountCents,a,d.idempotencyKey,now);
 else if(path==='checkin')checkin(s,d.bookingId,d.personId,d.occurrenceId,d.status,a,now);
 else if(path==='events'){assertAdmin(a);const id=demoId();s.activities[id]={...d,id,version:1,sample:true};result={activity:s.activities[id]}}
 else if(path==='event-update'){assertManage(a,s.activities[d.id]);s.activities[d.id]={...s.activities[d.id],...d.patch,version:d.version+1,sample:true}}
 else if(path==='settings'){assertAdmin(a);Object.assign(s.settings,d)}
 else if(path==='roles'){assertAdmin(a);s.accounts[d.id].role=d.role}
 else if(path==='profile')s.accounts[a.id].whatsapp=d.whatsapp;
 else if(path==='membership'){if(a.role==='user')throw new Error('Scegli un operatore demo.');const p=s.people[d.personId];if(p.membership.some(m=>m.card===d.card))throw new Error('Tessera già presente.');p.membership.push({id:demoId(),card:d.card,from:d.from,to:d.to,status:'active',approvedBy:a.id,feeCents:s.settings.membershipFeeCents||0,paidCents:d.paidCents});const id=demoId();s.ledger[id]={id,personId:p.id,type:'membership',method:'onsite',amountCents:d.paidCents,createdAt:now,actorId:a.id,reference:d.card}}
 else if(path==='refund'){assertAdmin(a);const b=s.bookings[d.id];const id=demoId();s.ledger[id]={id,bookingId:b.id,type:'refund',method:'online',amountCents:b.refundDueCents,createdAt:now,actorId:a.id,reference:id};b.refundedCents+=b.refundDueCents;b.refundDueCents=0}
 else if(path==='notify'){assertManage(a,s.activities[d.activityId]);for(const b of record(s.bookings).filter(b=>b.activityId===d.activityId&&b.state==='confirmed')){const id=demoId();s.jobs[id]={id,bookingId:b.id,recipientId:b.ownerId,type:'change',channel:'email',dueAt:now,state:'pending',attempts:0,leaseUntil:0,detail:d.message}}}
 else if(path==='run-jobs'){for(const j of record(s.jobs).filter(j=>j.state==='pending')){j.state='accepted';j.providerId='DEMO_'+j.id;j.detail='Invio simulato nella presentazione. Nessun messaggio reale.'}}
 else if(path==='import/commit'){assertAdmin(a);for(const r of d.rows.filter((r:any)=>!r.errors.length))s.people[r.cf]={id:r.cf,name:r.name,surname:r.surname,cfCipher:'',membership:[]}}
 else throw new Error('Operazione non prevista nella demo.');
 processWaitlist(s,now);save(s);return result;
}
export async function demoExport(activityId?:string){const {default:ExcelJS}=await import('exceljs');const s=load(),a=s.accounts[session()];if(!a||a.role==='user')throw new Error('Apri il gestionale demo.');const data=privateView(s,a);const wb=new ExcelJS.Workbook();const sh=wb.addWorksheet('Prenotazioni DEMO');sh.addRow(['Attività','Partecipante','Stato','Totale gruppo EUR','Versato gruppo EUR']);for(const b of data.bookings.filter(b=>!activityId||b.activityId===activityId))for(const p of b.participants)sh.addRow([s.activities[b.activityId].title,p.name+' '+p.surname,b.state,b.totalCents/100,b.paidCents/100]);sh.columns.forEach(c=>c.width=28);const bytes=await wb.xlsx.writeBuffer();const url=URL.createObjectURL(new Blob([bytes as BlobPart],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));const link=document.createElement('a');link.href=url;link.download='conterosso-demo.xlsx';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
export async function demoImport(file:File){const {default:ExcelJS}=await import('exceljs');if(file.size>2000000)throw new Error('Usa un file demo inferiore a 2 MB.');const wb=new ExcelJS.Workbook();await wb.xlsx.load(await file.arrayBuffer());const sheet=wb.worksheets[0];const rows:any[]=[];sheet.eachRow((r,n)=>{if(n===1)return;const name=String(r.getCell(1).text),surname=String(r.getCell(2).text),cf=String(r.getCell(3).text).toUpperCase();rows.push({name,surname,cf,errors:!name||!surname||!cf?['Nome, cognome e identificativo richiesti']:[]})});return {rows}}
