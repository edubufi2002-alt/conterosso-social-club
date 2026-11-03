// Run on staging with ADC: node --env-file=.env.local --import tsx scripts/import-programme.ts
import {programmeActivities} from '../src/lib/programme';
import {transact} from '../src/lib/server/store';
async function main(){
 if(process.env.APP_MODE!=='firebase')throw new Error('Configurare un progetto Firebase di staging.');
 const programme=programmeActivities();
 const count=await transact(s=>{
  let added=0;
  for(const e of Object.values(programme)){
   if(s.activities[e.id])continue;
   // Only dates and descriptions are confirmed by the poster. An operator reviews before publication.
   s.activities[e.id]={...e,status:'draft',managers:[],sample:false,priceCents:0,
    occurrences:e.occurrences.map(o=>({...o,capacity:0}))};
   added++;
  }
  return added;
 });
 console.log('Bozze inserite:',count);
}
main().catch(()=>{console.error('Importazione non completata.');process.exitCode=1});
