import Skeleton from "./Skeleton";

export default function LinkCardSkeleton() {
  return (
    <div className="w-full aspect-[4/5] sm:aspect-[3/4] bg-[#FEF8EE] border-3 sm:border-4 border-black rounded-2xl sm:rounded-[20px] shadow-[3px_3px_0px_#000000] sm:shadow-[4px_4px_0px_#000000] flex-none box-border relative overflow-hidden">
      <Skeleton className="absolute inset-0 rounded-xl sm:rounded-[16px]" />
    </div>
  );
}
