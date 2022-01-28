import {
  createDoesNoExistsError,
} from '@/configs/errors';
import { models } from '@/models';
import fs from 'fs';
import {
  CMDBManualInstance,
  CMDBFileInstance,
} from '@/models/instances';
import { Op } from 'sequelize';
import checkResolver from './checkResolver';
import {
  getModelAttribute,
  idDoesExists,
} from '@/helperFunctions';
import { pubsub } from './index';
const { withFilter } = require('apollo-server-express');
import {
  CMDB_MANUALS_CHANGE,
} from '@/configs/subscriptions';

const queries = {
  cmdbManuals: async (root, { companyId, order, limit, page, stringFilter }, { req }) => {
    const User = await checkResolver(req, ['cmdb']);

    let manualOrder = ['id', 'DESC'];
    switch (order) {
      case 'title': {
        manualOrder = ['title', 'ASC'];
        break;
      }
      case 'updatedAt': {
        manualOrder = ['updatedAt', 'DESC'];
        break;
      }
      default: {
        break;
      }
    }

    let pagination = <any>{};
    let manualWhere = <any>{ CompanyId: companyId };
    if (limit && page) {
      pagination = {
        offset: limit * (page - 1),
        limit,
      }
    };
    if (stringFilter) {
      if (stringFilter.title.length > 0) {
        manualWhere = {
          ...manualWhere,
          title: { [Op.like]: `%${stringFilter.title}%` },
        }
      }
    }

    const response = await models.CMDBManual.findAndCountAll({ where: manualWhere, order: [<any>manualOrder], ...pagination, });

    return {
      count: <number>response.count,
      manuals: <CMDBManualInstance[]>response.rows,
    }
  },
  cmdbManual: async (root, { id }, { req }) => {
    const User = await checkResolver(req, ["cmdb"]);
    return models.CMDBManual.findByPk(id, { include: [models.CMDBFile] });
  },
}

const mutations = {
  addCmdbManual: async (root, { title, body, companyId }, { req }) => {
    const User = await checkResolver(req, ["cmdb"]);
    await idDoesExists(companyId, models.Company);
    const Manual = <CMDBManualInstance>await models.CMDBManual.create({
      title,
      body,
      CompanyId: companyId,
      changedById: User.get('id'),
      createdById: User.get('id'),
    });
    pubsub.publish(CMDB_MANUALS_CHANGE, { cmdbManualsSubscription: companyId });
    return Manual;
  },
  updateCmdbManual: async (root, { id, deletedImages, ...args }, { req }) => {
    const User = await checkResolver(req, ["cmdb"]);
    const OriginalManual = <CMDBManualInstance>await models.CMDBManual.findByPk(id, {
      include: [
        models.CMDBFile
      ]
    });
    if (!OriginalManual) {
      throw createDoesNoExistsError('Manual', id);
    };

    if (deletedImages && deletedImages.length > 0) {
      const DeletedImages = (<CMDBFileInstance[]>OriginalManual.get('CMDBFiles')).filter((File) => deletedImages.includes(File.get('id')));
      DeletedImages.forEach((DeletedImage) => {
        try {
          fs.unlinkSync(<string>DeletedImage.get('path'));
        } catch (err) {
        }
      })
      await Promise.all(DeletedImages.map((DeletedImage) => DeletedImage.destroy()));
    }
    await OriginalManual.update({
      ...args,
      changedById: User.get('id'),
    });
    pubsub.publish(CMDB_MANUALS_CHANGE, { cmdbManualsSubscription: OriginalManual.get('CompanyId') });
    return OriginalManual.reload();
  },
  deleteCmdbManual: async (root, { id }, { req }) => {
    const User = await checkResolver(req, ["cmdb"]);
    const OriginalManual = <CMDBManualInstance>await models.CMDBManual.findByPk(id, {
      include: [
        models.CMDBFile,
      ]
    });

    if (!OriginalManual) {
      throw createDoesNoExistsError('Manual', id);
    };

    const Files = <CMDBFileInstance[]>OriginalManual.get('CMDBFiles');
    if (Files.length > 0) {
      Files.forEach((File) => {
        try {
          fs.unlinkSync(<string>File.get('path'));
        } catch (err) {
        }
      })
      await Promise.all(Files.map((File) => File.destroy()));
    }
    const cmdbManualsSubscription = OriginalManual.get('CompanyId');
    await OriginalManual.destroy();
    pubsub.publish(CMDB_MANUALS_CHANGE, { cmdbManualsSubscription });
    return OriginalManual;
  },
}

const attributes = {
  CMDBManual: {
    async images(manual) {
      return getModelAttribute(manual, 'CMDBFiles');
    },
    async createdBy(manual) {
      return getModelAttribute(manual, 'createdBy');
    },
    async updatedBy(manual) {
      return getModelAttribute(manual, 'changedBy');
    },
  },
};

const subscriptions = {
  cmdbManualsSubscription: {
    subscribe: withFilter(
      () => pubsub.asyncIterator(CMDB_MANUALS_CHANGE),
      async ({ cmdbManualsSubscription }, { companyId }) => {
        return cmdbManualsSubscription === companyId;
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
