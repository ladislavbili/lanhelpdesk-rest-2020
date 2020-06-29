import { FirstModel } from './firstModel';
import axios from 'axios';
import {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLList,
} from 'graphql';

const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    firstModels: {
      type: new GraphQLList(FirstModel),
      resolve( parent, args ){
        return ['aaaaa']
      }
    }
  }
})

export default new GraphQLSchema({
  query: RootQuery,
})
