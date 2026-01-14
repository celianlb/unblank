import Skeleton from "./Skeleton";

export default function DetailedLinkCardSkeleton() {
  return (
    <div className="w-full h-auto bg-white border-[3px] border-black rounded-xl flex flex-col items-start p-3 gap-[10px] box-border relative overflow-hidden">
      {/* Header with favicon and site info */}
      <div className="flex flex-row items-center p-[2px] gap-[10px] w-full">
        {/* Favicon */}
        <Skeleton className="w-[70px] h-[70px] min-w-[70px] min-h-[70px] rounded-full" />

        {/* Site name and URL */}
        <div className="flex flex-col items-start gap-[10px]">
          <Skeleton className="h-[30px] w-32 rounded-md" />
          <Skeleton className="h-3 w-24 rounded" />
        </div>
      </div>

      {/* Description */}
      <div className="flex flex-col items-start gap-1 w-full">
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="h-3 w-2/3 rounded" />
      </div>

      {/* Link bar with actions */}
      <div className="flex flex-row items-center gap-[10px] w-full h-[41px]">
        <Skeleton className="flex-1 h-[41px] rounded-lg" />
        <Skeleton className="w-[41px] h-[41px] rounded-lg" />
        <Skeleton className="w-[41px] h-[41px] rounded-lg" />
      </div>

      {/* Tags */}
      <div className="flex flex-row items-start gap-1.5 w-full overflow-hidden">
        <Skeleton className="h-[29px] w-16 rounded-lg" />
        <Skeleton className="h-[29px] w-20 rounded-lg" />
      </div>
    </div>
  );
}
