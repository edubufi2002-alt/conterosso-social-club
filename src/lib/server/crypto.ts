import {createCipheriv,createDecipheriv,createHash,createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
import {fail} from '../model';
export const demo=()=>process.env.APP_MODE==='demo';
export function secret(name='AUTH_SECRET'){const v=process.env[name];if(v&&v.length>=32)return v;if(demo())return 'LOCAL-DEMO-ONLY-DO-NOT-USE-IN-PRODUCTION-'+name;return fail('configuration',`Configurazione server incompleta (${name}).`,503)}
export const hash=(v:string)=>createHash('sha256').update(v).digest('hex');
export const digest=(v:string)=>createHmac('sha256',secret()).update(v).digest('hex');
export const cfKey=(v:string)=>digest('cf:'+v.trim().toUpperCase());
export function encrypt(v:string){const iv=randomBytes(12),key=createHash('sha256').update(secret('DATA_ENCRYPTION_KEY')).digest(),c=createCipheriv('aes-256-gcm',key,iv);return [iv.toString('base64'),c.update(v,'utf8','base64')+c.final('base64'),c.getAuthTag().toString('base64')].join('.')}
export function decrypt(v:string){const [iv,data,tag]=v.split('.');const c=createDecipheriv('aes-256-gcm',createHash('sha256').update(secret('DATA_ENCRYPTION_KEY')).digest(),Buffer.from(iv,'base64'));c.setAuthTag(Buffer.from(tag,'base64'));return c.update(data,'base64','utf8')+c.final('utf8')}
export function equal(a:string,b:string){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y)}
export function validCf(cf:string){cf=cf.trim().toUpperCase();if(!/^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/.test(cf))return false;return checksum(cf.slice(0,15))===cf[15]}
export function checksum(base:string){const odd=[1,0,5,7,9,13,15,17,19,21,2,4,18,20,11,3,6,8,12,14,16,10,22,25,24,23];let sum=0;for(let i=0;i<15;i++){const n=/\d/.test(base[i])?Number(base[i]):base.charCodeAt(i)-65;sum+=i%2===0?odd[n]:n}return String.fromCharCode(65+sum%26)}
export const testCf=(i:number)=>{const b=`TSTDMO90A01H${String(i).padStart(3,'0')}`;return b+checksum(b)};
export function totpValid(base32:string,code:string,now=Date.now()){if(!/^\d{6}$/.test(code))return false;const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';let bits='';for(const c of base32.toUpperCase().replace(/=+$/,'')){const v=alphabet.indexOf(c);if(v<0)return false;bits+=v.toString(2).padStart(5,'0')}const key=Buffer.from((bits.match(/.{8}/g)||[]).map(b=>parseInt(b,2)));for(const offset of [-1,0,1]){const buffer=Buffer.alloc(8);buffer.writeBigUInt64BE(BigInt(Math.floor(now/30000)+offset));const h=createHmac('sha1',key).update(buffer).digest();const n=h.readUInt32BE(h[19]&15)&0x7fffffff;if(equal(String(n%1000000).padStart(6,'0'),code))return true}return false}
