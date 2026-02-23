import { Skeleton } from "@/components/ui/skeleton";

export default function PublicLoading() {
  return (
    <div className="w-full max-w-md space-y-4">
      <Skeleton className="h-10 w-40" />
      <Skeleton className="h-4 w-72" />
      <Skeleton className="h-[320px] w-full" />
    </div>
  );
}
