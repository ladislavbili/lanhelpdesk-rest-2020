import {
  createDoesNoExistsError,
  ProjectNoAdminGroupWithUsers,
  ProjectNoNewStatus,
  ProjectNoCloseStatus
} from '@/configs/errors';
import { models } from '@/models';
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
  extractDatesFromObject,
} from '@/helperFunctions';
import {
  getProjectAdminRights,
  checkIfHasProjectRights,
  checkFixedAttributes,
  checkIfDefGroupsExists,
  checkIfDefGroupsChanged,
  applyAttributeRightsRequirements,
  fixProjectFilters,
  postProcessFilters,
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
  FilterInstance,
  ProjectAttributesInstance,
  ProjectGroupInstance,
  ProjectGroupRightsInstance,
  UserInstance
} from '@/models/instances';
import { PROJECT_CHANGE, PROJECT_GROUP_CHANGE } from '@/configs/subscriptions';
import { pubsub } from './index';
const { withFilter } = require('apollo-server-express');
import { ApolloError } from 'apollo-server-express';

const queries = {
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
      await checkIfHasProjectRights(User.get('id'), undefined, id, ['projectRead']);
    }
    return models.Project.findByPk(id, {
      include: [
        models.ProjectAttachment,
        models.ProjectAttributes,
        {
          model: models.Tag,
          as: 'tags'
        },
        {
          model: models.Status,
          as: 'projectStatuses',
        },
        {
          model: models.ProjectGroup,
          include: [
            models.User,
            models.ProjectGroupRights
          ]
        },
      ],
      order: [
        [{ model: models.Status, as: 'projectStatuses' }, 'order', 'ASC'],
      ],
    });
  },
  myProjects: async (root, args, { req, userID }) => {
    const User = await checkResolver(req);
    if ((<RoleInstance>User.get('Role')).get('level') === 0) {
      const Projects = <ProjectInstance[]>await models.Project.findAll({
        include: [
          models.Milestone,
          models.ProjectAttributes,
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
        ],
        order: [
          [{ model: models.Status, as: 'projectStatuses' }, 'order', 'ASC'],
        ],
      })

      const ProjectsRights = <any[]>await Promise.all(Projects.map((Project) => getProjectAdminRights(Project.get('id'))));

      return Projects.map((Project, index) => (
        {
          right: ProjectsRights[index],
          attributeRights: ProjectsRights[index].get('attributes'),
          project: Project,
          usersWithRights: (<ProjectGroupInstance[]>Project.get('ProjectGroups')).reduce((acc, cur) => {
            return [
              ...acc,
              ...(<UserInstance[]>cur.get('Users')).map((User) => ({
                user: User,
                assignable: <boolean>(<any>(<any>((<ProjectGroupRightsInstance>cur.get('ProjectGroupRight')).get('attributes'))).assigned).edit,
              }))
            ]
          }, [])
        }
      ))
    } else {
      const ProjectGroups = <ProjectGroupInstance[]>await User.getProjectGroups({
        order: [
          [models.Project, { model: models.Status, as: 'projectStatuses' }, 'order', 'ASC'],
        ],
        include: [
          {
            model: models.Project,
            include: [
              models.Milestone,
              models.ProjectAttributes,
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
          attributeRights: (<ProjectGroupRightsInstance>group.get('ProjectGroupRight')).get('attributes'),
          usersWithRights: (<ProjectGroupInstance[]>(<ProjectInstance>group.get('Project')).get('ProjectGroups')).reduce((acc, cur) => {
            return [
              ...acc,
              ...(<UserInstance[]>cur.get('Users')).map((User) => ({
                user: User,
                assignable: <boolean>(<any>(<any>((<ProjectGroupRightsInstance>cur.get('ProjectGroupRight')).get('attributes'))).assigned).edit
              }))
            ]
          }, [])
        }
      ))
    }
  },
}

const mutations = {
  addProject: async (root, { tags, statuses, filters, groups, projectFilters, projectAttributes, userGroups, companyGroups, ...attributes }, { req }) => {
    const User = await checkResolver(req, ["addProjects"]);
    groups = applyAttributeRightsRequirements(groups, projectAttributes);
    checkFixedAttributes(projectAttributes);
    checkIfDefGroupsExists(groups);
    filters = await fixProjectFilters(filters, groups);

    //check is there is an admin
    if (!groups.some((group) => (
      group.rights.projectRead &&
      group.rights.projectWrite &&
      (
        userGroups.some((userGroup) => userGroup.groupId === group.id) ||
        companyGroups.some((userGroup) => userGroup.groupId === group.id)
      )
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
    let assigned = projectAttributes.assigned.value;
    let company = projectAttributes.company.value;
    let requester = projectAttributes.requester.value;
    let taskType = projectAttributes.taskType.value;
    let fakeTagIds = projectAttributes.tags.value.filter((fakeID) => tags.some((tag) => tag.id === fakeID));
    let fakeGroupIds = groups.map((group) => group.id);
    let fakeStatusId = statuses.some((status) => status.id === projectAttributes.status.value) ? projectAttributes.status.value : null;

    await idsDoExistsCheck(assigned, models.User);
    await multipleIdDoesExistsCheck([
      { model: models.Company, id: company },
      { model: models.User, id: requester },
      { model: models.TaskType, id: taskType },
    ].filter((pair) => pair.id !== null));

    //extract attribute dates
    const projectAttrDates = extractDatesFromObject({ startsAt: projectAttributes.startsAt.value, deadline: projectAttributes.deadline.value }, ['startsAt', 'deadline']);

    const newProject = <ProjectInstance>await models.Project.create(
      {
        ...attributes,
        defCompanyId: company,
        defRequesterId: requester,
        defTaskTypeId: taskType,
        ProjectAttribute: {
          statusFixed: projectAttributes.status.fixed,
          tagsFixed: projectAttributes.tags.fixed,
          assignedFixed: projectAttributes.assigned.fixed,
          requesterFixed: projectAttributes.requester.fixed,
          companyFixed: projectAttributes.company.fixed,
          taskTypeFixed: projectAttributes.taskType.fixed,
          pausalFixed: projectAttributes.pausal.fixed,
          overtimeFixed: projectAttributes.overtime.fixed,
          startsAtFixed: projectAttributes.startsAt.fixed,
          deadlineFixed: projectAttributes.deadline.fixed,
          pausal: projectAttributes.pausal.value,
          overtime: projectAttributes.overtime.value,
          requesterId: projectAttributes.requester.value,
          CompanyId: projectAttributes.company.value,
          TaskTypeId: projectAttributes.taskType.value,
          ...projectAttrDates,
        },
      },
      {
        include: [
          models.ProjectAttributes,
        ]
      }
    );

    const newGroups = <ProjectGroupInstance[]>await Promise.all(
      groups.map((group) => newProject.createProjectGroup({
        title: group.title,
        def: group.def,
        admin: group.admin,
        description: group.description,
        order: group.order,
        ProjectGroupRight: { ...group.rights, ...flattenObject(group.attributeRights) },
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

    filters = postProcessFilters(
      filters,
      newGroups,
      [],
      fakeGroupIds,
      newProject.get('id'),
      User.get('id')
    );
    const newFilters = <FilterInstance[]>await Promise.all(
      filters.map((filter) => {
        let createFilter = { ...filter };
        delete createFilter.aditionalData;
        return newProject.createFilterOfProject(createFilter)
      })
    );

    const ProjectAttributes = <ProjectAttributesInstance>await newProject.getProjectAttribute();
    await ProjectAttributes.setAssigned(assigned === null ? [] : assigned);
    if (fakeStatusId !== null) {
      await ProjectAttributes.setStatus(newStatuses[statuses.findIndex((status) => status.id === fakeStatusId)].get('id'));
    }

    await Promise.all(
      [
        ...userGroups.map((userGroup) => {
          let index = groups.findIndex((group) => group.id === userGroup.groupId);
          if (index !== -1) {

            return newGroups[index].addUser(userGroup.userId)
          }
        }),
        ...companyGroups.map((companyGroup) => {
          let index = groups.findIndex((group) => group.id === companyGroup.groupId);
          if (index !== -1) {
            return newGroups[index].addCompany(companyGroup.companyId)
          }
        }),
        ...newFilters.reduce((acc, newFilter, index) => {
          const aditional = filters[index].aditionalData;

          return [
            ...acc,
            newFilter.setProjectGroups(aditional.groups),
            newFilter.setFilterAssignedTos(aditional.assignedTos),
            newFilter.setFilterTags(aditional.tags),
            newFilter.setFilterRequesters(aditional.requesters),
            newFilter.setFilterCompanies(aditional.companies),
            newFilter.setFilterTaskTypes(aditional.taskTypes),
            newFilter.setFilterStatuses(aditional.statuses),
          ]
        }, []),
        ProjectAttributes.setTags(fakeTagIds.map((fakeID) => {
          let index = tags.findIndex((tag) => tag.id === fakeID);
          return newTags[index].get('id');
        })),
      ]
    )

    pubsub.publish(PROJECT_CHANGE, { projectsSubscription: true });
    return newProject;
  },

  updateProject: async (root, allAttributes, { req, userID }) => {
    const User = await checkResolver(req);
    let {
      id,
      deleteTags,
      updateTags,
      addTags,
      deleteStatuses,
      updateStatuses,
      addStatuses,
      addFilters,
      updateFilters,
      deleteFilters,
      companyGroups,
      userGroups,
      addGroups,
      updateGroups,
      deleteGroups,
      projectAttributes,
      ...attributes
    } = allAttributes;

    const Project = <ProjectInstance>await models.Project.findByPk(id, {
      include: [
        models.ProjectAttributes,
        {
          model: models.ProjectGroup,
          include: [models.ProjectGroupRights, models.User, models.Company]
        },
        {
          model: models.Filter,
          as: 'filterOfProjects'
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
    await checkIfHasProjectRights(User.get('id'), undefined, id, ['projectWrite']);

    //applyAttributeRightsRequirements - fixne updated groups a add groups
    addGroups = applyAttributeRightsRequirements(addGroups, projectAttributes ? projectAttributes : Project.get('ProjectAttribute'));
    updateGroups = applyAttributeRightsRequirements(updateGroups, projectAttributes ? projectAttributes : Project.get('ProjectAttribute'));
    console.log(updateGroups[0]);

    //checkIfDefGroupsChanged - def a admin musia zostat, ziskaj update a delete existujuci equivalent a porovnaj
    checkIfDefGroupsChanged(addGroups, updateGroups, deleteGroups, Project.get('ProjectGroups'))

    //fixing Filters
    const allUpdatedGroups = [
      ...addGroups,
      ...(<ProjectGroupInstance[]>Project.get('ProjectGroups')).filter((ProjectGroup) => !deleteGroups.includes(ProjectGroup.get('id'))).map((ProjectGroup) => {
        const updateGroup = updateGroups.some((updateGroup) => updateGroup.id === ProjectGroup.get('id'));
        if (updateGroup) {
          return updateGroup;
        }
        return {
          ...ProjectGroup.get(),
          attributeRights: (<ProjectGroupRightsInstance>ProjectGroup.get('ProjectGroupRight')).get('attributes')
        }
      })
    ]
    addFilters = await fixProjectFilters(addFilters, allUpdatedGroups);
    updateFilters = await fixProjectFilters(updateFilters, allUpdatedGroups);

    if (projectAttributes) {
      checkFixedAttributes(projectAttributes);
      let assigned = projectAttributes.assigned.value;
      let company = projectAttributes.company.value;
      let requester = projectAttributes.requester.value;
      let taskType = projectAttributes.taskType.value;
      let status = projectAttributes.status.value;
      let tags = projectAttributes.tags.value;
      await idsDoExistsCheck(assigned, models.User);
      await idsDoExistsCheck(tags.filter((tagID) => tagID > -1), models.Tag);
      await multipleIdDoesExistsCheck([
        { model: models.Company, id: company },
        { model: models.User, id: requester },
        { model: models.TaskType, id: taskType },
        { model: models.Status, id: status !== null && status > 0 ? status : null },
      ].filter((pair) => pair.id !== null));
    }

    //start saving data
    const newGroups = <ProjectGroupInstance[]>await Promise.all(
      addGroups.map((newGroup) => Project.createProjectGroup({
        title: newGroup.title,
        description: newGroup.description,
        order: newGroup.order,
        ProjectGroupRight: { ...newGroup.rights, ...flattenObject(newGroup.attributeRights) },
      }, {
          include: [models.ProjectGroupRights]
        }))
    )

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

    addFilters = postProcessFilters(
      addFilters,
      newGroups,
      (<ProjectGroupInstance[]>Project.get('ProjectGroups')).filter((ProjectGroup) => !deleteGroups.includes(ProjectGroup.get('id'))),
      addGroups.map((addGroup) => addGroup.id),
      id,
      User.get('id')
    );
    updateFilters = postProcessFilters(
      updateFilters,
      newGroups,
      (<ProjectGroupInstance[]>Project.get('ProjectGroups')).filter((ProjectGroup) => !deleteGroups.includes(ProjectGroup.get('id'))),
      addGroups.map((addGroup) => addGroup.id),
      id,
      User.get('id'),
      true
    );
    const newFilters = <FilterInstance[]>await Promise.all(
      addFilters.map((filter) => {
        let createFilter = { ...filter };
        delete createFilter.aditionalData;
        return Project.createFilterOfProject(createFilter)
      })
    );

    let promises = [];
    let extraAttributes = {};

    //projectAttributes
    if (projectAttributes) {
      let assigned = projectAttributes.assigned.value;
      let company = projectAttributes.company.value;
      let requester = projectAttributes.requester.value;
      let taskType = projectAttributes.taskType.value;
      let status = projectAttributes.status.value;
      let tags = projectAttributes.tags.value;
      const projectAttrDates = extractDatesFromObject({ startsAt: projectAttributes.startsAt.value, deadline: projectAttributes.deadline.value }, ['startsAt', 'deadline']);
      const ProjectAttributes = <ProjectAttributesInstance>Project.get('ProjectAttribute');
      ProjectAttributes.update({
        statusFixed: projectAttributes.status.fixed,
        tagsFixed: projectAttributes.tags.fixed,
        assignedFixed: projectAttributes.assigned.fixed,
        requesterFixed: projectAttributes.requester.fixed,
        companyFixed: projectAttributes.company.fixed,
        taskTypeFixed: projectAttributes.taskType.fixed,
        pausalFixed: projectAttributes.pausal.fixed,
        overtimeFixed: projectAttributes.overtime.fixed,
        startsAtFixed: projectAttributes.startsAt.fixed,
        deadlineFixed: projectAttributes.deadline.fixed,
        pausal: projectAttributes.pausal.value,
        overtime: projectAttributes.overtime.value,
        ...projectAttrDates,
        requesterId: projectAttributes.requester.value,
        CompanyId: projectAttributes.company.value,
        TaskTypeId: projectAttributes.taskType.value,
      })
      await ProjectAttributes.setAssigned(assigned === null ? [] : assigned);

      if (status < 0) {
        promises.push(ProjectAttributes.setStatus(newStatuses[addStatuses.findIndex((newStatus) => newStatus.id === status)].get('id')));
      } else {
        promises.push(ProjectAttributes.setStatus(status));
      }

      const [existingTags, fakeTags] = splitArrayByFilter(tags, (tagID) => tagID > -1);
      promises.push(ProjectAttributes.setTags(
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

    //filters
    newFilters.forEach((newFilter, index) => {
      const aditional = addFilters[index].aditionalData;
      promises.push(newFilter.setProjectGroups(aditional.groups));
      promises.push(newFilter.setFilterAssignedTos(aditional.assignedTos));
      promises.push(newFilter.setFilterTags(aditional.tags));
      promises.push(newFilter.setFilterRequesters(aditional.requesters));
      promises.push(newFilter.setFilterCompanies(aditional.companies));
      promises.push(newFilter.setFilterTaskTypes(aditional.taskTypes));
    });
    deleteFilters.forEach((filterId) => {
      const Filter = (<FilterInstance[]>Project.get('filterOfProjects')).find((Filter) => Filter.get('id') === filterId && Filter.get('ofProject'));
      if (Filter) {
        promises.push(Filter.destroy());
      }
    });
    updateFilters.forEach((filter) => {
      const Filter = (<FilterInstance[]>Project.get('filterOfProjects')).find((Filter) => Filter.get('id') === filter.aditionalData.id && Filter.get('ofProject'));
      if (Filter) {
        let basicFilterData = { ...filter };
        delete basicFilterData.aditionalData;
        promises.push(Filter.update(basicFilterData));
        let aditional = filter.aditionalData;
        promises.push(Filter.setProjectGroups(aditional.groups));
        promises.push(Filter.setFilterAssignedTos(aditional.assignedTos));
        promises.push(Filter.setFilterTags(aditional.tags));
        promises.push(Filter.setFilterRequesters(aditional.requesters));
        promises.push(Filter.setFilterCompanies(aditional.companies));
        promises.push(Filter.setFilterTaskTypes(aditional.taskTypes));
        promises.push(Filter.setFilterStatuses(aditional.statuses));
      }
    });

    //tags
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

    //statuses
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

    //groups
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
          description: group.description,
          order: group.order,
        }));

        promises.push(
          (<ProjectGroupRightsInstance>Group.get('ProjectGroupRight')).update({ ...group.rights, ...flattenObject(group.attributeRights) })
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
    companyGroups.forEach((companyGroup) => {
      if (companyGroup.groupId < 0) {
        const index = addGroups.findIndex((group) => group.id === companyGroup.groupId);
        if (index !== -1) {
          const Group = newGroups[index];
          promises.push(Group.setCompanies(companyGroup.companyIds));
        }
      } else {
        const Group = (<ProjectGroupInstance[]>Project.get('ProjectGroups')).find((Group) => Group.get('id') === companyGroup.groupId);
        if (Group) {
          promises.push(Group.setCompanies(companyGroup.companyIds));
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
    pubsub.publish(PROJECT_CHANGE, { projectsSubscription: true });
    pubsub.publish(PROJECT_GROUP_CHANGE, { projectGroupsSubscription: Project.get('id') });
    return Project;
  },

  deleteProject: async (root, { id, newId }, { req }) => {
    const User = await checkResolver(req);
    const Project = await models.Project.findByPk(id, {
      include: [
        { model: models.Task },
        { model: models.Imap },
        {
          model: models.Filter,
          as: 'filterOfProjects',
        },
      ]
    });
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
      await checkIfHasProjectRights(User.get('id'), undefined, id, ['projectEdit']);
    }
    const Tasks = <TaskInstance[]>await Project.get('Tasks');
    const Imaps = <ImapInstance[]>await Project.get('Imaps');
    const Filters = <FilterInstance[]>await Project.get('filterOfProjects');
    await Promise.all(Filters.filter((Filter) => Filter.get('ofProject')).map((Filter) => Filter.destroy()));
    await Promise.all(Imaps.map((Imap) => Imap.setProject(newId)));
    await Project.destroy();
    pubsub.publish(PROJECT_CHANGE, { projectsSubscription: true });
    pubsub.publish(PROJECT_GROUP_CHANGE, { projectGroupsSubscription: Project.get('id') });
    return Project;
  },
}

const attributes = {
  Project: {
    async projectAttributes(project) {
      return (await getModelAttribute(project, 'projectAttribute')).get('attributes');
    },
    async filters(project) {
      return getModelAttribute(project, 'filterOfProjects');
    },
    async projectFilters(project) {
      return getModelAttribute(project, 'filterOfProjects', null, { where: { ofProject: true } });
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
    async attachments(project) {
      return getModelAttribute(project, 'ProjectAttachments');
    },
  },

  BasicProject: {
    async filters(project) {
      return getModelAttribute(project, 'filterOfProjects');
    },
    async projectFilters(project) {
      return getModelAttribute(project, 'filterOfProjects');
    },
    async projectAttributes(project) {
      return (await getModelAttribute(project, 'projectAttribute')).get('attributes');
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

const subscriptions = {
  projectsSubscription: {
    subscribe: withFilter(
      () => pubsub.asyncIterator(PROJECT_CHANGE),
      async (data, args, { userID }) => {
        return true;
      }
    ),
  }
}

export default {
  attributes,
  mutations,
  queries,
  subscriptions,
}
