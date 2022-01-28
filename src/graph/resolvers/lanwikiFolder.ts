import {
  createDoesNoExistsError,
  CantManageFolderError,
} from '@/configs/errors';
import { models, sequelize } from '@/models';
import {
  LanwikiFolderInstance,
  LanwikiFolderRightInstance,
  LanwikiPageInstance,
} from '@/models/instances';
import checkResolver from './checkResolver';
import { getModelAttribute } from '@/helperFunctions';
import {
  isUserAdmin,
  idsDoExistsCheck,
} from '@/helperFunctions';
import { pubsub } from './index';
const { withFilter } = require('apollo-server-express');
import {
  LANWIKI_FOLDER_CHANGE,
} from '@/configs/subscriptions';

const fullFolderRights = {
  active: true,
  read: true,
  write: true,
  manage: true,
};

const queries = {
  lanwikiFolders: async (root, { archived }, { req }) => {
    const User = await checkResolver(req, ['lanwiki']);
    const isAdmin = isUserAdmin(User);
    const where = <any>{};
    if (typeof archived == "boolean") {
      where.archived = archived;
    }
    if (isAdmin) {
      const Folders = <LanwikiFolderInstance[]>await models.LanwikiFolder.findAll({
        order: [
          ['order', 'ASC'],
          ['title', 'ASC'],
        ],
        include: [
          {
            model: models.LanwikiFolderRight,
            include: [models.User],
          },
        ],
        where
      });
      return Folders.map((Folder) => {
        Folder.isAdmin = true;
        return Folder;
      })
    }
    return models.LanwikiFolder.findAll({
      order: [
        ['order', 'ASC'],
        ['title', 'ASC'],
      ],
      include: [
        {
          required: true,
          model: models.LanwikiFolderRight,
          include: [models.User],
          where: {
            UserId: User.get('id'),
            active: true,
          },
        },
      ],
      where: {
        archived: archived === true,
      }
    });
  },
  lanwikiFolder: async (root, { id }, { req }) => {
    const User = await checkResolver(req, ["lanwiki"]);
    const isAdmin = isUserAdmin(User);
    const Folder = await models.LanwikiFolder.findByPk(id, {
      include: [
        {
          model: models.LanwikiFolderRight,
          include: [models.User],
        },
      ],
    });
    if (!Folder) {
      throw createDoesNoExistsError('Folder', id);
    }
    const Rights = (<LanwikiFolderRightInstance[]>Folder.get('LanwikiFolderRights')).find((folderRight) => folderRight.get('UserId') === User.get('id'));
    if (!isAdmin && (!Rights || !Rights.get('active') || !Rights.get('manage'))) {
      throw createDoesNoExistsError('Folder', id);
    }
    return Folder;
  },
  lanwikiUsers: async (root, args, { req }) => {
    const User = await checkResolver(req, ["lanwiki"]);
    return models.User.findAll({
      include: [
        {
          required: true,
          model: models.Role,
          include: [
            {
              required: true,
              model: models.AccessRights,
              where: {
                lanwiki: true,
              },
            },
          ],
        }
      ],
    });
  },
}

