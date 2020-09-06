import { gql } from 'apollo-server-express';
import Querries from './querries';
import Mutations from './mutations';
import DataTypes from "./dataTypes";
import { Directives } from '../directives';
import Subscriptions from './subscriptions'
export default gql`
  ${Directives}
  ${DataTypes}
  ${Querries}
  ${Mutations}
  ${Subscriptions}
`;
