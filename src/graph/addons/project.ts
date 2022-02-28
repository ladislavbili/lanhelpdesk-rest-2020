import { models } from '@/models';
import { ApolloError } from 'apollo-server-express';
import moment from 'moment';
import {
  addApolloError,
  idsDoExistsCheck,
  idDoesExistsCheck,
  extractDatesFromObject,
} from '@/helperFunctions';
import {
  createDoesNoExistsError,
  InsufficientProjectAccessError,
  createProjectFixedAttributeError,
  createProjectRequiredAttributeError,
  createCantEditTaskAttributeError,
  ProjectCantChangeDefaultGroupsError,
} from '@/configs/errors';
import {
  ProjectGroupInstance,
  ProjectGroupRightsInstance,
  ProjectAttributesInstance,
  RoleInstance,
  AccessRightsInstance,
  UserInstance,
  CompanyInstance,
  ProjectInstance,
} from '@/models/instances';

const taskAttributes = [
  { attribute: 'status', value: 'int' },
  { attribute: 'tags', value: 'arr' },
  { attribute: 'assigned', value: 'arr' },
  { attribute: 'requester', value: 'int' },
  { attribute: 'company', value: 'int' },
  { attribute: 'taskType', value: 'int' },
  { attribute: 'pausal', value: 'bool' },
  { attribute: 'overtime', value: 'bool' },
  { attribute: 'startsAt', value: 'date' },
  { attribute: 'deadline', value: 'date' },
  { attribute: 'repeat', value: 'int' },
]

export const checkIfHasProjectRights = async (User, taskId = undefined, projectId = undefined, rights = [], attributeRights = [], fromInvoice = false) => {
  if (taskId === undefined && projectId === undefined) {
    throw InsufficientProjectAccessError;
  }
  let projectID = projectId;
  let Task = null;
  if (projectID === undefined) {
    Task = await models.Task.findByPk(taskId);
    if (Task === null) {
      throw createDoesNoExistsError('Task', taskId);
    }
    projectID = Task.get('ProjectId');
  }
  const Project = <ProjectInstance>await models.Project.findByPk(
    projectID,
    {
      include: [
        {
          model: models.ProjectGroup,
          include: [models.User, { model: models.Company, include: [models.User] }, models.ProjectGroupRights]
        },
      ],
    }
  );

  const Role = <RoleInstance>User.get('Role');
  let adminOfProjects = (<AccessRightsInstance>Role.get('AccessRight')).get('projects');
  let groupRights = <any>{};
  const ProjectGroups = <ProjectGroupInstance[]>Project.get('ProjectGroups');
  //START get group rights
  const UserProjectGroupRights = <ProjectGroupRightsInstance[]>ProjectGroups.filter((ProjectGroup) => (
    (<UserInstance[]>ProjectGroup.get('Users')).some((GroupUser) => GroupUser.get('id') === User.get('id')) ||
    (<CompanyInstance[]>ProjectGroup.get('Companies')).some((Company) => Company.get('id') === User.get('CompanyId'))
  )).map((ProjectGroup) => ProjectGroup.get('ProjectGroupRight'));

  if ((<RoleInstance>User.get('Role')).get('level') === 0 || adminOfProjects || fromInvoice) {
    groupRights = await mergeGroupRights(ProjectGroups.find((ProjectGroup) => ProjectGroup.get('admin') && ProjectGroup.get('def')).get('ProjectGroupRight'), UserProjectGroupRights[0], UserProjectGroupRights[1]);
  } else if (UserProjectGroupRights.length === 0) {
    throw InsufficientProjectAccessError;
  } else {
    groupRights = await mergeGroupRights(UserProjectGroupRights[0], UserProjectGroupRights[1]);
  }
  //END get group rights
  if (
    (rights.length === 0 || rights.every((right) => groupRights.project[right])) &&
    (attributeRights.length === 0 || attributeRights.every((rightPair) => groupRights.attributes[rightPair.right][rightPair.action]))
  ) {
    return { User, Role, groupRights, Task };
  }

  addApolloError(
    'Project',
    InsufficientProjectAccessError,
    User.get('id'),
    projectID
  );
  throw InsufficientProjectAccessError;
}

export const getUserProjectRights = async (projectID, User, fromInvoice = false) => {
  const Project = <ProjectInstance>await models.Project.findByPk(
    projectID,
    {
      include: [
        {
          model: models.ProjectGroup,
          include: [models.User, { model: models.Company, include: [models.User] }, models.ProjectGroupRights]
        },
      ],
    }
  );

  const Role = <RoleInstance>User.get('Role');
  let adminOfProjects = (<AccessRightsInstance>Role.get('AccessRight')).get('projects');
  let groupRights = <any>{};
  const ProjectGroups = <ProjectGroupInstance[]>Project.get('ProjectGroups');
  //START get group rights
  const UserProjectGroupRights = <ProjectGroupRightsInstance[]>ProjectGroups.filter((ProjectGroup) => (
    (<UserInstance[]>ProjectGroup.get('Users')).some((GroupUser) => GroupUser.get('id') === User.get('id')) ||
    (<CompanyInstance[]>ProjectGroup.get('Companies')).some((Company) => Company.get('id') === User.get('CompanyId'))
  )).map((ProjectGroup) => ProjectGroup.get('ProjectGroupRight'));

  if ((<RoleInstance>User.get('Role')).get('level') === 0 || adminOfProjects || fromInvoice) {
    groupRights = await mergeGroupRights(ProjectGroups.find((ProjectGroup) => ProjectGroup.get('admin') && ProjectGroup.get('def')).get('ProjectGroupRight'));
  } else if (UserProjectGroupRights.length === 0) {
    throw InsufficientProjectAccessError;
  } else {
    groupRights = await mergeGroupRights(UserProjectGroupRights[0], UserProjectGroupRights[1]);
  }
  return groupRights;
}

export const getProjectAdminRights = async (projectId) => {
  const Project = await models.Project.findByPk(projectId, {
    include: [{
      model: models.ProjectGroup,
      where: {
        def: true,
        admin: true,
      },
      include: [models.ProjectGroupRights]
    }]
  });
  const ProjectGroup = <ProjectGroupInstance>Project.get('ProjectGroups')[0];
  return <ProjectGroupRightsInstance>(ProjectGroup.get('ProjectGroupRight'));
}

