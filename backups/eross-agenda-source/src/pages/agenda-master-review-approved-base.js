import AgendaCurrent from "./agenda-master-review-text-base";

export default function AgendaTextContrast(){
  return <>
    <AgendaCurrent/>
    <style jsx global>{`
      /* Mayor contraste en Clientes y Reportes */
      .em-cardhead h3{
        color:#0B2238!important;
        font-weight:950!important;
        font-size:18px!important;
        letter-spacing:-.02em!important;
      }

      .em-table th{
        color:#637689!important;
        font-weight:900!important;
        font-size:10.5px!important;
        letter-spacing:.055em!important;
      }

      .em-table tbody td{
        color:#334E66!important;
        font-weight:650!important;
        font-size:12.5px!important;
      }

      .em-table tbody td:first-child{
        color:#17324A!important;
        font-weight:900!important;
      }

      .em-table tbody td b,
      .em-table tbody td strong{
        color:#132E46!important;
        font-weight:900!important;
      }

      .em-card[data-visual="clients"] .em-table tbody td{
        color:#2E4960!important;
      }

      .em-card[data-visual="clients"] .em-table tbody td:first-child{
        color:#122E46!important;
        font-weight:950!important;
      }

      .em-card[data-visual="reports"] .em-table tbody td{
        color:#314B62!important;
      }

      .em-card[data-visual="reports"] .em-table tbody td:first-child{
        color:#142F47!important;
        font-weight:900!important;
      }

      .em-search{
        color:#243D54!important;
        font-weight:650!important;
      }

      .em-search::placeholder{
        color:#687B8D!important;
        opacity:1!important;
      }

      .em-badge{
        color:#674B0D!important;
        font-weight:900!important;
      }
    `}</style>
  </>;
}
