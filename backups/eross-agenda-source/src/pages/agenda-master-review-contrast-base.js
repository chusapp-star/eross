import {useEffect} from "react";
import AgendaPolishedBase from "./agenda-master-review-polished-base";

export default function AgendaMasterClientInitialsFix(){
  useEffect(()=>{
    let t;
    const enhanceClients=()=>{
      clearTimeout(t);
      t=setTimeout(()=>{
        const cards=[...document.querySelectorAll(".em-card")];
        const clientCard=cards.find(card=>card.querySelector(".em-cardhead h3")?.textContent?.trim()==="Clientes / Prospectos");
        if(!clientCard)return;

        clientCard.querySelectorAll("tbody tr").forEach(row=>{
          const first=row.querySelector("td:first-child");
          if(!first || first.querySelector(".eross-client-avatar"))return;

          const name=first.textContent.trim();
          const parts=name.split(/\s+/).filter(Boolean);
          const initials=((parts[0]?.[0]||"")+(parts[1]?.[0]||"")).toUpperCase()||"CL";

          const badge=document.createElement("span");
          badge.className="eross-client-avatar";
          badge.textContent=initials;
          first.prepend(badge);
          first.classList.add("eross-client-cell");
        });
      },0);
    };

    const observer=new MutationObserver(enhanceClients);
    observer.observe(document.body,{childList:true,subtree:true});
    document.addEventListener("click",enhanceClients);
    enhanceClients();

    return ()=>{
      clearTimeout(t);
      observer.disconnect();
      document.removeEventListener("click",enhanceClients);
    };
  },[]);

  return <>
    <AgendaPolishedBase/>
    <style jsx global>{`
      .em-card[data-visual="clients"] .em-table tbody td:first-child:before,
      .em-card:has(.em-cardhead h3) .em-table tbody td.eross-client-cell:before{
        display:none!important;
        content:none!important;
      }

      .em-table tbody td.eross-client-cell{
        position:relative!important;
        padding-left:62px!important;
        min-height:58px!important;
      }

      .eross-client-avatar{
        position:absolute!important;
        left:12px!important;
        top:50%!important;
        transform:translateY(-50%)!important;
        width:38px!important;
        height:38px!important;
        border-radius:12px!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        background:linear-gradient(135deg,#174d75 0%,#0b2b46 100%)!important;
        color:#fff!important;
        font-size:11px!important;
        font-weight:950!important;
        letter-spacing:.05em!important;
        box-shadow:0 7px 16px rgba(7,26,45,.18)!important;
        border:1px solid rgba(255,255,255,.14)!important;
      }

      .em-table tbody tr:hover .eross-client-avatar{
        background:linear-gradient(135deg,#1d5b88 0%,#0c3454 100%)!important;
        transform:translateY(-50%) scale(1.03)!important;
      }
    `}</style>
  </>;
}