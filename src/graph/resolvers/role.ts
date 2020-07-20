import {
  createDoesNoExistsError,
  createCantChangeRightsError,
  InvalidTokenError,
  EditRoleError,
  EditRoleLevelTooLowError,
  SetRoleLevelTooLowError
} from 'configs/errors';
import { models } from 'models';
import { UserInstance, RoleInstance, AccessRightsInstance } from 'models/interfaces';
import checkResolver from './checkResolver';

const querries = {
  roles: async ( root, args, { req } ) => {
    await checkResolver( req, [ 'roles', 'users' ], true );
    return models.Role.findAll({
      order: [
        ['order', 'ASC'],
        ['title', 'ASC'],
      ]
    })
  },
  role: async ( root, { id }, { req } ) => {
    await checkResolver( req, [ 'roles' ] );
    return models.Role.findByPk(id);
  },
  accessRights: async ( root, args, { req } ) => {
    const User = await checkResolver( req );
    return User.get('AccessRight');
  },
}

const mutations = {

  addRole: async ( root, { title, order, level, accessRights }, { req } ) => {
    //kontrola prav a ziskanie pouzivatelovych prav
    const User = await checkResolver( req, [ 'roles' ] );

    //nemie byt nova rola mensieho alebo rovneho levelu
    if( level !== undefined && User.get('Role').get('level') >= level ){
      throw EditRoleLevelTooLowError;
    }
    //nesmie pridat prava ktore sam nema
    checkRights( User.get('Role').get('AccessRight').get(), {}, accessRights )

    return models.Role.create({
      title, order, level,
      AccessRight: accessRights
    }, {
      include: [{ model: models.AccessRights }]
    });
  },

  updateRole: async ( root, { id, title, order, level, accessRights }, { req } ) => {
    //kontrola prav a ziskanie prav pouzivatela a upravovanej role
    const User = await checkResolver( req, [ 'roles' ] );
    const TargetRole = <RoleInstance> await models.Role.findByPk(id, { include: [{ model: models.AccessRights }] });
    if( TargetRole === null ){
      throw createDoesNoExistsError('Role', id);
    }
    const TargetAccessRights = TargetRole.get('AccessRight');

    //nemie byt upravovana rola mensieho alebo rovneho levelu, ani novy level nesmie byt mensi alebo rovny
    if( level !== undefined && User.get('Role').get('level') >= level ){
      throw EditRoleLevelTooLowError;
    }
    if(User.get('Role').get('level') >= TargetRole.get('level')){
      throw EditRoleError;
    }
    //nesmie menit prava ktore sam nema
    checkRights( User.get('Role').get('AccessRight').get(), TargetAccessRights.get(), accessRights )

    await TargetAccessRights.update(accessRights);
    return TargetRole.update( { title, order } );
  },

  deleteRole: async ( root, { id, newId }, { req } ) => {
    //kontrola prav a ziskanie prav pouzivatela, upravovanej role, a nahradnej role
    const User = await checkResolver( req, [ 'roles' ] );
    const OldRole = await models.Role.findByPk(id);
    const NewRole = await models.Role.findByPk(newId);
    if( OldRole === null ){
      throw createDoesNoExistsError('Role', id);
    }
    if( NewRole === null ){
      throw createDoesNoExistsError('New role', id);
    }
    //mazana rola musi byt vacsieho levelu
    if( User.get('Role').get('level') >= OldRole.get('level') ){
      throw EditRoleLevelTooLowError;
    }
    //nahradna rola musi byt vacsieho levelu
    if( User.get('Role').get('level') >= NewRole.get('level') ){
      throw SetRoleLevelTooLowError;
    }

    const allUsers = await models.User.findAll({ where: { RoleId: id } });
    await Promise.all( allUsers.map( user => (user as UserInstance ).setRole(newId) ) );
    return OldRole.destroy();
  },
}

//porovna ci bud uz pouzivatel prava mal alebo ci my ich mame aby sme mu ich dali
function checkRights( myRights, targetRights, newRights ){
  if( !Object.keys(newRights).every( (key) => ( newRights[key] === targetRights[key] || myRights[key] ) ) ){
    throw createCantChangeRightsError( Object.keys(newRights).filter( (key) => !( newRights[key] === targetRights[key] || myRights[key] ) ) );

  }

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
