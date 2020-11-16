import { createDoesNoExistsError, NotAdminOfProjectNorManagesProjects } from '@/configs/errors';
import { models, sequelize } from '@/models';
import checkResolver from './checkResolver';
import { flattenObject, idsDoExistsCheck, multipleIdDoesExistsCheck, splitArrayByFilter, addApolloError, getModelAttribute } from '@/helperFunctions';
import { ProjectInstance, ProjectRightInstance, RoleInstance, AccessRightsInstance, TaskInstance, ImapInstance } from '@/models/instances';
import { pubsub } from './index';
import { TASK_CHANGE } from '@/configs/subscriptions';
import { ApolloError } from 'apollo-server-express';

const querries = {
  projects: async (root, args, { req }) => {
    await checkResolver(req, ["projects"]);
    return models.Project.findAll({
      order: [
        ['title', 'ASC'],
      ]
    })
  },
  project: async (root, { id }, { req }) => {
    await checkResolver(req);
    return models.Project.findByPk(id, {
      include: [
        models.ProjectRight,
      ]
    });
  },
  myProjects: async (root, args, { req }) => {
    const User = await checkResolver(
      req,
      [],
      false,
      [{
        model: models.ProjectRight,
        include: [{
          model: models.Project,
          include: [{
            model: models.ProjectRight,
            include: [{
              model: models.User,
            }]
          }]
        }]
      }]
    );

    return (<ProjectRightInstance[]>User.get('ProjectRights')).map((right) => (
      {
        right,
        project: right.get('Project'),
        usersWithRights: (<ProjectRightInstance[]>(<ProjectInstance>right.get('Project')).get('ProjectRights')).map((ProjectRight) => ProjectRight.get('User'))
      }
    ))
  },
}

