import { models } from '@/models';
import { ApolloError } from 'apollo-server-express';
import moment from 'moment';
import {
  addApolloError
} from './addErrorMessage';
import {
  allGroupRights
} from '@/configs/projectConstants';
import {
  createDoesNoExistsError,
  InsufficientProjectAccessError,
  createProjectFixedAttributeError,
  createCantEditTaskAttributeError
} from '@/configs/errors';
import {
  ProjectGroupInstance,
  ProjectGroupRightsInstance,
  RoleInstance,
  AccessRightsInstance,
  UserInstance,
} from '@/models/instances';

export const checkIfHasProjectRights = async (userId, taskId = undefined, projectId = undefined, rights = []) => {
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

  let User = await models.User.findByPk(userId, {
    include: [
      {
        model: models.ProjectGroup,
        where: {
          ProjectId: projectID,
        },
        include: [models.ProjectGroupRights]
      },
      {
        model: models.Role,
        include: [models.AccessRights]
      }
    ],
  })

  if (User === null) {
    User = await models.User.findByPk(userId, {
      include: [
        {
          model: models.Role,
          include: [models.AccessRights]
        }
      ],
    })
    let Role = <RoleInstance>User.get('Role');

    if (Role.get('level') === 0 || (<AccessRightsInstance>Role.get('AccessRight')).get('projects')) {
      return { User, Role, groupRights: allGroupRights, Task };
    }
    addApolloError(
      'Project',
      InsufficientProjectAccessError,
      userId,
      projectID
    );
    throw InsufficientProjectAccessError;
  }

  let Role = <RoleInstance>User.get('Role');
  let groupRights = (<ProjectGroupRightsInstance>(<ProjectGroupInstance[]>User.get('ProjectGroups'))[0].get('ProjectGroupRight')).get();
  if (rights.length === 0) {
    return { User, Role, groupRights, Task };
  }
  if (Role.get('level') === 0 || (<AccessRightsInstance>Role.get('AccessRight')).get('projects')) {
    return { User, Role, groupRights, Task };
  }
  if (rights.every((right) => groupRights[right])) {
    return { User, Role, groupRights, Task };
  }
  addApolloError(
    'Project',
    InsufficientProjectAccessError,
    userId,
    projectID
  );
  throw InsufficientProjectAccessError;
}

export const checkDefIntegrity = (def) => {
  const { assignedTo, company, overtime, pausal, requester, status, tag, type } = def;
  if (
    !assignedTo.required ||
    !company.required ||
    !overtime.required ||
    !pausal.required ||
    !status.required
  ) {
    throw new ApolloError(
      'Right now only tags, task type and requester can be not required.',
      'PROJECT_DEF_INTEGRITY'
    );
  }
  if (assignedTo.fixed && !assignedTo.def) {
    throw new ApolloError('In default values, assigned to is set to be fixed, but is not set to default value.', 'PROJECT_DEF_INTEGRITY');
  } else if (assignedTo.fixed && (assignedTo.value === null || assignedTo.value === [])) {
    throw new ApolloError('In default values, assigned to is set to be fixed, but fixed value can\'t be empty.', 'PROJECT_DEF_INTEGRITY');
  }

  if (company.fixed && !company.def) {
    throw new ApolloError('In default values, company is set to be fixed, but is not set to default value.', 'PROJECT_DEF_INTEGRITY');
  } else if (company.fixed && (company.value === null)) {
    throw new ApolloError('In default values, company is set to be fixed, but fixed value can\'t be null.', 'PROJECT_DEF_INTEGRITY');
  }

  if (overtime.fixed && !overtime.def) {
    throw new ApolloError('In default values, overtime is set to be fixed, but is not set to default value.', 'PROJECT_DEF_INTEGRITY');
  } else if (overtime.fixed && !([true, false].includes(overtime.value))) {
    throw new ApolloError('In default values, overtime is set to be fixed, but fixed value can be only true or false.', 'PROJECT_DEF_INTEGRITY');
  }

  if (pausal.fixed && !pausal.def) {
    throw new ApolloError('In default values, pausal is set to be fixed, but is not set to default value.', 'PROJECT_DEF_INTEGRITY');
  } else if (pausal.fixed && !([true, false].includes(pausal.value))) {
    throw new ApolloError('In default values, pausal is set to be fixed, but fixed value can be only true or false.', 'PROJECT_DEF_INTEGRITY');
  }

  if (requester.fixed && !requester.def) {
    throw new ApolloError('In default values, requester is set to be fixed, but is not set to default value.', 'PROJECT_DEF_INTEGRITY');
  }

  if (type.fixed && !type.def) {
    throw new ApolloError('In default values, type is set to be fixed, but is not set to default value.', 'PROJECT_DEF_INTEGRITY');
  }

  if (status.fixed && !status.def) {
    throw new ApolloError('In default values, status is set to be fixed, but is not set to default value.', 'PROJECT_DEF_INTEGRITY');
  } else if (status.fixed && (status.value === null)) {
    throw new ApolloError('In default values, status is set to be fixed, but fixed value can\'t be null.', 'PROJECT_DEF_INTEGRITY');
  }

  if (tag.fixed && !tag.def) {
    throw new ApolloError('In default values, tag is set to be fixed, but is not set to default value.', 'PROJECT_DEF_INTEGRITY');
  }
}

