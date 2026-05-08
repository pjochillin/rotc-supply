import { NextAuthOptions } from 'next-auth';
import OIDCProvider from 'next-auth/providers/oidc';

export const authOptions: NextAuthOptions = {
  providers: [
    OIDCProvider({
      clientId: process.env.OIDC_CLIENT_ID!,
      clientSecret: process.env.OIDC_CLIENT_SECRET!,
      issuer: process.env.OIDC_ISSUER!,
      authorization: { params: { scope: 'openid profile email' } },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          id: user.id,
        };
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};

