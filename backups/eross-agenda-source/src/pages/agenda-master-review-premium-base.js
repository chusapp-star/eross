import AgendaBase from "./agenda-master-review-base-premium";

export default function AgendaPremium(){
  return <>
    <AgendaBase/>
    <style jsx global>{`
      :root{
        --ep-navy:#071a2d;
        --ep-navy-2:#0b2b46;
        --ep-navy-3:#123c5d;
        --ep-gold:#d3a438;
        --ep-gold-2:#e8bf57;
        --ep-gold-soft:#fff8e9;
        --ep-bg:#f3f5f7;
        --ep-line:#e1e7eb;
        --ep-text:#14283b;
        --ep-muted:#7c8b97;
      }

      html,body,#__next{background:var(--ep-bg)!important;}

      .em-root{
        grid-template-columns:246px minmax(0,1fr)!important;
        background:
          radial-gradient(circle at 85% 8%,rgba(216,227,235,.32),transparent 22%),
          var(--ep-bg)!important;
      }

      .em-side{
        padding:18px 14px!important;
        background:
          radial-gradient(circle at 12% 87%,rgba(43,96,138,.26),transparent 34%),
          linear-gradient(180deg,#06192a 0%,#071827 100%)!important;
        overflow:hidden!important;
        position:sticky!important;
      }
      .em-side:after{
        content:""!important;
        position:absolute!important;
        left:-60px!important;
        right:-75px!important;
        bottom:64px!important;
        height:125px!important;
        border-top:1px solid rgba(211,164,56,.52)!important;
        border-radius:50%!important;
        transform:rotate(-8deg)!important;
        pointer-events:none!important;
      }

      .em-brandbox{
        display:grid!important;
        grid-template-columns:88px minmax(0,1fr)!important;
        grid-template-rows:auto auto!important;
        column-gap:12px!important;
        align-items:center!important;
        text-align:left!important;
        padding:4px 6px 18px!important;
        margin-bottom:14px!important;
        border-bottom:1px solid rgba(255,255,255,.09)!important;
        position:relative!important;
        z-index:2!important;
      }
      .em-logoCrop{
        grid-column:1!important;
        grid-row:1/3!important;
        width:88px!important;
        height:88px!important;
        margin:0!important;
        border-radius:17px!important;
        background:rgba(255,255,255,.035)!important;
        box-shadow:0 12px 28px rgba(0,0,0,.22)!important;
        overflow:hidden!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
      }
      .em-logoCrop img{
        width:100%!important;
        height:100%!important;
        object-fit:contain!important;
        transform:none!important;
      }
      .em-brandbox b{
        grid-column:2!important;
        align-self:end!important;
        margin:0 0 3px!important;
        font-size:22px!important;
        letter-spacing:-.025em!important;
        line-height:1!important;
        color:#fff!important;
      }
      .em-brandbox small{
        grid-column:2!important;
        align-self:start!important;
        font-size:10px!important;
        color:#acbdca!important;
        margin:0!important;
      }

      .em-user{
        position:relative!important;
        z-index:2!important;
        min-height:58px!important;
        padding:10px 11px 10px 56px!important;
        margin:0 2px 13px!important;
        border-radius:14px!important;
        background:rgba(13,49,76,.76)!important;
        border:1px solid rgba(255,255,255,.08)!important;
        box-shadow:none!important;
      }
      .em-user:before{
        content:"JP"!important;
        position:absolute!important;
        left:10px!important;
        top:10px!important;
        width:37px!important;
        height:37px!important;
        border-radius:50%!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        background:linear-gradient(135deg,#285475,#122f49)!important;
        color:#fff!important;
        font-size:11px!important;
        font-weight:900!important;
      }
      .em-user b{font-size:12px!important;color:#fff!important;}
      .em-user small{color:#adbdc9!important;font-size:9px!important;}

      .em-nav{position:relative!important;z-index:2!important;}
      .em-nav button{
        border-radius:10px!important;
        padding:10px 11px!important;
        color:#c6d0d8!important;
        font-size:12px!important;
        letter-spacing:.005em!important;
        transition:.15s!important;
      }
      .em-nav button:before{
        content:""!important;
        width:7px!important;
        height:7px!important;
        border-radius:50%!important;
        background:rgba(255,255,255,.24)!important;
        margin-right:9px!important;
        display:inline-block!important;
      }
      .em-nav button:hover{
        background:rgba(255,255,255,.05)!important;
        color:#fff!important;
      }
      .em-nav button.on{
        background:linear-gradient(90deg,rgba(211,164,56,.95),rgba(211,164,56,.54))!important;
        color:#fff!important;
        box-shadow:0 9px 24px rgba(0,0,0,.13)!important;
      }
      .em-nav button.on:before{background:#fff!important;}

      .em-main{background:transparent!important;}

      .em-header{
        height:80px!important;
        margin:16px 18px 0!important;
        padding:0 23px!important;
        border-radius:16px!important;
        border:1px solid #e4e9ed!important;
        background:rgba(255,255,255,.95)!important;
        box-shadow:0 8px 25px rgba(18,38,58,.045)!important;
      }
      .em-header h2{
        font-size:34px!important;
        letter-spacing:-.04em!important;
        color:var(--ep-navy)!important;
      }
      .em-pill{
        padding:8px 12px!important;
        background:#fff9ec!important;
        border:1px solid #e5c568!important;
        color:#72540e!important;
        font-size:10px!important;
        letter-spacing:.03em!important;
      }
      .em-pill:before{content:"◉ "!important;}

      .em-content{padding:13px 18px 28px!important;}

      .em-toolbar{
        padding:11px 12px!important;
        border-radius:15px!important;
        border:1px solid var(--ep-line)!important;
        background:#fff!important;
        box-shadow:0 6px 20px rgba(18,38,58,.035)!important;
      }
      .em-btn{
        border-radius:10px!important;
        border-color:#d7e0e6!important;
        color:#294156!important;
        transition:.14s!important;
      }
      .em-btn:hover{
        transform:translateY(-1px)!important;
        box-shadow:0 5px 12px rgba(17,38,58,.07)!important;
      }
      .em-btn.primary{
        background:linear-gradient(135deg,var(--ep-gold),var(--ep-gold-2))!important;
        border-color:var(--ep-gold)!important;
        color:#14283b!important;
        box-shadow:0 8px 20px rgba(211,164,56,.2)!important;
      }
      .em-btn.on{
        background:var(--ep-gold-soft)!important;
        border-color:#e4bf57!important;
        color:#72540f!important;
      }
      .em-selectSmall{
        border-radius:10px!important;
        border-color:#d7e0e6!important;
        color:#294156!important;
        background:#fff!important;
      }

      .em-agenda{
        grid-template-columns:235px minmax(0,1fr)!important;
        gap:12px!important;
      }
      .em-left{
        padding:15px!important;
        border-radius:16px!important;
        border:1px solid var(--ep-line)!important;
        box-shadow:0 8px 22px rgba(18,38,58,.04)!important;
      }
      .em-left>b{
        font-size:15px!important;
        color:#10283d!important;
      }
      .em-mini{
        margin-top:10px!important;
        gap:3px!important;
        font-size:10px!important;
      }
      .em-mini span{
        padding:6px 0!important;
        border-radius:999px!important;
        color:#455b6d!important;
      }
      .em-mini span.today{
        background:linear-gradient(135deg,var(--ep-gold),var(--ep-gold-2))!important;
        color:#13283d!important;
        box-shadow:0 4px 10px rgba(211,164,56,.18)!important;
      }
      .em-sep{border-color:#e8edf0!important;margin:14px 0!important;}
      .em-check{font-size:11px!important;color:#465d70!important;padding:5px 0!important;}
      .em-dot{width:9px!important;height:9px!important;}

      .em-month{
        border-radius:16px!important;
        border:1px solid var(--ep-line)!important;
        box-shadow:0 8px 22px rgba(18,38,58,.04)!important;
      }
      .em-monthhead{background:#fafbfc!important;}
      .em-monthhead div{
        padding:13px 8px!important;
        font-size:11px!important;
        color:#536779!important;
        border-color:#edf1f3!important;
      }
      .em-monthday{
        min-height:124px!important;
        padding:9px!important;
        border-color:#edf1f3!important;
        background:#fff!important;
        transition:.12s!important;
      }
      .em-monthday:hover{background:#fbfcfd!important;}
      .em-monthday.selected{
        background:#fffaf0!important;
        box-shadow:inset 0 0 0 2px #dfa936!important;
      }
      .em-monthday.selected .em-date{
        background:linear-gradient(135deg,var(--ep-gold),var(--ep-gold-2))!important;
        color:#13283d!important;
      }
      .em-date{color:#536779!important;}
      .em-mevent{
        border-radius:9px!important;
        padding:7px 8px!important;
        box-shadow:0 3px 9px rgba(18,38,58,.04)!important;
        color:#294458!important;
      }

      .em-scroll{border-radius:16px!important;}
      .em-week{
        border-radius:16px!important;
        border-color:var(--ep-line)!important;
        box-shadow:0 8px 22px rgba(18,38,58,.04)!important;
      }
      .em-slot,.em-time,.em-days div{border-color:#edf1f3!important;}
      .em-appt{border-radius:9px!important;box-shadow:0 3px 9px rgba(18,38,58,.04)!important;}

      .em-day,.em-card{
        border-radius:16px!important;
        border:1px solid var(--ep-line)!important;
        box-shadow:0 8px 22px rgba(18,38,58,.04)!important;
      }
      .em-cardhead{
        padding:17px 18px!important;
        background:#fff!important;
        border-color:#e8edf0!important;
      }
      .em-cardhead h3{
        font-size:17px!important;
        letter-spacing:-.02em!important;
        color:#10283d!important;
      }
      .em-search{
        min-width:300px!important;
        padding:10px 13px!important;
        border-radius:11px!important;
        border-color:#d5dfe6!important;
        background:#fbfcfd!important;
      }

      /* Premium client table */
      .em-table{
        border-collapse:separate!important;
        border-spacing:0 8px!important;
        padding:0 12px 10px!important;
      }
      .em-table thead th{
        background:transparent!important;
        color:#83919d!important;
        font-size:9px!important;
        letter-spacing:.045em!important;
        padding-top:10px!important;
        padding-bottom:4px!important;
        border:0!important;
      }
      .em-table tbody tr{
        background:#fff!important;
        box-shadow:0 2px 0 #edf1f3!important;
        transition:.13s!important;
      }
      .em-table tbody tr:hover{
        background:#f9fbfc!important;
        box-shadow:0 6px 18px rgba(18,38,58,.055)!important;
      }
      .em-table tbody td{
        padding:14px 13px!important;
        border:0!important;
        color:#3f5669!important;
        font-size:11px!important;
      }
      .em-table tbody td:first-child{
        border-radius:12px 0 0 12px!important;
        font-weight:900!important;
        color:#173047!important;
        position:relative!important;
        padding-left:53px!important;
      }
      .em-table tbody td:first-child:before{
        content:""!important;
        position:absolute!important;
        left:12px!important;
        top:50%!important;
        transform:translateY(-50%)!important;
        width:31px!important;
        height:31px!important;
        border-radius:10px!important;
        background:linear-gradient(135deg,#153d5c,#0b263d)!important;
        box-shadow:0 5px 12px rgba(7,26,45,.13)!important;
      }
      .em-table tbody td:last-child{border-radius:0 12px 12px 0!important;}
      .em-badge{
        background:#fff6df!important;
        color:#715416!important;
        padding:6px 9px!important;
        font-size:9px!important;
      }
      .em-table .em-btn{
        background:#fff!important;
        border-color:#d6e0e7!important;
        color:#17334b!important;
        font-size:10px!important;
        padding:8px 10px!important;
      }
      .em-table .em-btn:hover{
        background:#102c45!important;
        border-color:#102c45!important;
        color:#fff!important;
      }

      .em-stats{gap:12px!important;}
      .em-stat{
        border-radius:15px!important;
        border:1px solid var(--ep-line)!important;
        box-shadow:0 7px 20px rgba(18,38,58,.035)!important;
      }
      .em-stat b{color:#10283d!important;}
      .em-chartcard{
        border-radius:15px!important;
        border:1px solid var(--ep-line)!important;
        box-shadow:0 7px 20px rgba(18,38,58,.035)!important;
      }
      .em-barfill{
        background:linear-gradient(90deg,var(--ep-gold),var(--ep-gold-2))!important;
      }

      .em-smallcard{
        border-radius:14px!important;
        border-color:#e2e8ec!important;
        box-shadow:0 5px 16px rgba(18,38,58,.03)!important;
      }

      .em-overlay{backdrop-filter:blur(3px)!important;}
      .em-modal{
        border-radius:22px!important;
        box-shadow:0 30px 90px rgba(0,0,0,.28)!important;
      }
      .em-modal h1{color:#10283d!important;letter-spacing:-.03em!important;}
      .em-kicker{color:#9b7420!important;}
      .em-input,.em-select,.em-textarea{
        border-radius:10px!important;
        border-color:#d1dce4!important;
      }
      .em-note{
        background:#fffdf7!important;
        border-color:#e8dba8!important;
      }

      @media(max-width:1100px){
        .em-root{grid-template-columns:220px minmax(0,1fr)!important;}
        .em-brandbox{grid-template-columns:72px minmax(0,1fr)!important;}
        .em-logoCrop{width:72px!important;height:72px!important;}
        .em-agenda{grid-template-columns:205px minmax(0,1fr)!important;}
      }
      @media(max-width:900px){
        .em-root{grid-template-columns:1fr!important;}
        .em-header{margin:10px 10px 0!important;}
        .em-content{padding:10px!important;}
        .em-search{min-width:0!important;width:100%!important;}
      }
    `}</style>
  </>;
}
