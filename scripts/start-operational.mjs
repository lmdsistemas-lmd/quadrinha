import {createApp} from '../server.mjs';
import {fileURLToPath} from 'node:url';

const server=await createApp({databasePath:process.env.QF_DATABASE_PATH||fileURLToPath(new URL('../data/operacional.sqlite',import.meta.url)),operationalMode:true});
const port=Number(process.env.PORT||3000);
server.listen(port,process.env.HOST||'127.0.0.1',()=>console.log(`Aplicação operacional iniciada na porta ${port}.`));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