const mutations = {

  addProject: async (root, { def, projectRights, ...attributes }, { req }) => {
    await checkResolver(req, ["projects"]);
    checkDefIntegrity(def);
    let assignedTos = def.assignedTo.value;
    let company = def.company.value;
    let requester = def.requester.value;
    let status = def.status.value;
    let tags = def.tag.value;
    let taskType = def.taskType.value;

    await idsDoExistsCheck(projectRights.map((right) => right.UserId), models.User);
    await idsDoExistsCheck(assignedTos, models.User);
    await idsDoExistsCheck(tags, models.Tag);
    await multipleIdDoesExistsCheck([
      { model: models.Company, id: company },
      { model: models.User, id: requester },
      { model: models.Status, id: status },
      { model: models.TaskType, id: taskType }
    ].filter((pair) => pair.id !== null));

    delete def.assignedTo['value'];
    delete def.company['value'];
    delete def.requester['value'];
    delete def.status['value'];
    delete def.tag['value'];
    delete def.taskType['value'];
    //def map to object
    let newDef = flattenObject(def, 'def');

    const newProject = <ProjectInstance>await models.Project.create({
      ...attributes,
      defCompanyId: company,
      defRequesterId: requester,
      defStatusId: status,
      defTaskTypeId: taskType,
      ProjectRights: fixRights(projectRights)
    }, {
        include: [{ model: models.ProjectRight }]
      });

    await newProject.setDefAssignedTos(assignedTos === null ? [] : assignedTos);
    await newProject.setDefTags(tags === null ? [] : tags);
    return newProject;
  },

  updateProject: async (root, { id, def: defInput, projectRights: projectRightsInput, ...attributes }, { req, userID }) => {
    const User = await checkResolver(req);
    const Project = <ProjectInstance>await models.Project.findByPk(id, { include: [{ model: models.ProjectRight }] });
    if (Project === null) {
      throw createDoesNoExistsError('Project', id);
    }

    //Who can edit (admin in project project manager)
    const userRights = (<ProjectRightInstance[]>Project.get('ProjectRights')).find((right) => right.get('UserId') === User.get('id'));
    if (
      (
        userRights === undefined ||
        !userRights.get('admin')
      ) &&
      !((<AccessRightsInstance>(<RoleInstance>User.get('Role')).get('AccessRight')).get().projects)
    ) {
      addApolloError(
        'Project',
        NotAdminOfProjectNorManagesProjects,
        userID,
        id
      );
      throw NotAdminOfProjectNorManagesProjects;
    }

    await sequelize.transaction(async (t) => {
      let extraAttributes = {};
      const promises = [];
      //RIGHTS
      const projectRights = fixRights(projectRightsInput);
      //all users exists in rights
      await idsDoExistsCheck(projectRights.map((right) => right.UserId), models.User);

      if (projectRights !== null) {
        const [existingRights, deletedRights] = splitArrayByFilter(
          <ProjectRightInstance[]>Project.get('ProjectRights'),
          (right) => [...projectRights].some((newRight) => newRight.UserId === right.get('UserId'))
        )
        const newRights = projectRights.filter((projectRight) => !existingRights.some((right) => right.get('UserId') === projectRight.UserId))
        //update rights
        newRights.forEach((right) => promises.push(Project.createProjectRight(right, { transaction: t })));
        existingRights.forEach((Right) => promises.push(Right.update(projectRights.find((right) => right.UserId === Right.get('UserId')), { transaction: t })));
        deletedRights.forEach((Right) => promises.push(Right.destroy({ transaction: t })));
      }

      //DEFS
      if (defInput) {
        checkDefIntegrity(defInput);
        let assignedTos = defInput.assignedTo.value;
        let company = defInput.company.value;
        let requester = defInput.requester.value;
        let status = defInput.status.value;
        let tags = defInput.tag.value;
        let taskType = defInput.taskType.value;

        await idsDoExistsCheck(assignedTos, models.User);
        await idsDoExistsCheck(tags, models.Tag);
        await multipleIdDoesExistsCheck([
          { model: models.Company, id: company },
          { model: models.User, id: requester },
          { model: models.Status, id: status },
          { model: models.TaskType, id: taskType }
        ].filter((pair) => pair.id !== null));

        delete defInput.assignedTo['value'];
        delete defInput.company['value'];
        delete defInput.requester['value'];
        delete defInput.status['value'];
        delete defInput.tag['value'];
        delete defInput.taskType['value'];
        //def map to object
        const def = flattenObject(defInput, 'def');
        extraAttributes = {
          ...def,
          defCompanyId: company,
          defRequesterId: requester,
          defStatusId: status,
          defTaskTypeId: taskType,
        }
        promises.push(Project.setDefAssignedTos(assignedTos === null ? [] : assignedTos));
        promises.push(Project.setDefTags(tags === null ? [] : tags));
      }

      promises.push(Project.update({ ...attributes, ...extraAttributes }));
      await Promise.all(promises);
    })
    return Project;
  },

  addUserToProject: async (root, { projectId, userId }, { req }) => {
    const User = await checkResolver(req);
    const Project = <ProjectInstance>await models.Project.findByPk(projectId, { include: [{ model: models.ProjectRight }] });
    if (Project === null) {
      throw createDoesNoExistsError('Project', projectId);
    }
    await idsDoExistsCheck([userId], models.User);

    //Who can edit (admin in project project manager)
    const userRights = (<ProjectRightInstance[]>Project.get('ProjectRights')).find((right) => right.get('UserId') === User.get('id'));
    if (
      (
        userRights === undefined ||
        !userRights.get('admin')
      ) &&
      !((<AccessRightsInstance>(<RoleInstance>User.get('Role')).get('AccessRight')).get().projects)
    ) {
      addApolloError(
        'Project',
        NotAdminOfProjectNorManagesProjects,
        User.get('id'),
        projectId
      );
      throw NotAdminOfProjectNorManagesProjects;
    }
    await Project.createProjectRight({
      UserId: userId,
      read: true,
      write: false,
      delete: false,
      internal: false,
      admin: false
    });

    return Project.reload();
  },

  deleteProject: async (root, { id, newId }, { req }) => {
    await checkResolver(req, ["projects"]);
    const Project = await models.Project.findByPk(id, { include: [{ model: models.Task }, { model: models.Imap }] });
    if (Project === null) {
      throw createDoesNoExistsError('Project', id);
    }
    const NewProject = await models.Project.findByPk(newId);
    if (NewProject === null) {
      throw createDoesNoExistsError('New project', newId);
    }
    const Tasks = <TaskInstance[]>await Project.get('Tasks');
    pubsub.publish(TASK_CHANGE, { taskSubscription: { type: 'delete', data: null, ids: Tasks.forEach((Task) => Task.get('id')) } });
    const Imaps = <ImapInstance[]>await Project.get('Imaps');
    await Promise.all(Imaps.map((Imap) => Imap.setProject(newId)));
    return Project.destroy();
  },

}

const attributes = {
  Project: {
    async projectRights(project) {
      return getModelAttribute(project, 'ProjectRights');
    },
    async def(project) {
      return project.get('def')
    },
    async filters(project) {
      return getModelAttribute(project, 'filterOfProjects');
    },
    async milestones(project) {
      return getModelAttribute(project, 'Milestones');
    },
    async imaps(project) {
      return getModelAttribute(project, 'Imaps');
    },
    async right(project, _, { userID }, __) {
      const rights = await project.getProjectRights({ where: { UserId: userID } });
      if (rights.length === 0) {
        return {
          read: false,
          write: false,
          delete: false,
          internal: false,
          admin: false
        }
      }
      return {
        read: rights[0].get('read'),
        write: rights[0].get('write'),
        delete: rights[0].get('delete'),
        internal: rights[0].get('internal'),
        admin: rights[0].get('admin')
      };
    },
  },

  BasicProject: {
    async filters(project) {
      return getModelAttribute(project, 'filterOfProjects');
    },
    async def(project) {
      return project.get('def')
    },
    async milestones(project) {
      return getModelAttribute(project, 'Milestones');
    },
    async right(project, _, { userID }, __) {
      const rights = await project.getProjectRights({ where: { UserId: userID } });
      if (rights.length === 0) {
        return {
          read: false,
          write: false,
          delete: false,
          internal: false,
          admin: false
        }
      }
      return {
        read: rights[0].get('read'),
        write: rights[0].get('write'),
        delete: rights[0].get('delete'),
        internal: rights[0].get('internal'),
        admin: rights[0].get('admin')
      };
    },
  },
  ProjectRight: {
    async user(projectRight) {
      return getModelAttribute(projectRight, 'User');
    },
  },
};

