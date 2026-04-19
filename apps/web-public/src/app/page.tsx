// apps/web-public/src/app/page.tsx

import Hero from "@/components/home/hero";
import { PromoSection } from "@/components/home/promo-section";
import { RecommendSection } from "@/components/home/recommend-section";
import { InfoHowTo } from "@/components/home/info-howto";
import { InfoRatingCms } from "@/components/home/info-rating-cms";
import { InfoContactCms } from "@/components/home/info-contact-cms";
import { DataState } from "@/components/ui";
import { getPublicApiErrorMessage, listPromos, listTrending } from "@/data/api";
import { features } from "@/lib/config";
import { getHomepageCmsState } from "@/lib/homepage-cms";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SectionState<T> =
  | { status: "ready"; data: T }
  | { status: "empty"; message: string }
  | { status: "error"; message: string };

function resolveListState<T>(
  result: PromiseSettledResult<ReadonlyArray<T>>,
  options: { emptyMessage: string; errorMessage: string }
): SectionState<ReadonlyArray<T>> {
  if (result.status === "rejected") {
    return {
      status: "error",
      message: getPublicApiErrorMessage(result.reason, options.errorMessage),
    };
  }

  if (result.value.length === 0) {
    return {
      status: "empty",
      message: options.emptyMessage,
    };
  }

  return {
    status: "ready",
    data: result.value,
  };
}

export default async function HomePage() {
  const cmsState = await getHomepageCmsState();
  const { content: cms, visibility } = cmsState;

  const [topVillaResult, topJeepResult, topRentResult, topDocResult, promoResult] =
    await Promise.allSettled([
      listTrending({ type: "villa", limit: 4 }),
      listTrending({ type: "jeep", limit: 4 }),
      listTrending({ type: "transport", limit: 4 }),
      listTrending({ type: "dokumentasi", limit: 4 }),
      features.showPromoPackages ? listPromos() : Promise.resolve([]),
    ]);

  const recommendationStates = {
    villa: resolveListState(topVillaResult, {
      emptyMessage: "Belum ada villa unggulan yang bisa ditampilkan.",
      errorMessage: "Rekomendasi villa gagal dimuat.",
    }),
    jeep: resolveListState(topJeepResult, {
      emptyMessage: "Belum ada jeep unggulan yang bisa ditampilkan.",
      errorMessage: "Rekomendasi jeep gagal dimuat.",
    }),
    transport: resolveListState(topRentResult, {
      emptyMessage: "Belum ada layanan rent unggulan yang bisa ditampilkan.",
      errorMessage: "Rekomendasi rent gagal dimuat.",
    }),
    dokumentasi: resolveListState(topDocResult, {
      emptyMessage: "Belum ada layanan dokumentasi unggulan yang bisa ditampilkan.",
      errorMessage: "Rekomendasi dokumentasi gagal dimuat.",
    }),
  } as const;

  const promoState = resolveListState(promoResult, {
    emptyMessage: "Belum ada promo aktif yang bisa ditampilkan di homepage.",
    errorMessage: "Promo homepage gagal dimuat dari server.",
  });

  return (
    <>
      {cmsState.status === "error" ? (
        <div className="container-page pt-6">
          <DataState
            tone="error"
            title="Konten homepage gagal dimuat"
            description={cmsState.error ?? "CMS homepage sedang bermasalah."}
          />
        </div>
      ) : null}

      {cmsState.status === "empty" ? (
        <div className="container-page pt-6">
          <DataState
            tone="empty"
            title="Konten homepage belum tersedia"
            description="CMS homepage belum mengirim section yang bisa ditampilkan."
          />
        </div>
      ) : null}

      {visibility.hero && cms.hero ? <Hero content={cms.hero} /> : null}

      {features.showPromoPackages && visibility.promo && cms.promo ? (
        promoState.status === "ready" ? (
          <PromoSection promos={promoState.data} content={cms.promo} />
        ) : (
          <div className="container-page py-8">
            <DataState
              tone={promoState.status === "error" ? "error" : "empty"}
              title={promoState.status === "error" ? "Promo gagal dimuat" : "Belum ada promo aktif"}
              description={promoState.message}
            />
          </div>
        )
      ) : null}

      {visibility.recommendations && cms.recommendations
        ? cms.recommendations.sections.map((section) => {
            if (!section.enabled) {
              return null;
            }

            const state =
              section.key === "villa"
                ? recommendationStates.villa
                : section.key === "jeep"
                  ? recommendationStates.jeep
                  : section.key === "transport"
                    ? recommendationStates.transport
                    : recommendationStates.dokumentasi;

            if (state.status === "ready") {
              return <RecommendSection key={section.key} title={section.title} items={state.data} />;
            }

            return (
              <div key={section.key} className="container-page py-4">
                <DataState
                  tone={state.status === "error" ? "error" : "empty"}
                  title={section.title}
                  description={state.message}
                />
              </div>
            );
          })
        : null}

      {visibility.howTo && cms.howTo ? <InfoHowTo content={cms.howTo} /> : null}
      {visibility.reviews && cms.reviews ? <InfoRatingCms content={cms.reviews} /> : null}
      {visibility.contact && cms.contact ? <InfoContactCms content={cms.contact} /> : null}
    </>
  );
}
