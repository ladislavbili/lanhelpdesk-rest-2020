import {
  createDoesNoExistsError,
  ProjectNoAdminGroupWithUsers,
  ProjectNoNewStatus,
  ProjectNoCloseStatus
} from '@/configs/errors';
import { models, sequelize } from '@/models';
import checkResolver from './checkResolver';
import {
  allGroupRights
} from '@/configs/projectConstants';
import {
  flattenObject,
  idsDoExistsCheck,
  multipleIdDoesExistsCheck,
  splitArrayByFilter,
  getModelAttribute,
} from '@/helperFunctions';
import {
  checkDefIntegrity,
  checkIfChanged,
  checkIfHasProjectRights,
} from '@/graph/addons/project';
import {
  ProjectInstance,
  RoleInstance,
  AccessRightsInstance,
  TaskInstance,
  TaskMetadataInstance,
  SubtaskInstance,
  WorkTripInstance,
  MaterialInstance,
  CustomItemInstance,
  ImapInstance,
  TagInstance,
  StatusInstance,
  ProjectGroupInstance,
  ProjectGroupRightsInstance,
  UserInstance
} from '@/models/instances';
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
        {
          model: models.ProjectGroup,
          include: [
            models.User,
            models.ProjectGroupRights
          ]
        },

      ]
    });
  },
  myProjects: async (root, args, { req, userID }) => {
    const User = await checkResolver(req);
    if ((<RoleInstance>User.get('Role')).get('level') === 0) {
      await checkResolver(req, ["projects"]);
      const Projects = <ProjectInstance[]>await models.Project.findAll({
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
              models.User,
              models.ProjectGroupRights
            ]
          }
        ]
      })
      return Projects.map((Project) => (
        {
          right: allGroupRights,
          project: Project,
          usersWithRights: (<ProjectGroupInstance[]>Project.get('ProjectGroups')).reduce((acc, cur) => {
            return [...acc, ...(<UserInstance[]>cur.get('Users')).map((User) => ({ user: User, assignable: (<ProjectGroupRightsInstance>cur.get('ProjectGroupRight')).get('assignedWrite') }))]
          }, [])
        }
      ))
    } else {
      const ProjectGroups = <ProjectGroupInstance[]>await User.getProjectGroups({
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
                  models.User,
                  models.ProjectGroupRights
                ]
              }
            ]
          },
          models.ProjectGroupRights,
        ]
      });
      return ProjectGroups.map((group) => (
        {
          right: group.get('ProjectGroupRight'),
          project: group.get('Project'),
          usersWithRights: (<ProjectGroupInstance[]>(<ProjectInstance>group.get('Project')).get('ProjectGroups')).reduce((acc, cur) => {
            return [...acc, ...(<UserInstance[]>cur.get('Users')).map((User) => ({ user: User, assignable: (<ProjectGroupRightsInstance>cur.get('ProjectGroupRight')).get('assignedWrite') }))]
          }, [])
        }
      ))
    }
  },
}

