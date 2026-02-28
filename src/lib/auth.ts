import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const ROLES = {
  OWNER: "OWNER",
  OFFICE_MANAGER: "OFFICE_MANAGER",
  SALES_ARBORIST: "SALES_ARBORIST",
  CREW_LEADER: "CREW_LEADER",
  CREW_MEMBER: "CREW_MEMBER",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { company: true },
        });

        if (!user || !user.active) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.companyId,
          companyName: user.company.name,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: string }).role;
        token.companyId = (user as { companyId: string }).companyId;
        token.companyName = (user as { companyName: string }).companyName;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
        (session.user as { role: string }).role = token.role as string;
        (session.user as { companyId: string }).companyId =
          token.companyId as string;
        (session.user as { companyName: string }).companyName =
          token.companyName as string;
      }
      return session;
    },
  },
});

export function canAccess(userRole: string, minRole: Role): boolean {
  const hierarchy: Role[] = [
    "CREW_MEMBER",
    "CREW_LEADER",
    "SALES_ARBORIST",
    "OFFICE_MANAGER",
    "OWNER",
  ];
  return hierarchy.indexOf(userRole as Role) >= hierarchy.indexOf(minRole);
}
