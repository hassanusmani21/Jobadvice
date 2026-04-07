"use client";

import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

type GoogleAdminSignInButtonProps = {
  callbackUrl: string;
};

export default function GoogleAdminSignInButton({
  callbackUrl,
}: GoogleAdminSignInButtonProps) {
  return (
    <GoogleSignInButton callbackUrl={callbackUrl} />
  );
}
