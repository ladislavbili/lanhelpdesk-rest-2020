import defaultAttributes from './defaultAttributes';
const createAccessRights = (required) => {
  return ['login', 'testSections', 'mailViaComment', 'vykazy', 'publicFilters', 'addProjects', 'viewVykaz', 'viewRozpocet', 'viewErrors', 'viewInternal',
    'users', 'companies', 'pausals', 'projects', 'statuses', 'units', 'prices', 'suppliers', 'tags', 'invoices', 'roles', 'taskTypes', 'tripTypes', 'imaps', 'smtps'].reduce((acc, right) => {
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

export const RoleQuerries = `
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
