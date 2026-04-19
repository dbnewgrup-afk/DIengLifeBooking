"use client";

type StepStatus = "done" | "current" | "upcoming";

interface StepItem {
  key: string;
  label: string;
  helper: string;
}

const STEPS: StepItem[] = [
  { key: "select", label: "Pilih Produk", helper: "Cari kategori dan produk" },
  { key: "details", label: "Data Booking", helper: "Isi tamu dan jadwal" },
  { key: "payment", label: "Pembayaran", helper: "Bayar lewat Xendit" },
  { key: "success", label: "Selesai", helper: "Invoice dan status" },
];

function getStatus(index: number, currentIndex: number): StepStatus {
  if (index < currentIndex) return "done";
  if (index === currentIndex) return "current";
  return "upcoming";
}

export function BookingStepper({
  current,
  className = "",
}: {
  current: StepItem["key"];
  className?: string;
}) {
  const currentIndex = Math.max(
    0,
    STEPS.findIndex((step) => step.key === current)
  );

  return (
    <div className={`rounded-[28px] border border-white/10 bg-white/[0.03] p-4 ${className}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {STEPS.map((step, index) => {
          const status = getStatus(index, currentIndex);
          const isLast = index === STEPS.length - 1;

          return (
            <div key={step.key} className="flex min-w-0 flex-1 items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${
                  status === "done"
                    ? "border-emerald-300 bg-emerald-400 text-slate-950"
                    : status === "current"
                      ? "border-emerald-400 bg-emerald-500/15 text-emerald-200"
                      : "border-white/10 bg-white/5 text-slate-400"
                }`}
              >
                {status === "done" ? "✓" : index + 1}
              </div>

              <div className="min-w-0">
                <div
                  className={`text-sm font-semibold ${
                    status === "upcoming" ? "text-slate-400" : "text-white"
                  }`}
                >
                  {step.label}
                </div>
                <div className="text-xs text-slate-400">{step.helper}</div>
              </div>

              {!isLast ? (
                <div className="ml-auto hidden h-px flex-1 bg-white/10 md:block" />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
