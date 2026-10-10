import {pipeline,env} from './vendor/speech/transformers.min.mjs';
env.allowLocalModels=false;
env.backends.onnx.wasm.numThreads=1;
env.backends.onnx.wasm.wasmPaths=new URL('./vendor/speech/',self.location.href).href;
let ready=null;
function transcriber(){return ready ||= pipeline('automatic-speech-recognition','Xenova/whisper-tiny',{device:'wasm',dtype:'q8',progress_callback:p=>{if(p.status==='progress')self.postMessage({kind:'progress',percent:Math.round(p.progress||0)});else if(p.status==='ready')self.postMessage({kind:'ready'})}}).catch(error=>{ready=null;throw error})}
self.onmessage=async({data})=>{try{const model=await transcriber();if(data.kind==='warm'){self.postMessage({kind:'ready'});return}const result=await model(data.audio,{chunk_length_s:30,stride_length_s:5,task:'transcribe',return_timestamps:false});self.postMessage({kind:'result',id:data.id,text:result.text.trim()})}catch(error){self.postMessage({kind:'error',id:data.id,message:error.message||'Speech recognition unavailable'})}};
