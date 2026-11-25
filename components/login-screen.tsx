"use client";

import { useState } from "react";
import { CircleUserRound, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginWithPhone } from "@/lib/app-store";
import { ensurePushSubscription } from "@/lib/push-client";

type LoginScreenProps = {
  onLoggedIn: (fullName: string) => void;
};

export function LoginScreen({ onLoggedIn }: LoginScreenProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async () => {
    setError(null);
    setPending(true);
    try {
      // Must await permission inside the click gesture — Chrome desktop rejects
      // Notification.requestPermission() if it runs after an async login gap.
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "default"
      ) {
        await Notification.requestPermission();
      }

      const result = await loginWithPhone(phoneNumber);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      // Session cookie exists — register SW + store subscription in Redis.
      await ensurePushSubscription();
      onLoggedIn(result.fullName);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="fixed inset-x-0 top-0 bottom-0 mx-auto flex w-full max-w-[34rem] flex-col bg-background px-6 pt-[max(15vh,calc(env(safe-area-inset-top,0px)+2rem))] text-foreground">
      <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <CircleUserRound className="size-8" aria-hidden />
      </div>

      <h1 className="text-center font-heading text-2xl font-medium tracking-tight">
        עובדים-געש
      </h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        התחברות עם מספר טלפון
      </p>

      <form
        className="mt-8 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="phone-number" className="block w-full text-center">
            מספר טלפון
          </Label>
          <Input
            id="phone-number"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="הזינו מספר טלפון"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            disabled={pending}
            autoFocus
            className="text-center placeholder:text-center"
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
          disabled={pending || phoneNumber.replace(/\D/g, "").length < 9}
        >
          <LogIn className="size-4" />
          {pending ? "מתחבר..." : "כניסה"}
        </Button>
      </form>
    </div>
  );
}
