import { createDoesNoExistsError } from '@/configs/errors';
import { models } from '@/models';
import { ProjectInstance, TaskInstance, StatusInstance } from '@/models/instances';
import checkResolver from './checkResolver';
/*
statuses: [Status]
statusTemplates: [Status]
status(id: Int!): Status
`

export const StatusMutations = `
addStatusTemplate( title: String!, order: Int!, color: String!, icon: String!, action: StatusAllowedType! ): Status
updateStatusTemplate( id: Int!, title: String, order: Int, color: String, icon: String, action: StatusAllowedType ): Status
deleteStatusTemplate( id: Int! ): Status
addStatus( title: String!, order: Int!, color: String!, icon: String!, action: StatusAllowedType!, projectId: Int! ): Status
updateStatus( id: Int!, title: String, order: Int, color: String, icon: String, action: StatusAllowedType ): Status
deleteStatus( id: Int! ): Status
*/


const querries = {
  statusTemplates: async (root, args, { req }) => {
    await checkResolver(req, ["statuses"]);
    return models.Status.findAll({
      order: [
        ['order', 'ASC'],
        ['title', 'ASC'],
      ],
      where: {
        template: true
      }
    })
  },
  statusTemplate: async (root, { id }, { req }) => {
    await checkResolver(req, ["statuses"]);
    return models.Status.findByPk(id);
  },

  statuses: async (root, { projectId }, { req }) => {
    await checkResolver(req);
    return models.Status.findAll({
      order: [
        ['order', 'ASC'],
        ['title', 'ASC'],
      ],
      where: {
        projectStatusId: projectId
      }
    })
  },
}

const mutations = {
  addStatusTemplate: async (root, args, { req }) => {
    await checkResolver(req, ["statuses"]);
    return models.Status.create({ ...args, template: true });
  },

  updateStatusTemplate: async (root, { id, ...args }, { req }) => {
    await checkResolver(req, ["statuses"]);
    const Status = await models.Status.findByPk(id);
    if (Status === null) {
      throw createDoesNoExistsError('Status', id);
    }
    return Status.update(args);
  },

  deleteStatusTemplate: async (root, { id }, { req }) => {
    await checkResolver(req, ["statuses"]);
    const OldStatus = <StatusInstance>await models.Status.findByPk(id);
    if (OldStatus === null) {
      throw createDoesNoExistsError('Status', id);
    }
    return OldStatus.destroy();
  },
}

const attributes = {
};

export default {
  attributes,
  mutations,
  querries
}
