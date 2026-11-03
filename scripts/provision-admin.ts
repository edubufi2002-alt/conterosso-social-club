/** Run in trusted staging/server environment with ADC and .env.local loaded.
 * JSON stdin: {email,name,surname,phone,cf,totpSecret}. Never pass secrets as arguments.
 */
import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {cfKey,encrypt,validCf,secret} from '../src/lib/server/crypto';
import {database,firebaseAuth,transact,state} from '../src/lib/server/store';
async function main(){
if(process.env.APP_MODE!=='firebase')throw new Error('Requires APP_MODE=firebase');
secret();secret('DATA_ENCRYPTION_KEY');
let raw='';for await(const chunk of process.stdin){raw+=chunk;if(raw.length>10000)throw new Error('Input too large')}
const d=z.object({email:z.email(),name:z.string().min(1),surname:z.string().min(1),phone:z.string(),cf:z.string().transform(s=>s.toUpperCase()).refine(validCf),totpSecret:z.string().regex(/^[A-Z2-7]{32,}$/)}).parse(JSON.parse(raw));
const current=await state();
if(Object.values(current.accounts).some(a=>a.role==='admin'))throw new Error('Initial administrator already exists; use controlled recovery procedure');
const uid=randomUUID(),key=cfKey(d.cf);
await firebaseAuth().createUser({uid,email:d.email.toLowerCase(),emailVerified:false});
await database().ref('authPrivate/mfa/'+uid).set({secret:encrypt(d.totpSecret),lastUsedStep:0});
await transact(s=>{
 if(Object.values(s.accounts).some(a=>a.role==='admin'||a.email===d.email.toLowerCase()||a.cfKey===key)||s.people[key])throw new Error('Account collision; inspect provisional Firebase user before retry');
 s.accounts[uid]={id:uid,email:d.email.toLowerCase(),name:d.name,surname:d.surname,phone:d.phone,cfKey:key,role:'admin',whatsapp:false};
 s.people[key]={id:key,name:d.name,surname:d.surname,cfCipher:encrypt(d.cf),membership:[]};
 s.audit[uid]={id:uid,actorId:'provisioning',action:'admin.provisioned',target:uid,at:Date.now()};
});
console.log('Initial administrator provisioned. Verify email OTP + authenticator before further configuration.');

}
main().catch(()=>{console.error('Provisioning failed; inspect server state before retry.');process.exitCode=1});