export const convertSQLProjectGroupRightsToRights = (SQLRights) => {
  return {
    project: {
      //project
      projectRead: SQLRights.projectRead > 0,
      projectWrite: SQLRights.projectWrite > 0,

      //tasklist
      companyTasks: SQLRights.companyTasks > 0,
      allTasks: SQLRights.allTasks > 0,

      //tasklist view
      tasklistDnD: SQLRights.tasklistDnD > 0,
      tasklistKalendar: SQLRights.tasklistKalendar > 0,
      tasklistGantt: SQLRights.tasklistGantt > 0,
      tasklistStatistics: SQLRights.tasklistStatistics > 0,

      //add task
      addTask: SQLRights.addTask > 0,

      //edit task
      deleteTask: SQLRights.deleteTask > 0,
      taskImportant: SQLRights.taskImportant > 0,
      taskTitleWrite: SQLRights.taskTitleWrite > 0,
      taskProjectWrite: SQLRights.taskProjectWrite > 0,
      taskDescriptionRead: SQLRights.taskDescriptionRead > 0,
      taskDescriptionWrite: SQLRights.taskDescriptionWrite > 0,
      taskAttachmentsRead: SQLRights.taskAttachmentsRead > 0,
      taskAttachmentsWrite: SQLRights.taskAttachmentsWrite > 0,

      taskSubtasksRead: SQLRights.taskSubtasksRead > 0,
      taskSubtasksWrite: SQLRights.taskSubtasksWrite > 0,
      taskWorksRead: SQLRights.taskWorksRead > 0,
      taskWorksWrite: SQLRights.taskWorksWrite > 0,
      taskWorksAdvancedRead: SQLRights.taskWorksAdvancedRead > 0,
      taskWorksAdvancedWrite: SQLRights.taskWorksAdvancedWrite > 0,
      taskMaterialsRead: SQLRights.taskMaterialsRead > 0,
      taskMaterialsWrite: SQLRights.taskMaterialsWrite > 0,
      taskPausalInfo: SQLRights.taskPausalInfo > 0,

      //comments and history
      viewComments: SQLRights.viewComments > 0,
      addComments: SQLRights.addComments > 0,
      internal: SQLRights.internal > 0,
      emails: SQLRights.emails > 0,
      history: SQLRights.history > 0,
    },
    attributes: {
      status: {
        required: SQLRights.statusRequired > 0,
        add: SQLRights.statusAdd > 0,
        view: SQLRights.statusView > 0,
        edit: SQLRights.statusEdit > 0,
      },
      tags: {
        required: SQLRights.tagsRequired > 0,
        add: SQLRights.tagsAdd > 0,
        view: SQLRights.tagsView > 0,
        edit: SQLRights.tagsEdit > 0,
      },
      assigned: {
        required: SQLRights.assignedRequired > 0,
        add: SQLRights.assignedAdd > 0,
        view: SQLRights.assignedView > 0,
        edit: SQLRights.assignedEdit > 0,
      },
      requester: {
        required: SQLRights.requesterRequired > 0,
        add: SQLRights.requesterAdd > 0,
        view: SQLRights.requesterView > 0,
        edit: SQLRights.requesterEdit > 0,
      },
      company: {
        required: SQLRights.companyRequired > 0,
        add: SQLRights.companyAdd > 0,
        view: SQLRights.companyView > 0,
        edit: SQLRights.companyEdit > 0,
      },
      taskType: {
        required: SQLRights.taskTypeRequired > 0,
        add: SQLRights.taskTypeAdd > 0,
        view: SQLRights.taskTypeView > 0,
        edit: SQLRights.taskTypeEdit > 0,
      },
      pausal: {
        required: SQLRights.pausalRequired > 0,
        add: SQLRights.pausalAdd > 0,
        view: SQLRights.pausalView > 0,
        edit: SQLRights.pausalEdit > 0,
      },
      overtime: {
        required: SQLRights.overtimeRequired > 0,
        add: SQLRights.overtimeAdd > 0,
        view: SQLRights.overtimeView > 0,
        edit: SQLRights.overtimeEdit > 0,
      },
      startsAt: {
        required: SQLRights.startsAtRequired > 0,
        add: SQLRights.startsAtAdd > 0,
        view: SQLRights.startsAtView > 0,
        edit: SQLRights.startsAtEdit > 0,
      },
      deadline: {
        required: SQLRights.deadlineRequired > 0,
        add: SQLRights.deadlineAdd > 0,
        view: SQLRights.deadlineView > 0,
        edit: SQLRights.deadlineEdit > 0,
      },
      repeat: {
        add: SQLRights.repeatAdd > 0,
        view: SQLRights.repeatView > 0,
        edit: SQLRights.repeatEdit > 0,
      },

    }
  }
}

