import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  type Tasks {
    id: Int,
    title: String,
    tags: [Tags]
  }

  type Tags {
    id: Int,
    title: String,
    color: String
  }

  type Query {
    tasks: [Tasks]
  }
`;
