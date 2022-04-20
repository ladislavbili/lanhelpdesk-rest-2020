import {
  createDoesNoExistsError,
} from '@/configs/errors';
import { models } from '@/models';
import fs from 'fs';
import {
  PassEntryInstance,
} from '@/models/instances';
import { Op } from 'sequelize';
import checkResolver from './checkResolver';
import {
  getModelAttribute,
  idDoesExists,
  extractDatesFromObject,
} from '@/helperFunctions';
import { pubsub } from './index';
const { withFilter } = require('apollo-server-express');
import {
  PASS_ENTRIES_CHANGE,
} from '@/configs/subscriptions';

const fullFolderRights = {
  active: true,
  read: true,
  write: true,
  manage: true,
};

const noFolderRights = {
  active: false,
  read: false,
  write: false,
  manage: false,
};

const queries = {
  passEntries: async (root, { folderId, order, limit, page, stringFilter }, { req }) => {
    const User = await checkResolver(req, ['pass']);

    let passwordOrder = ['id', 'DESC'];
    switch (order) {
      case 'title': {
        passwordOrder = ['title', 'ASC'];
        break;
      }
      case 'updatedAt': {
        passwordOrder = ['updatedAt', 'DESC'];
        break;
      }
      default: {
        break;
      }
    }

    let pagination = <any>{};
    let passwordWhere = <any>{};
    if (limit && page) {
      pagination = {
        offset: limit * (page - 1),
        limit,
      }
    };
    if (stringFilter) {
      if (stringFilter.title.length > 0) {
        passwordWhere = {
          ...passwordWhere,
          title: { [Op.like]: `%${stringFilter.title}%` },
        }
      }
    }
    if (folderId) {
      passwordWhere = {
        ...passwordWhere,
        PassFolderId: folderId
      }
    }

    const response = await models.PassEntry.findAndCountAll({
      where: passwordWhere,
      order: [<any>passwordOrder],
      ...pagination,
      include: [
        {
          model: models.User,
          as: 'createdBy',
        },
        {
          model: models.User,
          as: 'changedBy',
        },
      ],
    });

    return {
      count: <number>response.count,
      passwords: <PassEntryInstance[]>response.rows,
    }
  },
  passEntry: async (root, { id }, { req }) => {
    const User = await checkResolver(req, ["pass"]);
    return models.PassEntry.findByPk(id);
  },
}

const mutations = {
  addPassEntry: async (root, { folderId, expireDate, ...directData }, { req }) => {
    const User = await checkResolver(req, ["pass"]);
    await idDoesExists(folderId, models.Company);

    const dates = extractDatesFromObject({ expireDate }, ['expireDate']);
    const Entry = <PassEntryInstance>await models.PassEntry.create({
      ...directData,
      ...dates,
      PassFolderId: folderId,
      changedById: User.get('id'),
      createdById: User.get('id'),
    });
    pubsub.publish(PASS_ENTRIES_CHANGE, { passEntriesSubscription: folderId });
    return Entry;
  },
  updatePassEntry: async (root, { id, expireDate, ...args }, { req }) => {
    const User = await checkResolver(req, ["pass"]);
    const OriginalEntry = <PassEntryInstance>await models.PassEntry.findByPk(id);
    if (!OriginalEntry) {
      throw createDoesNoExistsError('Entry', id);
    };
    const dates = extractDatesFromObject({ expireDate }, ['expireDate']);

    await OriginalEntry.update({
      ...args,
      ...dates,
      changedById: User.get('id'),
    });
    pubsub.publish(PASS_ENTRIES_CHANGE, { passEntriesSubscription: OriginalEntry.get('PassFolderId') });
    return OriginalEntry.reload();
  },
  deletePassEntry: async (root, { id }, { req }) => {
    const User = await checkResolver(req, ["pass"]);
    const OriginalEntry = <PassEntryInstance>await models.PassEntry.findByPk(id);

    if (!OriginalEntry) {
      throw createDoesNoExistsError('Entry', id);
    };
    const passEntriesSubscription = OriginalEntry.get('PassFolderId');
    await OriginalEntry.destroy();
    pubsub.publish(PASS_ENTRIES_CHANGE, { passEntriesSubscription });
    return OriginalEntry;
  },
}

const attributes = {
  PassEntry: {
    async myRights(entry, body, { req, userID }) {
      if (entry.isAdmin) {
        return fullFolderRights;
      }
      let Folder = <PassFolderInstance>entry.get('PassFolder');
      if (!Folder) {
        Folder = <PassFolderInstance>await entry.getPassFolder({
          include: [{
            model: models.PassFolderRight,
            where: {
              userId: userID,
              active: true,
            },
          }]
        });
      }
      let FolderRights = <PassFolderRightInstance[]>Folder.get('PassFolderRights');
      if (!FolderRights) {
        FolderRights = await <PassFolderRightInstance[]>Folder.getPassFolderRights({
          where: {
            userId: userID,
            active: true,
          },
        });
      }
      if (FolderRights.length === 0 || !FolderRights[0].get('write')) {
        return noFolderRights;
      }
      return FolderRights[0];
    },
    async createdBy(password) {
      return getModelAttribute(password, 'createdBy');
    },
    async updatedBy(password) {
      return getModelAttribute(password, 'changedBy');
    },
  },
};

const subscriptions = {
  passEntriesSubscription: {
    subscribe: withFilter(
      () => pubsub.asyncIterator(PASS_ENTRIES_CHANGE),
      async ({ passEntriesSubscription }, { folderId }) => {
        return passEntriesSubscription === folderId || folderId === null;
      }
    ),
  },
};

export default {
  attributes,
  mutations,
  queries,
  subscriptions,
}