export const mergeGroupRights = async (right1, right2 = null, right3 = null) => {
  if (!right1) {
    if (!right2) {
      right1 = right3;
    } else {
      right1 = right2;
    }
  }
  if (!right2) {
    right2 = right1;
  }
  if (!right3) {
    right3 = right1;
  }
  let [attributeRight1, attributeRight2] = await Promise.all([right1.get('attributes'), right2.get('attributes')]);
  attributeRight1 = <any>attributeRight1;
  attributeRight2 = <any>attributeRight2;
  return {
    project: {
      //project
      projectRead: right1.get('projectRead') || right2.get('projectRead'),
      projectWrite: right1.get('projectWrite') || right2.get('projectWrite'),

      //tasklist
      companyTasks: right1.get('companyTasks') || right2.get('companyTasks'),
      allTasks: right1.get('allTasks') || right2.get('allTasks'),

      //tasklist view
      tasklistDnD: right1.get('tasklistDnD') || right2.get('tasklistDnD'),
      tasklistKalendar: right1.get('tasklistKalendar') || right2.get('tasklistKalendar'),
      tasklistGantt: right1.get('tasklistGantt') || right2.get('tasklistGantt'),
      tasklistStatistics: right1.get('tasklistStatistics') || right2.get('tasklistStatistics'),

      //add task
      addTask: right1.get('addTask') || right2.get('addTask'),

      //edit task
      deleteTask: right1.get('deleteTask') || right2.get('deleteTask'),
      taskImportant: right1.get('taskImportant') || right2.get('taskImportant'),
      taskTitleWrite: right1.get('taskTitleWrite') || right2.get('taskTitleWrite'),
      taskProjectWrite: right1.get('taskProjectWrite') || right2.get('taskProjectWrite'),
      taskDescriptionRead: right1.get('taskDescriptionRead') || right2.get('taskDescriptionRead'),
      taskDescriptionWrite: right1.get('taskDescriptionWrite') || right2.get('taskDescriptionWrite'),
      taskAttachmentsRead: right1.get('taskAttachmentsRead') || right2.get('taskAttachmentsRead'),
      taskAttachmentsWrite: right1.get('taskAttachmentsWrite') || right2.get('taskAttachmentsWrite'),

      taskSubtasksRead: right1.get('taskSubtasksRead') || right2.get('taskSubtasksRead'),
      taskSubtasksWrite: right1.get('taskSubtasksWrite') || right2.get('taskSubtasksWrite'),
      taskWorksRead: right1.get('taskWorksRead') || right2.get('taskWorksRead'),
      taskWorksWrite: right1.get('taskWorksWrite') || right2.get('taskWorksWrite'),
      taskWorksAdvancedRead: right1.get('taskWorksAdvancedRead') || right2.get('taskWorksAdvancedRead'),
      taskWorksAdvancedWrite: right1.get('taskWorksAdvancedWrite') || right2.get('taskWorksAdvancedWrite'),
      taskMaterialsRead: right1.get('taskMaterialsRead') || right2.get('taskMaterialsRead'),
      taskMaterialsWrite: right1.get('taskMaterialsWrite') || right2.get('taskMaterialsWrite'),
      taskPausalInfo: right1.get('taskPausalInfo') || right2.get('taskPausalInfo'),

      //comments and history
      viewComments: right1.get('viewComments') || right2.get('viewComments'),
      addComments: right1.get('addComments') || right2.get('addComments'),
      internal: right1.get('internal') || right2.get('internal'),
      emails: right1.get('emails') || right2.get('emails'),
      history: right1.get('history') || right2.get('history'),
    },
    attributes: {
      status: {
        required: attributeRight1.status.required && attributeRight2.status.required,
        add: attributeRight1.status.add || attributeRight2.status.add,
        view: attributeRight1.status.view || attributeRight2.status.view,
        edit: attributeRight1.status.edit || attributeRight2.status.edit,
      },
      tags: {
        required: attributeRight1.tags.required && attributeRight2.tags.required,
        add: attributeRight1.tags.add || attributeRight2.tags.add,
        view: attributeRight1.tags.view || attributeRight2.tags.view,
        edit: attributeRight1.tags.edit || attributeRight2.tags.edit,
      },
      assigned: {
        required: attributeRight1.assigned.required && attributeRight2.assigned.required,
        add: attributeRight1.assigned.add || attributeRight2.assigned.add,
        view: attributeRight1.assigned.view || attributeRight2.assigned.view,
        edit: attributeRight1.assigned.edit || attributeRight2.assigned.edit,
      },
      requester: {
        required: attributeRight1.requester.required && attributeRight2.requester.required,
        add: attributeRight1.requester.add || attributeRight2.requester.add,
        view: attributeRight1.requester.view || attributeRight2.requester.view,
        edit: attributeRight1.requester.edit || attributeRight2.requester.edit,
      },
      company: {
        required: attributeRight1.company.required && attributeRight2.company.required,
        add: attributeRight1.company.add || attributeRight2.company.add,
        view: attributeRight1.company.view || attributeRight2.company.view,
        edit: attributeRight1.company.edit || attributeRight2.company.edit,
      },
      taskType: {
        required: attributeRight1.taskType.required && attributeRight2.taskType.required,
        add: attributeRight1.taskType.add || attributeRight2.taskType.add,
        view: attributeRight1.taskType.view || attributeRight2.taskType.view,
        edit: attributeRight1.taskType.edit || attributeRight2.taskType.edit,
      },
      pausal: {
        required: attributeRight1.pausal.required && attributeRight2.pausal.required,
        add: attributeRight1.pausal.add || attributeRight2.pausal.add,
        view: attributeRight1.pausal.view || attributeRight2.pausal.view,
        edit: attributeRight1.pausal.edit || attributeRight2.pausal.edit,
      },
      overtime: {
        required: attributeRight1.overtime.required && attributeRight2.overtime.required,
        add: attributeRight1.overtime.add || attributeRight2.overtime.add,
        view: attributeRight1.overtime.view || attributeRight2.overtime.view,
        edit: attributeRight1.overtime.edit || attributeRight2.overtime.edit,
      },
      startsAt: {
        required: attributeRight1.startsAt.required && attributeRight2.startsAt.required,
        add: attributeRight1.startsAt.add || attributeRight2.startsAt.add,
        view: attributeRight1.startsAt.view || attributeRight2.startsAt.view,
        edit: attributeRight1.startsAt.edit || attributeRight2.startsAt.edit,
      },
      deadline: {
        required: attributeRight1.deadline.required && attributeRight2.deadline.required,
        add: attributeRight1.deadline.add || attributeRight2.deadline.add,
        view: attributeRight1.deadline.view || attributeRight2.deadline.view,
        edit: attributeRight1.deadline.edit || attributeRight2.deadline.edit,
      },
      repeat: {
        add: attributeRight1.repeat.add || attributeRight2.repeat.add,
        view: attributeRight1.repeat.view || attributeRight2.repeat.view,
        edit: attributeRight1.repeat.edit || attributeRight2.repeat.edit,
      },

    }
  }
}

export const applyAttributeRightsRequirements = (groups, projectAttributes) => {
  let updatedGroups = [];
  groups.forEach((group) => {
    let newGroup = {
      ...group
    };

    taskAttributes.map((attr) => attr.attribute).forEach((attribute) => {
      if (attribute !== 'repeat' && projectAttributes[attribute].fixed) {
        newGroup.attributeRights[attribute].required = false;
        newGroup.attributeRights[attribute].add = false;
        newGroup.attributeRights[attribute].edit = false;
      } else {
        if (newGroup.attributeRights[attribute].edit) {
          newGroup.attributeRights[attribute].view = true;
        }
        if (newGroup.attributeRights[attribute].required) {
          newGroup.attributeRights[attribute].add = true;
        }
      }
    })
    updatedGroups.push(newGroup);
  })
  return updatedGroups;
}

export const checkFixedAttributes = (projectAttributes) => {
  taskAttributes.filter((taskAttribute) => !['repeat', 'pausal'].includes(taskAttribute.attribute)).forEach((taskAttribute) => {
    const attribute = projectAttributes[taskAttribute.attribute];
    if (
      attribute.fixed && (
        (taskAttribute.value === 'bool' && !([true, false].includes(attribute.value))) ||
        (taskAttribute.value === 'int' && attribute.value === null && !['requester', 'company'].includes(taskAttribute.attribute)) ||
        (taskAttribute.value === 'arr' && attribute.value.length === 0 && !['tags', 'assigned'].includes(taskAttribute.attribute)) ||
        (taskAttribute.value === 'date' && isNaN(parseInt(attribute.value)))
      )
    ) {
      throw new ApolloError(`In default values, ${taskAttribute.attribute} to is set to be fixed, but fixed value can\'t be empty.`, 'PROJECT_ATTRIBUTE_FIXED_INTEGRITY');
    }
  })
}

