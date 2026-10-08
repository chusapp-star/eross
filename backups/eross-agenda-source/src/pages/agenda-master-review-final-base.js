import AgendaExact from "./agenda-master-review-exact-base";

export default function AgendaBrandFinalFix(){
  return <>
    <AgendaExact/>
    <style jsx global>{`
      /* Quitar branding duplicado y conservar únicamente el bloque aprobado */
      .em-brandbox > b,
      .em-brandbox > small,
      .em-brandbox > .em-logoCrop{
        display:none!important;
      }

      .em-brandbox{
        height:88px!important;
        padding:0!important;
        margin:2px 2px 14px!important;
        background-image:url("/eross-approved-brand.webp")!important;
        background-repeat:no-repeat!important;
        background-position:center 4px!important;
        background-size:100% auto!important;
        overflow:hidden!important;
      }

      @media(max-width:1100px){
        .em-brandbox{
          height:80px!important;
          background-position:center 3px!important;
        }
      }
    `}</style>
  </>;
}
