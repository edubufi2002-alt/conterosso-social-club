import {State,record} from './model';

type Seats={confirmed:number; temporary:[number,number][]};
/** One pass over reservations. Only quantities and expiry times leave the private aggregate. */
export function buildCatalogue(s:State,now:number){
 const counts=new Map<string,Seats>();
 function add(activity:string,ids:string[],quantity:number,expiry?:number){
  for(const id of ids){
   const key=JSON.stringify([activity,id]);
   const seats=counts.get(key)??{confirmed:0,temporary:[]};
   if(expiry===undefined)seats.confirmed+=quantity;
   else seats.temporary.push([expiry,quantity]);
   counts.set(key,seats);
  }
 }
 for(const b of record(s.bookings)){
  if(b.state==='confirmed')add(b.activityId,b.occurrenceIds,b.participants.length);
  else if(b.state==='held'&&b.expiresAt>now)add(b.activityId,b.occurrenceIds,b.participants.length,b.expiresAt);
 }
 for(const w of record(s.waitlist))if(w.state==='offered'&&w.expiresAt>now)add(w.activityId,w.occurrenceIds,w.quantity,w.expiresAt);
 const {homeText,about,membershipText,address,phone,contactEmail,gallery,membershipFeeCents,membershipFrom,membershipTo}=s.settings;
 return {version:1,content:{homeText,about,membershipText,address,phone,contactEmail,gallery:gallery||[],membershipFeeCents,membershipFrom,membershipTo},activities:record(s.activities).filter(e=>e.status!=='draft').map(e=>({...e,managers:[],occurrences:e.occurrences.map(o=>({...o,seats:counts.get(JSON.stringify([e.id,o.id]))??{confirmed:0,temporary:[]}}))}))};
}
export function serveCatalogue(c:ReturnType<typeof buildCatalogue>,now:number){
 return {content:{...c.content,gallery:c.content.gallery||[]},activities:(c.activities||[]).map(e=>({...e,managers:[],occurrences:(e.occurrences||[]).map(({seats,...o})=>({...o,remaining:o.cancelled?0:Math.max(0,o.capacity-seats.confirmed-(seats.temporary||[]).reduce((n,[end,q])=>end>now?n+q:n,0))}))}))};
}