export const getTaskRepeatUpdate = (originalAttributes, newAttributes, Project) => {
  let update = <any>{ direct: {}, set: {} };
  let hasUpdate = false;
  ['status', 'tags', 'assigned', 'requester', 'company', 'taskType', 'pausal', 'overtime', 'startsAt', 'deadline'].filter((attribute) => newAttributes[attribute].fixed).forEach((attribute) => {
    switch (attribute) {
      case 'status': {
        if (
          (originalAttributes.status.value === null && newAttributes.status.value !== null) ||
          (originalAttributes.status.value !== null && newAttributes.status.value === null) ||
          (originalAttributes.status.value !== null && newAttributes.status.value !== null && originalAttributes.status.value.get('id') !== newAttributes.status.value.get('id')) ||
          !originalAttributes.status.fixed
        ) {
          if (newAttributes.status.value) {
            update.direct.StatusId = newAttributes.status.value.get('id');
          } else {
            const Statuses = Project.get('projectStatuses');
            const NewStatus = Statuses.find((Status) => Status.get('action') === 'IsNew');
            if (NewStatus) {
              update.direct.StatusId = NewStatus.get('id');
            } else {
              update.direct.StatusId = Statuses[0].get('id');
            }
          }
          hasUpdate = true;
        }
        break;
      }
      case 'tags': {
        if (
          originalAttributes.tags.length !== newAttributes.tags.length ||
          !originalAttributes.tags.value.every((Tag1) => newAttributes.tags.value.some((Tag2) => Tag1.get('id') === Tag2.get('id'))) ||
          !originalAttributes.tags.fixed
        ) {
          update.set.tags = newAttributes.tags.map((Tag) => Tag.get('id'));
          hasUpdate = true;
        }
        break;
      }
      case 'assigned': {
        if (
          originalAttributes.assigned.value.length !== newAttributes.assigned.value.length ||
          !originalAttributes.assigned.value.every((User1) => newAttributes.assigned.value.some((User2) => User1.get('id') === User2.get('id'))) ||
          !originalAttributes.assigned.fixed
        ) {
          update.set.assignedTo = newAttributes.assigned.value.map((User) => User.get('id'));
          hasUpdate = true;
        }
        break;
      }
      case 'requester': {
        if (newAttributes.requester.value !== null && (
          originalAttributes.requester.value === null ||
          originalAttributes.requester.value.get('id') !== newAttributes.requester.value.get('id') ||
          !originalAttributes.requester.fixed
        )) {
          update.direct.requesterId = newAttributes.requester.value.get('id');
          hasUpdate = true;
        }
        break;
      }
      case 'company': {
        if (newAttributes.company.value !== null && (
          originalAttributes.company.value === null ||
          originalAttributes.company.value.get('id') !== newAttributes.company.value.get('id') ||
          !originalAttributes.company.fixed
        )) {
          update.direct.CompanyId = newAttributes.company.value.get('id');
          hasUpdate = true;
        }
        break;
      }
      case 'taskType': {
        if (originalAttributes.taskType.value.get('id') !== newAttributes.taskType.value.get('id') || !originalAttributes.taskType.fixed) {
          update.direct.TaskTypeId = newAttributes.taskType.value.get('id');
          hasUpdate = true;
        }
        break;
      }
      case 'pausal':
      case 'overtime': {
        if (originalAttributes[attribute].value !== newAttributes[attribute].value || !originalAttributes[attribute].fixed) {
          update.direct[attribute] = newAttributes[attribute].value === true;
          hasUpdate = true;
        }
        break;
      }
      case 'startsAt':
      case 'deadline': {
        if (
          newAttributes[attribute].value !== null && (
            originalAttributes[attribute].value === null ||
            !moment(originalAttributes[attribute].value).isSame(originalAttributes[attribute].value) ||
            !originalAttributes[attribute].fixed
          )
        ) {
          update.direct[attribute] = parseInt(newAttributes[attribute].value);
        }
        break;
      }
      default: {
        break;
      }
    }
  });
  return hasUpdate ? update : null;
}

export const checkIfDefGroupsExists = (groups) => {
  const defGroups = groups.filter((group) => group.def);
  if (defGroups.length !== 3 || groups.filter((group) => group.admin).length !== 1) {
    throw ProjectCantChangeDefaultGroupsError;
  }
  const adminGroup = defGroups.find((group) => group.admin && group.title === 'Admin');
  const agentGroup = defGroups.find((group) => group.title === 'Agent');
  const customerGroup = defGroups.find((group) => group.title === 'Customer');
  if ([adminGroup, agentGroup, customerGroup].some((group) => group === undefined) || !adminGroup.rights.projectRead || !adminGroup.rights.projectWrite) {
    throw ProjectCantChangeDefaultGroupsError;
  }
}

export const checkIfDefGroupsChanged = (addGroups, updateGroups, deleteGroups, originalGroups) => {
  if (
    addGroups.some((group) => group.def || group.admin) ||
    originalGroups.filter((Group) => deleteGroups.includes(Group.get('id'))).some((Group) => (Group.get('def') || Group.get('admin'))) ||
    updateGroups.some((updateGroup) => {
      const originalGroup = originalGroups.find((Group) => updateGroup.id === Group.get('id'));
      if (originalGroup.get('def') || originalGroup.get('admin')) {
        if (
          updateGroup.title !== originalGroup.get('title') ||
          updateGroup.def !== originalGroup.get('def') ||
          updateGroup.admin !== originalGroup.get('admin') ||
          originalGroup.get('admin') && (!updateGroup.rights.projectRead || !updateGroup.rights.projectWrite)
        ) {
          return true;
        }
      }
      return false;
    })
  ) {
    throw ProjectCantChangeDefaultGroupsError;
  }
}

//PROJECT FILTER RELATED
const dateNames = ['statusDateFrom', 'statusDateTo', 'pendingDateFrom', 'pendingDateTo', 'closeDateFrom', 'closeDateTo', 'deadlineFrom', 'deadlineTo', 'scheduledFrom', 'scheduledTo', 'createdAtFrom', 'createdAtTo'];

const groupMissesRight = (groups, right) => groups.some((group) => !group.attributeRights[right].view);

export const postProcessFilters = (filters, newGroups, existingGroups, fakeGroupIds, ProjectId, userId, hasId = false) => {
  let newFilters = [];
  filters.map((filterData) => {
    const filter = filterData.filter;
    const dates = extractDatesFromObject(filterData.filter, dateNames);
    let newFilter = <any>{
      active: filterData.active,
      title: filterData.title,
      description: filterData.description,
      order: isNaN(parseInt(filterData.order)) ? 0 : parseInt(filterData.order),
      pub: false,
      global: false,
      dashboard: false,
      ofProject: true,
      ProjectId,
      filterOfProjectId: ProjectId,
      important: filterData.filter.important,
      invoiced: filterData.filter.invoiced,
      pausal: filterData.filter.pausal,
      overtime: filterData.filter.overtime,
      assignedToCur: filterData.filter.assignedToCur,
      requesterCur: filterData.filter.requesterCur,
      companyCur: filterData.filter.companyCur,
      ...dates,
      aditionalData: {
        assignedTos: filterData.filter.assignedTos ? filterData.filter.assignedTos : [],
        tags: filterData.filter.tags ? filterData.filter.tags : [],
        requesters: filterData.filter.requesters ? filterData.filter.requesters : [],
        companies: filterData.filter.companies ? filterData.filter.companies : [],
        taskTypes: filterData.filter.taskTypes ? filterData.filter.taskTypes : [],
        statuses: filterData.filter.statuses ? filterData.filter.statuses : [],
      }
    };

    if (isNaN(parseInt(filterData.order))) {
      newFilter.order = 0;
    } else {
      newFilter.order = parseInt(filterData.order);
    }

    if (!hasId) {
      newFilter.filterCreatedById = userId;
    }

    if (!filterData.groups) {
      newFilter.aditionalData.groups = [];
    } else {
      newFilter.aditionalData.groups = filterData.groups.map((groupId) => {
        if (groupId < 0) {
          let index = fakeGroupIds.findIndex((fakeGroupId) => groupId === fakeGroupId);
          return newGroups[index].get('id');
        }
        return existingGroups.some((Group) => Group.get('id') === groupId) ? groupId : null;
      }).filter((value) => value !== null)
    }

    if (hasId) {
      newFilter.aditionalData.id = filterData.id;
    }
    newFilters.push(newFilter);
  });
  return newFilters;
}