const mutations = {
  addLanwikiFolder: async (root, { folderRights, ...directArguments }, { req }) => {
    const User = await checkResolver(req, ["lanwiki"]);
    await idsDoExistsCheck(folderRights.map((folderRight) => folderRight.userId), models.User);
    const NewFolder = await models.LanwikiFolder.create(
      {
        ...directArguments,
        LanwikiFolderRights: folderRights.map((folderRight) => ({
          ...folderRight,
          UserId: folderRight.userId,
        })),
      },
      {
        include: [{
          model: models.LanwikiFolderRight,
        }],
      },
    );
    pubsub.publish(LANWIKI_FOLDER_CHANGE, { lanwikiFolderSubscription: folderRights.map((folderRight) => folderRight.userId) });
    return NewFolder;
  },
  updateLanwikiFolder: async (root, { id, folderRights, ...directArguments }, { req }) => {
    const User = await checkResolver(req, ["lanwiki"]);
    const isAdmin = isUserAdmin(User);
    const OriginalFolder = <LanwikiFolderInstance>await models.LanwikiFolder.findByPk(id, {
      include: [models.LanwikiFolderRight],
    });
    if (!OriginalFolder) {
      throw createDoesNoExistsError('Folder', id);
    };
    const OriginalFolderRights = <LanwikiFolderRightInstance[]>OriginalFolder.get('LanwikiFolderRights');
    const MyOriginalRight = OriginalFolderRights.find((FolderRight) => FolderRight.get('UserId') === User.get('id'));

    if (!isAdmin && (!MyOriginalRight.get('active') || !MyOriginalRight.get('manage'))) {
      throw CantManageFolderError;
    }
    await idsDoExistsCheck(folderRights.map((folderRight) => folderRight.userId), models.User);
    const newFolderUsersIds = folderRights.map((folderRight) => folderRight.userId);
    const originalFolderUsersIds = OriginalFolderRights.map((FolderRight) => FolderRight.get('UserId'));
    const DeletedFolderRights = OriginalFolderRights.filter((FolderRight) => !newFolderUsersIds.includes(FolderRight.get('UserId')));
    const UpdatedFolderRights = OriginalFolderRights.filter((FolderRight) => newFolderUsersIds.includes(FolderRight.get('UserId')));

    await sequelize.transaction(async (transaction) => {
      await Promise.all([
        OriginalFolder.update(directArguments, { transaction }),
        ...DeletedFolderRights.map((FolderRight) => FolderRight.destroy({ transaction })),
        ...UpdatedFolderRights.map((FolderRight) => FolderRight.update(folderRights.find((folderRight) => folderRight.userId === FolderRight.get('UserId')), { transaction })),
        ...folderRights.filter((folderRight) => !UpdatedFolderRights.some((FolderRight) => FolderRight.get('UserId') === folderRight.userId))
          .map((folderRight) => OriginalFolder.createLanwikiFolderRight({ ...folderRight, UserId: folderRight.userId }, { transaction })),
      ]);
    });
    pubsub.publish(LANWIKI_FOLDER_CHANGE, { lanwikiFolderSubscription: [...newFolderUsersIds, ...originalFolderUsersIds] });
    return OriginalFolder.reload();
  },
  deleteLanwikiFolder: async (root, { id, newId }, { req }) => {
    const User = await checkResolver(req, ["lanwiki"]);
    const isAdmin = isUserAdmin(User);
    const hasReplacement = !isNaN(parseInt(newId));
    const OriginalFolder = <LanwikiFolderInstance>await models.LanwikiFolder.findByPk(id, {
      include: [models.LanwikiFolderRight],
    });
    if (!OriginalFolder) {
      throw createDoesNoExistsError('Folder', id);
    }
    const OriginalFolderRights = <LanwikiFolderRightInstance[]>OriginalFolder.get('LanwikiFolderRights');
    const MyOriginalRight = OriginalFolderRights.find((FolderRight) => FolderRight.get('UserId') === User.get('id'));

    let ReplacementFolder = null;
    let MyReplacementRight = null;
    if (hasReplacement) {
      ReplacementFolder = <LanwikiFolderInstance>await models.LanwikiFolder.findByPk(newId, {
        include: [models.LanwikiFolderRight],
      });
      if (!ReplacementFolder) {
        throw createDoesNoExistsError('Replacement folder', newId);
      }
      const ReplacementFolderRights = <LanwikiFolderRightInstance[]>ReplacementFolder.get('LanwikiFolderRights');
      MyReplacementRight = ReplacementFolderRights.find((FolderRight) => FolderRight.get('UserId') === User.get('id'));
    }

    if (
      !isAdmin && (
        !MyOriginalRight.get('active') ||
        !MyOriginalRight.get('manage') ||
        (MyReplacementRight !== null && !MyReplacementRight.get('active')) ||
        (MyReplacementRight !== null && !MyReplacementRight.get('write'))
      )
    ) {
      throw CantManageFolderError;
    }

    if (hasReplacement) {
      const OriginalPages = <LanwikiPageInstance[]>await OriginalFolder.getLanwikiPages();
      await Promise.all(OriginalPages.map((OriginalPage) => OriginalPage.update({ LanwikiFolderId: newId })))
    }
    await OriginalFolder.destroy();
    pubsub.publish(LANWIKI_FOLDER_CHANGE, { lanwikiFolderSubscription: OriginalFolderRights.map((FolderRight) => FolderRight.get('UserId')) });
    return OriginalFolder;
  },
}

const attributes = {
  LanwikiFolder: {
    async folderRights(lanwikiFolder) {
      return getModelAttribute(lanwikiFolder, 'LanwikiFolderRights');
    },
    async myRights(lanwikiFolder, body, { userID }) {
      if (lanwikiFolder.isAdmin) {
        return fullFolderRights;
      }
      return (await getModelAttribute(lanwikiFolder, 'LanwikiFolderRights')).find((folderRight) => folderRight.get('UserId') === userID);
    },
    async folderUsers(lanwikiFolder) {
      return (await getModelAttribute(lanwikiFolder, 'LanwikiFolderRights')).map((folderRight) => folderRight.get('User'));
    },
  },
  LanwikiFolderRight: {
    async user(folderRight) {
      return getModelAttribute(folderRight, 'User');
    },
  }
};

const subscriptions = {
  lanwikiFolderSubscription: {
    subscribe: withFilter(
      () => pubsub.asyncIterator(LANWIKI_FOLDER_CHANGE),
      async ({ lanwikiFolderSubscription }, args, { userID }) => {
        return lanwikiFolderSubscription.includes(userID);
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
