import {
  createDoesNoExistsError,
} from '@/configs/errors';
import { models } from '@/models';
import { Op } from 'sequelize';
import fs from 'fs';
import {
  CMDBItemInstance,
  CMDBFileInstance,
} from '@/models/instances';
import checkResolver from './checkResolver';
import {
  isUserAdmin,
  idDoesExists,
  multipleIdDoesExistsCheck,
  getModelAttribute,
  extractDatesFromObject,
} from '@/helperFunctions';
const dateNames = ['installDate', 'expireDate'];

const queries = {
  cmdbItems: async (root, { companyId, categoryId, limit, page, stringFilter, sort }, { req }) => {
    const User = await checkResolver(req, ['cmdb']);

    let itemSort = ['id', 'DESC'];
    switch (sort) {
      case 'title': {
        itemSort = ['title', 'ASC'];
        break;
      }
      case 'active': {
        itemSort = ['active', 'DESC'];
        break;
      }
      case 'updatedAt': {
        itemSort = ['updatedAt', 'DESC'];
        break;
      }
      default: {
        break;
      }
    }

    let itemWhere = <any>{};
    let pagination = <any>{};
    let ipsWhere = <any>{};
    let companyWhere = <any>{};
    let categoryWhere = <any>{};
    let ipsFilterRequired = false;

    if (companyId) {
      itemWhere = {
        ...itemWhere,
        CompanyId: companyId,
      }
    }
    if (categoryId) {
      itemWhere = {
        ...itemWhere,
        CMDBCategoryId: categoryId,
      }
    }

    if (limit && page) {
      pagination = {
        offset: limit * (page - 1),
        limit,
      }
    };

    if (stringFilter) {
      if (stringFilter.title && stringFilter.title.length > 0) {
        itemWhere = {
          ...itemWhere,
          title: { [Op.like]: `%${stringFilter.title}%` },
        }
      }
      if (stringFilter.company && stringFilter.company.length > 0) {
        companyWhere = {
          ...companyWhere,
          title: { [Op.like]: `%${stringFilter.company}%` },
        }
      }
      if (stringFilter.category && stringFilter.category.length > 0) {
        categoryWhere = {
          ...categoryWhere,
          title: { [Op.like]: `%${stringFilter.category}%` },
        }
      }
      if (typeof stringFilter.active == "boolean") {
        itemWhere = {
          ...itemWhere,
          active: stringFilter.active,
        }
      }

      if (stringFilter.location && stringFilter.location.length > 0) {
        itemWhere = {
          ...itemWhere,
          location: { [Op.like]: `%${stringFilter.location}%` },
        }
      }

      if (stringFilter.installDateFrom && stringFilter.installDateTo) {
        itemWhere = {
          ...itemWhere,
          installDate: { [Op.between]: [parseInt(stringFilter.installDateFrom), parseInt(stringFilter.installDateTo)] },
        }
      }

      if (stringFilter.expireDateFrom && stringFilter.expireDateTo) {
        itemWhere = {
          ...itemWhere,
          expireDate: { [Op.between]: [parseInt(stringFilter.expireDateFrom), parseInt(stringFilter.expireDateTo)] },
        }
      }

      if (stringFilter.ips && stringFilter.ips.length > 0) {
        ipsFilterRequired = true;
        ipsWhere = {
          ...ipsWhere,
          ip: { [Op.like]: `%${stringFilter.ips}%` },
        }
      }
    }

    //includeFolder, rights and has right
    const response = <any>await models.CMDBItem.findAndCountAll({
      order: [<any>itemSort],
      distinct: true,
      include: [
        {
          required: true,
          model: models.Company,
          where: companyWhere,
        },
        {
          required: true,
          model: models.CMDBCategory,
          where: categoryWhere,
        },
        {
          model: models.CMDBAddress,
          as: 'CMDBAddresses',
        },
        models.CMDBItemPassword,
        {
          required: ipsFilterRequired,
          model: models.CMDBAddress,
          as: 'addressesFilter',
          where: ipsWhere,
        },
        {
          model: models.User,
          as: 'createdBy',
        },
        {
          model: models.User,
          as: 'changedBy',
        },
        {
          model: models.CMDBFile,
          as: 'descriptionFiles',
        },
        {
          model: models.CMDBFile,
          as: 'backupFiles',
        },
        {
          model: models.CMDBFile,
          as: 'monitoringFiles',
        },
      ],
      where: itemWhere,
      ...pagination,
    });

    const Items = <CMDBItemInstance[]>response.rows;
    const count = <number>response.count;

    return {
      items: Items,
      count,
    };
  },
  cmdbItem: async (root, { id }, { req }) => {
    const User = await checkResolver(req, ["cmdb"]);
    const CMDBItem = <CMDBItemInstance>await models.CMDBItem.findByPk(id, {
      include: [
        {
          model: models.CMDBAddress,
          as: 'CMDBAddresses',
        },
        models.CMDBItemPassword,
        {
          model: models.User,
          as: 'createdBy',
        },
        {
          model: models.User,
          as: 'changedBy',
        },
        {
          model: models.CMDBFile,
          as: 'descriptionFiles',
        },
        {
          model: models.CMDBFile,
          as: 'backupFiles',
        },
        {
          model: models.CMDBFile,
          as: 'monitoringFiles',
        },
      ],
    });
    if (!CMDBItem) {
      throw createDoesNoExistsError('Item', id);
    };
    return CMDBItem;
  },
}

