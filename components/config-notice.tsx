import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function ConfigNotice({
  title,
  message,
  className,
}: {
  title: string;
  message: string;
  className?: string;
}) {
  return (
    <Card className={cn("border-amber-200 bg-amber-50/90 p-4 shadow-none", className)}>
      <p className="text-sm font-semibold text-amber-900">{title}</p>
      <p className="mt-1 text-sm leading-6 text-amber-800">{message}</p>
    </Card>
  );
}
