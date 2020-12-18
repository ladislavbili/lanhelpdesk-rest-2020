import { createDoesNoExistsError } from '@/configs/errors';
import { models } from '@/models';
import { ProjectInstance } from '@/models/instances';
import checkResolver from './checkResolver';
import { getModelAttribute } from '@/helperFunctions';

const querries = {
  /*
  tags: async (root, args, { req }) => {
    await checkResolver(req);
    return models.Tag.findAll({
      order: [
        ['order', 'ASC'],
        ['title', 'ASC'],
      ]
    })
  },
  tag: async (root, { id }, { req }) => {
    await checkResolver(req, ["tags"]);
    return models.Tag.findByPk(id);
  },
  */
}

const mutations = {
  /*
  addTag: async (root, args, { req }) => {
    await checkResolver(req, ["tags"]);
    return models.Tag.create(args);
  },

  updateTag: async (root, { id, ...args }, { req }) => {
    await checkResolver(req, ["tags"]);
    const Tag = await models.Tag.findByPk(id);
    if (Tag === null) {
      throw createDoesNoExistsError('Tag', id);
    }
    return Tag.update(args);
  },

  deleteTag: async (root, { id }, { req }) => {
    await checkResolver(req, ["tags"]);
    const Tag = await models.Tag.findByPk(id,
      {
        include: [
          { model: models.Project, as: 'defTags' },
        ]
      }
    );
    if (Tag === null) {
      throw createDoesNoExistsError('Tag', id);
    }
    await Promise.all([
      ...(<ProjectInstance[]>Tag.get('defTags')).map((project) => {
        return project.removeDefTag(id);
      }),
    ])
    return Tag.destroy();
  },
  */
}

const attributes = {
  Tag: {
    async tasks(tag) {
      return getModelAttribute(tag, 'Tasks');
    },
    async project(tag) {
      return getModelAttribute(tag, 'ofProject');
    },
  },
};

export default {
  attributes,
  mutations,
  querries
}
