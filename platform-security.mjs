import {randomBytes,scryptSync,timingSafeEqual,createHash,createCipheriv,createDecipheriv} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname} from 'node:path';
export const fail=(message,status=400)=>Object.assign(new Error(message),{status});
export const digest=value=>createHash('sha256').update(String(value)).digest('hex');
export const token=()=>randomBytes(32).toString('hex');
export const hashPassword=value=>{const salt=randomBytes(16).toString('hex');return salt+':'+scryptSync(value,salt,64).toString('hex');};
export function checkPassword(value,encoded){try{const[salt,hash]=encoded.split(':');const expected=Buffer.from(hash,'hex'),actual=scryptSync(value,salt,64);return expected.length===actual.length&&timingSafeEqual(expected,actual);}catch{return false;}}
export function password(value){if(typeof value!=='string'||value.length<10||value.length>200)throw fail('Use uma senha de 10 a 200 caracteres.');return value;}
export function email(value){const result=String(value||'').trim().toLowerCase();if(result.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result))throw fail('Informe um e-mail válido.');return result;}
export function textField(value,max=120,required=true){if(typeof value!=='string'||value.trim().length>max||(required&&!value.trim()))throw fail('Preencha os campos com textos válidos.');return value.trim();}
export async function readJSON(req){let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>128000)throw fail('Requisição muito grande.',413);}try{const data=JSON.parse(body||'{}');if(!data||typeof data!=='object'||Array.isArray(data))throw Error();return data;}catch{throw fail('JSON inválido.');}}
export const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
export async function createVault({key,keyPath}){
 if(!key){await mkdir(dirname(keyPath),{recursive:true,mode:0o700});try{key=await readFile(keyPath,'utf8');}catch(error){if(error.code!=='ENOENT')throw error;const generated=randomBytes(32).toString('hex');try{await writeFile(keyPath,generated,{flag:'wx',mode:0o600});key=generated;}catch(e){if(e.code!=='EEXIST')throw e;key=await readFile(keyPath,'utf8');}}}
 if(!/^[a-f0-9]{64}$/i.test(key.trim()))throw fail('PLATFORM_ENCRYPTION_KEY deve conter 64 caracteres hexadecimais.');
 const bytes=Buffer.from(key.trim(),'hex');
 return {seal(value,scope){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',bytes,iv);cipher.setAAD(Buffer.from(scope));const encrypted=Buffer.concat([cipher.update(JSON.stringify(value)),cipher.final()]);return [iv,cipher.getAuthTag(),encrypted].map(x=>x.toString('base64')).join('.');},open(value,scope){try{const[iv,tag,encrypted]=value.split('.').map(x=>Buffer.from(x,'base64')),cipher=createDecipheriv('aes-256-gcm',bytes,iv);cipher.setAAD(Buffer.from(scope));cipher.setAuthTag(tag);return JSON.parse(Buffer.concat([cipher.update(encrypted),cipher.final()]).toString());}catch{throw fail('Não foi possível abrir as credenciais. Confira a chave de criptografia do servidor.',503);}}};
}
export function secureHeaders(res){res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');res.setHeader('Content-Security-Policy',"default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");}
export function assertOrigin(req){if(req.headers.origin&&!['http://'+req.headers.host,'https://'+req.headers.host].includes(req.headers.origin))throw fail('Origem não autorizada.',403);if(req.headers['sec-fetch-site']==='cross-site')throw fail('Origem não autorizada.',403);}
