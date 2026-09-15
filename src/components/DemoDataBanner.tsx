import { FlaskConical } from "lucide-react";

export default function DemoDataBanner() {
  return (
    <div className="sticky top-0 z-[1200] flex items-center justify-center gap-2 bg-warning px-4 py-2 text-xs font-bold uppercase text-warning-foreground">
      <FlaskConical className="h-4 w-4" aria-hidden="true" />
      Demo data — not real students
    </div>
  );
}