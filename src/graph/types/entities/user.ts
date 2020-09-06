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
  language: LanguageEnum!
  tasklistLayout: Int!
  role: BasicRole!
  company: BasicCompany!
  statuses: [Status]!
}

enum LanguageEnum {
  sk
  en
}

type BasicUser {
  id: Int!
  email: String!
  username: String!
  name: String!
  surname: String!
  fullName: String!
  company: BasicCompany!
  language: LanguageEnum!
  role: BasicRole!
}


type UserData {
  user: User
  accessToken: String
}

input TaskPairInput {
  taskId: Int!
  requesterId: Int!
}

input SubtaskPairInput {
  subtaskId: Int!
  assignedId: Int!
}

input WorkTripPairInput {
  workTripId: Int!
  assignedId: Int!
}
`
export const UserQuerries = `
users: [User]
user(id: Int!): User
basicUsers: [BasicUser]
basicUser(id: Int!): BasicUser
getMyData: User
`

export const UserMutations = `
registerUser( active: Boolean, username: String!, email: String!, name: String!, surname: String!, password: String!, receiveNotifications: Boolean, signature: String, roleId: Int!, companyId: Int!, language: LanguageEnum ): User
loginUser( email: String!, password: String! ): UserData
setUserActive( id: Int!, active: Boolean! ): User
updateUser( id: Int!, username: String, email: String, name: String, surname: String, password: String, receiveNotifications: Boolean, signature: String, roleId: Int, companyId: Int, language: LanguageEnum ): User
loginToken: UserData
logoutUser: Boolean
logoutAll: String
setUserStatuses( ids: [Int]! ): User
setTasklistLayout( tasklistLayout: Int! ): User
updateProfile( username: String, email: String, name: String, surname: String, password: String, receiveNotifications: Boolean, signature: String, language: LanguageEnum ): UserData,
deleteUser( id: Int!, taskPairs: [TaskPairInput]!, subtaskPairs: [SubtaskPairInput]!, workTripPairs: [WorkTripPairInput]! ): User
`
