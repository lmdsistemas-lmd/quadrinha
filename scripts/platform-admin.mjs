import {createInterface} from 'node:readline';
import {stdin,stdout} from 'node:process';
import {createPlatformStore} from '../platform-store.mjs';
import {resolve} from 'node:path';
if(!stdin.isTTY){console.error('Execute em um terminal interativo para cadastrar o administrador com a senha oculta.');process.exit(1);}
const rl=createInterface({input:stdin,output:stdout});const ask=prompt=>new Promise(resolve=>rl.question(prompt,resolve));let hidden=false;const original=rl._writeToOutput.bind(rl);rl._writeToOutput=value=>{if(!hidden)original(value);};
let store;try{const name=await ask('Nome do proprietário: '),email=await ask('E-mail de administração: ');stdout.write('Senha (mínimo de 10 caracteres; entrada oculta): ');hidden=true;const password=await ask('');hidden=false;stdout.write('\n');store=await createPlatformStore({dataDirectory:resolve(process.env.PLATFORM_DATA_DIR||'data/platform'),encryptionKey:process.env.PLATFORM_ENCRYPTION_KEY,publicUrl:process.env.APP_PUBLIC_URL||''});store.initializeAdmin({name,email,password});console.log('Administrador criado. Entre pela rota /admin com o e-mail e a senha informados.');}catch(error){console.error(error.status?error.message:'Não foi possível criar o administrador. Confira o diretório e a configuração.');process.exitCode=1;}finally{rl.close();store?.close();}
