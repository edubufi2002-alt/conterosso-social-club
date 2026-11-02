import {spawn} from 'node:child_process';
const args=process.argv.slice(2),port=args.indexOf('--port');
const child=spawn(process.execPath,['node_modules/next/dist/bin/next',...(args.includes('--strictPort')?['start']:['dev','--webpack']),'--hostname','0.0.0.0','--port',port>=0?args[port+1]:'3000'],{stdio:'inherit'});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
child.on('exit',code=>process.exit(code??1));
