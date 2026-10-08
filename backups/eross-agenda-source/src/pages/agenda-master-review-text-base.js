import AgendaCurrent from "./agenda-master-review-contrast-base";

export default function AgendaReadableNumbers(){
  return <>
    <AgendaCurrent/>
    <style jsx global>{`
      /* Legibilidad de horas y numeración de Agenda */
      .em-time,
      .em-daytime{
        color:#4E6075!important;
        font-weight:800!important;
        font-size:10.5px!important;
        letter-spacing:.01em!important;
      }

      .em-days div,
      .em-monthhead div{
        color:#4A5C72!important;
        font-weight:850!important;
      }

      .em-date{
        color:#31465B!important;
        font-weight:850!important;
      }

      .em-mini span:not(.blank){
        color:#24384F!important;
        font-weight:750!important;
      }

      .em-mini span.today{
        color:#10283D!important;
        font-weight:950!important;
      }

      .em-daytitle{
        color:#24384F!important;
        font-weight:900!important;
      }

      .em-slot,
      .em-dayslot{
        color:#31465B!important;
      }
    `}</style>
  </>;
}
