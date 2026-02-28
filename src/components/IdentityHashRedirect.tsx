"use client";

import { useEffect } from "react";

const identityHashPattern =
  /(recovery_token|confirmation_token|invite_token|email_change_token|type=recovery|type=invite|type=signup)/i;
const recoveryHashPattern = /(recovery_token|type=recovery)/i;

export default function IdentityHashRedirect() {
  useEffect(() => {
    const { pathname, hash } = window.location;
    if (pathname !== "/" || !hash) {
      return;
    }

    if (!identityHashPattern.test(hash)) {
      return;
    }

    if (recoveryHashPattern.test(hash)) {
      window.location.replace(`/admin/recover${hash}`);
      return;
    }

    window.location.replace(`/admin/${hash}`);
  }, []);

  return null;
}
