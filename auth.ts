import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { verifyTOTPToken } from "@/lib/totp";
import { prisma } from "@/lib/prisma";

const providers = [
  Credentials({
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
      totpCode: { label: "2FA Code", type: "text" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;
      const user = await prisma.user.findUnique({
        where: { email: credentials.email as string },
      });
      if (!user?.passwordHash) return null;
      const valid = await bcrypt.compare(
        credentials.password as string,
        user.passwordHash
      );
      if (!valid) return null;

      if (user.twoFactorEnabled && user.twoFactorSecret) {
        const code = (credentials.totpCode as string) ?? "";
        if (!code) return null;
        if (!verifyTOTPToken(user.twoFactorSecret, code)) return null;
      }

      return user;
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.unshift(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }) as never
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers,
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.role = (user as any).role;
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
