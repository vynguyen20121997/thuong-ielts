"use client";
import { useEffect, useRef, useState } from 'react';
const clock=(n:number)=>`${Math.floor(n/60)}:${String(Math.floor(n%60)).padStart(2,'0')}`;
export default function AudioPlayer({id,index,initial,done,review,disabled,onReady,onProgress,onIssue}: {id:string;index:number;initial:number;done:boolean;review:boolean;disabled:boolean;onReady:(i:number,ready:boolean)=>void;onProgress:(i:number,seconds:number,ended:boolean)=>void;onIssue:(message:string)=>void}) {
  const audio=useRef<HTMLAudioElement>(null);const position=useRef(initial);const initialized=useRef(false);
  const [playing,setPlaying]=useState(false),[current,setCurrent]=useState(initial),[duration,setDuration]=useState(0),[error,setError]=useState(false);
  useEffect(()=>{if(disabled)audio.current?.pause();},[disabled]);
  useEffect(()=>{position.current=Math.max(position.current,initial);},[initial]);
  useEffect(()=>{const stop=(event:Event)=>{if((event as CustomEvent).detail!==index)audio.current?.pause();};window.addEventListener('diagnostic-audio',stop);return()=>window.removeEventListener('diagnostic-audio',stop);},[index]);
  async function toggle(){const el=audio.current;if(!el)return;if(playing){el.pause();return;}window.dispatchEvent(new CustomEvent('diagnostic-audio',{detail:index}));try{await el.play();}catch{setError(true);onIssue(`Không phát được audio ${index+1}`);}}
  return <div className="diag-audio">
    <audio ref={audio} preload="auto" src={`/api/practice/listening/audio/${id}`} onLoadedMetadata={()=>{const el=audio.current!;setDuration(el.duration);if(!initialized.current){el.currentTime=Math.min(position.current,el.duration);initialized.current=true;}}} onCanPlay={()=>{setError(false);onReady(index,true);}} onError={()=>{setError(true);onReady(index,false);onIssue(`Lỗi tải audio ${index+1}`);}} onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onRateChange={()=>{if(!review&&audio.current)audio.current.playbackRate=1;}} onTimeUpdate={()=>{const el=audio.current!;position.current=el.currentTime;setCurrent(el.currentTime);onProgress(index,el.currentTime,el.ended);}} onEnded={()=>{setPlaying(false);onProgress(index,duration,true);}} />
    <div className="flex flex-wrap items-center gap-3"><span className="font-semibold">{index===0?'Part 1 · Hotel Reservation':'Part 2 · Research Project'}</span><span className="ml-auto font-mono text-xs">{clock(current)} / {clock(duration)}</span></div>
    <div className="mt-2 flex items-center gap-3"><button type="button" className="diag-secondary" disabled={disabled||(!review&&done)||error||!duration} onClick={toggle}>{done&&!review?'Đã nghe hết':playing?'Tạm dừng':'Phát audio'}</button><progress aria-label={`Tiến độ audio ${index+1}`} max={duration||1} value={current} className="min-w-0 flex-1 accent-brand"/><label className="flex items-center gap-1 text-xs">Âm lượng<input type="range" aria-label={`Âm lượng audio ${index+1}`} min="0" max="1" step="0.1" defaultValue="1" className="w-16 accent-brand" onChange={e=>{if(audio.current)audio.current.volume=Number(e.target.value);}}/></label></div>
    {review&&<input className="mt-2 w-full" aria-label={`Tua audio ${index+1}`} type="range" min="0" max={duration||1} value={current} onChange={e=>{if(audio.current)audio.current.currentTime=Number(e.target.value);}}/>}
    {error&&<p role="alert" className="mt-2 text-sm text-red-800">Chưa tải được audio. <button className="underline" onClick={()=>{initialized.current=false;audio.current?.load();}}>Thử tải lại từ vị trí đã nghe</button></p>}
  </div>;
}
