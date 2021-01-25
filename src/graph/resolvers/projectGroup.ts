import {
  getModelAttribute
} from '@/helperFunctions';

const querries = {
}

const mutations = {
}

const attributes = {
  ProjectGroup: {
    async users(projectGroup) {
      return getModelAttribute(projectGroup, 'Users');
    },
    async rights(projectGroup) {
      return getModelAttribute(projectGroup, 'ProjectGroupRight');
    },
    async project(projectGroup) {
      return getModelAttribute(projectGroup, 'Project');
    },
  },
};

export default {
  attributes,
  mutations,
  querries
}
