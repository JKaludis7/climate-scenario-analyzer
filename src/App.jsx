import { useState, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, AreaChart, Area, CartesianGrid, LineChart, Line } from "recharts";

/* ═══════════════════════════════════════════
   DESIGN SYSTEM — Dark Scientific Dashboard
   ═══════════════════════════════════════════ */
const T = {
  bg: "#080C14", bgPanel: "#0D1520", bgCard: "#111C2A", bgCardAlt: "#0F1825",
  bgHover: "#162235", surface: "#FFFFFF06", surfaceLit: "#FFFFFF0D",
  accent: "#00E5A0", accentDim: "#00E5A030", accentGlow: "#00E5A015",
  cyan: "#00D4FF", cyanDim: "#00D4FF30",
  warm15: "#00E5A0", warm20: "#FFD166", warm30: "#FF6B6B",
  text: "#D4DEE8", textMid: "#7E95A9", textDim: "#4A5E70", textBright: "#F0F6FA",
  border: "#FFFFFF0A", borderLit: "#FFFFFF14",
  red: "#FF6B6B", yellow: "#FFD166", green: "#00E5A0", blue: "#00D4FF",
  mono: "'JetBrains Mono', monospace",
  sans: "'Outfit', sans-serif",
};

const SC = [
  { key: "s15", label: "1.5°C", color: T.warm15, tag: "Paris-Aligned", desc: "Aggressive decarbonization, net-zero by 2050" },
  { key: "s20", label: "2°C", color: T.warm20, tag: "Delayed Transition", desc: "Moderate policy action, carbon pricing by 2035" },
  { key: "s30", label: "3°C+", color: T.warm30, tag: "Hot House World", desc: "Business as usual, severe physical impacts" },
];

/* ═══════════════ API LAYER ═══════════════ */
const callAPI = async (system, userMessage) => {
  const res = await fetch("/api/climate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, userMessage }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "HTTP " + res.status }));
    throw new Error(err.error || "API error");
  }
  return (await res.json()).text;
};

const extractJSON = (txt) => {
  let c = txt.replace(/<\/?antml:[^>]*>/g,"").replace(/<\/?cite[^>]*>/g,"").replace(/<[^>]*index="[^"]*"[^>]*>/g,"").replace(/```json/g,"").replace(/```/g,"").trim();
  try { return JSON.parse(c); } catch {}
  let d=0,s=-1,e=-1;
  for(let i=0;i<c.length;i++){if(c[i]==="{"){if(d===0)s=i;d++;}else if(c[i]==="}"){d--;if(d===0&&s!==-1){e=i;break;}}}
  if(s!==-1&&e!==-1){const j=c.substring(s,e+1);try{return JSON.parse(j);}catch{return JSON.parse(j.replace(/,\s*}/g,"}").replace(/,\s*\]/g,"]").replace(/[\x00-\x1F]+/g," "));}}
  throw new Error("Failed to parse climate data");
};

const SYS = "You are a climate risk analyst specializing in TCFD-aligned scenario analysis and NGFS climate scenarios. Research companies thoroughly using web search. Model realistic climate risk impacts based on the company's actual industry, geography, emissions profile, and business model. Use specific numbers and percentages where possible. Respond with ONLY valid JSON. No markdown, no backticks, no citation tags, no XML tags. Plain JSON only.";

/* ═══════════════ COMPONENTS ═══════════════ */
const Spin = () => <div style={{width:18,height:18,border:"2px solid "+T.border,borderTop:"2px solid "+T.accent,borderRadius:"50%",animation:"spin .7s linear infinite"}} />;

const Pill = ({label,color,active,onClick,tag}) => (
  <button onClick={onClick} style={{
    padding:"8px 18px",borderRadius:6,border:active?"1.5px solid "+color:"1px solid "+T.border,
    background:active?color+"15":"transparent",color:active?color:T.textMid,
    fontSize:12,fontWeight:600,cursor:"pointer",transition:"all .15s",letterSpacing:.3,
    display:"flex",alignItems:"center",gap:8,
  }}>
    <span style={{width:8,height:8,borderRadius:"50%",background:color,opacity:active?1:.4}} />
    {label}
    {tag && active && <span style={{fontSize:9,opacity:.7,fontWeight:400}}>{tag}</span>}
  </button>
);

