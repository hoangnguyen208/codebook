import { cn } from "@/lib/utils";
import { getUserInitials } from "@/lib/auth/user";

type UserAvatarProps = {
  nameOrEmail?: string | null;
  imageUrl?: string | null;
  className?: string;
  textClassName?: string;
};

export function UserAvatar({ nameOrEmail, imageUrl, className, textClassName }: UserAvatarProps) {
  const initials = getUserInitials(nameOrEmail);

  if (imageUrl) {
    return (
      <span
        className={cn(
          "block rounded-full bg-muted bg-cover bg-center bg-no-repeat",
          className,
        )}
        style={{ backgroundImage: `url("${imageUrl}")` }}
        aria-label={nameOrEmail ?? "User avatar"}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-sidebar-primary font-semibold text-sidebar-primary-foreground",
        className,
        textClassName,
      )}
      aria-label={nameOrEmail ?? "User avatar initials"}
    >
      {initials}
    </span>
  );
}
