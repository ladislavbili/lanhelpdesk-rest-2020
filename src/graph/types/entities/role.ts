import defaultAttributes from './defaultAttributes';
const createAccessRights = (required) => {
  return [
    'login',
    'vykazy',
    'publicFilters',
    'addProjects',
    'viewErrors',

    'users',
    'companies',
    'pausals',
    'projects',
    'statuses',
    'prices',
    'roles',
    'taskTypes',
    'tripTypes',
    'imaps',
    'smtps',

    'tasklistLayout',
    'tasklistCalendar',
    'tasklistPreferences',
    'customFilters',
    'lanwiki',
    'cmdb',
    'pass',
  ].reduce((acc, right) => {
    return acc + `${right}: Boolean${(required ? '!' : '')}\n`;
  }, '')
}

export const Role = `
type Role {
  ${defaultAttributes}
  title: String!
  order: Int!
  level: Int!

  accessRights: AccessRights!
  currentUsers: [BasicUser]
  imaps: [Imap]!
}

type BasicRole{
  ${defaultAttributes}
  title: String!
  order: Int!
  level: Int!

  accessRights: AccessRights!
}

type AccessRights {
  ${createAccessRights(true)}
}

input AccessRightsCreateInput {
  ${createAccessRights(true)}
}

input AccessRightsUpdateInput {
  ${createAccessRights(false)}
}
`

export const RoleQueries = `
roles: [Role]
role(id: Int!): Role
basicRoles: [BasicRole]
accessRights: AccessRights
`

export const RoleMutations = `
addRole( title: String!, order: Int, level: Int!, accessRights: AccessRightsCreateInput! ): Role
updateRole( id: Int!, title: String, order: Int, level: Int, accessRights: AccessRightsUpdateInput ): Role
deleteRole( id: Int!, newId: Int! ): Role
`

export const RoleSubscriptions = `
  rolesSubscription: Boolean
`
