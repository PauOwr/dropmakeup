import { Skeleton } from "@/components/ui/skeleton"

const SkeletonProductPreview = () => {
  return (
    <div aria-hidden>
      <Skeleton className="aspect-4/5 w-full bg-nude-soft" />
      <div className="mt-4 flex flex-col gap-2">
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/5" />
      </div>
    </div>
  )
}

export default SkeletonProductPreview
