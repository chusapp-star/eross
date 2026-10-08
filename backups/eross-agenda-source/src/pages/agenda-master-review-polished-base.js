import {useEffect} from "react";
import AgendaWithIcons from "./agenda-master-review-icons-base";

export default function AgendaMasterPolishedRows(){
  useEffect(()=>{
    let timer;
    const enhance=()=>{
      clearTimeout(timer);
      timer=setTimeout(()=>{
        const cards=[...document.querySelectorAll(".em-card")];
        for(const card of cards){
          const title=card.querySelector(".em-cardhead h3")?.textContent?.trim()||"";
          if(title==="Clientes / Prospectos"){
            card.dataset.visual="clients";
            card.querySelectorAll("tbody tr").forEach(row=>{
              const first=row.querySelector("td:first-child");
              if(!first)return;
              const name=first.textContent.trim();
              const parts=name.split(/\s+/).filter(Boolean);
              const initials=((parts[0]?.[0]||"")+(parts[1]?.[0]||parts[0]?.[1]||"")).toUpperCase()||"CL";
              first.setAttribute("data-initials",initials);
            });
          }
          if(title==="Reporte de citas / gestiones"){
            card.dataset.visual="reports";
          }
        }
      },0);
    };
    const observer=new MutationObserver(enhance);
    observer.observe(document.body,{childList:true,subtree:true,characterData:true});
    document.addEventListener("click",enhance);
    enhance();
    return ()=>{clearTimeout(timer);observer.disconnect();document.removeEventListener("click",enhance);};
  },[]);

  return <>
    <AgendaWithIcons/>
    <style jsx global>{`
      .em-card[data-visual="clients"] .em-table tbody td:first-child:before{
        content:attr(data-initials)!important;
        position:absolute!important;
        left:12px!important;
        top:50%!important;
        transform:translateY(-50%)!important;
        width:34px!important;
        height:34px!important;
        border-radius:11px!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        color:#fff!important;
        font-size:10px!important;
        font-weight:950!important;
        letter-spacing:.04em!important;
        background:linear-gradient(135deg,#174d75,#0b2b46)!important;
        background-image:none!important;
        box-shadow:0 6px 14px rgba(7,26,45,.16)!important;
      }
      .em-card[data-visual="clients"] .em-table tbody td:first-child{
        padding-left:58px!important;
      }

      .em-card[data-visual="reports"] .em-table tbody td:first-child:before{
        content:""!important;
        position:absolute!important;
        left:12px!important;
        top:50%!important;
        transform:translateY(-50%)!important;
        width:34px!important;
        height:34px!important;
        border-radius:11px!important;
        display:block!important;
        background-color:#fff7e5!important;
        background-image:url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%230b2b46%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Crect%20x%3D%223%22%20y%3D%225%22%20width%3D%2218%22%20height%3D%2216%22%20rx%3D%222%22%2F%3E%3Cpath%20d%3D%22M16%203v4M8%203v4M3%2011h18%22%2F%3E%3Cpath%20d%3D%22M8%2015h3M13%2015h3M8%2018h3%22%2F%3E%3C%2Fsvg%3E")!important;
        background-repeat:no-repeat!important;
        background-position:center!important;
        background-size:18px 18px!important;
        box-shadow:inset 0 0 0 1px #edd99e,0 5px 12px rgba(7,26,45,.07)!important;
      }
      .em-card[data-visual="reports"] .em-table tbody td:first-child{
        padding-left:58px!important;
      }

      .em-card[data-visual="clients"] .em-table tbody tr,
      .em-card[data-visual="reports"] .em-table tbody tr{
        box-shadow:0 2px 0 #edf1f3,0 5px 16px rgba(18,38,58,.025)!important;
      }
      .em-card[data-visual="clients"] .em-table tbody tr:hover,
      .em-card[data-visual="reports"] .em-table tbody tr:hover{
        transform:translateY(-1px)!important;
        box-shadow:0 8px 22px rgba(18,38,58,.07)!important;
      }
    `}</style>
  </>;
}
