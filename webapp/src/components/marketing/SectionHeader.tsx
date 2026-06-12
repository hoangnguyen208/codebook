import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  label?: string;
  title: string;
  description?: string;
  className?: string;
};

export function SectionHeader({
  label,
  title,
  description,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("mb-12 text-center", className)}>
      {label ? (
        <p className="mb-3 text-sm font-medium text-blue-400 uppercase tracking-wider">
          {label}
        </p>
      ) : null}
      <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-base text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
