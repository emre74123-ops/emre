"use client";

import { createClient } from "@supabase/supabase-js";

let memberClient: ReturnType<typeof createClient> | undefined;

export function createMemberClient() {
  if (!memberClient) {
    memberClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        auth: {
          storageKey: "iyilik-adresim-member-auth",
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      },
    );
  }
  return memberClient;
}