export const fixProjectFilters = async (filters, allGroups) => {
  let newFilters = [];
  let promises = [];
  let usersToCheck = [];
  let companiesToCheck = [];
  let taskTypesToCheck = [];

  filters.map((filterData) => {
    const filter = filterData.filter;
    let newFilter = { ...filterData };
    const groups = allGroups.filter((group) => newFilter.groups.includes(group.id));
    if (filter.active) {
      if (groupMissesRight(groups, 'assigned')) {
        newFilter.filter.assignedToCur = false;
        newFilter.filter.assignedTos = [];
      }
      if (groupMissesRight(groups, 'requester')) {
        newFilter.filter.requesterCur = false;
        newFilter.filter.requesters = [];
      }
      if (groupMissesRight(groups, 'taskType')) {
        newFilter.filter.taskTypes = [];
      }
      if (groupMissesRight(groups, 'company')) {
        newFilter.filter.companyCur = false;
        newFilter.filter.companies = [];
      }
      if (groupMissesRight(groups, 'overtime')) {
        newFilter.filter.overtime = null;
      }
      if (groupMissesRight(groups, 'pausal')) {
        newFilter.filter.pausal = null;
      }
      if (groupMissesRight(groups, 'deadline')) {
        newFilter.filter.deadlineFromNow = false;
        newFilter.filter.deadlineFrom = null;
        newFilter.filter.deadlineToNow = false;
        newFilter.filter.deadlineTo = null;
      }
      if (groupMissesRight(groups, 'status')) {
        newFilter.filter.pausal = null;
        newFilter.filter.statuses = [];
        newFilter.filter.statusDateFromNow = false;
        newFilter.filter.statusDateFrom = null;
        newFilter.filter.statusDateToNow = false;
        newFilter.filter.statusDateTo = null;
        newFilter.filter.closeDateFromNow = false;
        newFilter.filter.closeDateFrom = null;
        newFilter.filter.closeDateToNow = false;
        newFilter.filter.closeDateTo = null;
        newFilter.filter.pendingDateFromNow = false;
        newFilter.filter.pendingDateFrom = null;
        newFilter.filter.pendingDateToNow = false;
        newFilter.filter.pendingDateTo = null;
      }
      if (groupMissesRight(groups, 'taskWorks')) {
        newFilter.filter.scheduledFromNow = false;
        newFilter.filter.scheduledFrom = null;
        newFilter.filter.scheduledToNow = false;
        newFilter.filter.scheduledTo = null;
      }
    }
    usersToCheck = [...usersToCheck, ...filter.assignedTos, ...filter.requesters]
    companiesToCheck = [...companiesToCheck, ...filter.companies]
    taskTypesToCheck = [...taskTypesToCheck, ...filter.taskTypes]
    newFilters.push(newFilter);
  })
  await Promise.all([
    idsDoExistsCheck(usersToCheck, models.User),
    idsDoExistsCheck(companiesToCheck, models.Company),
    idsDoExistsCheck(taskTypesToCheck, models.TaskType),
  ]);
  return newFilters;
}

//TASK RELATED
export const canViewTask = (Task, User, groupRights, checkAdmin = false) => {

  return (
    groupRights.allTasks ||
    (groupRights.companyTasks && Task.get('CompanyId') === User.get('CompanyId')) ||
    Task.get('requesterId') === User.get('id') ||
    (<UserInstance[]>Task.get('assignedTos')).some((AssignedTo) => AssignedTo.get('id') === User.get('id')) ||
    (checkAdmin && (<RoleInstance>User.get('Role')).get('level') === 0) ||
    Task.get('createdById') === User.get('id')
  )
}

const allProjectAttributes = ['requester', 'assignedTo', 'tags', 'overtime', 'pausal', 'taskType', 'startsAt', 'deadline', 'status', 'company'];
const allIDProjectAttributes = ['requester', 'assignedTo', 'tags', 'taskType', 'status', 'company'];

export const processProjectDataAdd = async (CurrentUser, Project, rights, args) => {
  //get rights and project attributes
  let attributes = await Project.get('ProjectAttribute').get('attributes');
  rights.assignedTo = rights.assigned;
  attributes.assignedTo = attributes.assigned;

  for (const attribute of allProjectAttributes) {
    args = await applyFixedAttribute(args, attributes, Project, CurrentUser, attribute);
    if (!attributes[attribute].fixed) {
      //check rights
      args = await applyUserRights(args, attributes, rights, Project, CurrentUser, attribute);
      //check if valid values
      args = await checkIfValidValue(args, attributes, Project, CurrentUser, attribute);
      //set required
      args = await applyRequiredAttribute(args, attributes, Project, CurrentUser, attribute);
    }
  }

  //check if ids exists
  await checkIfAttributeValuesExists(args);
  return args;
}

export const processProjectDataEdit = async (CurrentUser, Project, rights, args, taskData, repeatAdd = false) => {
  //get rights and project attributes
  let attributes = await Project.get('ProjectAttribute').get('attributes');
  rights.assignedTo = rights.assigned;
  attributes.assignedTo = attributes.assigned;

  for (const attribute of allProjectAttributes) {
    args = await applyFixedAttribute(args, attributes, Project, CurrentUser, attribute, taskData);
    if (!attributes[attribute].fixed) {
      //check rights
      args = await applyUserRights(args, attributes, rights, Project, CurrentUser, attribute, taskData);
      //check if valid values
      args = await checkIfValidValue(args, attributes, Project, CurrentUser, attribute, taskData);
      //set required
      args = await applyRequiredAttribute(args, attributes, Project, CurrentUser, attribute, taskData);
    }
    if (repeatAdd) {
      args = setValueIfUndefined(args, taskData, attribute);
    }
  }

  //check if ids exists
  await checkIfAttributeValuesExists(args);
  return args;
}

