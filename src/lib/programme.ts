import type {Activity} from './model';
import {club} from './content';
const listings = [
  ['11 ottobre', 'Bene Benni', 'Un omaggio a Stefano Benni tra teatro, scrittura, musica e poesia.'],
  ['17 ottobre', 'Like a Rolling Stones', 'Mauro Stallone, con chitarra e racconti, segue gli intrecci fra Bob Dylan, Beatles e Rolling Stones.'],
  ['24 ottobre', 'Cantar poetando', 'Rime, strambotti e quartine incontrano il jazz e le ballate folk.'],
  ['31 ottobre', 'The Bump', 'Vince Abbracciante, Dado Penta e Antonio Di Lorenzo tra jazz urbano, shakebeat e brasil-jazz.'],
  ['7 novembre', 'The Buonamico’s Band', 'Dal Messico, rock, cumbia, soul e funk.'],
  ['14 novembre', 'Vento d’incanto', 'Adriana Polo e Roberto Gagliardi in uno spettacolo per voce, sax e altri strumenti.'],
  ['21 novembre', 'Tukuru', 'Africa e Mediterraneo si incontrano nel desert blues, nell’afrobeat e nel funk.'],
  ['29 novembre', 'Festival Viator · XII edizione', 'Menti, cuori e corpi sulle vie francigene del Sud, a cura di Giovannangelo de Gennaro.'],
  ['7 dicembre', 'Fabrizio Mandara', 'Un viaggio nella canzone napoletana classica, per voce e chitarra.'],
  ['13 dicembre', 'Festival Viator · XII edizione', 'Seconda data in calendario della rassegna sulle vie francigene del Sud.'],
  ['19 dicembre', 'Dirty Trainload', '«An unsolicited delivery of dissident blues», con chitarra, armonica, basso, theremin e batteria.'],
];

/** The poster specifies dates only. Operational values below are simulation fixtures. */
export function programmeActivities(now=Date.now()):Record<string,Activity>{
 const months:Record<string,string>={ottobre:'10',novembre:'11',dicembre:'12'};
 const today=new Date(now).toLocaleDateString('sv-SE',{timeZone:'Europe/Rome'});
 return Object.fromEntries(listings.map(([label,title,description],index)=>{
  const [day,month]=label.split(' ');
  const date='2026-'+months[month]+'-'+day.padStart(2,'0');
  const id='programma-'+date;
  const start=Date.parse(date+'T20:30:00'+(date<'2026-10-25'?'+02:00':'+01:00'));
  const iso=(offset:number)=>new Date(start+offset).toISOString();
  const event:Activity={id,title,description,category:index===0?'Teatro':'Musica',cover:index===0?'words':'music',location:club.address,status:date<today?'concluded':'published',priceCents:1000,cyclePriceCents:null,methods:['onsite'],managers:['manager'],version:1,refundPercent:100,sample:true,occurrences:[{id:id+'-1',startsAt:iso(0),endsAt:iso(7200000),capacity:80,bookingDeadline:iso(-1800000),cancellationDeadline:iso(-86400000)}]};
  return [id,event];
 }));
}
export function installProgramme(activities:Record<string,Activity>,now=Date.now()){
 for(const [id,event] of Object.entries(programmeActivities(now))) activities[id]??=event;
}
