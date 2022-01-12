import {
  createDoesNoExistsError,
  CantAddOrEditPagesToFolderError,
} from '@/configs/errors';
import { models } from '@/models';
import { Op } from 'sequelize';
import fs from 'fs';
import {
  LanwikiPageInstance,
  LanwikiFolderInstance,
  LanwikiFolderRightInstance,
  LanwikiTagInstance,
  LanwikiFileInstance,
} from '@/models/instances';
import checkResolver from './checkResolver';
import {
  isUserAdmin,
  idsDoExistsCheck,
  getModelAttribute,
} from '@/helperFunctions';

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
  lanwikiPages: async (root, { folderId, tagId, limit, page, stringFilter }, { req }) => {
    const User = await checkResolver(req, ['lanwiki']);
    const isAdmin = isUserAdmin(User);

    let pageWhere = <any>{};
    let folderWhere = <any>{};
    let tagsWhere = <any>{};
    let tagsFilterNeeded = false;
    if (folderId) {
      pageWhere = {
        ...pageWhere,
        LanwikiFolderId: folderId,
      }
    }
    if (tagId) {
      tagsFilterNeeded = true;
      tagsWhere = {
        ...tagsWhere,
        id: tagId,
      }
    }
    let pagination = <any>{};
    if (limit && page) {
      pagination = {
        offset: limit * (page - 1),
        limit,
      }
    };
    if (stringFilter) {
      if (stringFilter.title.length > 0) {
        pageWhere = {
          ...pageWhere,
          title: { [Op.like]: `%${stringFilter.title}%` },
        }
      }
      if (stringFilter.folder.length > 0) {
        folderWhere = {
          ...folderWhere,
          title: { [Op.like]: `%${stringFilter.folder}%` },
        }
      }
      if (stringFilter.tags.length > 0) {
        tagsFilterNeeded = true;
        tagsWhere = {
          ...tagsWhere,
          title: { [Op.like]: `%${stringFilter.tags}%` },
        }
      }
    }



    //includeFolder, rights and has right
    const response = <any>await models.LanwikiPage.findAndCountAll({
      order: [
        ['id', 'DESC'],
        ['title', 'ASC'],
      ],
      include: [
        {
          required: true,
          model: models.LanwikiFolder,
          attributes: ['id', 'title'],
          where: folderWhere,
          include: [{
            required: !isAdmin,
            model: models.LanwikiFolderRight,
            where: {
              UserId: User.get('id'),
              active: true,
              read: true,
            }
          }]
        },
        {
          required: tagsFilterNeeded,
          model: models.LanwikiTag,
          as: 'lanwikiTagsFilter',
          where: tagsWhere,
        },
        models.LanwikiTag,
      ],
      where: pageWhere,
      ...pagination,
    });
    const LanwikiPages = <LanwikiPageInstance[]>response.rows;
    const count = <number>response.count;

    return {
      pages: LanwikiPages.map((LanwikiPage) => {
        LanwikiPage.isAdmin = isAdmin;
        return LanwikiPage;
      }),
      count,
    };
  },
  lanwikiPage: async (root, { id }, { req }) => {
    const User = await checkResolver(req, ["lanwiki"]);
    const isAdmin = isUserAdmin(User);

    let LanwikiPage = <LanwikiPageInstance>await models.LanwikiPage.findByPk(id, {
      include: [
        {
          model: models.LanwikiFolder,
          include: [{
            required: !isAdmin,
            model: models.LanwikiFolderRight,
            where: {
              UserId: User.get('id'),
              active: true,
              read: true,
            }
          }]
        },
        models.LanwikiTag,
        models.LanwikiFile,
      ],
    });
    if (!LanwikiPage) {
      throw createDoesNoExistsError('Lanwiki page', id);
    };
    LanwikiPage.isAdmin = isAdmin;
    return LanwikiPage;
  },
}