//step 1
const applyFixedAttribute = async (args, attributes, Project, User, name, data = null) => {
  //get new value, if same as task, set undefined
  const attribute = attributes[name];
  const value = args[name];
  const newTask = !data;
  //if after set is same as tasks, set undefined, its not needed to be set

  switch (name) {
    case 'assignedTo':
    case 'tags': {
      if (attribute.fixed) {
        args[name] = attribute.value.map((value) => value.get('id'));
        args = setUndefinedIfSameInData(args, data, name);
      }
      break;
    }

    case 'pausal': {
      if (attribute.fixed) {
        if ([true, false].includes(attribute.value)) {
          args[name] = attribute.value;
        } else {
          const Company = await models.Company.findByPk(args.company);
          if (Company) {
            args[name] = Company.get('monthly');
          } else {
            args[name] = !data ? attribute.value : data.get('Company').get('monthly');
          }
        }
        args = setUndefinedIfSameInData(args, data, name);
      }
      break;
    }

    case 'overtime': {
      if (attribute.fixed) {
        args[name] = attribute.value;
        args = setUndefinedIfSameInData(args, data, name);
      }
      break;
    }

    case 'taskType': {
      if (attribute.fixed) {
        args[name] = attribute.value.get('id');
        args = setUndefinedIfSameInData(args, data, name);
      }
      break;
    }

    case 'startsAt':
    case 'deadline': {
      if (attribute.fixed) {
        args[name] = moment(attribute.value).valueOf();
        args = setUndefinedIfSameInData(args, data, name);
      }
      break;
    }

    case 'status': {
      if (attribute.fixed) {
        if (attribute.value) {
          args[name] = attribute.value.get('id');
        } else {
          const Statuses = Project.get('projectStatuses');
          const NewStatus = Statuses.find((Status) => Status.get('action') === 'IsNew');
          if (NewStatus) {
            args[name] = NewStatus.get('id');
          } else {
            args[name] = Statuses[0].get('id');
          }
        }
        args = setUndefinedIfSameInData(args, data, name);
      }
      break;
    }

    case 'company': {
      if (attribute.fixed) {
        if (attribute.value) {
          args[name] = attribute.value.get('id');
        }
        args = setUndefinedIfSameInData(args, data, name);
      }
      break;
    }

    case 'requester': {
      //IS FIXED
      //has value - set it
      //no value - check if task has it
      //no value - set current user
      let company = null;
      const projectUsers = <any[]>(<ProjectGroupInstance[]>Project.get('ProjectGroups')).reduce((acc, ProjectGroup) => {
        return [
          ...acc,
          ...(<UserInstance[]>ProjectGroup.get('Users')),
          ...(<UserInstance[]>ProjectGroup.get('Companies')).reduce((acc, Company) => {
            return [...acc, ...(<UserInstance[]>Company.get('Users'))]
          }, []),
        ];
      }, []);
      const projectUsersIds = projectUsers.map((User) => User.get('id'));
      if (attribute.fixed) {
        if (attribute.value) {
          company = attribute.value.get('CompanyId');
          args[name] = attribute.value.get('id');
        } else if (
          !newTask &&
          data.get('requester') &&
          (
            !Project.get('lockedRequester') || projectUsersIds.includes(data.get('requester').get('id'))
          )
        ) {
          delete args[name];
          company = data.get('requester').get('CompanyId');
        } else if (!Project.get('lockedRequester') || projectUsersIds.includes(User.get('id'))) {
          args[name] = User.get('id');
          company = User.get('CompanyId');
        } else {
          args[name] = projectUsers[0].get('id');
          company = projectUsers[0].get('CompanyId');
        }
        args = setUndefinedIfSameInData(args, data, name);
      }

      //set fixed company by requester
      if (attributes.company.fixed && !attributes.company.value) {
        if (!attribute.fixed) {
          let companySet = false;
          if (args[name]) {
            const Requester = await models.User.findByPk(args[name]);
            if ((!Project.get('lockedRequester') || projectUsersIds.includes(args[name])) && Requester) {
              args.company = Requester.get('CompanyId');
              companySet = true;
            }
          }
          if (!companySet) {
            const DataRequester = newTask ? null : data.get('requester');
            if (DataRequester && (!Project.get('lockedRequester') || projectUsersIds.includes(DataRequester.get('id')))) {
              args.company = DataRequester.get('CompanyId');
            } else {
              if (!Project.get('lockedRequester') || projectUsersIds.includes(User.get('id'))) {
                args.company = User.get('CompanyId');
                args.requester = User.get('id');
              } else {
                args.company = projectUsers[0].get('CompanyId');
                args.requester = projectUsers[0].get('id');
              }
            }
          }
        } else {
          args.company = company;
        }
      }
      break;
    }

    default: {
      break;
    }
  }
  return args;
}

//step 2
const applyUserRights = async (args, attributes, rights, Project, User, name, data = null) => {
  const attribute = attributes[name];
  const newTask = !data;
  const neededRight = newTask ? 'add' : 'edit';

  const right = rights[name][neededRight];
  //if null must check

  //if undefined or has right its ok
  if (args[name] === undefined || right) {
    return args;
  }

  //if has task, set to undefined
  if (!newTask) {
    delete args[name];
    return args;
  }

  //new task, set as preset
  args = await setValuePresetOrEmpty(args, attribute, User, Project, data, name);
  return args;
}

//step 3
const checkIfValidValue = async (args, attributes, Project, User, name, data = null) => {
  const attribute = attributes[name];
  const newTask = !data;
  const value = args[name];
  const dataValue = getDataValue(data, name);

  switch (name) {
    case 'assignedTo': {
      const assignableUserIds = <number[]>(<ProjectGroupInstance[]>Project.get('ProjectGroups')).filter((ProjectGroup) => {
        const GroupRights = <ProjectGroupRightsInstance>ProjectGroup.get('ProjectGroupRight');
        return GroupRights.get('assignedEdit');
      }).reduce((acc, ProjectGroup) => {
        return [
          ...acc,
          ...(<UserInstance[]>ProjectGroup.get('Users')).map((User) => User.get('id')),
          ...(<UserInstance[]>ProjectGroup.get('Companies')).reduce((acc, Company) => {
            return [...acc, ...(<UserInstance[]>Company.get('Users')).map((User) => User.get('id'))]
          }, []),
        ];
      }, []);
      //if args value, filter to which can be (value exists only if can add or edit)
      if (value) {
        args[name] = value.filter((id) => assignableUserIds.includes(id));
      } else if (!newTask && dataValue) {
        //if task has value, filter to which can be (value exists only if editing task)
        args[name] = dataValue.filter((User) => assignableUserIds.includes(User.get('id'))).map((User) => User.get('id'));
      } else {
        //else set preset or empty
        args = await setValuePresetOrEmpty(args, attribute, User, Project, data, name);
      }
      args = setUndefinedIfSameInData(args, data, name);
      break;
    }
    case 'tags': {
      const acceptableTags = Project.get('tags').map((Tag) => Tag.get('id'));
      //if args value, filter to which can be (value exists only if can add or edit)
      if (value) {
        args[name] = value.filter((id) => acceptableTags.includes(id));
      } else if (!newTask && dataValue) {
        //if task has value, filter to which can be (value exists only if editing task)
        args[name] = dataValue.filter((Tag) => acceptableTags.includes(Tag.get('id'))).map((Tag) => Tag.get('id'));
      } else {
        //else set preset or empty
        args = await setValuePresetOrEmpty(args, attribute, User, Project, data, name);
      }
      args = setUndefinedIfSameInData(args, data, name);
      break;
    }
    case 'overtime':
    case 'pausal': {
      //if args value and valid, skip
      if (![true, false].includes(value)) {
        if (!newTask && [true, false].includes(dataValue)) {
          //if task has value, set undefined
          delete args[name];
        } else {
          //else set preset or empty
          args = await setValuePresetOrEmpty(args, attribute, User, Project, data, name);
        }
      }
      args = setUndefinedIfSameInData(args, data, name);
      break;
    }
    case 'status': {
      const validStatuses = Project.get('projectStatuses').map((Status) => Status.get('id'));
      //if args value and valid, skip
      if ([null, undefined].includes(value)) {
        if (!newTask && ![undefined, null].includes(dataValue) && validStatuses.includes(dataValue.get('id'))) {
          //if task has value, and is in the project statuses, set undefined
          delete args[name];
        } else {
          //else set preset or empty
          args = await setValuePresetOrEmpty(args, attribute, User, Project, data, name);
        }
      }
      args = setUndefinedIfSameInData(args, data, name);
      break;
    }
    case 'requester': {
      //if args value and valid, skip
      if ([null, undefined].includes(value)) {
        const projectUsers = <number[]>(<ProjectGroupInstance[]>Project.get('ProjectGroups')).reduce((acc, ProjectGroup) => {
          return [
            ...acc,
            ...(<UserInstance[]>ProjectGroup.get('Users')).map((User) => User.get('id')),
            ...(<UserInstance[]>ProjectGroup.get('Companies')).reduce((acc, Company) => {
              return [...acc, ...(<UserInstance[]>Company.get('Users')).map((User) => User.get('id'))]
            }, []),
          ];
        }, []);
        if (!newTask && ![undefined, null].includes(dataValue) && (!Project.get('lockedRequester') || projectUsers.includes(dataValue.get('id')))) {
          //if task has value, must be still valid, set undefined
          delete args[name];
        } else {
          //else set preset or empty
          args = await setValuePresetOrEmpty(args, attribute, User, Project, data, name);
        }
      }
      args = setUndefinedIfSameInData(args, data, name);
      break;
    }
    case 'company':
    case 'taskType': {
      //if args value and valid, skip
      if ([null, undefined].includes(value)) {
        if (!newTask && ![undefined, null].includes(dataValue)) {
          //if task has value, set undefined
          delete args[name];
        } else {
          //else set preset or empty
          args = await setValuePresetOrEmpty(args, attribute, User, Project, data, name);
        }
      }
      args = setUndefinedIfSameInData(args, data, name);
      break;
    }
    case 'startsAt':
    case 'deadline': {
      //if args value and valid, skip
      if ([undefined].includes(value)) {
        if (!newTask && ![undefined].includes(dataValue)) {
          //if task has value, set undefined
          delete args[name];
        } else {
          //else set preset or empty
          args = await setValuePresetOrEmpty(args, attribute, User, Project, data, name);
        }
      }
      args = setUndefinedIfSameInData(args, data, name);
      break;
    }
    default:
      break;
  }
  return args;
}

