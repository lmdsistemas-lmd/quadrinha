import {DatabaseSync} from 'node:sqlite';
import {mkdir,link,rm,access} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createApp} from '../server.mjs';

// A new database is created; the source database and business records are never changed.
export async function createOperationalDatabase({source,destination}){
 source=resolve(source);destination=resolve(destination);
 if(source===destination)throw new Error('O banco operacional deve ter um caminho diferente do banco atual.');
 try{await access(destination);throw new Error('O banco de destino já existe. Nenhum arquivo foi substituído.');}catch(error){if(error.code!=='ENOENT')throw error;}
 let accounts=[];
 try{await access(source);const db=new DatabaseSync(source,{readOnly:true});try{accounts=db.prepare('SELECT * FROM users').all();}finally{db.close();}}catch(error){if(error.code!=='ENOENT')throw error;}
 await mkdir(dirname(destination),{recursive:true});
 const temporary=destination+'.prepare-'+randomUUID();
 try{
  const server=await createApp({databasePath:temporary,operationalMode:true});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));await new Promise(resolve=>server.close(resolve));
  const db=new DatabaseSync(temporary);
  try{
   db.exec('BEGIN IMMEDIATE');
   const insert=db.prepare('INSERT INTO users(id,name,email,password,role,created_at,last_login) VALUES(?,?,?,?,?,?,?)');
   for(const account of accounts)insert.run(account.id,account.name,account.email,account.password,account.role,account.created_at||null,account.last_login||null);
   db.prepare('INSERT OR REPLACE INTO settings VALUES(?,?)').run('deployment','"operational"');
   db.prepare('INSERT OR REPLACE INTO settings VALUES(?,?)').run('demo','false');
   db.exec('COMMIT');
  }finally{db.close();}
  // link() fails atomically if another process has already created the destination.
  await link(temporary,destination);
  return {accounts:accounts.length,destination};
 }finally{for(const suffix of ['','-wal','-shm'])await rm(temporary+suffix,{force:true});}
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const root=fileURLToPath(new URL('../',import.meta.url));
 const result=await createOperationalDatabase({source:process.argv[2]||resolve(root,'data/quadrafacil.sqlite'),destination:process.argv[3]||resolve(root,'data/operacional.sqlite')});
 console.log(`Banco operacional criado. ${result.accounts} conta(s) de acesso preservada(s). Nenhum cadastro ou lançamento fictício foi copiado.`);
 console.log('Inicie com npm run start:operational. O banco anterior foi preservado.');
}
