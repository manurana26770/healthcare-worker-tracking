import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { typeDefs } from '@/lib/graphql/schema';
import { resolvers } from '@/lib/graphql/resolvers';
import { NextRequest } from 'next/server';

interface Context {
  req: NextRequest;
  res: unknown;
}

const server = new ApolloServer<Context>({
  typeDefs,
  resolvers,
});

const handler = startServerAndCreateNextHandler<NextRequest, Context>(server, {
  context: async (req, res) => {
    // TODO: Add proper authentication context here
    return {
      req,
      res,
    };
  },
});

export { handler as GET, handler as POST }; 