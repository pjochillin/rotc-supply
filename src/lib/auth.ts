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
      const name = profile.name || profile.displayName;
      const email = `${profile.sub}@cornell.edu`;
      console.log(`[AUTH] Constructed email: ${email}`);
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
        let user = await prisma.user.findUnique({
          where: { email: 'jo447@cornell.edu' },
        });
        if (!user) {
          console.log('Local development user (jo447@cornell.edu) not found. Creating a new one.');
          user = await prisma.user.create({
            data: {
              email: 'jo447@cornell.edu',
              name: 'Joshua Ochalek',
              role: 'ADMIN',
            },
          });
        }
        return user;
      },
    })
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma, {
    allowDangerousEmailAccountLinking: true,
  }),
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

      if (dbUser && !dbUser.name && user.name) {
        console.log(`[AUTH] Existing user ${dbUser.email} is missing a name. Updating to '${user.name}'.`);
        const updatedUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: { name: user.name }
        });
        dbUser.name = updatedUser.name;
      }

      // If user does not exist and it's an OIDC login, create a new user.
      if (!dbUser && account?.provider === 'oidc') {
        console.log(`[AUTH] New user from OIDC: ${user.email}. Creating user.`);
        dbUser = await prisma.user.create({
            data: {
                email: user.email,
                name: user.name,
                role: 'USER', // Default role for new users
            }
        });
      }
      
      if (!dbUser) {
        console.log(`[AUTH] Denying sign-in for unapproved user: ${user.email}`);
        return false;
      }
      console.log(`[AUTH] Allowing sign-in for approved user: ${user.email}`);
      return true;
    },
    async jwt({ token, user, account }) {
      console.log("[AUTH] jwt callback triggered.");
      console.log("[AUTH] JWT token object:", token);
      console.log("[AUTH] JWT user object:", user);
      console.log("[AUTH] JWT account object:", account);
      if (account && user) {
        token.id = user.id;
        token.role = user.role;
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

