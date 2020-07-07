import { gql } from 'apollo-server-express';
import Querries from './querries';
import Mutations from './mutations';
import DataTypes from "./dataTypes";

export default gql`
  ${DataTypes}
  ${Querries}
  ${Mutations}
`;
