import { signOutAction } from "@/app/actions";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <Button type="submit" variant="outline" className="bg-white/80">
        Sign out
      </Button>
    </form>
  );
}

