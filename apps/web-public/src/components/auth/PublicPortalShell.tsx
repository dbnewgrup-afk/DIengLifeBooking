"use client";

import Image from "next/image";
import Link from "next/link";
import { type ReactNode } from "react";

type PublicPortalLink = {
  href: string;
  label: string;
  external?: boolean;
};

type PublicPortalShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  links?: PublicPortalLink[];
  children: ReactNode;
};

function PortalLink({ href, label, external }: PublicPortalLink) {
  if (external) {
    return (
      <a href={href} className="portalLink">
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className="portalLink">
      {label}
    </Link>
  );
}

export function PublicPortalShell({
  eyebrow,
  title,
  description,
  links = [],
  children,
}: PublicPortalShellProps) {
  return (
    <main className="portalRoot">
      <div className="portalOverlay" />
      <section className="portalCard">
        <div className="portalHero">
          <div className="portalHeroRings" aria-hidden="true" />
          <div className="portalLogoFrame">
            <Image
              src="/images/logo.png"
              alt="Dieng Life Villas"
              width={270}
              height={74}
              className="portalLogo"
              priority
            />
          </div>
          <p className="portalEyebrow">{eyebrow}</p>
          <h1 className="portalTitle">{title}</h1>
          <p className="portalDescription">{description}</p>
        </div>

        <div className="portalBody">{children}</div>

        {links.length > 0 ? (
          <div className="portalLinks">
            {links.map((link) => (
              <PortalLink key={`${link.href}-${link.label}`} {...link} />
            ))}
          </div>
        ) : null}
      </section>

      <style jsx>{`
        .portalRoot {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          background: url("/images/slider.webp") center center / cover no-repeat;
        }

        .portalOverlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(180deg, rgba(10, 34, 72, 0.16), rgba(10, 34, 72, 0.22)),
            radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.2), transparent 26%);
        }

        .portalCard {
          position: relative;
          z-index: 1;
          width: min(100%, 470px);
          overflow: hidden;
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.96);
          box-shadow: 0 28px 70px rgba(16, 24, 40, 0.28);
          backdrop-filter: blur(10px);
        }

        .portalHero {
          position: relative;
          overflow: hidden;
          padding: 28px 28px 26px;
          background: linear-gradient(135deg, #0f6aa8 0%, #1688cc 100%);
          color: #f8fbff;
        }

        .portalHeroRings {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 88% 18%, transparent 0 46px, rgba(255, 255, 255, 0.1) 46px 47px, transparent 47px),
            radial-gradient(circle at -8% 78%, transparent 0 62px, rgba(255, 255, 255, 0.08) 62px 63px, transparent 63px);
          pointer-events: none;
        }

        .portalLogo {
          display: block;
          width: min(100%, 220px);
          height: auto;
          margin: 0;
        }

        .portalLogoFrame {
          position: relative;
          z-index: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          padding: 12px 18px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.96);
          box-shadow: 0 12px 28px rgba(8, 25, 45, 0.16);
        }

        .portalEyebrow {
          position: relative;
          z-index: 1;
          margin: 0;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(248, 251, 255, 0.84);
        }

        .portalTitle {
          position: relative;
          z-index: 1;
          margin: 10px 0 0;
          font-size: 2rem;
          line-height: 1.05;
          font-weight: 800;
          letter-spacing: -0.03em;
        }

        .portalDescription {
          position: relative;
          z-index: 1;
          margin: 8px 0 0;
          font-size: 14px;
          line-height: 1.55;
          color: rgba(248, 251, 255, 0.86);
        }

        .portalBody {
          padding: 26px 28px 16px;
        }

        .portalLinks {
          display: flex;
          justify-content: center;
          gap: 16px;
          padding: 0 28px 26px;
          flex-wrap: wrap;
        }

        :global(.portalLink) {
          color: #6d7b96;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          transition: color 0.18s ease;
        }

        :global(.portalLink:hover) {
          color: #0f6aa8;
        }

        @media (max-width: 640px) {
          .portalCard {
            border-radius: 24px;
          }

          .portalHero {
            padding: 24px 22px 22px;
          }

          .portalTitle {
            font-size: 1.75rem;
          }

          .portalBody {
            padding: 22px 22px 14px;
          }

          .portalLinks {
            padding: 0 22px 22px;
          }
        }
      `}</style>
    </main>
  );
}
