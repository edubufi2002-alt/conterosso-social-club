import {build} from 'esbuild';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const result=await build({entryPoints:['demo/main.tsx'],bundle:true,platform:'browser',format:'iife',write:false,minify:true,define:{'process.env.NEXT_PUBLIC_PRESENTATION_DEMO':'"true"','process.env.NODE_ENV':'"production"'},alias:{exceljs:'exceljs/dist/exceljs.min.js'}});
const css=(await readFile('src/app/globals.css','utf8')).replace(/@import[^;]+(?:;[^)]*\))?[^;]*;/,'');
const toolbar='.presenter{display:flex;justify-content:center;align-items:center;gap:8px;flex-wrap:wrap;padding:8px;background:#43212a;color:white;font:13px system-ui}.presenter strong{letter-spacing:.12em;margin-right:12px}.presenter button{background:#fff7eb;color:#532835;border:0;border-radius:20px;padding:5px 12px;cursor:pointer}';
await mkdir('public',{recursive:true});
await writeFile('public/Conterosso-Demo.html','<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Conterosso Social Club · Demo</title><style>'+css+toolbar+'</style><body><div id="app"></div><script>'+result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script')+'</script></body></html>');
