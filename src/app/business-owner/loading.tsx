import { Spinner } from "@/components/ui/spinner";

export default function BusinessOwnerLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <Spinner className="size-8" />
    </div>
  );
}
