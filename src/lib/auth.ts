import { NextAuthOptions, User, Session } from 'next-auth';

interface CustomSession extends Session {
  user: User & {
    id: string;
  };
}

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: 'oidc',
      name: 'Cornell',
      type: 'oauth',
      wellKnown: 'https://shibidp.cit.cornell.edu/.well-known/openid-configuration',
      authorization: { params: { scope: 'openid profile email' } },
      clientId: process.env.OIDC_CLIENT_ID!,
      clientSecret: process.env.OIDC_CLIENT_SECRET!,
      idToken: true,
      checks: ['pkce', 'state'],
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
        };
      },
    },
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
      const customSession = session as CustomSession;
      if (customSession.user) {
        customSession.user.id = token.id as string;
      }
      return customSession;
    },
  },
  pages: {
    signIn: '/login',
  },
};

