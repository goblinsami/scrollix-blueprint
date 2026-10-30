import { addWebmDuration } from './webm-duration.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'artifacts', 'm35a');
const probe = process.argv.includes('--probe');
const baseURL = process.env.M35_BASE_URL || 'http://127.0.0.1:4174';
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
let server;
async function serverReady() {
  try { const response = await fetch(baseURL); if (response.ok) return; } catch {}
  server = spawn(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', new URL(baseURL).port, '--strictPort'], { cwd: root, windowsHide: true, stdio: 'ignore' });
  for(let i=0;i<80;i++) { try { const response = await fetch(baseURL); if(response.ok) return; } catch {} await wait(100); }
  throw new Error('Evidence server did not start');
}
async function record(page, durationMs, holdMs) {
  return page.evaluate(async ({durationMs, holdMs}) => {
    const canvas = document.querySelector('canvas[role="img"]');
    if (!(canvas instanceof HTMLCanvasElement) || !canvas.captureStream || !window.MediaRecorder) throw new Error('Canvas captureStream/MediaRecorder unavailable');
    const mimeType = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find(type => MediaRecorder.isTypeSupported(type));
    if(!mimeType) throw new Error('No local WebM recorder codec');
    const stream = canvas.captureStream(30);
    const track = stream.getVideoTracks()[0];
    // A silent local oscillator provides a continuous media clock during the final static hold.
    // No microphone API or speaker connection is used.
    const audioContext=new AudioContext();await audioContext.resume();
    const destination=audioContext.createMediaStreamDestination(),gain=audioContext.createGain(),oscillator=audioContext.createOscillator();
    gain.gain.value=0;oscillator.connect(gain);gain.connect(destination);oscillator.start();
    stream.addTrack(destination.stream.getAudioTracks()[0]);
    const chunks = []; const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 5_000_000 });
    const done = new Promise((resolve,reject) => { recorder.onstop = resolve; recorder.onerror = reject; });
    recorder.ondataavailable = event => { if(event.data.size) chunks.push(event.data); };
    const journey = document.querySelector('[data-testid="journey"]'), shell = document.querySelector('.studio-shell');
    if(!journey || !shell) throw new Error('Native scroll host not found');
    const top = journey.getBoundingClientRect().top + window.scrollY, distance = journey.offsetHeight - shell.offsetHeight;
    window.scrollTo({top,behavior:'instant'});
    const entry='/src/index.ts'; const {createDefaultProject}=await import(entry);
    const holdStart=createDefaultProject().camera.storyboard.holdStart;
    const frameTimes = []; let frameRequests = 0, last = performance.now();
    // Populate the live canvas track with an actual WebGL frame before recording.
    // A cleared/non-preserved WebGL buffer must never become the video's first frame.
    const settle=async y=>{window.scrollTo({top:y,behavior:'instant'});for(let i=0;i<4;i++)await new Promise(requestAnimationFrame);};
    await settle(top+2);await settle(top);if(typeof track.requestFrame==='function')track.requestFrame();
    await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);
    recorder.start(250);
    const started = performance.now();
    await new Promise(resolve => {
      function frame(now) {
        const elapsed = now-started;
        frameTimes.push(now-last); last=now;
        const progress=elapsed<=durationMs?holdStart*elapsed/durationMs:holdStart+(1-holdStart)*Math.min(1,(elapsed-durationMs)/holdMs);
        window.scrollTo({top: top+progress*distance,behavior:'instant'});
        if(typeof track.requestFrame === 'function') track.requestFrame();
        frameRequests++;
        if(elapsed < durationMs+holdMs) requestAnimationFrame(frame); else resolve();
      }
      requestAnimationFrame(frame);
    });
    await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
    recorder.stop(); await done; oscillator.stop();stream.getTracks().forEach(track => track.stop());await audioContext.close();
    const blob = new Blob(chunks,{type:mimeType});
    const buffer = new Uint8Array(await blob.arrayBuffer());
    let encoded=''; for(let i=0;i<buffer.length;i+=32768) encoded+=String.fromCharCode(...buffer.subarray(i,i+32768));
    const sorted = frameTimes.slice(1).sort((a,b)=>a-b);
    return { base64:btoa(encoded), mimeType, silentClockTrack:true, capturePreservesDrawingBuffer:true, bytes:buffer.length, width:canvas.width, height:canvas.height, frameRequests, durationRequestedMs:durationMs+holdMs, elapsedMs:performance.now()-started, frameTime:{mean:sorted.reduce((s,n)=>s+n,0)/sorted.length,p95:sorted[Math.floor(sorted.length*.95)],max:sorted.at(-1)}, finalProgress:document.querySelector('[data-testid="blueprint-viewport"]')?.getAttribute('data-progress') };
  },{durationMs,holdMs});
}
async function verifyVideo(page, base64, mimeType) {
  return page.evaluate(async ({base64,mimeType}) => {
    const bytes = Uint8Array.from(atob(base64), character => character.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes],{type:mimeType}));
    const video = document.createElement('video'); video.muted=true; video.preload='auto'; video.src=url; document.body.append(video);
    const loaded = new Promise((resolve,reject) => { video.onloadedmetadata=resolve; video.onerror=()=>reject(new Error('Recorded WebM cannot be decoded')); });
    await Promise.race([loaded,new Promise((_,reject)=>setTimeout(()=>reject(Error('Video metadata timeout')),8000))]);
    const initialDuration=video.duration;
    if(!Number.isFinite(video.duration)) {
      await new Promise((resolve,reject) => {
        const timeout=setTimeout(()=>reject(new Error('Could not resolve WebM duration')),8000);
        const finish=()=> { if(Number.isFinite(video.duration)) { clearTimeout(timeout); resolve(); } };
        video.addEventListener('durationchange',finish);video.addEventListener('seeked',finish);video.currentTime=1e9;
      });
    }
    const duration=video.duration; video.currentTime=0;
    await video.play();
    await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error('Recorded video did not play')),8000);function check(){if(video.currentTime>=Math.min(.15,duration/2)){clearTimeout(timeout);resolve();}else requestAnimationFrame(check);}check();});
    video.pause();
    const endTime=Math.max(0,duration-.3);await new Promise(resolve=>{video.onseeked=resolve;video.currentTime=endTime;});
    await new Promise(async(resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error('Recorded video did not reach ended')),4000);video.onended=()=>{clearTimeout(timeout);resolve();};try{await video.play();}catch(error){clearTimeout(timeout);reject(error);}});
    const result={duration,ended:video.ended,endedAt:video.currentTime,initialDuration:Number.isFinite(initialDuration)?initialDuration:'Infinity',width:video.videoWidth,height:video.videoHeight,decodedFrames:video.getVideoPlaybackQuality().totalVideoFrames,currentTime:video.currentTime};
    video.pause();video.remove();URL.revokeObjectURL(url);return result;
  },{base64,mimeType});
}
async function extractFrames(page, base64, mimeType, durationMs, holdMs) {
  return page.evaluate(async ({base64,mimeType,durationMs,holdMs})=>{
    const entry='/src/index.ts',project=(await import(entry)).createDefaultProject(),hold=project.camera.storyboard.holdStart;
    const points=[['01-draw-start',0],['02-draw-mid',project.timeline.drawEnd/2],['03-draw-end',project.timeline.drawEnd],['04-extrude-mid',(project.timeline.drawEnd+project.timeline.extrudeEnd)/2],['05-reveal-start',project.timeline.extrudeEnd],['06-reveal-final',1]];
    const bytes=Uint8Array.from(atob(base64),c=>c.charCodeAt(0)),url=URL.createObjectURL(new Blob([bytes],{type:mimeType})),video=document.createElement('video');video.muted=true;video.src=url;document.body.append(video);
    await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Thumbnail data timeout')),8000);video.onloadeddata=()=>{clearTimeout(timeout);resolve();};video.onerror=()=>{clearTimeout(timeout);reject(Error('Thumbnail decode failed'));};});

    // loadeddata can precede the first presented video bitmap when an audio clock starts at 0.
    // Seek to the first presentable 1 ms frame; this changes no encoded media.
    await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Initial video seek timeout')),8000);video.onseeked=()=>{clearTimeout(timeout);resolve();};video.currentTime=.001;});
    const canvas=document.createElement('canvas');canvas.width=video.videoWidth;canvas.height=video.videoHeight;const ctx=canvas.getContext('2d');if(!ctx)throw Error('Thumbnail 2D context unavailable');const frames=[];
    for(const[name,progress]of points){
      const target=Math.min(video.duration-.05,progress>=hold?(durationMs+holdMs*.95)/1000:durationMs*progress/hold/1000);
      if(Math.abs(video.currentTime-target)>.001)await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Video seek timeout')),8000);video.onseeked=()=>{clearTimeout(timeout);resolve();};video.currentTime=target;});
      ctx.drawImage(video,0,0);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;let total=0,samples=0;for(let i=0;i<pixels.length;i+=64){total+=(pixels[i]+pixels[i+1]+pixels[i+2])/3;samples++;}const meanLuma=total/samples;if(meanLuma<20)throw Error('Black decoded frame: '+name);frames.push({name,progress,time:video.currentTime,width:canvas.width,height:canvas.height,meanLuma,base64:canvas.toDataURL('image/png').split(',')[1]});
    }
    video.remove();URL.revokeObjectURL(url);return frames;
  },{base64,mimeType,durationMs,holdMs});
}
await fs.mkdir(output,{recursive:true});
let browser;
try {
  await serverReady();browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'msedge',headless:true});
  const profiles=probe?[{name:'probe',viewport:{width:640,height:480}}]:[{name:'desktop',viewport:{width:1440,height:900}},{name:'mobile',viewport:{width:390,height:844}}];
  const results=[],thumbnails=[];
  for(const profile of profiles){
    const context=await browser.newContext({viewport:profile.viewport,deviceScaleFactor:1,isMobile:profile.name==='mobile',hasTouch:profile.name==='mobile'});
    const page=await context.newPage();const errors=[];
    page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
    // Capture-only instrumentation: retain the renderer's actual framebuffer.
    // Scene, shaders, geometry and runtime are unchanged; no images are synthesized.
    await page.addInitScript(()=>{
      const original=HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext=function(kind,options){
        return original.call(this,kind,kind==='webgl'||kind==='webgl2'||kind==='experimental-webgl'?{...options,preserveDrawingBuffer:true}:options);
      };
    });
    await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
    await page.goto(baseURL);await page.waitForFunction(()=>{const v=document.querySelector('[data-testid="blueprint-viewport"]');return v?.getAttribute('data-scene-ready')==='true'&&v?.getAttribute('data-progress')===v?.getAttribute('data-rendered-progress');});
    await page.getByRole('button',{name:'Inicio',exact:true}).click();
    const recording=await record(page,probe?1800:18000,probe?600:2200);
    const rawPlayback=await verifyVideo(page,recording.base64,recording.mimeType);
    const encoded=addWebmDuration(Buffer.from(recording.base64,'base64'),rawPlayback.duration);
    recording.base64=encoded.toString('base64'); recording.bytes=encoded.length;
    const playback=await verifyVideo(page,recording.base64,recording.mimeType);
    if(errors.length)throw new Error('Browser errors: '+errors.join(' | '));
    if(recording.bytes<1000||playback.decodedFrames<2||!Number.isFinite(playback.duration)||playback.duration<(probe?2.1:19.8)){ console.log(JSON.stringify({profile:profile.name,bytes:recording.bytes,elapsedMs:recording.elapsedMs,rawPlayback,playback})); await fs.writeFile(path.join(output,profile.name+'-candidate.webm'),Buffer.from(recording.base64,'base64')); throw new Error('Recording verification failed'); }
    await fs.writeFile(path.join(output,profile.name+'-journey.webm'),Buffer.from(recording.base64,'base64'));
    {
      const frames=await extractFrames(page,recording.base64,recording.mimeType,probe?1800:18000,probe?600:2200);
      for(const frame of frames){const filename=profile.name+'-video-'+frame.name+'.png';await fs.writeFile(path.join(output,filename),Buffer.from(frame.base64,'base64'));delete frame.base64;thumbnails.push({profile:profile.name,filename,...frame});}
    }
    delete recording.base64;
    const result={profile:profile.name,viewport:profile.viewport,...recording,playback,errors};results.push(result);
    await fs.writeFile(path.join(output,profile.name+'-recording.json'),JSON.stringify(result,null,2));
    console.log(JSON.stringify(result));await context.close();
  }
  await fs.writeFile(path.join(output,probe?'probe-result.json':'recordings.json'),JSON.stringify(results,null,2));
  if(!probe)await fs.writeFile(path.join(output,'video-thumbnails.json'),JSON.stringify(thumbnails,null,2));
}finally{await browser?.close();if(server)server.kill();}
