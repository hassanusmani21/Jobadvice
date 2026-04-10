"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

type GoogleAdminSignInButtonProps = {
  callbackUrl: string;
};

export default function GoogleAdminSignInButton({
  callbackUrl,
}: GoogleAdminSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signIn("google", { callbackUrl });
    } catch {
      setIsLoading(false);
      alert("Unable to start Google sign-in. Please try again.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      className="inline-flex w-full items-center justify-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
    >
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-slate-900">
        G
      </span>
      {isLoading ? "Redirecting to Google..." : "Continue with Google"}
    </button>
  );
}
