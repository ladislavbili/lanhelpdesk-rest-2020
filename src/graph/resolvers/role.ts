import {
  createDoesNoExistsError,
  createCantChangeRightsError,
  InvalidTokenError,
  EditRoleError,
  EditRoleLevelTooLowError,
  SetRoleLevelTooLowError
} from '@/configs/errors';
import { models } from '@/models';
import { UserInstance, RoleInstance, AccessRightsInstance, ImapInstance } from '@/models/instances';
import { addApolloError, getModelAttribute } from '@/helperFunctions';
import checkResolver from './checkResolver';

const querries = {
  roles: async (root, args, { req }) => {
    await checkResolver(req, ['roles', 'users'], true);
    return models.Role.findAll({
      order: [
        ['order', 'ASC'],
        ['title', 'ASC'],
      ]
    })
  },
  basicRoles: async (root, args, { req }) => {
    await checkResolver(req);
    return models.Role.findAll({
      order: [
        ['order', 'ASC'],
        ['title', 'ASC'],
      ]
    })
  },
  role: async (root, { id }, { req }) => {
    await checkResolver(req, ['roles']);
    return models.Role.findByPk(id, {
      include: [
        models.AccessRights
      ]
    });
  },
  accessRights: async (root, args, { req }) => {
    const User = await checkResolver(req);
    return (<RoleInstance>User.get('Role')).get('AccessRight');
  },
}

const mutations = {

  addRole: async (root, { title, order, level, accessRights }, { req, userID }) => {
    //kontrola prav a ziskanie pouzivatelovych prav
    const User = await checkResolver(req, ['roles']);

    //nemie byt nova rola mensieho alebo rovneho levelu
    if (level !== undefined && (<RoleInstance>User.get('Role')).get('level') >= level) {
      addApolloError(
        'Role',
        EditRoleLevelTooLowError,
        userID
      );
      throw EditRoleLevelTooLowError;
    }
    //nesmie pridat prava ktore sam nema
    checkRights((<AccessRightsInstance>(<RoleInstance>User.get('Role')).get('AccessRight')).get(), {}, accessRights, userID, null)

    return models.Role.create({
      title, order, level,
      AccessRight: accessRights
    }, {
        include: [{ model: models.AccessRights }]
      });
  },

  updateRole: async (root, { id, title, order, level, accessRights }, { req, userID }) => {
    //kontrola prav a ziskanie prav pouzivatela a upravovanej role
    const User = await checkResolver(req, ['roles']);
    const TargetRole = <RoleInstance>await models.Role.findByPk(id, { include: [{ model: models.AccessRights }] });
    if (TargetRole === null) {
      throw createDoesNoExistsError('Role', id);
    }
    const TargetAccessRights = <AccessRightsInstance>TargetRole.get('AccessRight');

    //nemie byt upravovana rola mensieho alebo rovneho levelu, ani novy level nesmie byt mensi alebo rovny
    if (level !== undefined && (<RoleInstance>User.get('Role')).get('level') >= level) {
      addApolloError(
        'Role',
        EditRoleLevelTooLowError,
        userID,
        id
      );
      throw EditRoleLevelTooLowError;
    }
    if ((<RoleInstance>User.get('Role')).get('level') >= TargetRole.get('level')) {
      addApolloError(
        'Role',
        EditRoleError,
        userID,
        id
      );
      throw EditRoleError;
    }
    //nesmie menit prava ktore sam nema
    checkRights((<AccessRightsInstance>(<RoleInstance>User.get('Role')).get('AccessRight')).get(), TargetAccessRights.get(), accessRights, userID, id)

    await TargetAccessRights.update(accessRights);
    return TargetRole.update({ title, order });
  },

  deleteRole: async (root, { id, newId }, { req, userID }) => {
    //kontrola prav a ziskanie prav pouzivatela, upravovanej role, a nahradnej role
    const User = await checkResolver(req, ['roles']);
    const OldRole = await models.Role.findByPk(id, { include: [{ model: models.User }, { model: models.Imap }] });
    const NewRole = await models.Role.findByPk(newId);
    if (OldRole === null) {
      throw createDoesNoExistsError('Role', id);
    }
    if (NewRole === null) {
      throw createDoesNoExistsError('New role', id);
    }
    //mazana rola musi byt vacsieho levelu
    if ((<RoleInstance>User.get('Role')).get('level') >= OldRole.get('level')) {
      addApolloError(
        'Role',
        EditRoleLevelTooLowError,
        userID,
        id
      );
      throw EditRoleLevelTooLowError;
    }
    //nahradna rola musi byt vacsieho levelu
    if ((<RoleInstance>User.get('Role')).get('level') >= NewRole.get('level')) {
      addApolloError(
        'Role',
        SetRoleLevelTooLowError,
        userID,
        newId
      );
      throw SetRoleLevelTooLowError;
    }

    const allUsers = <UserInstance[]>OldRole.get('Users');
    await Promise.all(allUsers.map(user => user.setRole(newId)));
    const Imaps = <ImapInstance[]>await OldRole.get('Imaps');
    await Promise.all(Imaps.map((Imap) => Imap.setRole(newId)));
    return OldRole.destroy();
  },
}

//porovna ci bud uz pouzivatel prava mal alebo ci my ich mame aby sme mu ich dali
function checkRights(myRights, targetRights, newRights, userID, targetId) {
  if (!Object.keys(newRights).every((key) => (newRights[key] === targetRights[key] || myRights[key]))) {
    const error = createCantChangeRightsError(Object.keys(newRights).filter((key) => !(newRights[key] === targetRights[key] || myRights[key])));
    addApolloError(
      'Role rights',
      error,
      userID,
      targetId
    );
    throw error;
  }
}

const attributes = {
  Role: {
    async currentUsers(role) {
      return getModelAttribute(role, 'Users');
    },
    async accessRights(role) {
      return getModelAttribute(role, 'AccessRight');
    },
    async imaps(role) {
      return getModelAttribute(role, 'Imaps');
    },
  },
  BasicRole: {
    async accessRights(role) {
      return getModelAttribute(role, 'AccessRight');
    }
  },
};

export default {
  attributes,
  mutations,
  querries
}
