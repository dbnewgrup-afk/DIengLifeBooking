"use client";
import React from "react";

export function Toast({ ok, text }: { ok:boolean; text:string }) {
  return (
    <div style={{
      marginTop:12,borderRadius:12,padding:"10px 12px",
      border: ok?"1px solid rgba(16,185,129,.5)":"1px solid rgba(244,63,94,.45)",
      color: ok?"#065f46":"#7f1d1d",
      background: ok?"linear-gradient(180deg, rgba(16,185,129,.12), rgba(16,185,129,.18))":
                    "linear-gradient(180deg, rgba(244,63,94,.12), rgba(244,63,94,.18))"
    }}>{text}</div>
  );
}
