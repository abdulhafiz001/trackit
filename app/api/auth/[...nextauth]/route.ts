import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" }
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          return null;
        }

        await dbConnect();
        
        // Find user by email
        const user = await User.findOne({ email: credentials.email.toLowerCase() });
        
        if (user) {
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            itDurationWeeks: user.itDurationWeeks,
            startDate: user.startDate.toISOString(),
          };
        }
        
        // If no user is found, the frontend will handle redirecting to onboarding.
        // We return null to reject the login attempt here.
        return null;
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.itDurationWeeks = (user as any).itDurationWeeks;
        token.startDate = (user as any).startDate;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).itDurationWeeks = token.itDurationWeeks as number;
        (session.user as any).startDate = token.startDate as string;
      }
      return session;
    }
  },
  pages: {
    signIn: "/",
    // Error page might be useful, but for now redirecting to / is fine
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
