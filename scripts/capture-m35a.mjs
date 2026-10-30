import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),output=path.join(root,'artifacts','m35a');
const baseURL=process.env.M35_BASE_URL||'http://127.0.0.1:4174';let server,browser;
async function serverReady(){try{if((await fetch(baseURL)).ok)return;}catch{}server=spawn(process.execPath,[path.join(root,'node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port',new URL(baseURL).port,'--strictPort'],{cwd:root,windowsHide:true,stdio:'ignore'});for(let i=0;i<80;i++){try{if((await fetch(baseURL)).ok)return;}catch{}await new Promise(resolve=>setTimeout(resolve,100));}throw Error('Evidence server did not start');}
await fs.mkdir(output,{recursive:true});
try{
 await serverReady();browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'msedge',headless:true});const captures=[];
 for(const profile of [{name:'desktop',viewport:{width:1440,height:900}},{name:'mobile',viewport:{width:390,height:844}}]){
  const context=await browser.newContext({viewport:profile.viewport,deviceScaleFactor:1,isMobile:profile.name==='mobile',hasTouch:profile.name==='mobile'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
  await page.goto(baseURL);await page.waitForFunction(()=>document.querySelector('[data-testid="blueprint-viewport"]')?.getAttribute('data-scene-ready')==='true');
  const project=await page.evaluate(async()=>{const entry='/src/index.ts';return(await import(entry)).createDefaultProject();});
  const points=[['01-draw-start',0],['02-draw-mid',project.timeline.drawEnd/2],['03-draw-end',project.timeline.drawEnd],['04-extrude-mid',(project.timeline.drawEnd+project.timeline.extrudeEnd)/2],['05-reveal-start',project.timeline.extrudeEnd],['06-reveal-final',1]];
  for(const[name,progress]of points){
   await page.evaluate(progress=>{const journey=document.querySelector('[data-testid="journey"]'),shell=document.querySelector('.studio-shell');const top=journey.getBoundingClientRect().top+scrollY;window.scrollTo({top:top+progress*(journey.offsetHeight-shell.offsetHeight),behavior:'instant'});},progress);
   await page.waitForFunction(target=>{const v=document.querySelector('[data-testid="blueprint-viewport"]');return v?.getAttribute('data-progress')===v?.getAttribute('data-rendered-progress')&&Math.abs(Number(v?.getAttribute('data-progress'))-target)<.0005;},progress);
   const filename=profile.name+'-'+name+'.png';await page.screenshot({path:path.join(output,filename)});
   const state=await page.locator('[data-testid="blueprint-viewport"]').evaluate(view=>({...view.dataset}));captures.push({profile:profile.name,viewport:profile.viewport,name,progress,filename,state});
  }
  if(errors.length)throw Error('Browser errors: '+errors.join(' | '));await context.close();
 }
 await fs.writeFile(path.join(output,'captures.json'),JSON.stringify(captures,null,2));
 const sections=['desktop','mobile'].map(profile=>'<section><h2>'+profile+'</h2><div class="grid">'+captures.filter(c=>c.profile===profile).map(c=>'<figure><a href="'+c.filename+'"><img loading="lazy" src="'+c.filename+'" alt="'+c.name+'"></a><figcaption>'+c.name+' · p='+c.progress.toFixed(3)+'</figcaption></figure>').join('')+'</div><h3>Recorrido continuo y hold final</h3><video controls preload="metadata" poster="'+profile+'-video-01-draw-start.png" src="'+profile+'-journey.webm"></video></section>').join('');
 await fs.writeFile(path.join(output,'index.html'),'<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>M3.5-A · Evidencia visual</title><style>body{margin:32px;background:#f4f1e8;color:#262b25;font:16px/1.5 system-ui}main{max-width:1500px;margin:auto}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}figure{margin:0}img{max-width:100%;max-height:540px;display:block;border:1px solid #ccc}video{width:100%;max-height:760px;background:#161e22}h2{margin-top:48px}figcaption{font:12px/1.5 monospace;margin-top:8px}@media(max-width:750px){.grid{grid-template-columns:1fr 1fr}}</style><main><h1>M3.5-A · Storyboard y cámara</h1><p>12 capturas del playground y 2 vídeos WebM del canvas WebGL real. Grabación mediante scroll nativo, sin HUD, con tramo final de contemplación. El arnés retiene el framebuffer WebGL y añade una pista silenciosa local para conservar el reloj durante el hold; no utiliza micrófono ni sintetiza imágenes. Evidencia técnica; aprobación artística pendiente del usuario. Geometría y acabado provisionales de A.</p>'+sections+'<p>Datos: <a href="captures.json">capturas</a> · <a href="recordings.json">grabaciones</a>. No se mide GPU física ni móvil real.</p></main></html>');
 try {
  const thumbnails=JSON.parse(await fs.readFile(path.join(output,'video-thumbnails.json'),'utf8'));
  const html=await fs.readFile(path.join(output,'index.html'),'utf8');
  const frames='<section><h2>Fotogramas decodificados desde las grabaciones</h2><p>Estos PNG se extraen de los WebM, no de la escena en vivo.</p><div class="grid">'+thumbnails.map(frame=>'<figure><a href="'+frame.filename+'"><img loading="lazy" src="'+frame.filename+'" alt="'+frame.profile+' '+frame.name+'"></a><figcaption>'+frame.profile+' / '+frame.name+' · '+frame.time.toFixed(2)+' s</figcaption></figure>').join('')+'</div></section>';
  await fs.writeFile(path.join(output,'index.html'),html.replace('</main>',frames+'</main>'));
 } catch(error) { if(error.code!=='ENOENT')throw error; }
 console.log(JSON.stringify({captures:captures.length,gallery:path.join(output,'index.html')}));
}finally{await browser?.close();server?.kill();}
