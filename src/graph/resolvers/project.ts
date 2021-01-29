import {
  createDoesNoExistsError,
  ProjectNoAdminGroupWithUsers,
  ProjectNoNewStatus,
  ProjectNoCloseStatus
} from '@/configs/errors';
import { models, sequelize } from '@/models';
import checkResolver from './checkResolver';
import {
  flattenObject,
  idsDoExistsCheck,
  multipleIdDoesExistsCheck,
  splitArrayByFilter,
  getModelAttribute,
  checkIfHasProjectRights,
  checkDefIntegrity,
  checkIfChanged,
} from '@/helperFunctions';
import { ProjectInstance, RoleInstance, AccessRightsInstance, TaskInstance, ImapInstance, TagInstance, StatusInstance, ProjectGroupInstance, ProjectGroupRightsInstance, UserInstance } from '@/models/instances';
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
    const User = await checkResolver(req);
    if ((<RoleInstance>User.get('Role')).get('level') !== 0) {
      await checkIfHasProjectRights(User.get('id'), undefined, id, ['projectPrimaryRead']);
    }
    return models.Project.findByPk(id, {
      include: [
        {
          model: models.Tag,
          as: 'tags'
        },
        {
          model: models.Status,
          as: 'projectStatuses'
        },
      ]
    });
  },
  myProjects: async (root, args, { req, userID }) => {
    const User = await checkResolver(
      req,
      [],
      false,
      [{
        model: models.ProjectGroup,
        include: [
          {
            model: models.Project,
            include: [
              models.Milestone,
              {
                model: models.Tag,
                as: 'tags'
              },
              {
                model: models.Status,
                as: 'projectStatuses'
              },
              {
                model: models.ProjectGroup,
                include: [
                  {
                    model: models.User,
                  }
                ]
              }
            ]
          },
          models.ProjectGroupRights,
        ]
      }
      ]
    );

    return (<ProjectGroupInstance[]>User.get('ProjectGroups')).map((group) => (
      {
        right: group.get('ProjectGroupRight'),
        project: group.get('Project'),
        usersWithRights: (<ProjectGroupInstance[]>(<ProjectInstance>group.get('Project')).get('ProjectGroups')).reduce((acc, cur) => {
          return [...acc, ...(<UserInstance[]>cur.get('Users'))]
        }, [])
      }
    ))
  },
}

