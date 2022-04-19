import {
  createDoesNoExistsError,
  CantManageFolderError,
} from '@/configs/errors';
import { models, sequelize } from '@/models';
import {
  PassFolderInstance,
  PassFolderRightInstance,
  PassEntryInstance,
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
  PASS_FOLDERS_CHANGE,
} from '@/configs/subscriptions';

const fullFolderRights = {
  active: true,
  read: true,
  write: true,
  manage: true,
};

const queries = {
  passFolders: async (root, { req }) => {
    const User = await checkResolver(req, ['pass']);
    const isAdmin = isUserAdmin(User);
    const where = <any>{};
    if (isAdmin) {
      const Folders = <PassFolderInstance[]>await models.PassFolder.findAll({
        order: [
          ['order', 'ASC'],
          ['title', 'ASC'],
        ],
        include: [
          {
            model: models.PassFolderRight,
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
    return models.PassFolder.findAll({
      order: [
        ['order', 'ASC'],
        ['title', 'ASC'],
      ],
      include: [
        {
          required: true,
          model: models.PassFolderRight,
          include: [models.User],
          where: {
            UserId: User.get('id'),
            active: true,
          },
        },
      ],
    });
  },
  passFolder: async (root, { id }, { req }) => {
    const User = await checkResolver(req, ["pass"]);
    const isAdmin = isUserAdmin(User);
    const Folder = await models.PassFolder.findByPk(id, {
      include: [
        {
          model: models.PassFolderRight,
          include: [models.User],
        },
      ],
    });
    if (!Folder) {
      throw createDoesNoExistsError('Folder', id);
    }
    const Rights = (<PassFolderRightInstance[]>Folder.get('PassFolderRights')).find((folderRight) => folderRight.get('UserId') === User.get('id'));
    if (!isAdmin && (!Rights || !Rights.get('active') || !Rights.get('manage'))) {
      throw createDoesNoExistsError('Folder', id);
    }
    return Folder;
  },
  passUsers: async (root, args, { req }) => {
    const User = await checkResolver(req, ["pass"]);
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
                pass: true,
              },
            },
          ],
        }
      ],
    });
  },
}

const mutations = {
  addPassFolder: async (root, { folderRights, ...directArguments }, { req }) => {
    const User = await checkResolver(req, ["pass"]);
    await idsDoExistsCheck(folderRights.map((folderRight) => folderRight.userId), models.User);
    const NewFolder = await models.PassFolder.create(
      {
        ...directArguments,
        PassFolderRights: folderRights.map((folderRight) => ({
          ...folderRight,
          UserId: folderRight.userId,
        })),
      },
      {
        include: [{
          model: models.PassFolderRight,
        }],
      },
    );
    pubsub.publish(PASS_FOLDERS_CHANGE, { passFolderSubscription: folderRights.map((folderRight) => folderRight.userId) });
    return NewFolder;
  },
  updatePassFolder: async (root, { id, folderRights, ...directArguments }, { req }) => {
    const User = await checkResolver(req, ["pass"]);
    const isAdmin = isUserAdmin(User);
    const OriginalFolder = <PassFolderInstance>await models.PassFolder.findByPk(id, {
      include: [models.PassFolderRight],
    });
    if (!OriginalFolder) {
      throw createDoesNoExistsError('Folder', id);
    };
    const OriginalFolderRights = <PassFolderRightInstance[]>OriginalFolder.get('PassFolderRights');
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
          .map((folderRight) => OriginalFolder.createPassFolderRight({ ...folderRight, UserId: folderRight.userId }, { transaction })),
      ]);
    });
    pubsub.publish(PASS_FOLDERS_CHANGE, { passFolderSubscription: [...newFolderUsersIds, ...originalFolderUsersIds] });
    return OriginalFolder.reload();
  },
  deletePassFolder: async (root, { id, newId }, { req }) => {
    const User = await checkResolver(req, ["pass"]);
    const isAdmin = isUserAdmin(User);
    const hasReplacement = !isNaN(parseInt(newId));
    const OriginalFolder = <PassFolderInstance>await models.PassFolder.findByPk(id, {
      include: [models.PassFolderRight],
    });
    if (!OriginalFolder) {
      throw createDoesNoExistsError('Folder', id);
    }
    const OriginalFolderRights = <PassFolderRightInstance[]>OriginalFolder.get('PassFolderRights');
    const MyOriginalRight = OriginalFolderRights.find((FolderRight) => FolderRight.get('UserId') === User.get('id'));

    let ReplacementFolder = null;
    let MyReplacementRight = null;
    if (hasReplacement) {
      ReplacementFolder = <PassFolderInstance>await models.PassFolder.findByPk(newId, {
        include: [models.PassFolderRight],
      });
      if (!ReplacementFolder) {
        throw createDoesNoExistsError('Replacement folder', newId);
      }
      const ReplacementFolderRights = <PassFolderRightInstance[]>ReplacementFolder.get('PassFolderRights');
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
      const OriginalEntries = <PassEntryInstance[]>await OriginalFolder.getPassEntries();
      await Promise.all(OriginalEntries.map((OriginalEntry) => OriginalEntry.update({ PassFolderId: newId })))
    }
    await OriginalFolder.destroy();
    pubsub.publish(PASS_FOLDERS_CHANGE, { passFolderSubscription: OriginalFolderRights.map((FolderRight) => FolderRight.get('UserId')) });
    return OriginalFolder;
  },
}

const attributes = {
  PassFolder: {
    async folderRights(passFolder) {
      return getModelAttribute(passFolder, 'PassFolderRights');
    },
    async myRights(passFolder, body, { userID }) {
      if (passFolder.isAdmin) {
        return fullFolderRights;
      }
      return (await getModelAttribute(passFolder, 'PassFolderRights')).find((folderRight) => folderRight.get('UserId') === userID);
    },
    async folderUsers(passFolder) {
      return (await getModelAttribute(passFolder, 'PassFolderRights')).map((folderRight) => folderRight.get('User'));
    },
  },
  PassFolderRight: {
    async user(folderRight) {
      return getModelAttribute(folderRight, 'User');
    },
  }
};

const subscriptions = {
  passFolderSubscription: {
    subscribe: withFilter(
      () => pubsub.asyncIterator(PASS_FOLDERS_CHANGE),
      async ({ passFolderSubscription }, args, { userID }) => {
        return passFolderSubscription.includes(userID);
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
