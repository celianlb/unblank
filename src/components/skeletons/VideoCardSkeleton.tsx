import Skeleton from "./Skeleton";

export default function VideoCardSkeleton() {
  return (
    <div className="w-full sm:w-[450px] bg-white border-[3px] border-black rounded-xl shadow-[4px_4px_0px_#000000] flex flex-col items-start box-border relative overflow-hidden">
      {/* Header with platform logo and info */}
      <div className="flex flex-row items-center p-3 gap-[10px] w-full bg-white">
        {/* Platform Logo */}
        <Skeleton className="w-[70px] h-[70px] min-w-[70px] min-h-[70px] rounded-full" />

        {/* Platform name and URL */}
        <div className="flex flex-col items-start gap-2">
          <Skeleton className="h-[30px] w-32 rounded-md" />
          <Skeleton className="h-3 w-24 rounded" />
        </div>
      </div>

      {/* Video Thumbnail */}
      <Skeleton className="w-full h-[200px]" />

      {/* Bottom content */}
      <div className="flex flex-col gap-3 p-3 w-full">
        {/* Title */}
        <Skeleton className="h-6 w-full rounded-md" />
        <Skeleton className="h-6 w-2/3 rounded-md" />

        {/* Link bar */}
        <div className="flex flex-row items-center gap-2 w-full h-[41px]">
          <Skeleton className="flex-1 h-[41px] rounded-lg" />
        </div>

        {/* Tags */}
        <div className="flex flex-row items-start gap-1.5">
          <Skeleton className="h-[29px] w-16 rounded-lg" />
          <Skeleton className="h-[29px] w-20 rounded-lg" />
          <Skeleton className="h-[29px] w-14 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
