import { createDoesNoExistsError, ImapIsAlreadyBeingTestedError, ImapRoleLevelTooLowError } from '@/configs/errors';
import { models } from '@/models';
import { RoleInstance, ImapInstance } from '@/models/instances';
import checkResolver from './checkResolver';
import { multipleIdDoesExistsCheck, idDoesExistsCheck, addApolloError } from '@/helperFunctions';
import { imapEvent } from '@/services/imap/readEmails';
import { testImap } from '@/services/imap/testImap';

const querries = {
  imaps: async (root, args, { req }) => {
    await checkResolver(req, ['imaps']);
    return models.Imap.findAll({
      order: [
        ['order', 'ASC'],
        ['title', 'ASC'],
      ]
    })
  },
  imap: async (root, { id }, { req }) => {
    await checkResolver(req, ['imaps']);
    return models.Imap.findByPk(id);
  },
}

const mutations = {

  addImap: async (root, { projectId, roleId, companyId, ...args }, { req }) => {
    const User = await checkResolver(req, ["imaps"]);
    if (args.def) {
      await models.Imap.update({ def: false }, { where: { def: true } })
    }

    await multipleIdDoesExistsCheck([{ model: models.Project, id: projectId }, { model: models.Role, id: roleId }, { model: models.Company, id: companyId }]);
    const Role = await models.Role.findByPk(roleId);
    if (Role.get('level') < (<RoleInstance>User.get('Role')).get('level')) {
      addApolloError(
        'Imap role',
        ImapRoleLevelTooLowError,
        User.get('id'),
        roleId
      );
      throw ImapRoleLevelTooLowError;
    }

    const Imap = await models.Imap.create({ ...args, ProjectId: projectId, RoleId: roleId, CompanyId: companyId });
    imapEvent.emit('add', Imap);
    return Imap;
  },

  updateImap: async (root, { id, projectId, roleId, companyId, ...args }, { req }) => {
    const User = await checkResolver(req, ["imaps"]);
    const Imap = <ImapInstance>await models.Imap.findByPk(id);
    if (Imap === null) {
      throw createDoesNoExistsError('Imap', id);
    }
    if (projectId) {
      await idDoesExistsCheck(projectId, models.Project);
    }
    if (companyId) {
      await idDoesExistsCheck(companyId, models.Company);
    }
    if (roleId) {
      const Role = await models.Role.findByPk(roleId);
      if (Role === null) {
        throw createDoesNoExistsError('Role', roleId);
      }
      if (Role.get('level') < (<RoleInstance>User.get('Role')).get('level')) {
        addApolloError(
          'Imap role',
          ImapRoleLevelTooLowError,
          User.get('id'),
          roleId
        );
        throw ImapRoleLevelTooLowError;
      }
    }
    if (args.def) {
      await models.Imap.update({ def: false }, { where: { def: true } })
    }
    const promises = [];
    if (projectId) {
      promises.push(Imap.setProject(projectId));
    }
    if (companyId) {
      promises.push(Imap.setCompany(companyId));
    }
    if (roleId) {
      promises.push(Imap.setRole(roleId));
    }
    promises.push(Imap.update(args));
    await Promise.all(promises);
    imapEvent.emit('update', Imap);
    return Imap;
  },

  deleteImap: async (root, { id }, { req }) => {
    await checkResolver(req, ["imaps"]);
    const Imap = await models.Imap.findByPk(id);
    if (Imap === null) {
      throw createDoesNoExistsError('Imap', id);
    }
    imapEvent.emit('delete', id);
    return Imap.destroy();
  },

  testImap: async (root, { id }, { req }) => {
    await checkResolver(req, ["imaps"]);
    const Imap = await models.Imap.findByPk(id);
    if (Imap === null) {
      throw createDoesNoExistsError('Imap', id);
    }
    if (Imap.get('currentlyTested')) {
      throw ImapIsAlreadyBeingTestedError;
    }
    testImap(Imap);
    return true;
  },

  testImaps: async (_, __, { req }) => {
    await checkResolver(req, ["imaps"]);
    const Imaps = await models.Imap.findAll({ where: { currentlyTested: false } });
    Imaps.forEach((Imap) => testImap(Imap));
    return true;
  },
}

const attributes = {
  Imap: {
    async project(imap) {
      return imap.getProject()
    },
    async company(imap) {
      return imap.getCompany()
    },
    async role(imap) {
      return imap.getRole()
    },
  }
};

export default {
  attributes,
  mutations,
  querries
}
