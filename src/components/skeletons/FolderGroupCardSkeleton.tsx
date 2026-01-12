import Skeleton from "./Skeleton";

export default function FolderGroupCardSkeleton() {
  return (
    <div className="w-[272px] min-h-[359px] bg-[#FEF8EE] border-4 border-black rounded-[20px] shadow-[4px_4px_0px_#000000] flex-none box-border flex flex-col gap-4 p-3">
      {/* Images Grid (2x2) */}
      <div className="flex flex-col gap-1.5 w-full">
        {/* Top row */}
        <div className="flex flex-row gap-1.5 w-full h-[90px]">
          <Skeleton className="flex-1 h-[90px] rounded-lg" />
          <Skeleton className="flex-1 h-[90px] rounded-lg" />
        </div>
        {/* Bottom row */}
        <div className="flex flex-row gap-1.5 w-full h-[89px]">
          <Skeleton className="flex-1 h-[89px] rounded-lg" />
          <Skeleton className="flex-1 h-[89px] rounded-lg" />
        </div>
      </div>

      {/* Title */}
      <Skeleton className="h-[30px] w-3/4 rounded-md" />

      {/* Info */}
      <div className="flex flex-col gap-1">
        <Skeleton className="h-3 w-20 rounded" />
        <Skeleton className="h-3 w-16 rounded" />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-row items-center justify-between w-full mt-auto">
        <div className="flex flex-row items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-9 h-9 rounded-lg" />
          <Skeleton className="w-9 h-9 rounded-lg" />
          <Skeleton className="w-9 h-9 rounded-lg" />
        </div>
        <Skeleton className="w-9 h-9 rounded-lg" />
      </div>
    </div>
  );
}
