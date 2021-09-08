import { models } from '@/models';
import { ApolloError } from 'apollo-server-express';
import moment from 'moment';
import {
  addApolloError
} from '@/helperFunctions';
import {
  allGroupRights
} from '@/configs/projectConstants';
import {
  createDoesNoExistsError,
  InsufficientProjectAccessError,
  createProjectFixedAttributeError,
  createCantEditTaskAttributeError,
  ProjectCantChangeDefaultGroupsError,
} from '@/configs/errors';
import {
  ProjectGroupInstance,
  ProjectGroupRightsInstance,
  RoleInstance,
  AccessRightsInstance,
  UserInstance,
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

export const checkIfHasProjectRights = async (userId, taskId = undefined, projectId = undefined, rights = [], attributeRights = []) => {
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

  let groupRights = <any>{};
  let Role = <any>{};

  if (User === null) {
    User = await models.User.findByPk(userId, {
      include: [
        {
          model: models.Role,
          include: [models.AccessRights]
        }
      ],
    })
    Role = <RoleInstance>User.get('Role');

    if (Role.get('level') === 0 || (<AccessRightsInstance>Role.get('AccessRight')).get('projects')) {
      groupRights = getProjectAdminRights(projectID);
    } else {
      addApolloError(
        'Project',
        InsufficientProjectAccessError,
        userId,
        projectID
      );
      throw InsufficientProjectAccessError;
    }
  } else {
    Role = <RoleInstance>User.get('Role');
    groupRights = (<ProjectGroupRightsInstance>(<ProjectGroupInstance[]>User.get('ProjectGroups'))[0].get('ProjectGroupRight')).get();
  }

  if (
    (rights.length === 0 || rights.every((right) => groupRights[right])) &&
    (attributeRights.length === 0 || attributeRights.every((rightPair) => groupRights.get('attributes')[rightPair.right][rightPair.action]))
  ) {
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
  return <ProjectGroupRightsInstance>(Project.get('ProjectGroupRights')[0]);
}

export const applyAttributeRightsRequirements = (groups, projectAttributes) => {
  let updatedGroups = [];
  groups.forEach((group) => {
    let newGroup = {
      ...group
    };
    taskAttributes.map((attr) => attr.attribute).forEach((attribute) => {
      if (attribute !== 'repeat' && projectAttributes[attribute].fixed) {
        newGroup.attributes[attribute].required = false;
        newGroup.attributes[attribute].add = false;
        newGroup.attributes[attribute].edit = false;
      } else {
        if (newGroup.attributes[attribute].edit) {
          newGroup.attributes[attribute].view = true;
        }
        if (newGroup.attributes[attribute].required) {
          newGroup.attributes[attribute].add = true;
        }
      }
    })
    updatedGroups.push(newGroup);
  })
  return updatedGroups;
}

export const checkFixedAttributes = (projectAttributes) => {
  taskAttributes.forEach((taskAttribute) => {
    const attribute = projectAttributes[taskAttribute.attribute];
    if (
      attribute.fixed && (
        (taskAttribute.value === 'bool' && !([true, false].includes(attribute.value))) ||
        (taskAttribute.value === 'int' && attribute.value === null) ||
        (taskAttribute.value === 'arr' && attribute.value.length === 0 && !['tags'].includes(taskAttribute.attribute)) ||
        (taskAttribute.value === 'date' && isNaN(parseInt(attribute.value)))
      )
    ) {
      throw new ApolloError(`In default values, ${taskAttribute.attribute} to is set to be fixed, but fixed value can\'t be empty.`, 'PROJECT_ATTRIBUTE_FIXED_INTEGRITY');
    }
  })
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

export const applyFixedOnAttributes = (defaults, args, User = null, statuses = []) => {

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
  if (User && def.company.required && [undefined, null].includes(args.company)) {
    args.company = [User.get('CompanyId')]
  }
  if (User && def.requester.required && [undefined, null].includes(args.requester)) {
    args.requester = User.get('id')
  }
  if (User && def.status.required && [undefined, null].includes(args.status)) {
    const status = statuses.find((status) => status.action === 'IsNew');
    args.status = status ? status.get('id') : null;
  }

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
export const checkDefRequiredSatisfied = (def, originalData, newData, newTask = true) => {
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
    if (key === 'assignedTo') {
      if (!newTask && def.assignedTo.required && mergedData.assignedTo.length === 0) {
        throw new ApolloError(
          `Right now only tags and requester can be not required. Field ${key} is of length 0 in task or request.`,
          'PROJECT_DEF_INTEGRITY'
        );
      }
    } else if (['tags'].includes(key)) {
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
export const checkIfCanEditTaskAttributes = (User, def, projectId, newAttrs, orgAttrs = null, ignoreAttributes = []) => {
  const groupRights = (
    User.get('Role').get('level') === 0 ?
      allGroupRights :
      User.get('ProjectGroups').find((ProjectGroup) => ProjectGroup.get('ProjectId') === projectId).get('ProjectGroupRight').get()
  )
  //DEF ATTRIBUTES

  if (!groupRights.assignedWrite && newAttrs.assignedTo !== undefined && !ignoreAttributes.includes('assignedTo')) {
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
  if (!groupRights.tagsWrite && newAttrs.tags !== undefined && !ignoreAttributes.includes('tags')) {
    if (
      (
        !def.tag.def ||
        def.tag.value.length !== newAttrs.tags.length ||
        !newAttrs.tags.every((id) => def.tag.value.some((value) => value.get('id') === id))
      ) &&
      (
        (
          orgAttrs === null &&
          newAttrs.tags.length !== 0
        ) ||
        orgAttrs !== null && (
          orgAttrs.get('Tags').length !== newAttrs.tags.length ||
          !orgAttrs.get('Tags').map((Tag) => Tag.get('id')).every((id) => newAttrs.tags.includes(id))
        )
      )
    ) {
      throw createCantEditTaskAttributeError('tags');
    }
  }

  if (!groupRights.companyWrite && newAttrs.company !== undefined && !ignoreAttributes.includes('company')) {
    if (
      (
        !def.company.def ||
        (def.company.value === null && newAttrs.company !== User.get('CompanyId')) ||
        (def.company.value !== null && def.company.value.get('id') !== newAttrs.company)
      ) &&
      (
        orgAttrs === null ||
        orgAttrs.get('CompanyId') !== newAttrs.company
      )
    ) {
      throw createCantEditTaskAttributeError('company');
    }
  }
  if (!groupRights.requesterWrite && newAttrs.requester !== undefined && !ignoreAttributes.includes('requester')) {
    if (
      (
        !def.requester.def ||
        (def.requester.value === null && newAttrs.requester !== User.get('id')) ||
        (def.requester.value !== null && def.requester.value.get('id') !== newAttrs.requester)
      ) &&
      (
        orgAttrs === null ||
        orgAttrs.get('RequesterId') !== newAttrs.requester
      )
    ) {
      throw createCantEditTaskAttributeError('requester');
    }
  }
  if (!groupRights.typeWrite && newAttrs.taskType !== undefined && !ignoreAttributes.includes('taskType') && def.type.required) {
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
        (def.status.value !== null && def.status.value.get('id') !== newAttrs.status)
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
  ].filter((check) => !ignoreAttributes.includes(check.key)).forEach((check) => {
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
