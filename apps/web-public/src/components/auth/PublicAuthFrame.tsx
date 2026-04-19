"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties, type ReactNode } from "react";

type QuickLink = {
  href: string;
  label: string;
};

type PublicAuthFrameProps = {
  eyebrow: string;
  title: string;
  description: string;
  highlights: string[];
  children: ReactNode;
  quickLinks?: QuickLink[];
  footer?: ReactNode;
};

export function PublicAuthFrame({
  eyebrow,
  title,
  description,
  highlights,
  children,
  quickLinks = [],
  footer,
}: PublicAuthFrameProps) {
  const [pointer, setPointer] = useState({ x: 0.68, y: 0.38, active: false });

  const motionVars = useMemo(
    () =>
      ({
        "--pointer-x": `${(pointer.x * 100).toFixed(2)}%`,
        "--pointer-y": `${(pointer.y * 100).toFixed(2)}%`,
        "--float-x": `${((pointer.x - 0.5) * 24).toFixed(2)}px`,
        "--float-y": `${((pointer.y - 0.5) * 18).toFixed(2)}px`,
        "--panel-tilt-x": `${((0.5 - pointer.y) * 4.5).toFixed(2)}deg`,
        "--panel-tilt-y": `${((pointer.x - 0.5) * 6).toFixed(2)}deg`,
        "--glow-alpha": pointer.active ? 1 : 0.76,
      }) as CSSProperties,
    [pointer]
  );

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    setPointer({
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
      active: true,
    });
  }

  function handlePointerLeave() {
    setPointer({ x: 0.68, y: 0.38, active: false });
  }

  return (
    <div className="container-page py-8 sm:py-12">
      <div
        className="public-auth-shell"
        style={motionVars}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <div className="public-auth-glow" />

        <div className="grid gap-0 lg:grid-cols-[1fr_1.05fr]">
          <section className="public-auth-panel public-auth-panel-form">
            <div className="public-auth-form-shell">
              {children}
            </div>
            {footer ? <div className="px-2 pb-1 pt-4">{footer}</div> : null}
          </section>

          <section className="public-auth-panel public-auth-panel-story">
            <div className="public-auth-story-inner">
              <div className="public-auth-badge">{eyebrow}</div>
              <h1 className="public-auth-title">{title}</h1>
              <p className="public-auth-description">{description}</p>

              <div className="public-auth-highlight-list">
                {highlights.map((item, index) => (
                  <div key={item} className="public-auth-highlight-card">
                    <div className="public-auth-highlight-index">0{index + 1}</div>
                    <p>{item}</p>
                  </div>
                ))}
              </div>

              {quickLinks.length > 0 ? (
                <div className="public-auth-link-row">
                  {quickLinks.map((item) => (
                    <Link
                      key={item.href + item.label}
                      href={item.href}
                      className="public-auth-link"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="public-auth-orb public-auth-orb-one" />
            <div className="public-auth-orb public-auth-orb-two" />
          </section>
        </div>
      </div>
      <style jsx>{`
        .public-auth-shell {
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(37, 99, 235, 0.16);
          border-radius: 36px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(248, 250, 247, 0.94));
          box-shadow: 0 32px 90px -44px rgba(15, 23, 42, 0.34);
          isolation: isolate;
        }

        .public-auth-glow {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(circle at var(--pointer-x) var(--pointer-y), rgba(255, 255, 255, 0.28), transparent 24%),
            linear-gradient(120deg, transparent 20%, rgba(255, 255, 255, 0.12) 52%, transparent 80%);
          opacity: var(--glow-alpha);
        }

        .public-auth-panel {
          position: relative;
          min-height: 100%;
        }

        .public-auth-panel-form {
          z-index: 2;
          padding: 26px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(252, 252, 250, 0.98));
        }

        .public-auth-form-shell {
          position: relative;
          height: 100%;
          border: 1px solid rgba(15, 23, 42, 0.06);
          border-radius: 30px;
          background: linear-gradient(180deg, #ffffff, #fbfcfa);
          padding: 26px;
          box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
        }

        .public-auth-panel-story {
          overflow: hidden;
          background:
            radial-gradient(circle at var(--pointer-x) var(--pointer-y), rgba(255, 255, 255, 0.16), transparent 24%),
            linear-gradient(180deg, #60a5fa 0%, #3b82f6 54%, #1d4ed8 100%);
          color: white;
        }

        .public-auth-story-inner {
          position: relative;
          z-index: 2;
          display: flex;
          min-height: 100%;
          flex-direction: column;
          justify-content: center;
          padding: 42px 34px;
          transform: perspective(1000px) rotateX(var(--panel-tilt-x)) rotateY(var(--panel-tilt-y));
          transition: transform 0.18s ease;
        }

        .public-auth-badge {
          display: inline-flex;
          align-items: center;
          width: fit-content;
          min-height: 34px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.24);
          background: rgba(255, 255, 255, 0.12);
          padding: 0 14px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.22em;
          text-transform: uppercase;
        }

        .public-auth-title {
          margin: 20px 0 0;
          max-width: 12ch;
          font-size: clamp(2.1rem, 3vw, 3.4rem);
          line-height: 1.04;
          font-weight: 800;
          letter-spacing: -0.04em;
          text-wrap: balance;
        }

        .public-auth-description {
          margin: 16px 0 0;
          max-width: 36ch;
          font-size: 15px;
          line-height: 1.8;
          color: rgba(255, 255, 255, 0.9);
        }

        .public-auth-highlight-list {
          margin-top: 26px;
          display: grid;
          gap: 12px;
        }

        .public-auth-highlight-card {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 12px;
          align-items: flex-start;
          border-radius: 22px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.11);
          padding: 14px 16px;
          backdrop-filter: blur(8px);
          font-size: 14px;
          line-height: 1.7;
        }

        .public-auth-highlight-index {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.16);
          font-size: 11px;
          font-weight: 800;
          color: rgba(255, 255, 255, 0.95);
        }

        .public-auth-link-row {
          margin-top: 24px;
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .public-auth-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 48px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          background: rgba(255, 255, 255, 0.12);
          padding: 0 18px;
          font-size: 14px;
          font-weight: 700;
          color: white;
          text-decoration: none;
          transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease;
        }

        .public-auth-link:hover {
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 0.18);
          border-color: rgba(255, 255, 255, 0.26);
        }

        .public-auth-orb {
          position: absolute;
          border-radius: 999px;
          pointer-events: none;
          filter: blur(4px);
        }

        .public-auth-orb-one {
          width: 240px;
          height: 240px;
          right: -80px;
          top: -70px;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0));
          transform: translate3d(calc(var(--float-x) * 0.6), calc(var(--float-y) * -0.5), 0);
        }

        .public-auth-orb-two {
          width: 180px;
          height: 180px;
          left: -50px;
          bottom: -60px;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0));
          transform: translate3d(calc(var(--float-x) * -0.5), calc(var(--float-y) * 0.6), 0);
        }

        @media (max-width: 1024px) {
          .public-auth-panel-form {
            order: 2;
          }

          .public-auth-panel-story {
            order: 1;
          }

          .public-auth-story-inner {
            min-height: 320px;
            transform: none;
          }
        }

        @media (max-width: 640px) {
          .public-auth-shell {
            border-radius: 26px;
          }

          .public-auth-panel-form {
            padding: 16px;
          }

          .public-auth-form-shell {
            border-radius: 22px;
            padding: 18px;
          }

          .public-auth-story-inner {
            padding: 24px 20px;
          }

          .public-auth-link-row {
            flex-direction: column;
          }

          .public-auth-link {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