const Stat = ({value,label,unit,color}) => (
  <div style={{textAlign:"center",padding:"16px 12px",background:T.surface,borderRadius:8,border:"1px solid "+T.border}}>
    <div style={{fontFamily:T.mono,fontSize:26,fontWeight:700,color:color||T.text,letterSpacing:-1}}>{value}<span style={{fontSize:12,fontWeight:400,color:T.textDim,marginLeft:2}}>{unit}</span></div>
    <div style={{fontSize:10,color:T.textDim,marginTop:4,textTransform:"uppercase",letterSpacing:1}}>{label}</div>
  </div>
);

const RiskScore = ({score,label,color,detail}) => {
  const pct = (score/10)*100;
  return (
    <div style={{marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:5}}>
        <span style={{fontSize:12,fontWeight:500,color:T.text}}>{label}</span>
        <span style={{fontFamily:T.mono,fontSize:13,fontWeight:700,color:color||T.accent}}>{score}<span style={{fontSize:10,color:T.textDim}}>/10</span></span>
      </div>
      <div style={{height:6,borderRadius:3,background:T.surface,overflow:"hidden"}}>
        <div style={{height:"100%",width:pct+"%",borderRadius:3,background:"linear-gradient(90deg,"+(color||T.accent)+","+(color||T.accent)+"80)",transition:"width .6s ease"}} />
      </div>
      {detail && <div style={{fontSize:11,color:T.textDim,marginTop:4,lineHeight:1.5}}>{detail}</div>}
    </div>
  );
};

