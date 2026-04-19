"use client";
import React from "react";

export function Tabs({ active, setActive, tabs, badge }: {
  active: string; setActive:(k:string)=>void;
  tabs: {k:string,t:string}[]; badge?:string;
}) {
  return (
    <div style={{
      position:"sticky",top:0,zIndex:10,display:"flex",gap:8,padding:6,
      borderRadius:999,background:"rgba(255,255,255,.35)",border:"1px solid rgba(255,255,255,.45)",
      backdropFilter:"blur(12px)",flexWrap:"wrap"
    }}>
      {tabs.map(x=>{
        const act=active===x.k;
        return (
          <button key={x.k} onClick={()=>setActive(x.k)} type="button" style={{
            borderRadius:999,padding:"8px 14px",border:"1px solid rgba(255,255,255,.45)",
            background:act?"rgba(255,255,255,.88)":"transparent",
            color:act?"#002b3f":"#eef9ff",fontWeight:800,cursor:"pointer"
          }}>{x.t}</button>
        );
      })}
      {badge && <span style={{
        marginLeft:"auto",padding:"6px 10px",borderRadius:999,
        background:"rgba(16,185,129,.9)",border:"1px solid rgba(255,255,255,.8)",
        color:"#fff",fontSize:12,fontWeight:800
      }}>{badge}</span>}
    </div>
  );
}