//step 4
const applyRequiredAttribute = async (args, attributes, Project, User, name, data = null) => {
  const attribute = attributes[name];
  const newTask = !data;
  const isRequiredByProject = newTask && attribute.required;
  const value = args[name];
  const dataValue = getDataValue(data, name);
  switch (name) {
    case 'requester': {
      const projectUsers = <number[]>(<ProjectGroupInstance[]>Project.get('ProjectGroups')).reduce((acc, ProjectGroup) => {
        return [
          ...acc,
          ...(<UserInstance[]>ProjectGroup.get('Users')).map((User) => User.get('id')),
          ...(<UserInstance[]>ProjectGroup.get('Companies')).reduce((acc, Company) => {
            return [...acc, ...(<UserInstance[]>Company.get('Users')).map((User) => User.get('id'))]
          }, []),
        ];
      }, []);
      if ([null, undefined].includes(value)) {
        //if task OR project requires and no value
        if (!newTask && ![undefined, null].includes(dataValue) && (!Project.get('lockedRequester') || projectUsers.includes(dataValue.get('id')))) {
          //task still valid
          delete args[name];
        } else {
          //else set preset
          args = await setValuePresetOrEmpty(args, attribute, User, Project, data, name);
        }
      }
      break;
    }
    case 'status': {
      const validStatuses = Project.get('projectStatuses').map((Status) => Status.get('id'));
      if ([null, undefined].includes(value)) {
        //if task OR project requires and no value
        if (!newTask && ![undefined, null].includes(dataValue) && validStatuses.includes(dataValue.get('id'))) {
          //task still valid
          delete args[name];
        } else {
          //else set preset
          args = await setValuePresetOrEmpty(args, attribute, User, Project, data, name);
        }
      }
      break;
    }
    case 'company': {
      const projectUsers = <number[]>(<ProjectGroupInstance[]>Project.get('ProjectGroups')).reduce((acc, ProjectGroup) => {
        return [
          ...acc,
          ...(<UserInstance[]>ProjectGroup.get('Users')).map((User) => User.get('id')),
          ...(<UserInstance[]>ProjectGroup.get('Companies')).reduce((acc, Company) => {
            return [...acc, ...(<UserInstance[]>Company.get('Users')).map((User) => User.get('id'))]
          }, []),
        ];
      }, []);
      if ([null, undefined].includes(value)) {
        //if no value
        if (!newTask && ![undefined, null].includes(dataValue)) {
          //task still valid
          delete args[name];
        } else if (!newTask && ![undefined, null].includes(getDataValue(data, 'requester')) && (!Project.get('lockedRequester') || projectUsers.includes(getDataValue(data, 'requester').get('id')))) {
          //task still valid
          args[name] = getDataValue(data, 'requester').get('CompanyId');
        } else {
          //else set preset
          args = await setValuePresetOrEmpty(args, attribute, User, Project, data, name);
        }
      }
      break;
    }
    case 'taskType': {
      //if args value and valid, skip
      if ([null, undefined].includes(value)) {
        if (!newTask && ![undefined, null].includes(dataValue)) {
          //if task has value, set undefined
          delete args[name];
        } else {
          //else set preset or empty
          args = await setValuePresetOrEmpty(args, attribute, User, Project, data, name);
        }
      }
      break;
    }
    case 'assignedTo': {
      const assignableUserIds = <number[]>(<ProjectGroupInstance[]>Project.get('ProjectGroups')).filter((ProjectGroup) => {
        const GroupRights = <ProjectGroupRightsInstance>ProjectGroup.get('ProjectGroupRight');
        return GroupRights.get('assignedEdit');
      }).reduce((acc, ProjectGroup) => {
        return [
          ...acc,
          ...(<UserInstance[]>ProjectGroup.get('Users')).map((User) => User.get('id')),
          ...(<UserInstance[]>ProjectGroup.get('Companies')).reduce((acc, Company) => {
            return [...acc, ...(<UserInstance[]>Company.get('Users')).map((User) => User.get('id'))]
          }, []),
        ];
      }, []);
      //needs at least one
      if (isRequiredByProject) {
        //value is empty or length 0
        if ([null, undefined].includes(args[name]) || value.length === 0) {
          //set project default, must have at least one
          args = await setValuePresetOrEmpty(args, attribute, User, Project, data, name);
        }
        if (([null, undefined].includes(args[name]) || value.length === 0) && assignableUserIds.includes(User.get('id'))) {
          args[name] = [User.get('id')];
          //set current user if can
        }
        if ([null, undefined].includes(args[name]) || value.length === 0) {
          //set first user available
          args[name] = [assignableUserIds[0]];
        }
      }
      break;
    }
    case 'tags': {
      const acceptableTags = Project.get('tags').map((Tag) => Tag.get('id'));
      //needs at least one
      if (isRequiredByProject) {
        //value is empty or length 0
        if ([null, undefined].includes(args[name]) || value.length === 0) {
          //set project default, must have at least one
          args = await setValuePresetOrEmpty(args, attribute, User, Project, data, name);
        }
        if ([null, undefined].includes(args[name]) || value.length === 0) {
          //set first tag
          args[name] = [acceptableTags[0]];
        }
      }
      break;
    }

    case 'overtime':
    case 'pausal': {
      if (isRequiredByProject) {
        //if args value and valid, skip
        if ([null, undefined].includes(value)) {
          //else set preset or empty
          args = await setValuePresetOrEmpty(args, attribute, User, Project, data, name);
        }
      }
      break;
    }


    case 'startsAt':
    case 'deadline': {
      if (isRequiredByProject) {
        //if args value and valid, skip
        if ([null, undefined].includes(value)) {
          //set preset or empty
          args = await setValuePresetOrEmpty(args, attribute, User, Project, data, name);
          if (args[name] === null) {
            args[name] = moment().valueOf();
          }
        }
      }
      break;
    }
    default:
      break;
  }
  args = setUndefinedIfSameInData(args, data, name);
  return args;
}

