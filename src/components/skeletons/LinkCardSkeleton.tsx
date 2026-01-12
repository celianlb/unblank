import Skeleton from "./Skeleton";

export default function LinkCardSkeleton() {
  return (
    <div className="w-full sm:w-[200px] md:w-[230px] lg:w-[250px] xl:w-[272px] h-[280px] sm:h-[300px] md:h-[330px] lg:h-[345px] xl:h-[359px] bg-[#FEF8EE] border-3 sm:border-4 border-black rounded-2xl sm:rounded-[20px] shadow-[3px_3px_0px_#000000] sm:shadow-[4px_4px_0px_#000000] flex-none box-border relative overflow-hidden">
      <Skeleton className="absolute inset-0 rounded-xl sm:rounded-[16px]" />
    </div>
  );
}
