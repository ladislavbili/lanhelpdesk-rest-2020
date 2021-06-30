import { gql } from 'apollo-server-express';
import Queries from './queries';
import Mutations from './mutations';
import DataTypes from "./dataTypes";
import { Directives } from '../directives';
import Subscriptions from './subscriptions'
export default gql`
  ${Directives}
  ${DataTypes}
  ${Queries}
  ${Mutations}
  ${Subscriptions}
`;