const checkSingleAttribute = (newAttr, oldAttr) => {
  return ['def', 'fixed', 'required'].some((key) => newAttr[key] !== oldAttr[key]);
};

const checkAllAttributes = (newAttrs, oldAttrs) => {
  return ['assignedTo', 'company', 'overtime', 'pausal', 'requester', 'status', 'tag', 'type'].some((key) => checkSingleAttribute(newAttrs[key], oldAttrs[key]));
}

const checkAttributeValue = (newAttr, oldAttr) => {
  return (
    (oldAttr.value === null && newAttr.value !== null) ||
    (oldAttr.value !== null && newAttr.value === null) ||
    (
      oldAttr.value !== null &&
      newAttr.value !== null &&
      oldAttr.value.get('id') !== newAttr.value
    )
  )
}

export const checkIfChanged = async (attributes, Project) => {
  if (
    (attributes.deleteTags !== undefined && attributes.deleteTags.length !== 0) ||
    (attributes.updateTags !== undefined && attributes.updateTags.length !== 0) ||
    (attributes.addTags !== undefined && attributes.addTags.length !== 0) ||
    (attributes.deleteStatuses !== undefined && attributes.deleteStatuses.length !== 0) ||
    (attributes.updateStatuses !== undefined && attributes.updateStatuses.length !== 0) ||
    (attributes.addStatuses !== undefined && attributes.addStatuses.length !== 0) ||
    (attributes.addGroups !== undefined && attributes.addGroups.length !== 0) ||
    (attributes.updateGroups !== undefined && attributes.updateGroups.length !== 0) ||
    (attributes.deleteGroups !== undefined && attributes.deleteGroups.length !== 0) ||
    (attributes.lockedRequester !== undefined && attributes.lockedRequester !== Project.get('lockedRequester'))
  ) {
    return true;
  }
  let newUserGroups = attributes.userGroups;
  let originalUserGroups = Project.get('ProjectGroups').map((ProjectGroup) => ({
    groupId: ProjectGroup.get('id'),
    userIds: ProjectGroup.get('Users').map((User) => User.get('id'))
  }))
  if (newUserGroups.length !== originalUserGroups.length) {
    return true;
  }
  if (
    newUserGroups.some((newUserGroup) => {
      let originalUserGroup = originalUserGroups.find((originalUserGroup) => newUserGroup.groupId === originalUserGroup.groupId);
      if (originalUserGroup === undefined) {
        return true;
      }
      return (
        newUserGroup.userIds.length !== originalUserGroup.userIds.length ||
        !newUserGroup.userIds.every((userId) => originalUserGroup.userIds.includes(userId))
      )
    })
  ) {
    return true;
  }
  if (attributes.def === undefined) {
    return false;
  }
  let origDef = await Project.get('def');
  let newDef = attributes.def;
  if (
    checkAllAttributes(newDef, origDef) ||
    origDef.assignedTo.value.length !== newDef.assignedTo.value.length ||
    !origDef.assignedTo.value.every((User) => newDef.assignedTo.value.includes(User.get('id'))) ||
    origDef.tag.value.length !== newDef.tag.value.length ||
    checkAttributeValue(newDef.company, origDef.company) ||
    checkAttributeValue(newDef.requester, origDef.requester) ||
    checkAttributeValue(newDef.type, origDef.type) ||
    checkAttributeValue(newDef.status, origDef.status) ||
    origDef.status.value !== newDef.status.value ||
    origDef.overtime.value !== newDef.overtime.value ||
    origDef.pausal.value !== newDef.pausal.value
  ) {
    return true;
  }

  return false;
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

export const applyFixedOnAttributes = (defaults, args) => {

  const def = {
    ...(<any>defaults),
    taskType: (<any>defaults).type
  };

  (['assignedTo', 'tag']).forEach((key) => {
    if (def[key].fixed && args[key]) {
      let values = def[key].value.map((value) => value.get('id'));
      if (
        values.length !== args[key].length ||
        args[key].some((argValue) => !values.includes(argValue))
      ) {
        throw createProjectFixedAttributeError(key);
      }
    }
  });

  (['overtime', 'pausal']).forEach((key) => {
    if (def[key].fixed && args[key]) {
      let value = def[key].value;
      if (value !== args[key]) {
        throw createProjectFixedAttributeError(key);
      }
    }
  });

  (['company', 'requester', 'status', 'taskType']).forEach((key) => {
    if (def[key].fixed && args[key]) {
      let value = def[key].value.get('id');
      //if is fixed, it must fit
      if (value !== args[key]) {
        throw createProjectFixedAttributeError(key);
      }
    }
  });
  return args;
}

const checkedAttributes = [
  'assignedTo',
  'tags',
  'company',
  'requester',
  'taskType',
  'status',
];
export const checkDefRequiredSatisfied = (def, originalData, newData) => {
  let mergedData = newData;
  if (originalData) {
    mergedData = checkedAttributes.reduce((acc, cur) => {
      let mergedData = { ...acc };
      mergedData[cur] = (newData[cur] ? newData[cur] : originalData[cur])
      return mergedData;
    }, {});
  }
  def = { ...def, tags: def.tag, taskType: def.type };
  checkedAttributes.forEach((key) => {
    if (['assignedTo', 'tags'].includes(key)) {
      if (def[key].required && mergedData[key].length === 0) {
        throw new ApolloError(
          `Right now only tags and requester can be not required. Field ${key} is of length 0 in task or request.`,
          'PROJECT_DEF_INTEGRITY'
        );
      }
    } else {
      if (def[key].required && mergedData[key] === null) {
        throw new ApolloError(
          `Right now only tags and requester can be not required. Field ${key} is null in task or request.`,
          'PROJECT_DEF_INTEGRITY'
        );
      }
    }
  })
}

//skontrolovat ci ma pravo na polia
export const checkIfCanEditTaskAttributes = (User, def, projectId, newAttrs, orgAttrs = null) => {
  const groupRights = (
    User.get('Role').get('level') === 0 ?
      allGroupRights :
      User.get('ProjectGroups').find((ProjectGroup) => ProjectGroup.get('ProjectId') === projectId).get('ProjectGroupRight').get()
  )
  //DEF ATTRIBUTES

  if (!groupRights.assignedWrite && newAttrs.assignedTo !== undefined) {
    if (
      (
        !def.assignedTo.def ||
        def.assignedTo.value.length !== newAttrs.assignedTo.length ||
        !newAttrs.assignedTo.every((id) => def.assignedTo.value.some((value) => value.get('id') === id))
      ) &&
      (
        orgAttrs === null ||
        orgAttrs.get('AssignedTos').length !== newAttrs.length ||
        !orgAttrs.get('AssignedTos').map((User) => User.get('id')).every((id) => newAttrs.assignedTo.includes(id))
      )
    ) {
      throw createCantEditTaskAttributeError('assignedTo');
    }
  }
  if (!groupRights.tagsWrite && newAttrs.tags !== undefined) {
    if (
      (
        !def.tag.def ||
        def.tag.value.length !== newAttrs.tags.length ||
        !newAttrs.tags.every((id) => def.tag.value.some((value) => value.get('id') === id))
      ) &&
      (
        orgAttrs === null ||
        orgAttrs.get('Tags').length !== newAttrs.length ||
        !orgAttrs.get('Tags').map((Tag) => Tag.get('id')).every((id) => newAttrs.tags.includes(id))
      )
    ) {
      throw createCantEditTaskAttributeError('tags');
    }
  }

  if (!groupRights.companyWrite && newAttrs.company !== undefined) {
    if (
      (
        !def.company.def ||
        def.company.value.get('id') !== newAttrs.company
      ) &&
      (
        orgAttrs === null ||
        orgAttrs.get('CompanyId') !== newAttrs.company
      )
    ) {
      throw createCantEditTaskAttributeError('company');
    }
  }
  if (!groupRights.requesterWrite && newAttrs.requester !== undefined) {
    if (
      (
        !def.requester.def ||
        def.requester.value.get('id') !== newAttrs.requester
      ) &&
      (
        orgAttrs === null ||
        orgAttrs.get('RequesterId') !== newAttrs.requester
      )
    ) {
      throw createCantEditTaskAttributeError('requester');
    }
  }
  if (!groupRights.typeWrite && newAttrs.taskType !== undefined) {
    if (
      (
        !def.type.def ||
        def.type.value.get('id') !== newAttrs.taskType
      ) &&
      (
        orgAttrs === null ||
        orgAttrs.get('TaskTypeId') !== newAttrs.taskType
      )
    ) {
      throw createCantEditTaskAttributeError('task type');
    }
  }
  if (!groupRights.statusWrite && newAttrs.status !== undefined) {
    if (
      (
        !def.status.def ||
        def.status.value.get('id') !== newAttrs.status
      ) &&
      (
        orgAttrs === null ||
        orgAttrs.get('StatusId') !== newAttrs.status
      )
    ) {
      throw createCantEditTaskAttributeError('status');
    }
  }

  if (!groupRights.overtimeWrite && newAttrs.overtime !== undefined) {
    if (
      (
        def.overtime.value !== newAttrs.overtime
      ) &&
      (
        orgAttrs === null ||
        orgAttrs.get('overtime') !== newAttrs.overtime
      )
    ) {
      throw createCantEditTaskAttributeError('overtime');
    }
  }

  if (!groupRights.pausalWrite && newAttrs.pausal !== undefined) {
    if (
      (
        def.pausal.value !== newAttrs.pausal
      ) &&
      (
        orgAttrs === null ||
        orgAttrs.get('pausal') !== newAttrs.pausal
      )
    ) {
      throw createCantEditTaskAttributeError('pausal');
    }
  }

  //OTHER ATTRIBUTES
  [
    {
      key: 'title',
      type: 'text',
      right: 'taskTitleEdit'
    },
    {
      key: 'description',
      type: 'text',
      right: 'taskDescriptionWrite'
    },
    {
      key: 'closeDate',
      type: 'date',
      right: 'statusWrite',
    },
    {
      key: 'deadline',
      type: 'date',
      right: 'deadlineWrite',
    },
    {
      key: 'pendingDate',
      type: 'date',
      right: 'milestoneWrite',
    },
    {
      key: 'milestone',
      type: 'object',
      right: 'milestoneWrite',
      orgKey: 'MilestoneId'
    },
    {
      key: 'project',
      type: 'project',
      right: 'projectWrite',
      orgKey: 'ProjectId'
    },
    {
      key: 'scheduled',
      type: 'array',
      right: 'scheduledWrite',
    },
    {
      key: 'shortSubtasks',
      type: 'array',
      right: 'taskShortSubtasksWrite',
    },
    {
      key: 'workTrips',
      type: 'array',
      right: 'vykazWrite',
    },
    {
      key: 'materials',
      type: 'array',
      right: 'vykazWrite',
    },
    {
      key: 'customItems',
      type: 'array',
      right: 'vykazWrite',
    },
    {
      key: 'repeat',
      type: 'repeat',
      right: 'repeatWrite',
    },
  ].forEach((check) => {
    switch (check.type) {
      case 'text': {
        if (
          !groupRights[check.right] &&
          newAttrs[check.key] &&
          (
            orgAttrs === null ||
            orgAttrs.get(check.key) !== newAttrs[check.key]
          )
        ) {
          throw createCantEditTaskAttributeError(check.key);
        }
        break;
      }
      case 'date': {
        if (
          !groupRights[check.right] &&
          newAttrs[check.key] &&
          (
            orgAttrs === null ||
            !moment(orgAttrs.get(check.key)).isSame(parseInt(newAttrs[check.key]))
          )
        ) {
          throw createCantEditTaskAttributeError(check.key);
        }
        break;
      }
      case 'object': {
        if (
          !groupRights[check.right] &&
          newAttrs[check.key] &&
          (
            orgAttrs === null ||
            orgAttrs.get(check.orgKey) !== newAttrs[check.key]
          )
        ) {
          throw createCantEditTaskAttributeError(check.key);
        }
        break;
      }
      case 'project': {
        if (
          !groupRights[check.right] &&
          newAttrs[check.key] &&
          orgAttrs !== null &&
          orgAttrs.get(check.orgKey) !== newAttrs[check.key]
        ) {
          throw createCantEditTaskAttributeError(check.key);
        }
        break;
      }
      case 'boolean': {
        if (
          !groupRights[check.right] &&
          newAttrs[check.key] !== undefined &&
          newAttrs[check.key] !== null &&
          (
            orgAttrs === null ||
            orgAttrs.get(check.key) === newAttrs[check.key]
          )
        ) {
          throw createCantEditTaskAttributeError(check.key);
        }
        break;
      }
      case 'array': {
        if (
          !groupRights[check.right] &&
          newAttrs[check.key] &&
          newAttrs[check.key].length !== 0
        ) {
          throw createCantEditTaskAttributeError(check.key);
        }
        break;
      }
      case 'repeat': {
        if (
          !groupRights[check.right] &&
          newAttrs[check.key]
        ) {
          throw createCantEditTaskAttributeError(check.key);
        }
        break;
      }
      default: {
        break;
      }
    }
  })
}