const mutations = {
  addCmdbItem: async (root, { companyId, categoryId, addresses, passwords, ...args }, { req }) => {
    const User = await checkResolver(req, ["cmdb"]);
    const dates = extractDatesFromObject(args, dateNames);
    await multipleIdDoesExistsCheck([{ id: companyId, model: models.Company }, { id: categoryId, model: models.CMDBCategory }]);
    return await models.CMDBItem.create(
      {
        ...args,
        ...dates,
        CompanyId: companyId,
        CMDBCategoryId: categoryId,
        createdById: User.get('id'),
        changedById: User.get('id'),
        CMDBAddresses: addresses,
        CMDBItemPasswords: passwords,
      },
      {
        include: [
          {
            model: models.CMDBAddress,
            as: 'CMDBAddresses',
          },
          models.CMDBItemPassword,
        ],
      }
    );
  },
  updateCmdbItem: async (root, { id, companyId, categoryId, deletedImages, ...args }, { req }) => {
    const User = await checkResolver(req, ["cmdb"]);
    const CMDBItem = <CMDBItemInstance>await models.CMDBItem.findByPk(id, {
      include: [
        {
          model: models.CMDBAddress,
          as: 'CMDBAddresses',
        },
        {
          model: models.CMDBFile,
          as: 'descriptionFiles',
        },
        {
          model: models.CMDBFile,
          as: 'backupFiles',
        },
        {
          model: models.CMDBFile,
          as: 'monitoringFiles',
        },
      ],
    });

    if (!CMDBItem) {
      throw createDoesNoExistsError('Item', id);
    };
    const dates = extractDatesFromObject(args, dateNames);
    delete args['installDate'];
    delete args['expireDate'];
    let changes = <any>{
      ...args,
      ...dates,
      changedById: User.get('id'),
    };
    if (companyId) {
      await idDoesExists(companyId, models.Company);
      changes = { ...changes, CompanyId: companyId };
    }
    if (categoryId) {
      await idDoesExists(categoryId, models.CMDBCategory);
      changes = { ...changes, CMDBCategoryId: categoryId };
    }

    if (deletedImages && deletedImages.length > 0) {
      const DeletedImages = <CMDBItemInstance[]>[
        ...(<CMDBItemInstance[]>CMDBItem.get('descriptionFiles')),
        ...(<CMDBItemInstance[]>CMDBItem.get('backupFiles')),
        ...(<CMDBItemInstance[]>CMDBItem.get('monitoringFiles')),
      ].filter((File) => deletedImages.includes(File.get('id')));
      DeletedImages.forEach((DeletedImage) => {
        try {
          fs.unlinkSync(<string>DeletedImage.get('path'));
        } catch (err) {
        }
      })
      await Promise.all(DeletedImages.map((DeletedImage) => DeletedImage.destroy()));
    }
    return CMDBItem.update(changes);
  },
  deleteCmdbItem: async (root, { id }, { req }) => {
    const User = await checkResolver(req, ["cmdb"]);
    const CMDBItem = <CMDBItemInstance>await models.CMDBItem.findByPk(id, {
      include: [
        {
          model: models.CMDBFile,
          as: 'descriptionFiles',
        },
        {
          model: models.CMDBFile,
          as: 'backupFiles',
        },
        {
          model: models.CMDBFile,
          as: 'monitoringFiles',
        },
      ],
    });

    if (!CMDBItem) {
      throw createDoesNoExistsError('Item', id);
    };
    const Files = <CMDBItemInstance[]>[
      ...(<CMDBItemInstance[]>CMDBItem.get('descriptionFiles')),
      ...(<CMDBItemInstance[]>CMDBItem.get('backupFiles')),
      ...(<CMDBItemInstance[]>CMDBItem.get('monitoringFiles')),
    ]
    if (Files.length > 0) {
      Files.forEach((File) => {
        try {
          fs.unlinkSync(<string>File.get('path'));
        } catch (err) {
        }
      });
      await Promise.all(Files.map((File) => File.destroy()));
    }
    return CMDBItem.destroy();
  },
}

const attributes = {
  CMDBItem: {
    async createdBy(item) {
      return getModelAttribute(item, 'createdBy');
    },
    async updatedBy(item) {
      return getModelAttribute(item, 'changedBy');
    },
    async company(item) {
      return getModelAttribute(item, 'Company');
    },
    async category(item) {
      return getModelAttribute(item, 'CMDBCategory');
    },
    async descriptionImages(item) {
      return getModelAttribute(item, 'descriptionFiles')
    },
    async backupImages(item) {
      return getModelAttribute(item, 'backupFiles')
    },
    async monitoringImages(item) {
      return getModelAttribute(item, 'monitoringFiles')
    },
    async addresses(item) {
      return getModelAttribute(item, 'CMDBAddresses');
    },
    async passwords(item) {
      return getModelAttribute(item, 'CMDBItemPasswords');
    },
  },
};

const subscriptions = {
};

export default {
  attributes,
  mutations,
  queries,
  subscriptions,
}
