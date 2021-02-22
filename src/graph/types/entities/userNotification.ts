import defaultAttributes from './defaultAttributes';

export const UserNotification = `
type UserNotification {
  ${defaultAttributes}
  subject: String!
  message: String!
  read: Boolean!
  forUser: User!
  fromUser: User
  task: Task
}
`
export const UserNotificationQuerries = `
userNotifications( limit: Int ): [UserNotification]
userNotificationsCount: Int
`

export const UserNotificationMutations = `
setUserNotificationRead( id: Int!, read: Boolean ): UserNotification
setSelectedUserNotificationsRead( ids: [Int]!, read: Boolean ): [Int]
setAllUserNotificationsRead( read: Boolean ): Boolean

deleteUserNotification( id: Int! ): UserNotification
deleteSelectedUserNotifications( ids: [Int]! ): [Int]
deleteAllUserNotifications: Boolean
`
