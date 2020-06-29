import {
  GraphQLObjectType,

  GraphQLInt,
  GraphQLFloat,
  GraphQLString,
  GraphQLBoolean,
} from 'graphql';

export const FirstModel = new GraphQLObjectType({
  name: 'firstModel',
  fields: () => ({
    testingInt: { type: GraphQLInt },
    testingFloat: { type: GraphQLFloat },
    testingName: { type: GraphQLString },
    testingBool: { type: GraphQLBoolean },
    otherResource: { type: TestResource },
  })
})

export const TestResource = new GraphQLObjectType({
  name: 'testResource',
  fields: () => ({
    resourceName: { type: GraphQLString },
  })
})
