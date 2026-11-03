import test from 'node:test';
import assert from 'node:assert/strict';
import {makeDemo} from '../demo/browser-api';
import {buildCatalogue,serveCatalogue} from '../src/lib/catalogue';
import {availability} from '../src/lib/domain';
const now=Date.parse('2026-11-03T12:00:00Z');
test('il calendario mantiene i posti corretti prima e dopo la scadenza senza altre scritture',()=>{
 const s=makeDemo(now);const original=s.bookings['demo-jazz'];
 s.bookings.hold={...original,id:'hold',state:'held',expiresAt:now+100};
 s.waitlist.offer={id:'offer',ownerId:'user',activityId:'jazz',occurrenceIds:original.occurrenceIds,participants:original.participants,quantity:2,state:'offered',expiresAt:now+200,createdAt:now};
 const view=buildCatalogue(s,now);
 for(const t of [now,now+100,now+200]){
  const data=serveCatalogue(view,t);
  for(const event of data.activities)for(const o of event.occurrences)
   assert.equal(o.remaining,availability(s,s.activities[event.id],[o.id],t));
 }
});
test('il catalogo esclude bozze e dati dei partecipanti',()=>{
 const s=makeDemo(now);s.activities.jazz.status='draft';
 const data=buildCatalogue(s,now);
 assert.ok(!data.activities.some(e=>e.id==='jazz'));
 for(const forbidden of ['DEMO-UTENTE','example.test','cfCipher','participants','staffRecipients','demo-jazz'])assert.ok(!JSON.stringify(data).includes(forbidden));
});
test('11 attività del programma con identificativi distinti e quattro date concluse al 3 novembre',()=>{
 const s=makeDemo(now),events=Object.values(s.activities).filter(e=>e.id.startsWith('programma-'));
 assert.equal(events.length,11);assert.equal(events.filter(e=>e.status==='concluded').length,4);
 assert.equal(events.filter(e=>e.title.includes('Viator')).length,2);
});
