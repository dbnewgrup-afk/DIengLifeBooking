"use client";
import React from "react";

export function ChartCard({ title, data, tone }: { title: string; data: { t: string; v: number }[]; tone: string }) {
  const W=240,H=64,PAD=6;
  const values=data.map(d=>d.v);
  const min=Math.min(...values,0), max=Math.max(...values,1), range=Math.max(1,max-min);
  const step=data.length>1?(W-PAD*2)/(data.length-1):W;
  const points=data.length>1?data.map((d,i)=>{
    const x=PAD+i*step; const y=H-PAD-((d.v-min)/range)*(H-PAD*2); return `${x},${y}`;
  }).join(" "):"";

  return (
    <div style={{
      padding:12, borderRadius:16, border:"1px solid rgba(255,255,255,.55)",
      background:"linear-gradient(180deg, rgba(255,255,255,.30), rgba(255,255,255,.22))",
      boxShadow:"0 10px 24px rgba(2,47,64,.16)", backdropFilter:"blur(8px)"
    }}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
        <div style={{fontSize:13,fontWeight:900,color:"#053343"}}>{title}</div>
        <div style={{fontSize:12,color:"#6b7280"}}>{data.length} titik</div>
      </div>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <polyline fill="none" stroke={tone} strokeWidth="2" points={points}
          strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </div>
  );
}