const Section = ({title,sub,children,style:s}) => (
  <div style={{background:T.bgCard,borderRadius:10,border:"1px solid "+T.border,overflow:"hidden",...s}}>
    {title&&<div style={{padding:"14px 18px",borderBottom:"1px solid "+T.border,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div><h3 style={{fontSize:13,fontWeight:600,color:T.textBright,margin:0,letterSpacing:.2}}>{title}</h3>
      {sub&&<p style={{fontSize:10,color:T.textDim,margin:"2px 0 0",letterSpacing:.5,textTransform:"uppercase"}}>{sub}</p>}</div>
    </div>}
    <div style={{padding:18}}>{children}</div>
  </div>
);

const ttStyle = {background:T.bgPanel,border:"1px solid "+T.borderLit,borderRadius:6,color:T.text,fontSize:11,fontFamily:T.mono};

/* ═══════════════ RESULTS VIEW ═══════════════ */
const Results = ({data:d, si, setSi}) => {
  const sc = SC[si];
  const sd = d.scenarios && d.scenarios[sc.key];
  if(!sd) return <div style={{color:T.red,padding:20}}>Scenario data missing for {sc.label}</div>;

  const timeline = (d.timeline||[]).map(t=>({year:t.year,"1.5C":t.s15,"2C":t.s20,"3C+":t.s30}));
  const radar = ["Physical","Transition","Financial","Regulatory","Opportunity"].map(r => {
    const k = r.toLowerCase();
    return {risk:r,
      "1.5C": d.scenarios.s15 && d.scenarios.s15[k] ? d.scenarios.s15[k].score||0 : 0,
      "2C": d.scenarios.s20 && d.scenarios.s20[k] ? d.scenarios.s20[k].score||0 : 0,
      "3C+": d.scenarios.s30 && d.scenarios.s30[k] ? d.scenarios.s30[k].score||0 : 0,
    };
  });
  const impacts = [
    {name:"Revenue at Risk", v15:d.scenarios.s15?.revenueAtRisk||0, v20:d.scenarios.s20?.revenueAtRisk||0, v30:d.scenarios.s30?.revenueAtRisk||0},
    {name:"CAPEX Required", v15:d.scenarios.s15?.capexRequired||0, v20:d.scenarios.s20?.capexRequired||0, v30:d.scenarios.s30?.capexRequired||0},
    {name:"Carbon Cost", v15:d.scenarios.s15?.carbonCost||0, v20:d.scenarios.s20?.carbonCost||0, v30:d.scenarios.s30?.carbonCost||0},
  ];

  return (
    <div style={{animation:"fadeUp .5s ease"}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:16,marginBottom:24}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
            <h2 style={{fontSize:22,fontWeight:300,color:T.textBright,margin:0,letterSpacing:.5}}>{d.companyName}</h2>
            <span style={{fontFamily:T.mono,fontSize:12,color:T.textDim,background:T.surface,padding:"2px 8px",borderRadius:4}}>{d.ticker}</span>
          </div>
          <p style={{fontSize:12,color:T.textMid}}>{d.industry} · {d.hq}</p>
        </div>
        <div style={{display:"flex",gap:6}}>{SC.map((s,i)=><Pill key={i} label={s.label} color={s.color} tag={s.tag} active={i===si} onClick={()=>setSi(i)} />)}</div>
      </div>

      {/* Scenario Banner */}
      <div style={{background:sc.color+"08",border:"1px solid "+sc.color+"25",borderRadius:10,padding:"16px 20px",marginBottom:22,borderLeft:"3px solid "+sc.color}}>
        <div style={{fontSize:12,fontWeight:600,color:sc.color,fontFamily:T.mono,marginBottom:3}}>{sc.label} SCENARIO — {sc.tag}</div>
        <p style={{fontSize:12,color:T.textMid,lineHeight:1.7,margin:0}}>{sd.summary||""}</p>
      </div>

      {/* Key Metrics */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:22}}>
        <Stat value={sd.revenueAtRisk||0} unit="%" label="Revenue at Risk" color={sc.color} />
        <Stat value={sd.capexRequired||0} unit="%" label="CAPEX Required" color={T.cyan} />
        <Stat value={sd.carbonCost||0} unit="%" label="Carbon Cost Impact" color={T.yellow} />
        <Stat value={sd.physical?.score||0} unit="/10" label="Physical Risk Score" color={T.red} />
      </div>

      {/* Charts Row */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:18}}>
        <Section title="RISK PROFILE OVERLAY" sub="All scenarios compared · 1-10 scale">
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radar}>
              <PolarGrid stroke={T.border} />
              <PolarAngleAxis dataKey="risk" tick={{fill:T.textMid,fontSize:10,fontFamily:T.mono}} />
              <PolarRadiusAxis domain={[0,10]} tick={{fill:T.textDim,fontSize:8}} axisLine={false} />
              <Radar name="1.5°C" dataKey="1.5C" stroke={T.warm15} fill={T.warm15} fillOpacity={0.12} strokeWidth={2} />
              <Radar name="2°C" dataKey="2C" stroke={T.warm20} fill={T.warm20} fillOpacity={0.08} strokeWidth={2} />
              <Radar name="3°C+" dataKey="3C+" stroke={T.warm30} fill={T.warm30} fillOpacity={0.08} strokeWidth={2} />
              <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono,color:T.textMid}} />
            </RadarChart>
          </ResponsiveContainer>
        </Section>

        <Section title="RISK TRAJECTORY · 2025-2050" sub="Cumulative risk index projection">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{fill:T.textDim,fontSize:9,fontFamily:T.mono}} />
              <YAxis tick={{fill:T.textDim,fontSize:9}} domain={[0,100]} />
              <Tooltip contentStyle={ttStyle} />
              <Area type="monotone" dataKey="1.5C" stroke={T.warm15} fill={T.warm15} fillOpacity={0.08} strokeWidth={2} />
              <Area type="monotone" dataKey="2C" stroke={T.warm20} fill={T.warm20} fillOpacity={0.06} strokeWidth={2} />
              <Area type="monotone" dataKey="3C+" stroke={T.warm30} fill={T.warm30} fillOpacity={0.06} strokeWidth={2} />
              <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}} />
            </AreaChart>
          </ResponsiveContainer>
        </Section>
      </div>

      {/* Financial Impact Bars */}
      <Section title="FINANCIAL IMPACT COMPARISON" sub="Estimated % of revenue / market cap" style={{marginBottom:18}}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={impacts} barGap={2} barSize={20}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{fill:T.textMid,fontSize:10}} />
            <YAxis tick={{fill:T.textDim,fontSize:9,fontFamily:T.mono}} unit="%" />
            <Tooltip contentStyle={ttStyle} />
            <Bar dataKey="v15" name="1.5°C" fill={T.warm15} radius={[3,3,0,0]} />
            <Bar dataKey="v20" name="2°C" fill={T.warm20} radius={[3,3,0,0]} />
            <Bar dataKey="v30" name="3°C+" fill={T.warm30} radius={[3,3,0,0]} />
            <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}} />
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {/* Detail Grid */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:18}}>
        {[{k:"physical",title:"PHYSICAL RISKS",icon:"🌊",color:T.red},{k:"transition",title:"TRANSITION RISKS",icon:"⚡",color:T.yellow},{k:"financial",title:"FINANCIAL IMPACT",icon:"📊",color:T.cyan}].map(card=>{
          const cd = sd[card.k];
          return (
            <Section key={card.k} title={card.icon+" "+card.title} sub={sc.label+" pathway"}>
              <RiskScore score={cd?.score||0} label="Risk Score" color={card.color} />
              <div style={{fontSize:10,color:T.textDim,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Level: <span style={{color:card.color,fontWeight:600}}>{cd?.level||"N/A"}</span></div>
              {(cd?.factors||[]).map((f,j)=>(
                <div key={j} style={{padding:"8px 0",borderTop:"1px solid "+T.border}}>
                  <div style={{fontSize:11,fontWeight:600,color:T.text}}>{f.name}</div>
                  <div style={{fontSize:10,color:T.textMid,lineHeight:1.5,marginTop:2}}>{f.detail}</div>
                </div>
              ))}
            </Section>
          );
        })}
      </div>

      {/* Regulatory + Opportunity */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:18}}>
        <Section title="📋 REGULATORY EXPOSURE" sub={sc.label+" scenario"}>
          <RiskScore score={sd.regulatory?.score||0} label="Regulatory Risk" color={T.yellow} />
          <p style={{fontSize:11,color:T.textMid,lineHeight:1.6,margin:0}}>{sd.regulatory?.detail||""}</p>
        </Section>
        <Section title="🌱 OPPORTUNITIES" sub={sc.label+" scenario"}>
          <RiskScore score={sd.opportunity?.score||0} label="Opportunity Score" color={T.green} />
          <p style={{fontSize:11,color:T.textMid,lineHeight:1.6,margin:0}}>{sd.opportunity?.detail||""}</p>
        </Section>
      </div>

      {/* Emissions Profile */}
      {d.emissions && (
        <Section title="CURRENT EMISSIONS PROFILE" sub="Latest reported data" style={{marginBottom:18}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
            <Stat value={d.emissions.scope1||"N/A"} label="Scope 1 (Direct)" color={T.red} />
            <Stat value={d.emissions.scope2||"N/A"} label="Scope 2 (Energy)" color={T.yellow} />
            <Stat value={d.emissions.scope3||"N/A"} label="Scope 3 (Value Chain)" color={T.cyan} />
          </div>
          {d.netZeroTarget && <p style={{fontSize:11,color:T.textMid,marginTop:12,lineHeight:1.6}}>Net-Zero Target: <span style={{color:T.accent,fontWeight:600}}>{d.netZeroTarget}</span></p>}
          {d.currentStrategy && <p style={{fontSize:11,color:T.textDim,marginTop:6,lineHeight:1.6}}>{d.currentStrategy}</p>}
        </Section>
      )}

      {/* Executive Summary */}
      {d.executiveSummary && (
        <Section title="EXECUTIVE SCENARIO ANALYSIS" style={{marginBottom:18}}>
          <p style={{fontSize:12,color:T.textMid,lineHeight:1.8,margin:0,whiteSpace:"pre-line"}}>{d.executiveSummary}</p>
        </Section>
      )}

      {/* Methodology */}
      <div style={{padding:14,background:T.surface,borderRadius:8,fontSize:10,color:T.textDim,lineHeight:1.7,textAlign:"center",fontFamily:T.mono}}>
        Methodology: NGFS climate scenarios · TCFD framework · IEA energy pathways · IPCC AR6 physical risk data · AI-generated analysis using publicly available data · Not financial advice
      </div>
    </div>
  );
};

