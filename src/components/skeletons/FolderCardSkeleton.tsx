import Skeleton from "./Skeleton";

export default function FolderCardSkeleton() {
  return (
    <div className="w-full h-auto bg-[#FEF8EE] border-4 border-black rounded-[20px] flex-none box-border flex flex-col gap-4 p-3">
      {/* Images Grid (2 images side by side) */}
      <div className="flex flex-row gap-2 w-full h-[150px] sm:h-[160px]">
        <Skeleton className="flex-1 h-[150px] sm:h-[160px] rounded-lg" />
        <Skeleton className="flex-1 h-[150px] sm:h-[160px] rounded-lg" />
      </div>

      {/* Title */}
      <Skeleton className="h-[30px] w-3/4 rounded-md" />

      {/* Info */}
      <div className="flex flex-col gap-1 mt-auto">
        <Skeleton className="h-3 w-20 rounded" />
        <Skeleton className="h-3 w-16 rounded" />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-row items-center justify-between w-full mt-auto">
        <div className="flex flex-row items-center gap-2">
          <Skeleton className="w-9 h-9 rounded-lg" />
          <Skeleton className="w-9 h-9 rounded-lg" />
          <Skeleton className="w-9 h-9 rounded-lg" />
        </div>
        <Skeleton className="w-9 h-9 rounded-lg" />
      </div>
    </div>
  );
}
