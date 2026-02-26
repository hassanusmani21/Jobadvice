"use client";

import { useEffect } from "react";

const identityHashPattern =
  /(recovery_token|confirmation_token|invite_token|email_change_token|type=recovery|type=invite|type=signup)/i;

export default function IdentityHashRedirect() {
  useEffect(() => {
    const { pathname, hash } = window.location;
    if (pathname !== "/" || !hash) {
      return;
    }

    if (!identityHashPattern.test(hash)) {
      return;
    }

    window.location.replace(`/admin/${hash}`);
  }, []);

  return null;
}