/* ═══════════════ MAIN APP ═══════════════ */
export default function App() {
  const [ticker, setTicker] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState([]);
  const [error, setError] = useState(null);
  const [si, setSi] = useState(0);

  const run = useCallback(async () => {
    const t = ticker.trim().toUpperCase();
    if (!t || loading) return;
    setLoading(true); setData(null); setError(null); setSi(0);
    setSteps([
      {text:"Researching "+t+" emissions, climate exposure, and physical risks...",done:false},
      {text:"Modeling 1.5°C, 2°C, and 3°C+ scenario impacts through 2050...",done:false},
    ]);

    try {
      const r1 = await callAPI(SYS,
        'Search for stock ticker "'+t+'" climate and environmental data. Find the company name, industry, headquarters, Scope 1/2/3 emissions (with units), net-zero target and year, energy sources, physical asset locations vulnerable to climate (floods, heat, storms, sea level), and their current climate strategy.\n\nSearch specifically for "'+t+' sustainability report emissions" and "'+t+' net zero target climate".\n\nReturn JSON:\n{"companyName":"name","ticker":"'+t+'","industry":"sector","hq":"location","emissions":{"scope1":"value with units","scope2":"value with units","scope3":"value with units or estimate"},"netZeroTarget":"target year and details","energyMix":"description","physicalExposure":"2-3 sentences on facility/supply chain climate vulnerability","currentStrategy":"detailed paragraph on climate strategy and progress"}'
      );
      const d1 = extractJSON(r1);
      setSteps(p=>p.map((s,i)=>i===0?{...s,done:true}:s));

      await new Promise(r=>setTimeout(r,3000));

      const cn = d1.companyName||t;
      const r2 = await callAPI(SYS,
        'Model climate scenario impacts for '+cn+' ('+t+'), industry: '+(d1.industry||"unknown")+'. Current emissions: Scope 1 '+(d1.emissions?.scope1||"unknown")+', Scope 2 '+(d1.emissions?.scope2||"unknown")+', Scope 3 '+(d1.emissions?.scope3||"unknown")+'. Net-zero: '+(d1.netZeroTarget||"unknown")+'. Physical exposure: '+(d1.physicalExposure||"unknown")+'.\n\nFor THREE scenarios (1.5C Paris-aligned, 2C delayed transition, 3C+ hot house), model realistic impacts specific to this company and industry. Score each risk 1-10 with specific factors. Provide financial impact estimates as percentages. Create a risk trajectory timeline 2025-2050.\n\nIMPORTANT: Make scores and estimates realistic and different across scenarios. 1.5C should show lower physical risk but higher transition costs. 3C+ should show severe physical risk but lower transition costs.\n\nReturn JSON:\n{"scenarios":{"s15":{"summary":"detailed paragraph on 1.5C impact for this company","physical":{"score":4,"level":"Low-Moderate","factors":[{"name":"specific factor","detail":"2 sentence detail"},{"name":"factor","detail":"detail"}]},"transition":{"score":6,"level":"Moderate-High","factors":[{"name":"factor","detail":"detail"},{"name":"factor","detail":"detail"}]},"financial":{"score":5,"level":"Moderate","factors":[{"name":"factor","detail":"detail"},{"name":"factor","detail":"detail"}]},"regulatory":{"score":5,"level":"Moderate","detail":"2-3 sentences"},"opportunity":{"score":7,"level":"High","detail":"2-3 sentences"},"revenueAtRisk":5,"capexRequired":12,"carbonCost":4},"s20":{"summary":"paragraph","physical":{"score":6,"level":"Moderate","factors":[{"name":"f","detail":"d"},{"name":"f","detail":"d"}]},"transition":{"score":5,"level":"Moderate","factors":[{"name":"f","detail":"d"},{"name":"f","detail":"d"}]},"financial":{"score":6,"level":"Moderate","factors":[{"name":"f","detail":"d"},{"name":"f","detail":"d"}]},"regulatory":{"score":4,"level":"Low-Moderate","detail":"detail"},"opportunity":{"score":5,"level":"Moderate","detail":"detail"},"revenueAtRisk":14,"capexRequired":8,"carbonCost":10},"s30":{"summary":"paragraph","physical":{"score":8,"level":"High","factors":[{"name":"f","detail":"d"},{"name":"f","detail":"d"}]},"transition":{"score":2,"level":"Low","factors":[{"name":"f","detail":"d"},{"name":"f","detail":"d"}]},"financial":{"score":7,"level":"High","factors":[{"name":"f","detail":"d"},{"name":"f","detail":"d"}]},"regulatory":{"score":2,"level":"Low","detail":"detail"},"opportunity":{"score":3,"level":"Low","detail":"detail"},"revenueAtRisk":25,"capexRequired":4,"carbonCost":20}},"timeline":[{"year":"2025","s15":8,"s20":10,"s30":12},{"year":"2030","s15":18,"s20":25,"s30":35},{"year":"2035","s15":25,"s20":40,"s30":55},{"year":"2040","s15":30,"s20":52,"s30":72},{"year":"2045","s15":34,"s20":62,"s30":85},{"year":"2050","s15":36,"s20":70,"s30":95}],"executiveSummary":"3 detailed paragraphs comparing all scenarios, assessing company readiness, and providing strategic recommendations"}'
      );
      const d2 = extractJSON(r2);
      setSteps(p=>p.map(s=>({...s,done:true})));

      setData({...d1,...d2});
    } catch(err) {
      console.error(err);
      setError(err.message);
    } finally { setLoading(false); }
  }, [ticker, loading]);

  return (
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:T.sans,color:T.text}}>
      {/* Grid Background Effect */}
      <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,backgroundImage:"radial-gradient(circle at 1px 1px, "+T.border+" 1px, transparent 0)",backgroundSize:"40px 40px",pointerEvents:"none",zIndex:0}} />

      {/* Nav */}
      <nav style={{position:"relative",zIndex:1,height:52,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 28px",borderBottom:"1px solid "+T.border,background:T.bg+"E0",backdropFilter:"blur(12px)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:18}}>🌍</span>
          <span style={{fontSize:14,fontWeight:300,letterSpacing:2,color:T.textBright}}>CLIMATE SCENARIO ANALYZER</span>
          <span style={{fontSize:9,color:T.textDim,background:T.surface,padding:"2px 8px",borderRadius:3,fontFamily:T.mono,letterSpacing:1}}>TCFD</span>
        </div>
        <div style={{fontFamily:T.mono,fontSize:10,color:T.textDim}}>v1.0 · {new Date().toISOString().split("T")[0]}</div>
      </nav>

      <div style={{position:"relative",zIndex:1,maxWidth:1140,margin:"0 auto",padding:"28px 22px"}}>
        {/* Search */}
        <div style={{background:T.bgPanel,borderRadius:12,padding:"32px 28px",marginBottom:28,border:"1px solid "+T.border,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:-60,right:-60,width:200,height:200,borderRadius:"50%",background:T.accentGlow,filter:"blur(80px)"}} />
          <div style={{position:"absolute",bottom:-40,left:-40,width:150,height:150,borderRadius:"50%",background:T.cyanDim,filter:"blur(60px)",opacity:.3}} />
          <div style={{position:"relative"}}>
            <h1 style={{fontSize:24,fontWeight:200,margin:"0 0 6px",letterSpacing:1,color:T.textBright}}>Climate Scenario Analysis</h1>
            <p style={{color:T.textMid,fontSize:12,margin:"0 0 20px",maxWidth:600}}>Model how 1.5°C, 2°C, and 3°C+ warming pathways affect a company through 2050 — physical risks, transition costs, financial exposure, regulatory impact, and strategic opportunities.</p>
            <div style={{display:"flex",gap:10}}>
              <input value={ticker} onChange={e=>setTicker(e.target.value.toUpperCase())} onKeyDown={e=>e.key==="Enter"&&run()} placeholder="Enter stock ticker..." disabled={loading}
                style={{flex:1,padding:"11px 16px",borderRadius:6,border:"1px solid "+T.borderLit,fontSize:14,fontWeight:600,fontFamily:T.mono,background:T.bgCard,color:T.text,letterSpacing:2,outline:"none",boxSizing:"border-box"}} />
              <button onClick={run} disabled={!ticker.trim()||loading}
                style={{padding:"11px 26px",borderRadius:6,border:"none",background:(!ticker.trim()||loading)?T.textDim:"linear-gradient(135deg,"+T.accent+","+T.cyan+")",color:T.bg,fontSize:12,fontWeight:700,cursor:(!ticker.trim()||loading)?"not-allowed":"pointer",letterSpacing:.5,fontFamily:T.mono}}
              >{loading?"ANALYZING...":"RUN ANALYSIS"}</button>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <Section style={{marginBottom:24,animation:"fadeUp .3s ease"}}>
            <h3 style={{fontSize:13,fontWeight:600,color:T.textBright,margin:"0 0 14px",fontFamily:T.mono}}>MODELING SCENARIOS FOR {ticker.toUpperCase()}</h3>
            {steps.map((s,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0"}}>
                {s.done?<div style={{width:18,height:18,borderRadius:"50%",background:T.accentGlow,color:T.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700}}>✓</div>:<Spin />}
                <span style={{fontSize:12,color:s.done?T.textDim:T.text,fontWeight:s.done?400:500}}>{s.text}</span>
              </div>
            ))}
            <div style={{marginTop:14,padding:"8px 12px",background:T.surface,borderRadius:6,display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:T.accent,animation:"pulse 1.5s infinite"}} />
              <span style={{fontSize:10,color:T.textDim,fontFamily:T.mono}}>Processing climate data... typically 20-40 seconds</span>
            </div>
          </Section>
        )}

        {/* Results */}
        {data && !loading && <Results data={data} si={si} setSi={setSi} />}

        {/* Empty */}
        {!data && !loading && (
          <div style={{textAlign:"center",padding:"60px 20px",animation:"fadeUp .6s ease"}}>
            <div style={{fontSize:52,marginBottom:16,opacity:.5}}>🌍</div>
            <h3 style={{fontSize:20,fontWeight:200,color:T.textMid,margin:"0 0 10px",letterSpacing:.5}}>Climate Risk Scenario Modeling</h3>
            <p style={{fontSize:12,color:T.textDim,maxWidth:500,margin:"0 auto 28px",lineHeight:1.8}}>
              Enter a stock ticker to model how different warming pathways affect a company's physical assets, transition costs, financial exposure, regulatory risk, and strategic opportunities from 2025 through 2050.
            </p>
            <div style={{display:"flex",flexWrap:"wrap",justifyContent:"center",gap:7,marginBottom:36}}>
              {["XOM","SHEL","TSLA","JPM","AAPL","BHP","NEE","BP","RIO","ENPH"].map(t=>(
                <button key={t} onClick={()=>setTicker(t)} style={{padding:"5px 14px",borderRadius:4,fontSize:11,fontWeight:600,fontFamily:T.mono,background:T.surface,color:T.textMid,border:"1px solid "+T.border,cursor:"pointer",letterSpacing:1}}>{t}</button>
              ))}
            </div>
            <div style={{display:"flex",justifyContent:"center",gap:32}}>
              {SC.map(s=>(
                <div key={s.key} style={{textAlign:"center",maxWidth:160}}>
                  <div style={{width:44,height:44,borderRadius:8,background:s.color+"12",border:"1.5px solid "+s.color+"40",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 8px",fontFamily:T.mono,fontSize:13,fontWeight:700,color:s.color}}>{s.label}</div>
                  <div style={{fontSize:11,fontWeight:600,color:s.color,marginBottom:3}}>{s.tag}</div>
                  <div style={{fontSize:10,color:T.textDim,lineHeight:1.5}}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <footer style={{position:"relative",zIndex:1,padding:"16px 28px",borderTop:"1px solid "+T.border,display:"flex",justifyContent:"space-between"}}>
        <span style={{color:T.textDim,fontSize:10,fontFamily:T.mono}}>CLIMATE SCENARIO ANALYZER © 2025 · TCFD-Aligned</span>
        <span style={{color:T.textDim,fontSize:10,fontFamily:T.mono}}>Powered by Claude AI · NGFS Scenarios</span>
      </footer>

      {/* Error */}
      {error&&(
        <div style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",background:T.bgCard,padding:"14px 20px",borderRadius:8,boxShadow:"0 8px 32px rgba(0,0,0,.5)",zIndex:999,display:"flex",alignItems:"center",gap:14,border:"1px solid "+T.borderLit,maxWidth:"90vw"}}>
          <span style={{color:T.red,fontSize:16}}>⚠</span>
          <div style={{flex:1,color:T.textMid,fontSize:11,fontFamily:T.mono}}>{error}</div>
          <button onClick={()=>{setError(null);run();}} style={{padding:"6px 14px",borderRadius:4,border:"none",background:T.accent,color:T.bg,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:T.mono}}>RETRY</button>
          <button onClick={()=>setError(null)} style={{padding:"6px 10px",borderRadius:4,border:"1px solid "+T.border,background:"transparent",color:T.textDim,fontSize:11,cursor:"pointer"}}>✕</button>
        </div>
      )}
    </div>
  );
}
