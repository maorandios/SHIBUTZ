"use client";

import { useState } from "react";
import { CircleUserRound, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginWithId } from "@/lib/app-store";

type LoginScreenProps = {
  onLoggedIn: (fullName: string) => void;
};

export function LoginScreen({ onLoggedIn }: LoginScreenProps) {
  const [idNumber, setIdNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async () => {
    setError(null);
    setPending(true);
    try {
      const result = await loginWithId(idNumber);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onLoggedIn(result.fullName);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="fixed inset-x-0 top-0 bottom-0 mx-auto flex w-full max-w-[34rem] flex-col justify-center bg-background px-6 text-foreground">
      <div className="mx-auto mb-8 flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <CircleUserRound className="size-8" aria-hidden />
      </div>

      <h1 className="text-center font-heading text-2xl font-medium tracking-tight">
        עובדים-געש
      </h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        התחברות עם מספר תעודת זהות
      </p>

      <form
        className="mt-8 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="id-number">תעודת זהות</Label>
          <Input
            id="id-number"
            inputMode="numeric"
            autoComplete="username"
            placeholder="הזינו מספר תעודת זהות"
            value={idNumber}
            onChange={(event) => setIdNumber(event.target.value)}
            disabled={pending}
            autoFocus
          />
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="pressable w-full"
          disabled={pending || idNumber.trim().length < 5}
        >
          <LogIn className="size-4" />
          {pending ? "מתחבר..." : "כניסה"}
        </Button>
      </form>
    </div>
  );
}
