import type { DefaultSession } from "next-auth";

import type { UserRole } from "@/data/wiki";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    uid?: string;
    role?: UserRole;
  }
}
