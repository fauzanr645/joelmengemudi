import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: "OWNER" | "CUSTOMER_SERVICE" | "INSTRUCTOR" | "STUDENT"
      branchId: string | null
      branchName: string | null
    } & DefaultSession["user"]
  }

  interface User {
    role: "OWNER" | "CUSTOMER_SERVICE" | "INSTRUCTOR" | "STUDENT"
    branchId: string | null
    branchName: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: "OWNER" | "CUSTOMER_SERVICE" | "INSTRUCTOR" | "STUDENT"
    branchId: string | null
    branchName: string | null
  }
}