const mutations = {
  addProject: async (root, { def, tags, statuses, groups, userGroups, ...attributes }, { req }) => {
    await checkResolver(req, ["projects"]);
    checkDefIntegrity(def);
    //check is there is an admin
    if (!groups.some((group) => (
      group.rights.projectPrimaryRead &&
      group.rights.projectPrimaryWrite &&
      group.rights.projectSecondary &&
      userGroups.some((userGroup) => userGroup.groupId === group.id)
    ))) {
      throw ProjectNoAdminGroupWithUsers;
    }
    //check if there are required statuses
    if (!statuses.some((status) => status.action === 'IsNew')) {
      throw ProjectNoNewStatus;
    }
    if (!statuses.some((status) => status.action === 'CloseDate')) {
      throw ProjectNoCloseStatus;
    }
    let assignedTos = def.assignedTo.value;
    let company = def.company.value;
    let requester = def.requester.value;
    let fakeTagIds = def.tag.value.filter((fakeID) => tags.some((tag) => tag.id === fakeID));
    let fakeStatusId = statuses.some((status) => status.id === def.status.value) ? def.status.value : null;

    await idsDoExistsCheck(assignedTos, models.User);
    await multipleIdDoesExistsCheck([
      { model: models.Company, id: company },
      { model: models.User, id: requester },
    ].filter((pair) => pair.id !== null));

    delete def.assignedTo['value'];
    delete def.company['value'];
    delete def.requester['value'];
    delete def.status['value'];
    delete def.tag['value'];
    //def map to object
    let newDef = flattenObject(def, 'def');

    const newProject = <ProjectInstance>await models.Project.create({
      ...attributes,
      defCompanyId: company,
      defRequesterId: requester,
    });
    await newProject.setDefAssignedTos(assignedTos === null ? [] : assignedTos);
    const newGroups = <ProjectGroupInstance[]>await Promise.all(
      groups.map((group) => newProject.createProjectGroup({
        title: group.title,
        order: group.order,
        ProjectGroupRight: group.rights,
      }, {
          include: [models.ProjectGroupRights]
        })
      )
    )
    const newStatuses = <StatusInstance[]>await Promise.all(
      statuses.map((newStatus) => newProject.createProjectStatus({
        title: newStatus.title,
        order: newStatus.order,
        color: newStatus.color,
        icon: newStatus.icon,
        action: newStatus.action,
        template: false,
      }))
    )
    const newTags = <TagInstance[]>await Promise.all(
      tags.map((newTag) => newProject.createTag({
        title: newTag.title,
        color: newTag.color,
        order: newTag.order,
      }))
    )
    if (fakeStatusId !== null) {
      await newProject.setDefStatus(newStatuses[statuses.findIndex((status) => status.id === fakeStatusId)].get('id'));
    }
    await Promise.all(
      userGroups.map((userGroup) => {
        let index = groups.findIndex((group) => group.id === userGroup.groupId);
        if (index !== -1) {
          console.log('target group', newGroups);

          return newGroups[index].addUser(userGroup.userId)
        }
      })
    )
    await newProject.setDefTags(fakeTagIds.map((fakeID) => {
      let index = tags.findIndex((tag) => tag.id === fakeID);
      return newTags[index].get('id');
    }));
    return newProject;
  },

  updateProject: async (root, allAttributes, { req, userID }) => {
    const User = await checkResolver(req);
    const {
      id,
      def: defInput,
      deleteTags,
      updateTags,
      addTags,
      deleteStatuses,
      updateStatuses,
      addStatuses,
      userGroups,
      addGroups,
      updateGroups,
      deleteGroups,
      ...attributes
    } = allAttributes;
    const Project = <ProjectInstance>await models.Project.findByPk(id, {
      include: [
        {
          model: models.ProjectGroup,
          include: [models.ProjectGroupRights, models.User]
        },
        {
          model: models.Tag,
          as: 'tags'
        },
        {
          model: models.Status,
          as: 'projectStatuses'
        },
      ]
    });
    if (Project === null) {
      throw createDoesNoExistsError('Project', id);
    }
    let requiredRights = ['projectPrimaryWrite'];
    if (await checkIfChanged(allAttributes, Project)) {
      requiredRights.push('projectSecondary')
    }
    await checkIfHasProjectRights(User.get('id'), undefined, id, requiredRights);

    if (defInput) {
      checkDefIntegrity(defInput);
      let assignedTos = defInput.assignedTo.value;
      let company = defInput.company.value;
      let requester = defInput.requester.value;
      let status = defInput.status.value;
      let tags = defInput.tag.value;
      await idsDoExistsCheck(assignedTos, models.User);
      await idsDoExistsCheck(tags.filter((tagID) => tagID > -1), models.Tag);
      await multipleIdDoesExistsCheck([
        { model: models.Company, id: company },
        { model: models.User, id: requester },
        { model: models.Status, id: defInput.status.value !== null && defInput.status.value > 0 ? defInput.status.value : null },
      ].filter((pair) => pair.id !== null));
    }
    let promises = [];
    let extraAttributes = {};

    const newStatuses = <StatusInstance[]>await Promise.all(
      addStatuses.map((newStatus) => Project.createProjectStatus({
        title: newStatus.title,
        order: newStatus.order,
        color: newStatus.color,
        icon: newStatus.icon,
        action: newStatus.action,
        template: false,
      }))
    )

    const newTags = <TagInstance[]>await Promise.all(
      addTags.map((newTag) => Project.createTag({
        title: newTag.title,
        color: newTag.color,
        order: newTag.order,
      }))
    )

    const newGroups = <ProjectGroupInstance[]>await Promise.all(
      addGroups.map((newGroup) => Project.createProjectGroup({
        title: newGroup.title,
        order: newGroup.order,
        ProjectGroupRight: newGroup.rights,
      }, {
          include: [models.ProjectGroupRights]
        }))
    )

    //DEFS
    if (defInput) {
      let assignedTos = defInput.assignedTo.value;
      let company = defInput.company.value;
      let requester = defInput.requester.value;
      let status = defInput.status.value;
      let tags = defInput.tag.value;
      delete defInput.assignedTo['value'];
      delete defInput.company['value'];
      delete defInput.requester['value'];
      delete defInput.status['value'];
      delete defInput.tag['value'];
      //def map to object
      const def = flattenObject(defInput, 'def');
      extraAttributes = {
        ...def,
        defCompanyId: company,
        defRequesterId: requester,
      }
      promises.push(Project.setDefAssignedTos(assignedTos === null ? [] : assignedTos));
      if (status < 0) {
        promises.push(Project.setDefStatus(newStatuses[addStatuses.findIndex((newStatus) => newStatus.id === status)].get('id')));
      } else {
        promises.push(Project.setDefStatus(status));
      }

      const [existingTags, fakeTags] = splitArrayByFilter(tags, (tagID) => tagID > -1);
      promises.push(Project.setDefTags(
        tags === null ?
          [] :
          [
            ...existingTags,
            ...fakeTags.map((fakeID) => {
              let index = addTags.findIndex((tag) => tag.id === fakeID);
              return newTags[index].get('id');
            })
          ]
      ));
    }
    deleteTags.forEach((tagID) => {
      const Tag = (<TagInstance[]>Project.get('tags')).find((Tag) => Tag.get('id') === tagID);
      if (Tag) {
        promises.push(Tag.destroy());
      }
    })
    updateTags.forEach((tag) => {
      const Tag = (<TagInstance[]>Project.get('tags')).find((Tag) => Tag.get('id') === tag.id);
      if (Tag) {
        promises.push(Tag.update({
          title: tag.title,
          color: tag.color,
          order: tag.order,
        }));
      }
    })

    deleteStatuses.forEach((statusID) => {
      const Status = (<StatusInstance[]>Project.get('projectStatuses')).find((Status) => Status.get('id') === statusID);
      if (Status) {
        promises.push(Status.destroy());
      }
    })
    updateStatuses.forEach((status) => {
      const Status = (<StatusInstance[]>Project.get('projectStatuses')).find((Status) => Status.get('id') === status.id);
      if (Status) {
        promises.push(Status.update({
          title: status.title,
          order: status.order,
          color: status.color,
          icon: status.icon,
          action: status.action,
        }));
      }
    })
    deleteGroups.forEach((groupId) => {
      const Group = (<ProjectGroupInstance[]>Project.get('ProjectGroups')).find((Group) => Group.get('id') === groupId);
      if (Group) {
        promises.push(Group.destroy());
      }
    })
    updateGroups.forEach((group) => {
      const Group = (<ProjectGroupInstance[]>Project.get('ProjectGroups')).find((Group) => Group.get('id') === group.id);
      if (Group) {
        promises.push(Group.update({
          title: group.title,
          order: group.order,
        }));

        promises.push(
          (<ProjectGroupRightsInstance>Group.get('ProjectGroupRight')).update(group.rights)
        )
      }
    })
    //update rights
    userGroups.forEach((userGroup) => {
      if (userGroup.groupId < 0) {
        const index = addGroups.findIndex((group) => group.id === userGroup.groupId);
        if (index !== -1) {
          const Group = newGroups[index];
          promises.push(Group.setUsers(userGroup.userIds));
        }
      } else {
        const Group = (<ProjectGroupInstance[]>Project.get('ProjectGroups')).find((Group) => Group.get('id') === userGroup.groupId);
        if (Group) {
          promises.push(Group.setUsers(userGroup.userIds));
        }
      }
    })

    promises.push(Project.update({ ...attributes, ...extraAttributes }));
    await Promise.all(promises);
    return Project;
  },

  addUserToProject: async (root, { projectId, userId }, { req }) => {
    const User = await checkResolver(req);
    const Project = <ProjectInstance>await models.Project.findByPk(projectId, {
      include: [models.ProjectGroup],
      order: [
        ['order', 'DESC']
      ]
    });
    if (Project === null) {
      throw createDoesNoExistsError('Project', projectId);
    }
    if ((<ProjectGroupInstance[]>Project.get('ProjectGroups')).length === 0) {
      return Project;
    }
    await idsDoExistsCheck([userId], models.User);
    await checkIfHasProjectRights(User.get('id'), undefined, projectId, ['projectSecondary']);
    (<ProjectGroupInstance[]>Project.get('ProjectGroups'))[0].addUser(userId);
    return Project.reload();
  },

  deleteProject: async (root, { id, newId }, { req }) => {
    const User = await checkResolver(req);
    const Project = await models.Project.findByPk(id, { include: [{ model: models.Task }, { model: models.Imap }] });
    if (Project === null) {
      throw createDoesNoExistsError('Project', id);
    }
    const NewProject = await models.Project.findByPk(newId);
    if (NewProject === null) {
      throw createDoesNoExistsError('New project', newId);
    }
    if (
      !(<AccessRightsInstance>(<RoleInstance>User.get('Role')).get('AccessRight')).get('projects')
    ) {
      await checkIfHasProjectRights(User.get('id'), undefined, id, ['projectSecondary']);
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
    async tags(project) {
      return getModelAttribute(project, 'tags');
    },
    async statuses(project) {
      return getModelAttribute(project, 'projectStatuses');
    },
    async right(project, _, { userID }, __) {
      const Groups = await project.getProjectGroups({
        attributes: ['id', 'title'],
        include: [
          { model: models.ProjectGroupRights, attributes: { exclude: ['ProjectGroupId', 'updatedAt', 'createdAt', 'id'] } },
          { model: models.User, where: { id: userID } }
        ]
      });
      if (Groups.length === 1) {
        return Groups[0].get('ProjectGroupRight').get();
      }
      return null;
    },
    async groups(project) {
      return getModelAttribute(project, 'ProjectGroups');
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
      const Groups = await project.getProjectGroups({
        attributes: ['id', 'title'],
        include: [
          { model: models.ProjectGroupRights, attributes: { exclude: ['ProjectGroupId', 'updatedAt', 'createdAt', 'id'] } },
          { model: models.User, where: { id: userID } }
        ]
      });
      if (Groups.length === 1) {
        return Groups[0].get('ProjectGroupRight').get();
      }
      return null;
    },
    async tags(project) {
      return getModelAttribute(project, 'tags');
    },
    async statuses(project) {
      return getModelAttribute(project, 'projectStatuses');
    },
    async groups(project) {
      return getModelAttribute(project, 'ProjectGroups');
    },
  },
};

export default {
  attributes,
  mutations,
  querries
}

function fixRights(rights) {
  return rights
}
