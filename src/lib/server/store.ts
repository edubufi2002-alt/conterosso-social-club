import {buildCatalogue,serveCatalogue} from '../catalogue';
import {initializeApp,getApps,applicationDefault} from 'firebase-admin/app';import {getDatabase} from 'firebase-admin/database';import {getAuth} from 'firebase-admin/auth';import {readFile,mkdir,writeFile,rename} from 'node:fs/promises';import {State,normalizeState,fail} from '../model';import {demo} from './crypto';import {emptyState,seedDemo} from './seed';
export function adminApp(){if(process.env.APP_MODE!=='firebase')return fail('configuration','Firebase non è configurato per questo ambiente.',503);if(!getApps().length)initializeApp({credential:applicationDefault(),projectId:process.env.FIREBASE_PROJECT_ID,databaseURL:process.env.FIREBASE_DATABASE_URL});return getApps()[0]}
export const firebaseAuth=()=>getAuth(adminApp());
export const database=()=>getDatabase(adminApp());
const localPath=process.env.DEMO_DATA_PATH||'.data/demo.json';
const g=globalThis as typeof globalThis & {clubQueue?:Promise<unknown>};
async function localRead(){try{return JSON.parse(await readFile(/* turbopackIgnore: true */ localPath,'utf8')) as State}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;return seedDemo()}}
export async function state():Promise<State>{if(demo())return normalizeState(await localRead());if(process.env.APP_MODE!=='firebase')return emptyState();return normalizeState((await database().ref('club').get()).val()||emptyState())}
export async function transact<T>(fn:(s:State)=>T):Promise<T>{if(demo()){let resolve!:(v:T)=>void,reject!:(e:unknown)=>void;const response=new Promise<T>((a,b)=>{resolve=a;reject=b});g.clubQueue=(g.clubQueue||Promise.resolve()).catch(()=>{}).then(async()=>{try{const s=normalizeState(await localRead());const result=fn(s);await mkdir('.data',{recursive:true});await writeFile(localPath+'.tmp',JSON.stringify(s));await rename(localPath+'.tmp',localPath);resolve(result)}catch(e){reject(e)}});return response}
 if(process.env.APP_MODE!=='firebase')return fail('configuration','Configurazione Firebase necessaria.',503);
 let result:T|undefined,error:unknown;const tx=await database().ref('club').transaction(raw=>{try{const s=normalizeState(raw||emptyState());result=fn(s);error=undefined;return JSON.parse(JSON.stringify({...s,catalogueV1:buildCatalogue(s,Date.now())}))}catch(e){error=e;return}},undefined,false);if(!tx.committed){if(error)throw error;return fail('conflict','Operazione concorrente: riprova.',409)}return result as T;
}
// Auth counters/challenges use their own transactions; never expose this namespace to clients.
export async function authTransaction<T>(key:string,fn:(v:any)=>{value:any;result:T}):Promise<T>{let result:T|undefined;let error:unknown;const tx=await database().ref('authPrivate/'+key).transaction(v=>{try{const out=fn(v);result=out.result;error=undefined;return out.value}catch(e){error=e;return}},undefined,false);if(!tx.committed){if(error)throw error;throw new Error('Auth transaction aborted')}return result as T}

export async function readAccount(id:string){
 if(process.env.APP_MODE!=='firebase')return (await state()).accounts[id];
 return (await database().ref('club/accounts').child(id).get()).val();
}
export async function readCatalogue(){
 const now=Date.now();
 if(process.env.APP_MODE!=='firebase')return serveCatalogue(buildCatalogue(await state(),now),now);
 const root=database().ref('club');
 const cached=(await root.child('catalogueV1').get()).val();
 if(cached?.version===1)return serveCatalogue(cached,Date.now());
 // Backfill through a transaction so a concurrent booking cannot publish older availability.
 await root.get();
 const tx=await root.transaction(raw=>{
  if(raw?.catalogueV1?.version===1)return raw;
  const s=normalizeState(raw||emptyState());
  return JSON.parse(JSON.stringify({...s,catalogueV1:buildCatalogue(s,Date.now())}));
 },undefined,false);
 return serveCatalogue(tx.snapshot.child('catalogueV1').val(),Date.now());
}