//step 5
const checkIfAttributeValuesExists = async (args) => {
  let promises = [];
  allIDProjectAttributes.filter((name) => ![undefined, null].includes(args[name]) || (Array.isArray(args[name]) && args[name].length > 0)).forEach((name) => {
    switch (name) {
      case 'requester': {
        promises.push(idDoesExistsCheck(args[name], models.User));
        break;
      }
      case 'assignedTo': {
        promises.push(idsDoExistsCheck(args[name], models.User));
        break;
      }
      case 'tags': {
        promises.push(idsDoExistsCheck(args[name], models.Tag));
        break;
      }
      case 'taskType': {
        promises.push(idDoesExistsCheck(args[name], models.TaskType));
        break;
      }
      case 'status': {
        promises.push(idDoesExistsCheck(args[name], models.Status));
        break;
      }
      case 'company': {
        promises.push(idDoesExistsCheck(args[name], models.Company));
        break;
      }
      default:
        break;
    }
  })
  await Promise.all(promises);
}

//step 6 - repeat add only
const setValueIfUndefined = (args, data, name) => {
  if (args[name] !== undefined) {
    return args;
  }
  const dataValue = getDataValue(data, name);

  switch (name) {
    case 'assignedTo':
    case 'tags': {
      args[name] = dataValue.map((item) => item.get('id'));
      break;
    }
    case 'status':
    case 'company':
    case 'taskType':
    case 'requester': {
      args[name] = dataValue ? dataValue.get('id') : null;
      break;
    }
    case 'startsAt':
    case 'deadline': {
      args[name] = dataValue ? moment(dataValue).valueOf() : null;
      break;
    }
    case 'overtime':
    case 'pausal': {
      args[name] = dataValue === true;
      break;
    }
    default:
      break;
  }
  return args;
}

const getDataValue = (data, name) => {
  if (!data) {
    return null;
  }
  switch (name) {
    case 'assignedTo': {
      return data.get('assignedTos');
      break;
    }
    case 'taskType': {
      return data.get('TaskType');
      break;
    }
    case 'status': {
      return data.get('Status');
      break;
    }
    case 'company': {
      return data.get('Company');
      break;
    }
    case 'tags': {
      return data.get('Tags');
      break;
    }
    default:
      break;
  }
  //overtime, pausal, startsAt, deadline, requester
  return data.get(name);
}

const setValuePresetOrEmpty = async (args, attribute, User, Project, data, name) => {
  switch (name) {
    case 'assignedTo':
    case 'tags': {
      args[name] = attribute.value.map((value) => value.get('id'));
      break;
    }
    case 'overtime':
    case 'pausal': {
      args[name] = attribute.value === true;
      break;
    }

    case 'requester': {
      const projectUsers = <number[]>(<ProjectGroupInstance[]>Project.get('ProjectGroups')).reduce((acc, ProjectGroup) => {
        return [
          ...acc,
          ...(<UserInstance[]>ProjectGroup.get('Users')).map((User) => User.get('id')),
          ...(<UserInstance[]>ProjectGroup.get('Companies')).reduce((acc, Company) => {
            return [...acc, ...(<UserInstance[]>Company.get('Users')).map((User) => User.get('id'))]
          }, []),
        ];
      }, []);
      if (attribute.value) {
        //if value set
        args[name] = attribute.value.get('id');
      } else if (data && data.get(name) && (!Project.get('lockedRequester') || projectUsers.includes(data.get(name).get('id')))) {
        //else get from task
        args[name] = undefined;
      } else if (!Project.get('lockedRequester') || projectUsers.includes(User.get('id'))) {
        //else set current user
        args[name] = User.get('id');
      } else {
        //else set random project user
        args[name] = projectUsers[0];
      }
      break;
    }
    case 'company': {
      const projectUsers = <number[]>(<ProjectGroupInstance[]>Project.get('ProjectGroups')).reduce((acc, ProjectGroup) => {
        return [
          ...acc,
          ...(<UserInstance[]>ProjectGroup.get('Users')).map((User) => User.get('id')),
          ...(<UserInstance[]>ProjectGroup.get('Companies')).reduce((acc, Company) => {
            return [...acc, ...(<UserInstance[]>Company.get('Users')).map((User) => User.get('id'))]
          }, []),
        ];
      }, []);
      if (attribute.value) {
        //if value set
        args[name] = attribute.value.get('id');
      } else if (data && data.get('requester') && (!Project.get('lockedRequester') || projectUsers.includes(data.get('requester').get('id')))) {
        //else get from task
        args[name] = data.get('requester').get('CompanyId');
      } else {
        //else set current user
        args[name] = User.get('CompanyId');
      }
      break;
    }
    case 'status': {
      if (attribute.value) {
        args[name] = attribute.value.get('id');
      } else {
        let possibleStatus = Project.get('projectStatuses').find((status) => status.action === 'IsNew');
        if (!possibleStatus) {
          possibleStatus = Project.get('projectStatuses')[0].get('id');
        }
        args[name] = possibleStatus.get('id');
      }
      break;
    }
    case 'taskType': {
      if (attribute.value) {
        args[name] = attribute.value.get('id');
      } else {
        args[name] = (await models.TaskType.findOne()).get('id');
      }
      break;
    }

    case 'startsAt':
    case 'deadline': {
      if (attribute.value) {
        args[name] = moment(attribute.value).valueOf();
      } else {
        args[name] = null;
      }
      break;
    }

    default:
      break;
  }
  return args;
}

const setUndefinedIfSameInData = (args, data, name) => {
  if (!data || args[name] === undefined) {
    return args;
  }
  switch (name) {
    case 'assignedTo':
    case 'tags': {
      const dataValues = data.get(name === 'tags' ? 'Tags' : 'assignedTos').map((value) => value.get('id'));
      if (
        args[name] !== null &&
        dataValues.length === args[name].length &&
        dataValues.every((value) => args[name].includes(value))
      ) {
        delete args[name];
      }
      break;
    }

    case 'pausal':
    case 'overtime': {
      if (args[name] === data.get(name)) {
        delete args[name];
      }
      break;
    }

    case 'taskType': {
      if (args[name] === data.get('TaskTypeId')) {
        delete args[name];
      }
      break;
    }

    case 'startsAt':
    case 'deadline': {
      if (moment(data.get(name)).isSame(args[name])) {
        delete args[name];
      }
      break;
    }

    case 'status': {
      if (args[name] === data.get('StatusId')) {
        delete args[name];
      }
      break;
    }

    case 'company': {
      if (args[name] === data.get('CompanyId')) {
        delete args[name];
      }
      break;
    }

    case 'requester': {
      if (args[name] === data.get('requesterId')) {
        delete args[name];
      }
      break;
    }

    default: {
      break;
    }
  }
  return args;
}
