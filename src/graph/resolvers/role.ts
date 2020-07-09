import { createDoesNoExistsError, InvalidTokenError } from 'configs/errors';
import { models } from 'models';
import { UserInstance, RoleInstance, AccessRightsInstance } from 'models/interfaces';
import checkResolver from './checkResolver';

const querries = {
  roles: async ( root, args, { req } ) => {
    await checkResolver( req );
    return models.Role.findAll()
  },
  role: async ( root, { id }, { req } ) => {
    await checkResolver( req );
    return models.Role.findByPk(id);
  },
  accessRights: async ( root, args, { userData, req } ) => {
    await checkResolver( req );
    return (<RoleInstance> await models.Role.findByPk(userData.id)).getAccessRight();
  },
}

const mutations = {

  addRole: async ( root, args ) => {
    return models.Role.create( args );
  },

  updateRole: async ( root, { id, title, order, ...accessRights } ) => {
    const Role = <RoleInstance> await models.Role.findByPk(id);
    if( Role === null ){
      throw createDoesNoExistsError('Role', id);
    }
    const AccessRights = await Role.getAccessRight();
    await AccessRights.update(accessRights);
    return Role.update( { title, order } );
  },

  deleteRole: async ( root, { id, newId } ) => {
    const Role = await models.Role.findByPk(id);
    const NewRole = await models.Role.findByPk(newId);
    if( Role === null ){
      throw createDoesNoExistsError('Role', id);
    }
    if( NewRole === null ){
      throw createDoesNoExistsError('New role', id);
    }
    const allUsers = await models.User.findAll({ where: { RoleId: id } });

    await Promise.all( allUsers.map( user => (user as UserInstance ).setRole(newId) ) );
    return Role.destroy();
  },
}

const attributes = {
  Role: {
    async currentUsers(role) {
      return role.getUsers()
    },
    async accessRights(role) {
      return role.getAccessRight()
    }
  },
};

export default {
  attributes,
  mutations,
  querries
}
