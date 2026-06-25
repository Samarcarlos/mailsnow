import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { verifyTOTPToken } from "@/lib/totp";
import { prisma } from "@/lib/prisma";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const googleProvider: any =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? Google({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        checks: ["state"],
      })
    : null;

const credentialsProvider = Credentials({
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
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const providers: any[] = googleProvider
  ? [googleProvider, credentialsProvider]
  : [credentialsProvider];

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret:
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    "mailsnow-2026-auth-secret-key-32ch",
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  providers,
  logger: {
    error: (error: Error) => {
      console.error("[NextAuth REAL ERROR]", {
        name: error.name,
        message: error.message,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cause: (error as any).cause,
        stack: error.stack?.split("\n").slice(0, 5).join("\n"),
      });
    },
    warn: (code: string) => console.warn("[NextAuth warn]", code),
    debug: (code: string, metadata: unknown) =>
      console.log("[NextAuth debug]", code, JSON.stringify(metadata ?? {}).slice(0, 200)),
  },
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async signIn({ account }: any) {
      console.log("[auth] signIn callback reached, provider:", account?.provider);
      return true;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    session({ session, user }: any) {
      if (user) {
        session.user.id = user.id;
        session.user.role = user.role ?? "CUSTOMER";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/auth-error",
  },
});
