import { NextAuthOptions, Profile } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import CredentialsProvider from 'next-auth/providers/credentials';

const providers: any[] = [
  {
    id: 'oidc',
    name: 'Cornell',
    type: 'oauth',
    wellKnown: 'https://shibidp.cit.cornell.edu/.well-known/openid-configuration',
    authorization: { params: { scope: 'openid profile' } },
    clientId: process.env.OIDC_CLIENT_ID!,
    clientSecret: process.env.OIDC_CLIENT_SECRET!,
    idToken: true,
    checks: ['pkce', 'state'],
    profile(profile: Profile) {
      console.log("[AUTH] OIDC Profile received:", profile);
      const email = `${profile.sub}@cornell.edu`;
      // OIDC profile may not have name, use NetID (sub) as fallback.
      const name = profile.name || profile.sub;
      console.log(`[AUTH] Constructed email: ${email}`);
      console.log(`[AUTH] Using name: ${name}`);
      return {
        id: profile.sub,
        name: name,
        email: email,
      };
    },
  },
];

if (process.env.NODE_ENV === 'development') {
  providers.push(
    CredentialsProvider({
      name: 'localhost',
      credentials: {},
      async authorize() {
        const email = 'adc273@cornell.edu';
        const user = await prisma.user.upsert({
          where: { email },
          update: { role: 'USER' },
          create: {
            email,
            name: 'Andrew Campbell',
            role: 'USER',
          },
        });
        console.log('Ensured local development user is USER role.');
        return user;
      },
    })
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers,
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user, account }) {
      console.log("[AUTH] signIn callback triggered.");
      console.log("[AUTH] User object:", user);
      console.log("[AUTH] Account object:", account);
      // Allow sign in for the credentials provider
      if (account?.provider === 'credentials') {
        console.log(`[AUTH] Allowing sign-in for local dev user: ${user.email}`);
        return true;
      }

      // For all other providers, check if the user is in the database
      if (!user.email) {
        console.log('[AUTH] Denying sign-in: No email found in user profile.');
        return false;
      }
      
      // Use findFirst with case-insensitive search for email
      let dbUser = await prisma.user.findFirst({
        where: { email: { equals: user.email, mode: 'insensitive' } },
      });



      if (!dbUser || !account) {
        console.log(`[AUTH] Denying sign-in for unapproved user or missing account information: ${user.email}`);
        return false;
      }

      const accountAlreadyLinked = await prisma.account.findFirst({
        where: {
          provider: account.provider,
          providerAccountId: account.providerAccountId,
        },
      });

      if (!accountAlreadyLinked) {
        await prisma.account.create({
          data: {
            userId: dbUser.id,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            refresh_token: account.refresh_token,
            access_token: account.access_token,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token,
          },
        });
        console.log(`[AUTH] Successfully linked new account for ${user.email}`);
      }

      console.log(`[AUTH] Allowing sign-in for approved user: ${user.email}`);
      return true;
    },
    async jwt({ token, user, account }) {
      if (account && user) { // This block only runs on sign-in
        token.id = user.id;
        token.name = user.name;
        // For local development, force the role to USER in the token
        if (account.provider === 'credentials') {
            console.log('[AUTH] Credentials provider sign-in. Forcing USER role in JWT.');
            token.role = 'USER';
        } else {
            // For other providers, use the role from the user object
            token.role = user.role;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === 'development',
  pages: {
    signIn: '/login',
  },
};

