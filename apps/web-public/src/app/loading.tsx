import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="container-page space-y-10 py-10">
      <div className="rounded-[32px] bg-slate-900 px-6 py-12 text-white">
        <Skeleton className="h-6 w-40 bg-white/15" />
        <Skeleton className="mt-5 h-14 w-2/3 bg-white/15" />
        <Skeleton className="mt-4 h-5 w-1/2 bg-white/15" />
        <div className="mt-8 rounded-[24px] border border-white/10 bg-white/5 p-4">
          <Skeleton className="h-14 w-full bg-white/10" />
          <Skeleton className="mt-3 h-14 w-full bg-white/10" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}
