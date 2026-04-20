import { signOutAction } from "@/app/actions";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <Button type="submit" variant="ghost" size="sm" className="text-[var(--muted)] hover:bg-white/76 hover:text-[var(--ink)]">
        Sign out
      </Button>
    </form>
  );
}
