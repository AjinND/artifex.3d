import { Skeleton } from "@/components/ui/Skeleton";
export default function Loading() {
  return (
    <main className="shop-shell" aria-busy="true">
      <span className="sr-only" role="status">
        Loading the studio…
      </span>
      <div aria-hidden="true">
        <Skeleton className="h-3 w-40 mb-8" />
        <Skeleton className="h-16 w-3/4 max-w-lg mb-12" />
        <div className="print-grid">
          {[0, 1, 2].map((i) => (
            <div key={i}>
              <Skeleton className="aspect-square rounded-xl" />
              <Skeleton className="h-5 w-2/3 mt-6" />
              <Skeleton className="h-3 w-1/3 mt-3" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
