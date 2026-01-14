import Skeleton from "./Skeleton";

export default function ImageCardSkeleton() {
  return (
    <div className="w-full aspect-[4/5] sm:aspect-[3/4] bg-[#FEF8EE] border-3 sm:border-4 border-black rounded-2xl sm:rounded-[20px] relative box-border overflow-hidden">
      <Skeleton className="absolute inset-0 rounded-xl sm:rounded-[16px]" />
    </div>
  );
}
