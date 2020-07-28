import defaultAttributes from './defaultAttributes';

export const User = `
type User {
  ${defaultAttributes}
  active: Boolean!
  username: String!
  email: String!
  name: String!
  surname: String!
  fullName: String!
  receiveNotifications: Boolean!
  signature: String
  role: Role!
  company: BasicCompany!
}

type BasicUser {
  id: Int!
  email: String!
  username: String!
  name: String!
  surname: String!
  fullName: String!
  company: BasicCompany!
}


type UserData {
  user: User
  accessToken: String
}
`
export const UserQuerries = `
users: [User]
user(id: Int!): User
basicUsers: [BasicUser]
basicUser(id: Int!): BasicUser
`

export const UserMutations = `
registerUser( active: Boolean, username: String!, email: String!, name: String!, surname: String!, password: String!, receiveNotifications: Boolean, signature: String, roleId: Int!, companyId: Int!): User
loginUser( email: String!, password: String! ): UserData
loginToken: UserData
logoutUser: Boolean
logoutAll: String
setUserActive( id: Int!, active: Boolean! ): User
updateUser( id: Int!, username: String, email: String, name: String, surname: String, password: String, receiveNotifications: Boolean, signature: String, roleId: Int, companyId: Int ): User
updateProfile( username: String, email: String, name: String, surname: String, password: String, receiveNotifications: Boolean, signature: String ): UserData,
deleteUser( id: Int! ): User
`
