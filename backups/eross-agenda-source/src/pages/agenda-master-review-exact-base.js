import AgendaStable from "./agenda-master-review-approved-base";

export default function AgendaApprovedBrandExact(){
  return <>
    <AgendaStable/>
    <style jsx global>{`
      .em-brandbox{
        display:block!important;
        height:88px!important;
        padding:0!important;
        margin:2px 2px 14px!important;
        border-bottom:1px solid rgba(255,255,255,.10)!important;
        background-image:url("/eross-approved-brand.webp")!important;
        background-repeat:no-repeat!important;
        background-position:center 4px!important;
        background-size:100% auto!important;
        overflow:hidden!important;
      }
      .em-brandbox > *{display:none!important;}
      .em-user{margin-top:0!important;}
      @media(max-width:1100px){
        .em-brandbox{height:80px!important;background-size:100% auto!important;}
      }
    `}</style>
  </>;
}