//TODO: if folder archived cant edit add and delete
const mutations = {
  addLanwikiPage: async (root, { folderId, tags, ...args }, { req }) => {
    const User = await checkResolver(req, ["lanwiki"]);
    const isAdmin = isUserAdmin(User);
    const Folder = await models.LanwikiFolder.findByPk(folderId, {
      include: [{
        required: true,
        model: models.LanwikiFolderRight,
        where: {
          UserId: User.get('id'),
          active: true,
        }
      }]
    });
    if (!Folder) {
      throw createDoesNoExistsError('Lanwiki folder', folderId);
    };
    const FolderRights = <LanwikiFolderRightInstance[]>Folder.get('LanwikiFolderRights');
    if ((!Folder || FolderRights.length === 0 || !FolderRights[0].get('active') || !FolderRights[0].get('write')) && !isAdmin) {
      throw CantAddOrEditPagesToFolderError;
    };
    await idsDoExistsCheck(tags, models.LanwikiTag);
    const LanwikiPage = <LanwikiPageInstance>await models.LanwikiPage.create({
      ...args,
      LanwikiFolderId: folderId,
    });
    await LanwikiPage.setLanwikiTags(tags);
    LanwikiPage.isAdmin = isAdmin;
    return LanwikiPage;
  },
  updateLanwikiPage: async (root, { id, folderId, tags, deletedImages, ...args }, { req }) => {
    const User = await checkResolver(req, ["lanwiki"]);
    const isAdmin = isUserAdmin(User);
    const OriginalPage = <LanwikiPageInstance>await models.LanwikiPage.findByPk(id, {
      include: [
        {
          model: models.LanwikiFolder,
          include: [{
            model: models.LanwikiFolderRight,
            where: {
              UserId: User.get('id'),
              active: true,
              write: true,
            }
          }]
        },
      ]
    });
    const FolderRights = <LanwikiFolderRightInstance[]>(<LanwikiFolderInstance>OriginalPage.get('LanwikiFolder')).get('LanwikiFolderRights');
    if (!isAdmin && (FolderRights.length === 0 || !FolderRights[0].get('active') || !FolderRights[0].get('write'))) {
      throw CantAddOrEditPagesToFolderError;
    }
    if (tags) {
      await idsDoExistsCheck(tags, models.LanwikiTag);
    }
    if (deletedImages && deletedImages.length > 0) {
      const DeletedImages = <LanwikiFileInstance[]>await models.LanwikiFile.findAll({ where: { id: deletedImages } });
      DeletedImages.forEach((DeletedImage) => {
        try {
          fs.unlinkSync(<string>DeletedImage.get('path'));
        } catch (err) {
        }
      })
      await Promise.all(DeletedImages.map((DeletedImage) => DeletedImage.destroy()));
    }
    await OriginalPage.update({
      ...args,
      LanwikiFolderId: folderId ? folderId : OriginalPage.get('LanwikiFolderId'),
    });
    if (tags) {
      await OriginalPage.setLanwikiTags(tags);
    }
    return OriginalPage.reload();
  },
  deleteLanwikiPage: async (root, { id }, { req }) => {
    const User = await checkResolver(req, ["lanwiki"]);
    const isAdmin = isUserAdmin(User);
    const OriginalPage = <LanwikiPageInstance>await models.LanwikiPage.findByPk(id, {
      include: [
        models.LanwikiFile,
        {
          model: models.LanwikiFolder,
          include: [{
            model: models.LanwikiFolderRight,
            where: {
              UserId: User.get('id'),
              active: true,
            }
          }]
        },
      ]
    });
    const FolderRights = <LanwikiFolderRightInstance[]>(<LanwikiFolderInstance>OriginalPage.get('LanwikiFolder')).get('LanwikiFolderRights');
    if (!isAdmin && (FolderRights.length === 0 || !FolderRights[0].get('active') || !FolderRights[0].get('write'))) {
      throw CantAddOrEditPagesToFolderError;
    }
    const LanwikiFiles = <LanwikiFileInstance[]>OriginalPage.get('LanwikiFiles');
    if (LanwikiFiles.length > 0) {
      LanwikiFiles.forEach((LanwikiFile) => {
        try {
          fs.unlinkSync(<string>LanwikiFile.get('path'));
        } catch (err) {
        }
      })
      await Promise.all(LanwikiFiles.map((LanwikiFile) => LanwikiFile.destroy()));
    }
    return OriginalPage.destroy();
  },
}

const attributes = {
  LanwikiPage: {
    async myRights(page, body, { req, userID }) {
      if (page.isAdmin) {
        return fullFolderRights;
      }
      let Folder = <LanwikiFolderInstance>page.get('LanwikiFolder');
      if (!Folder) {
        Folder = <LanwikiFolderInstance>await page.getLanwikiFolder({
          include: [{
            model: models.LanwikiFolderRight,
            where: {
              userId: userID,
              active: true,
            },
          }]
        });
      }
      let FolderRights = <LanwikiFolderRightInstance[]>Folder.get('LanwikiFolderRights');
      if (!FolderRights) {
        FolderRights = await <LanwikiFolderRightInstance[]>Folder.getLanwikiFolderRights({
          where: {
            userId: userID,
            active: true,
          },
        });
      }
      if (FolderRights.length === 0 || !FolderRights[0].get('active') || !FolderRights[0].get('write')) {
        return noFolderRights;
      }
      return FolderRights[0];
    },
    async tags(page) {
      return getModelAttribute(page, 'LanwikiTags');
    },
    async images(page) {
      return getModelAttribute(page, 'LanwikiFiles');
    },
    async folder(page) {
      return getModelAttribute(page, 'LanwikiFolder');
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
