import defaultAttributes from './defaultAttributes';

export const User = `
type User {
  ${defaultAttributes}
  active: Boolean!,
  username: String!,
  email: String!,
  name: String!,
  surname: String!,
  fullName: String!,
  receiveNotifications: Boolean!,
  signature: String,
}

type UserData {
  user: User,
  accessToken: String,
}
`
export const UserQuerries = `
users: [User],
user(id: Int!): User,
`

export const UserMutations = `
registerUser( active: Boolean, username: String!, email: String!, name: String!, surname: String!, password: String!, receiveNotifications: Boolean, signature: String): User,
loginUser( email: String!, password: String! ): UserData,
logoutUser: Boolean,
logoutAll: Boolean,
setUserActive( id: Int!, active: Boolean! ): User,
updateUser( id: Int!, active: Boolean, username: String, email: String, name: String, surname: String, password: String, receiveNotifications: Boolean, signature: String ): User,
updateProfile( active: Boolean, username: String, email: String, name: String, surname: String, password: String, receiveNotifications: Boolean, signature: String ): User,
deleteUser( id: Int! ): User,
`
