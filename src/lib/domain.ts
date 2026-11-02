import {Account,Activity,Booking,DomainError,Job,Participant,State,fail,record} from './model';
export function isStaff(a:Account){return a.role==='admin'||a.role==='manager'}
export function assertManage(a:Account,event:Activity){if(a.role!=='admin'&&(a.role!=='manager'||!event.managers.includes(a.id)))fail('forbidden','Attività non assegnata.',403)}
export function assertAdmin(a:Account){if(a.role!=='admin')fail('forbidden','Operazione riservata agli amministratori.',403)}
export function validMembership(s:State,personId:string,at:number){const day=new Date(at).toLocaleDateString('sv-SE',{timeZone:'Europe/Rome'});return (s.people[personId]?.membership||[]).some(m=>m.status==='active'&&m.from<=day&&m.to>=day&&m.paidCents>=m.feeCents&&!!m.approvedBy)}
export function occupied(s:State,activityId:string,occurrenceId:string,now:number,exclude=''){return record(s.bookings).filter(b=>b.id!==exclude&&b.activityId===activityId&&b.occurrenceIds.includes(occurrenceId)&&(b.state==='confirmed'||b.state==='held'&&b.expiresAt>now)).reduce((n,b)=>n+b.participants.length,0)+record(s.waitlist).filter(w=>w.activityId===activityId&&w.occurrenceIds.includes(occurrenceId)&&w.state==='offered'&&w.expiresAt>now).reduce((n,w)=>n+w.quantity,0)}
export function availability(s:State,event:Activity,ids:string[],now:number,exclude=''){return Math.min(...ids.map(id=>{const o=event.occurrences.find(o=>o.id===id);if(!o||o.cancelled)fail('occurrence','Incontro non disponibile.');return o.capacity-occupied(s,event.id,id,now,exclude)}))}
export function audit(s:State,id:string,actorId:string,action:string,target:string,now:number){s.audit[id]={id,actorId,action,target,at:now}}
function job(s:State,j:Omit<Job,'state'|'attempts'|'leaseUntil'>){if(!s.jobs[j.id])s.jobs[j.id]={...j,state:'pending',attempts:0,leaseUntil:0}}
export function scheduleBooking(s:State,b:Booking,now:number,confirmation=true){
 const event=s.activities[b.activityId];const owner=s.accounts[b.ownerId];
 const add=(kind:Job['type'],recipientId:string,dueAt:number,occurrenceId?:string)=>{const account=s.accounts[recipientId];if(!account)return; for(const channel of ['email','whatsapp'] as const){if(channel==='whatsapp'&&!account.whatsapp)continue;if(kind==='staff-new'&&channel==='email')continue; const id=[kind,b.id,occurrenceId||'all',recipientId,channel,event.version].join('_');job(s,{id,type:kind,bookingId:b.id,occurrenceId,recipientId,channel,dueAt});}};
 if(!owner)return;
 if(confirmation){add('confirmation',owner.id,now);for(const id of s.settings.staffRecipients)add('staff-new',id,now)}
 for(const id of b.occurrenceIds){const o=event.occurrences.find(o=>o.id===id)!;const start=Date.parse(o.startsAt);if(start<=now||o.cancelled)continue;
 for(const recipient of new Set([...s.settings.staffRecipients,...event.managers]))add('staff-reminder',recipient,Math.max(now,start-5*3600000),id);
 // Confirmation already carries full details for a late booking; no duplicate owner reminder.
 if(start-now>2*3600000)add('reminder',owner.id,Math.max(now,start-2*3600000),id);
 }
}
export function createBooking(s:State,input:{id:string;ownerId:string;activityId:string;occurrenceIds:string[];participants:Participant[];method:'onsite'|'online';idempotencyKey:string;requestHash:string;waitId?:string},now:number){
 const prior=record(s.bookings).find(b=>b.ownerId===input.ownerId&&b.idempotencyKey===input.idempotencyKey);if(prior){if(prior.requestHash!==input.requestHash)fail('idempotency','Richiesta già utilizzata con dati diversi.',409);return prior}
 const event=s.activities[input.activityId];if(!event||event.status!=='published')fail('not_found','Attività non prenotabile.',404);
 if(!event.methods.includes(input.method))fail('method','Modalità di pagamento non disponibile.');
 const ids=[...new Set(input.occurrenceIds)];if(!ids.length||ids.length!==input.occurrenceIds.length)fail('occurrence','Seleziona incontri distinti.');
 const cycle=ids.length>1;if(cycle&&(ids.length!==event.occurrences.filter(o=>!o.cancelled).length||!event.occurrences.filter(o=>!o.cancelled).every(o=>ids.includes(o.id))))fail('cycle','Seleziona un singolo incontro oppure l’intero ciclo.');
 const occurrences=ids.map(id=>{const o=event.occurrences.find(o=>o.id===id);if(!o||o.cancelled||Date.parse(o.bookingDeadline)<=now||Date.parse(o.startsAt)<=now)fail('deadline','Prenotazioni chiuse per uno degli incontri.');return o});
 if(!input.participants.length||new Set(input.participants.map(p=>p.personId)).size!==input.participants.length)fail('duplicate','Inserisci partecipanti distinti.');
 const taken=new Set(record(s.bookings).filter(b=>b.activityId===event.id&&b.occurrenceIds.some(id=>ids.includes(id))&&(b.state==='confirmed'||b.state==='held'&&b.expiresAt>now)).flatMap(b=>b.participants.map(p=>p.personId)));
 if(input.participants.some(p=>taken.has(p.personId)))fail('duplicate','Uno dei partecipanti risulta già prenotato per questo incontro.');
 if(input.waitId){const w=s.waitlist[input.waitId];if(!w||w.ownerId!==input.ownerId||w.state!=='offered'||w.expiresAt<=now||w.quantity!==input.participants.length||w.activityId!==event.id||w.occurrenceIds.slice().sort().join()!==ids.slice().sort().join())fail('offer','Offerta non valida o scaduta.',409);w.state='converted';w.bookingId=input.id}
 else if(record(s.waitlist).some(w=>w.activityId===event.id&&w.state==='waiting'&&w.occurrenceIds.some(id=>ids.includes(id))))fail('queue_priority','Sono presenti richieste in lista d’attesa: attendi l’assegnazione dei posti.',409);
 const residual=availability(s,event,ids,now);if(residual<input.participants.length)fail('capacity',`Sono disponibili soltanto ${Math.max(0,residual)} posti. Nessuna prenotazione parziale è stata confermata.`,409);
 const totalCents=(cycle&&event.cyclePriceCents!==null?event.cyclePriceCents:event.priceCents*ids.length)*input.participants.length;
 const b:Booking={...input,occurrenceIds:ids,state:input.method==='onsite'||totalCents===0?'confirmed':'held',expiresAt:Math.min(now+30*60000,...occurrences.map(o=>Date.parse(o.bookingDeadline))),createdAt:now,totalCents,paidCents:0,refundedCents:0,refundDueCents:0,refundPercent:event.refundPercent,cancellationDeadline:occurrences.map(o=>o.cancellationDeadline).sort()[0],attendance:{}};
 s.bookings[b.id]=b;if(b.state==='confirmed')scheduleBooking(s,b,now);audit(s,'book_'+b.id,input.ownerId,'booking.created',b.id,now);return b;
}
export function cancelBooking(s:State,id:string,actor:Account,now:number){const b=s.bookings[id];if(!b)fail('not_found','Prenotazione non trovata.',404);if(actor.id!==b.ownerId&&actor.role!=='admin')fail('forbidden','Operazione non consentita.',403);if(b.state==='cancelled')return b;if(actor.role!=='admin'&&Date.parse(b.cancellationDeadline)<now)fail('deadline','Il termine per annullare è scaduto.');if(Object.values(b.attendance||{}).includes('present'))fail('attendance','Prenotazione con presenze: serve gestione amministrativa.');b.state='cancelled';b.refundDueCents=b.refundPercent===null?0:Math.max(0,Math.round(b.paidCents*b.refundPercent/100)-b.refundedCents);for(const j of record(s.jobs))if(j.bookingId===b.id&&['pending','leased'].includes(j.state))j.state='cancelled';audit(s,'cancel_'+id,actor.id,'booking.cancelled',id,now);return b}
export function setCapacity(s:State,eventId:string,occurrenceId:string,capacity:number,actor:Account,now:number){const e=s.activities[eventId];if(!e)fail('not_found','Attività non trovata.',404);assertManage(actor,e);const o=e.occurrences.find(o=>o.id===occurrenceId);if(!o)fail('occurrence','Incontro non trovato.');if(!Number.isSafeInteger(capacity)||capacity<occupied(s,eventId,occurrenceId,now))fail('capacity','La capienza non può essere inferiore ai posti già occupati.',409);o.capacity=capacity;}
export function recordCash(s:State,bookingId:string,amount:number,actor:Account,key:string,now:number){const b=s.bookings[bookingId];if(!b)fail('not_found','Prenotazione non trovata.',404);assertManage(actor,s.activities[b.activityId]);if(s.ledger[key]){if(s.ledger[key].bookingId!==bookingId||s.ledger[key].amountCents!==amount)fail('idempotency','Operazione già utilizzata.',409);return}if(b.state!=='confirmed'||b.method!=='onsite'||!Number.isSafeInteger(amount)||amount<=0||amount>b.totalCents-b.paidCents)fail('amount','Importo non valido o superiore al residuo.');b.paidCents+=amount;s.ledger[key]={id:key,bookingId,type:'activity',method:'onsite',amountCents:amount,createdAt:now,actorId:actor.id,reference:key};audit(s,'cash_'+key,actor.id,'payment.received',bookingId,now)}
export function checkin(s:State,bid:string,pid:string,oid:string,status:'present'|'absent',actor:Account,now:number){const b=s.bookings[bid];if(!b)fail('not_found','Prenotazione non trovata.',404);assertManage(actor,s.activities[b.activityId]);if(b.state!=='confirmed'||!b.participants.some(p=>p.personId===pid)||!b.occurrenceIds.includes(oid))fail('participation','Partecipante non presente nella prenotazione.');if(status==='present'&&!validMembership(s,pid,now))fail('membership','Tessera non valida: completa il tesseramento prima dell’ingresso.');if(status==='present'&&s.settings.onsitePaymentRequired&&b.paidCents<b.totalCents)fail('unpaid','Prima dell’ingresso è necessario saldare il contributo.');b.attendance||={};b.attendance[`${oid}_${pid}`]=status;audit(s,`attendance_${bid}_${pid}_${oid}_${now}`,actor.id,'attendance.'+status,bid,now)}
export function processWaitlist(s:State,now:number){
 for(const b of record(s.bookings))if(b.state==='held'&&b.expiresAt<=now)b.state='expired';
 for(const w of record(s.waitlist))if(w.state==='offered'&&w.expiresAt<=now)w.state='expired';
 if(s.settings.waitPolicy==='unset')return;
 const blocked=new Set<string>();for(const w of record(s.waitlist).filter(w=>w.state==='waiting').sort((a,b)=>a.createdAt-b.createdAt||a.id.localeCompare(b.id))){const e=s.activities[w.activityId];if(!e||e.status!=='published'||w.occurrenceIds.some(id=>!e.occurrences.find(o=>o.id===id&&!o.cancelled&&Date.parse(o.bookingDeadline)>now))){w.state='expired';continue}if(blocked.has(e.id))continue;
 if(availability(s,e,w.occurrenceIds,now)<w.quantity){if(s.settings.waitPolicy==='strict')blocked.add(e.id);continue}
 w.state='offered';w.expiresAt=Math.min(now+s.settings.waitOfferMinutes*60000,...e.occurrences.filter(o=>w.occurrenceIds.includes(o.id)).map(o=>Date.parse(o.bookingDeadline)));
 job(s,{id:'offer_'+w.id,type:'wait-offer',waitId:w.id,recipientId:w.ownerId,channel:'email',dueAt:now});
 }
}
export function confirmPayment(s:State,bid:string,amount:number,reference:string,intent:string,now:number){if(s.processed[reference])return;const b=s.bookings[bid];if(!b)fail('not_found','Pagamento senza prenotazione.',404);if(amount!==b.totalCents||b.method!=='online')fail('amount','Importo o modalità non corrispondente.');
 const alreadyPaid=b.paidCents>0;
 s.ledger[reference]={id:reference,bookingId:bid,type:'activity',method:'online',amountCents:amount,createdAt:now,actorId:'stripe',reference};s.processed[reference]=true;
 if(alreadyPaid){b.refundDueCents+=amount;return}
 b.paidCents=amount;b.paymentIntent=intent;
 const event=s.activities[b.activityId];const eligible=event.status==='published'&&b.occurrenceIds.every(id=>event.occurrences.some(o=>o.id===id&&!o.cancelled&&Date.parse(o.startsAt)>now));
 if(b.state==='cancelled'||!eligible||availability(s,event,b.occurrenceIds,now,b.id)<b.participants.length){b.state='cancelled';b.refundDueCents=amount;return}
 b.state='confirmed';scheduleBooking(s,b,now);
}
