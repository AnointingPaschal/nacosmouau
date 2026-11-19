import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, BadgeCheck } from 'lucide-react';
import { useEffect, useRef, useState, type TouchEvent } from 'react';
import { Link } from 'react-router-dom';
import type { HeroSlide } from '../types/content';
import { LoadingState } from './States';
const welcome: HeroSlide = { id:'welcome', image_url:null, badge:'MOUAU CHAPTER · 2025/2026', title:'Computing minds.\nOne community.', subtitle:'A digital home for NACOS students at Michael Okpara University of Agriculture, Umudike.', primary_cta_text:'Become a member', primary_cta_link:'/register', secondary_cta_text:'Verify membership', secondary_cta_link:'/verify', display_order:0, is_active:true };
function Action({href,children,secondary=false}:{href:string;children:string;secondary?:boolean}) { return href.startsWith('http') ? <a className={`hero-action ${secondary?'outline':''}`} href={href} target="_blank" rel="noreferrer">{children}<ArrowRight size={16}/></a> : <Link className={`hero-action ${secondary?'outline':''}`} to={href||'/register'}>{children}<ArrowRight size={16}/></Link>; }
export function HeroSlider({slides,isLoading=false}:{slides?:HeroSlide[];isLoading?:boolean}) {
  const published = (slides ?? []).filter(s=>s.is_active).sort((a,b)=>a.display_order-b.display_order);
  const slidesToShow = published.length ? published : [welcome];
  const [index,setIndex] = useState(0); const reduced = useReducedMotion(); const touch = useRef<number|null>(null);
  useEffect(()=>{setIndex(0)},[slidesToShow.length]);
  useEffect(()=>{if(slidesToShow.length<2||reduced)return;const timer=window.setInterval(()=>setIndex(i=>(i+1)%slidesToShow.length),6500);return()=>window.clearInterval(timer)},[slidesToShow.length,reduced]);
  const move=(step:number)=>setIndex(i=>(i+step+slidesToShow.length)%slidesToShow.length);
  const onTouchStart=(e:TouchEvent)=>{touch.current=e.touches[0]?.clientX??null};
  const onTouchEnd=(e:TouchEvent)=>{if(touch.current===null)return;const delta=e.changedTouches[0]?.clientX-touch.current;if(Math.abs(delta)>45)move(delta<0?1:-1);touch.current=null};
  if(isLoading && !slides?.length) return <section className="hero-slider"><div className="hero-skeleton"><LoadingState label="Loading chapter welcome…"/></div></section>;
  const slide=slidesToShow[index]??welcome;
  return <section className="hero-slider" aria-roledescription="carousel" aria-label="NACOS MOUAU highlights" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
    {slide.image_url ? <div className="hero-photo" style={{backgroundImage:`linear-gradient(90deg,rgba(4,12,9,.88),rgba(4,12,9,.65) 54%,rgba(0,135,81,.35)),url("${slide.image_url.replaceAll('"','%22')}")`}}/> : <div className="hero-geometric"><div className="geometry-ring gr1"/><div className="geometry-ring gr2"/><div className="geometry-block gb1"/><div className="geometry-block gb2"/><div className="geometry-grid"/></div>}
    <div className="hero-shade"/><AnimatePresence mode="wait"><motion.div key={slide.id} className="hero-copy" initial={reduced?false:{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={reduced?undefined:{opacity:0,y:-8}} transition={{duration:.45}}>
      {slide.badge&&<div className="hero-badge"><BadgeCheck size={14}/>{slide.badge}</div>}<h1>{slide.title.split('\n').map((line,i)=><span key={`${slide.id}-${i}`}>{line}{i<slide.title.split('\n').length-1&&<br/>}</span>)}</h1><p>{slide.subtitle}</p><div className="hero-actions">{slide.primary_cta_text&&<Action href={slide.primary_cta_link||'/register'}>{slide.primary_cta_text}</Action>}{slide.secondary_cta_text&&<Action secondary href={slide.secondary_cta_link||'/verify'}>{slide.secondary_cta_text}</Action>}</div>
    </motion.div></AnimatePresence>
    {slidesToShow.length>1&&<><button className="slider-arrow slider-prev" onClick={()=>move(-1)} aria-label="Previous slide"><ArrowLeft/></button><button className="slider-arrow slider-next" onClick={()=>move(1)} aria-label="Next slide"><ArrowRight/></button><div className="slider-dots" role="tablist" aria-label="Choose slide">{slidesToShow.map((s,i)=><button key={s.id} className={i===index?'active':''} aria-label={`Show slide ${i+1}`} aria-selected={i===index} onClick={()=>setIndex(i)}/>)}</div></>}
  </section>;
}