const mutations = {
  addProject: async (root, { def, tags, statuses, groups, userGroups, ...attributes }, { req }) => {
    await checkResolver(req, ["addProjects"]);
    checkDefIntegrity(def);
    let defInput = def;
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
    let assignedTos = defInput.assignedTo.value;
    let company = defInput.company.value;
    let requester = defInput.requester.value;
    let taskType = defInput.type.value;
    let fakeTagIds = defInput.tag.value.filter((fakeID) => tags.some((tag) => tag.id === fakeID));
    let fakeStatusId = statuses.some((status) => status.id === defInput.status.value) ? defInput.status.value : null;

    await idsDoExistsCheck(assignedTos, models.User);
    await multipleIdDoesExistsCheck([
      { model: models.Company, id: company },
      { model: models.User, id: requester },
      { model: models.TaskType, id: taskType },
    ].filter((pair) => pair.id !== null));

    delete defInput.assignedTo['value'];
    delete defInput.company['value'];
    delete defInput.requester['value'];
    delete defInput.type['value'];
    delete defInput.status['value'];
    delete defInput.tag['value'];
    //def map to object
    defInput = {
      ...defInput,
      taskType: defInput.type,
    }
    let newDef = flattenObject(defInput, 'def');


    const newProject = <ProjectInstance>await models.Project.create({
      ...attributes,
      ...newDef,
      defCompanyId: company,
      defRequesterId: requester,
      defTaskTypeId: taskType,
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
      def,
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
    let defInput = { ...def };
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
      let taskType = defInput.type.value;
      let status = defInput.status.value;
      let tags = defInput.tag.value;
      await idsDoExistsCheck(assignedTos, models.User);
      await idsDoExistsCheck(tags.filter((tagID) => tagID > -1), models.Tag);
      await multipleIdDoesExistsCheck([
        { model: models.Company, id: company },
        { model: models.User, id: requester },
        { model: models.TaskType, id: taskType },
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
      let taskType = defInput.type.value;
      let status = defInput.status.value;
      let tags = defInput.tag.value;
      delete defInput.assignedTo['value'];
      delete defInput.company['value'];
      delete defInput.requester['value'];
      delete defInput.type['value'];
      delete defInput.status['value'];
      delete defInput.tag['value'];
      //def map to object
      defInput = {
        ...defInput,
        taskType: defInput.type,
      }
      const def = flattenObject(defInput, 'def');
      extraAttributes = {
        ...def,
        defCompanyId: company,
        defRequesterId: requester,
        defTaskTypeId: taskType,
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

    //update autoApproved metadata
    if (attributes.autoApproved === true && !Project.get('autoApproved')) {
      const Tasks = <TaskInstance[]>await Project.getTasks({
        include: [{ model: models.TaskMetadata, as: 'TaskMetadata' }]
      });
      Tasks.forEach((Task) => {
        const TaskMetadata = <TaskMetadataInstance>Task.get('TaskMetadata');
        TaskMetadata.update({
          subtasksApproved: parseInt(<any>TaskMetadata.get('subtasksApproved')) + parseInt(<any>TaskMetadata.get('subtasksPending')),
          subtasksPending: 0,
          tripsApproved: parseInt(<any>TaskMetadata.get('tripsApproved')) + parseInt(<any>TaskMetadata.get('tripsPending')),
          tripsPending: 0,
          materialsApproved: parseInt(<any>TaskMetadata.get('materialsApproved')) + parseInt(<any>TaskMetadata.get('materialsPending')),
          materialsPending: 0,
          itemsApproved: parseInt(<any>TaskMetadata.get('itemsApproved')) + parseInt(<any>TaskMetadata.get('itemsPending')),
          itemsPending: 0,
        })
      })
    } else if (attributes.autoApproved === false && Project.get('autoApproved')) {
      const Tasks = <TaskInstance[]>await Project.getTasks({
        include: [{ model: models.TaskMetadata, as: 'TaskMetadata' }, models.Subtask, models.WorkTrip, models.Material, models.CustomItem]
      });
      Tasks.forEach((Task) => {
        const TaskMetadata = <TaskMetadataInstance>Task.get('TaskMetadata');
        let body = {
          subtasksApproved: 0,
          subtasksPending: 0,
          tripsApproved: 0,
          tripsPending: 0,
          materialsApproved: 0,
          materialsPending: 0,
          itemsApproved: 0,
          itemsPending: 0,
        };
        (<SubtaskInstance[]>Task.get('Subtasks')).forEach((Subtask) => {
          if (Subtask.approved) {
            body.subtasksApproved += parseFloat(<any>Subtask.get('quantity'))
          } else {
            body.subtasksPending += parseFloat(<any>Subtask.get('quantity'))
          }
        });
        (<WorkTripInstance[]>Task.get('WorkTrips')).forEach((WorkTrip) => {
          if (WorkTrip.approved) {
            body.tripsApproved += parseFloat(<any>WorkTrip.get('quantity'))
          } else {
            body.tripsPending += parseFloat(<any>WorkTrip.get('quantity'))
          }
        });
        (<MaterialInstance[]>Task.get('Materials')).forEach((Material) => {
          if (Material.approved) {
            body.materialsApproved += parseFloat(<any>Material.get('quantity'))
          } else {
            body.materialsPending += parseFloat(<any>Material.get('quantity'))
          }
        });
        (<CustomItemInstance[]>Task.get('CustomItems')).forEach((CustomItem) => {
          if (CustomItem.approved) {
            body.itemsApproved += parseFloat(<any>CustomItem.get('quantity'))
          } else {
            body.itemsPending += parseFloat(<any>CustomItem.get('quantity'))
          }
        });
        TaskMetadata.update(body)
      })
    }

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
      if (project.getProjectGroups) {
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
      } else {
        if (project.ProjectGroupRight) {
          if (Object.keys(project.ProjectGroupRight).some((key) => project.ProjectGroupRight[key] !== null && project.ProjectGroupRight[key] !== undefined)) {
            return project.ProjectGroupRight;
          }
          return null;
        }
        return null;
      }
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