export default {
  attributes,
  mutations,
  querries
}

function checkDefIntegrity(def) {
  const { assignedTo, company, overtime, pausal, requester, status, tag, taskType } = def;
  if (!assignedTo.show && (!assignedTo.def || !assignedTo.fixed)) {
    throw new ApolloError('In default values, assigned to is set to be hidden, but is not set to fixed and default.', 'PROJECT_DEF_INTEGRITY');
  } else if (assignedTo.fixed && !assignedTo.def) {
    throw new ApolloError('In default values, assigned to is set to be fixed, but is not set to default value.', 'PROJECT_DEF_INTEGRITY');
  } else if (assignedTo.fixed && (assignedTo.value === null || assignedTo.value === [])) {
    throw new ApolloError('In default values, assigned to is set to be fixed, but fixed value can\'t be empty.', 'PROJECT_DEF_INTEGRITY');
  }

  if (!company.show && (!company.def || !company.fixed)) {
    throw new ApolloError('In default values, company is set to be hidden, but is not set to fixed and default.', 'PROJECT_DEF_INTEGRITY');
  } else if (company.fixed && !company.def) {
    throw new ApolloError('In default values, company is set to be fixed, but is not set to default value.', 'PROJECT_DEF_INTEGRITY');
  } else if (company.fixed && (company.value === null)) {
    throw new ApolloError('In default values, company is set to be fixed, but fixed value can\'t be null.', 'PROJECT_DEF_INTEGRITY');
  }

  if (!overtime.show && (!overtime.def || !overtime.fixed)) {
    throw new ApolloError('In default values, overtime is set to be hidden, but is not set to fixed and default.', 'PROJECT_DEF_INTEGRITY');
  } else if (overtime.fixed && !overtime.def) {
    throw new ApolloError('In default values, overtime is set to be fixed, but is not set to default value.', 'PROJECT_DEF_INTEGRITY');
  } else if (overtime.fixed && !([true, false].includes(overtime.value))) {
    throw new ApolloError('In default values, overtime is set to be fixed, but fixed value can be only true or false.', 'PROJECT_DEF_INTEGRITY');
  }

  if (!pausal.show && (!pausal.def || !pausal.fixed)) {
    throw new ApolloError('In default values, pausal is set to be hidden, but is not set to fixed and default.', 'PROJECT_DEF_INTEGRITY');
  } else if (pausal.fixed && !pausal.def) {
    throw new ApolloError('In default values, pausal is set to be fixed, but is not set to default value.', 'PROJECT_DEF_INTEGRITY');
  } else if (pausal.fixed && !([true, false].includes(pausal.value))) {
    throw new ApolloError('In default values, pausal is set to be fixed, but fixed value can be only true or false.', 'PROJECT_DEF_INTEGRITY');
  }

  if (requester.fixed && !requester.def) {
    throw new ApolloError('In default values, requester is set to be fixed, but is not set to default value.', 'PROJECT_DEF_INTEGRITY');
  }

  if (!status.show && (!status.def || !status.fixed)) {
    throw new ApolloError('In default values, status is set to be hidden, but is not set to fixed and default.', 'PROJECT_DEF_INTEGRITY');
  } else if (status.fixed && !status.def) {
    throw new ApolloError('In default values, status is set to be fixed, but is not set to default value.', 'PROJECT_DEF_INTEGRITY');
  } else if (status.fixed && (status.value === null)) {
    throw new ApolloError('In default values, status is set to be fixed, but fixed value can\'t be null.', 'PROJECT_DEF_INTEGRITY');
  }

  if (tag.fixed && !tag.def) {
    throw new ApolloError('In default values, tag is set to be fixed, but is not set to default value.', 'PROJECT_DEF_INTEGRITY');
  }

  if (!taskType.show && (!taskType.def || !taskType.fixed)) {
    throw new ApolloError('In default values, task type is set to be hidden, but is not set to fixed and default.', 'PROJECT_DEF_INTEGRITY');
  } else if (taskType.fixed && !taskType.def) {
    throw new ApolloError('In default values, taskType is set to be fixed, but is not set to default value.', 'PROJECT_DEF_INTEGRITY');
  } else if (taskType.fixed && (taskType.value === null)) {
    throw new ApolloError('In default values, taskType is set to be fixed, but fixed value can\'t be null.', 'PROJECT_DEF_INTEGRITY');
  }

}

function fixRights(rights) {
  return rights.map((right) => {
    const { read, write, delete: deleteTasks, admin } = right;
    if (admin) {
      return { ...right, read: true, write: true, delete: true, admin: true };
    }
    if (deleteTasks) {
      return { ...right, read: true, write: true, delete: true, admin: false };
    }
    if (write) {
      return { ...right, read: true, write: true, delete: false, admin: false };
    }
    if (read) {
      return { ...right, read: true, write: false, delete: false, admin: false };
    }

  })
}
