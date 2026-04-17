"use client";

import { signIn } from "next-auth/react";

export default function SignInButton() {
  return (
    <button
      onClick={() => signIn("reddit", { callbackUrl: "/dashboard" })}
      className="w-full py-3 px-6 bg-reddit hover:bg-orange-500 text-white font-semibold rounded-xl transition-colors text-sm"
    >
      Sign in with Reddit
    </button>
  );
}
