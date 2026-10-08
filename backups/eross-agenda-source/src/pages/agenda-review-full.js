import {useEffect} from "react";
import AgendaReviewFullBase from "./agenda-review-full-base";

export default function AgendaReviewFull(){
  useEffect(()=>{
    let raf=0;
    const syncSelectedMonthDay=()=>{
      cancelAnimationFrame(raf);
      raf=requestAnimationFrame(()=>{
        const selected=document.querySelector(".ar-mini span.today");
        const day=selected?.textContent?.trim();
        const cells=[...document.querySelectorAll(".ar-monthday")];
        cells.forEach(cell=>cell.classList.remove("ar-month-selected"));
        if(!day||!cells.length)return;
        const match=cells.find(cell=>cell.querySelector(".ar-date")?.textContent?.trim()===day);
        if(match)match.classList.add("ar-month-selected");
      });
    };
    const onClick=(e)=>{
      const miniDay=e.target.closest?.(".ar-mini span");
      if(miniDay && miniDay.textContent.trim() && !miniDay.classList.contains("blank")){
        setTimeout(syncSelectedMonthDay,0);
        return;
      }
      const btn=e.target.closest?.(".ar-btn");
      if(btn && ["Mes","‹","›","Hoy"].includes(btn.textContent.trim())){
        setTimeout(syncSelectedMonthDay,0);
      }
      const monthSelect=e.target.closest?.(".ar-selectSmall");
      if(monthSelect)setTimeout(syncSelectedMonthDay,0);
    };
    const observer=new MutationObserver(()=>syncSelectedMonthDay());
    const main=document.querySelector(".ar-main")||document.body;
    observer.observe(main,{childList:true,subtree:true});
    document.addEventListener("click",onClick);
    document.addEventListener("change",onClick);
    syncSelectedMonthDay();
    return ()=>{
      cancelAnimationFrame(raf);
      observer.disconnect();
      document.removeEventListener("click",onClick);
      document.removeEventListener("change",onClick);
    };
  },[]);

  return <>
    <AgendaReviewFullBase/>
    <style jsx global>{`
      .ar-monthday.ar-month-selected{
        background:#fff8e8!important;
        box-shadow:inset 0 0 0 3px #e4ad32!important;
        position:relative!important;
      }
      .ar-monthday.ar-month-selected .ar-date{
        display:inline-flex!important;
        align-items:center!important;
        justify-content:center!important;
        min-width:26px!important;
        height:26px!important;
        padding:0 7px!important;
        border-radius:999px!important;
        background:#e4ad32!important;
        color:#172536!important;
        font-weight:950!important;
      }
    `}</style>
  </>;
}
