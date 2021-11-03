import {
  createDoesNoExistsError,
  InsufficientProjectAccessError,
  createUserNotPartOfProjectError,
  MilestoneNotPartOfProject,
  createProjectFixedAttributeError,
  StatusPendingAttributesMissing,
  TaskNotNullAttributesPresent,
  InternalMessagesNotAllowed,
  TaskMustBeAssignedToAtLeastOneUser,
  AssignedToUserNotSolvingTheTask,
  InvalidTokenError,
  CantUpdateTaskAssignedToOldUsedInSubtasksOrWorkTripsError,
  CantCreateTasksError,
  CantViewTaskError
} from '@/configs/errors';
import { models, sequelize } from '@/models';
import { Op, QueryTypes } from 'sequelize';
import {
  TaskInstance,
  MilestoneInstance,
  ProjectInstance,
  ProjectAttributesInstance,
  ProjectGroupInstance,
  ProjectGroupRightsInstance,
  StatusInstance,
  RepeatInstance,
  RepeatTemplateInstance,
  UserInstance,
  CommentInstance,
  AccessRightsInstance,
  RoleInstance,
  SubtaskInstance,
  WorkTripInstance,
  MaterialInstance,
  CustomItemInstance,
  TagInstance,
  TaskTypeInstance,
  CompanyInstance,
  TaskMetadataInstance
} from '@/models/instances';
import {
  idsDoExistsCheck,
  multipleIdDoesExistsCheck,
  taskCheckDate,
  extractDatesFromObject,
  filterUnique,
  getModelAttribute,
  mergeFragmentedModel,
  addApolloError,
  createChangeMessage,
  createTaskAttributesChangeMessages,
  toFloatOrZero,
  sendTaskNotificationsToUsers,
  isUserAdmin,
} from '@/helperFunctions';
import {
  canViewTask,
  checkIfHasProjectRights,
  checkIfCanEditTaskAttributes,
  mergeGroupRights,
  checkAndApplyFixedAndRequiredOnAttributes,
  convertSQLProjectGroupRightsToRights,
} from '@/graph/addons/project';
import {
  calculateMetadata,
  filterToTaskWhere,
  transformSortToQuery,
  stringFilterToTaskWhere,
  transformSortToQueryString,
  filterToTaskWhereSQL,
  stringFilterToTaskWhereSQL,
  generateTasksSQL,
  generateTaskSQL,
  generateAssignedTosSQL,
  generateTaskAttachmentsSQL,
  generateTagsSQL,
  generateCompanySQL,
  generateShortSubtasksSQL,
  generateSubtasksSQL,
  generateWorkTripsSQL,
  generateMaterialsSQL,
  generateCustomItemsSQL,
  generateCompanyUsedTripPausalSQL,
  generateCompanyUsedSubtaskPausalSQL,
  generateWorkCountsSQL,
} from '@/graph/addons/task';
import { repeatEvent } from '@/services/repeatTasks';
import { pubsub } from './index';
const { withFilter } = require('apollo-server-express');
import {
  TASK_CHANGE,
  TASK_HISTORY_CHANGE,
  TASK_DELETE,
  TASK_ADD,
} from '@/configs/subscriptions';
import checkResolver from './checkResolver';
import moment from 'moment';
import Stopwatch from 'statman-stopwatch';
import { sendEmail } from '@/services/smtp';
const dateNames = ['startsAt', 'deadline', 'pendingDate', 'closeDate'];
const dateNames2 = [
  'closeDateFrom',
  'closeDateTo',
  'deadlineFrom',
  'deadlineTo',
  'pendingDateFrom',
  'pendingDateTo',
  'statusDateFrom',
  'statusDateTo',
  'createdAtFrom',
  'createdAtTo',
  'scheduledFrom',
  'scheduledTo',
];
const scheduledDateNames = ['from', 'to'];

const createBasicSort = (taskName, milestoneSort) => {
  return milestoneSort ? `"Milestone"."order" ASC, "${taskName}"."startsAt" DESC` : `"${taskName}"."important" DESC, "${taskName}"."id" DESC`;
}

const queries = {
  tasks: async (root, { projectId, milestoneId, filter, sort, milestoneSort, search, stringFilter, limit, page, statuses }, { req, userID }) => {
    const mainOrderBy = sort ? transformSortToQueryString(sort, true, milestoneSort) : createBasicSort('Task', milestoneSort);
    const secondaryOrderBy = sort ? transformSortToQueryString(sort, false, milestoneSort) : createBasicSort('TaskData', milestoneSort);

    const mainWatch = new Stopwatch(true);
    const checkUserWatch = new Stopwatch(true);
    const User = await checkResolver(req);
    const isAdmin = isUserAdmin(User);
    const checkUserTime = checkUserWatch.stop();
    let taskWhere = [];
    if (projectId) {
      const Project = await models.Project.findByPk(projectId, { include: [models.Milestone] });
      if (Project === null) {
        throw createDoesNoExistsError('Project', projectId);
      }
      taskWhere.push(`"Task"."ProjectId" = ${projectId}`);
      if (milestoneId !== null && milestoneId !== undefined) {
        if (!(<MilestoneInstance[]>Project.get('Milestones')).some((Milestone) => Milestone.get('id') === milestoneId)) {
          throw createDoesNoExistsError('Milestone', milestoneId);
        }
        taskWhere.push(`"Task"."MilestoneId" = ${milestoneId}`);
      }
    }

    if (filter) {
      const dates = extractDatesFromObject(filter, dateNames2);
      taskWhere = taskWhere.concat(filterToTaskWhereSQL({ ...filter, ...dates }, userID, User.get('CompanyId'), isAdmin));
    }

    if (search || stringFilter) {
      taskWhere = [
        ...taskWhere,
        ...stringFilterToTaskWhereSQL(search && search.charAt(search.length - 1) === " " ? search.substring(0, search.length - 1) : search, stringFilter),
      ]
    }

    if (!page) {
      page = 1;
    }

    const SQL = generateTasksSQL(userID, User.get('CompanyId'), isAdmin, taskWhere.join(' AND '), mainOrderBy, secondaryOrderBy, limit, (page - 1) * limit);
    const totalsSQL = generateWorkCountsSQL(userID, User.get('CompanyId'), isAdmin, taskWhere.join(' AND '));

    let [responseTasks, totals] = await Promise.all([
      sequelize.query(SQL, {
        model: models.Task,
        type: QueryTypes.SELECT,
        nest: true,
        raw: true,
        mapToModel: true
      }),
      sequelize.query(totalsSQL, {
        type: QueryTypes.SELECT,
        nest: true,
        raw: true,
        mapToModel: false
      })
    ]);
    totals = <any>totals[0];

    let databaseTime = 0;
    const databaseWatch = new Stopwatch(true);
    let tasks = [];
    responseTasks.forEach((Task: TaskInstance) => {
      const hasAsssignedTo = Task.assignedTos !== null && Task.assignedTos.id !== null;
      const hasTag = Task.Tags !== null && Task.Tags.id !== null;
      const hasSubtask = Task.Subtasks !== null && Task.Subtasks.id !== null;

      const taskIndex = tasks.findIndex((task) => Task.id === task.id);
      if (taskIndex !== -1) {

        if (hasAsssignedTo && !tasks[taskIndex].assignedTos.some((assignedTo) => assignedTo.id === Task.assignedTos.id)) {
          tasks[taskIndex].assignedTos.push(Task.assignedTos);
        }
        if (hasTag && !tasks[taskIndex].Tags.some((tag) => tag.id === Task.Tags.id)) {
          tasks[taskIndex].Tags.push(Task.Tags);
        }
        if (hasSubtask && !tasks[taskIndex].Subtasks.some((subtask) => subtask.id === Task.Subtasks.id)) {
          tasks[taskIndex].Subtasks.push(Task.Subtasks);
        }
      } else {
        tasks.push({
          ...Task,
          assignedTos: !hasAsssignedTo ? [] : [Task.assignedTos],
          Tags: !hasTag ? [] : [Task.Tags],
          Subtasks: !hasSubtask ? [] : [Task.Subtasks],
          subtasksQuantity: toFloatOrZero(Task.subtasksQuantity),
          approvedSubtasksQuantity: toFloatOrZero(Task.approvedSubtasksQuantity),
          pendingSubtasksQuantity: toFloatOrZero(Task.pendingSubtasksQuantity),
          workTripsQuantity: toFloatOrZero(Task.workTripsQuantity),
          materialsPrice: toFloatOrZero(Task.materialsPrice),
          approvedMaterialsPrice: toFloatOrZero(Task.approvedMaterialsPrice),
          pendingMaterialsPrice: toFloatOrZero(Task.pendingMaterialsPrice),
        })
      }
    })
    if (!isAdmin) {
      tasks = tasks.map((Task) => {
        const Project = Task.Project;
        const Groups = Project.ProjectGroups;
        const GroupRight = Groups.ProjectGroupRight;
        Task.rights = convertSQLProjectGroupRightsToRights(GroupRight);
        return Task;
      })
    } else {
      tasks = tasks.map((Task) => {

        const Project = Task.Project;
        const Groups = Project.AdminProjectGroup;
        const GroupRight = Groups.ProjectGroupRight;
        Task.rights = convertSQLProjectGroupRightsToRights(GroupRight);
        return Task;
      })
    }

    databaseTime = databaseWatch.stop()
    const count = tasks.length > 0 ? (<any>tasks[0]).count : 0;

    return {
      tasks,
      count,
      totals: {
        approvedSubtasks: isNaN(parseFloat((<any>totals).approvedSubtasks)) ? 0 : parseFloat((<any>totals).approvedSubtasks),
        pendingSubtasks: isNaN(parseFloat((<any>totals).pendingSubtasks)) ? 0 : parseFloat((<any>totals).pendingSubtasks),
        approvedMaterials: isNaN(parseFloat((<any>totals).approvedMaterials)) ? 0 : parseFloat((<any>totals).approvedMaterials),
        pendingMaterials: isNaN(parseFloat((<any>totals).pendingMaterials)) ? 0 : parseFloat((<any>totals).pendingMaterials),
      },
      execTime: mainWatch.stop(),
      secondaryTimes: [
        { source: 'User check', time: checkUserTime },
        { source: 'Database', time: databaseTime },
      ]
    };
  },

  task: async (root, { id }, { req }) => {
    const User = await checkResolver(req);
    const isAdmin = isUserAdmin(User);
    const { groupRights } = await checkIfHasProjectRights(User, id, undefined, [], []);

    const SQL = generateTaskSQL(id, User.get('id'), User.get('CompanyId'), isAdmin);
    let responseTask = <any>await sequelize.query(SQL, {
      model: models.Task,
      type: QueryTypes.SELECT,
      nest: true,
      raw: true,
      mapToModel: true
    });

    if (responseTask.length === 0) {
      throw createDoesNoExistsError('Task', id);
    }

    let [
      responseTaskAttachments,
      responseAssignedTos,
      responseTags,
      responseCompany,
      reponseUsedTripPausal,
      reponseUsedSubtaskPausal,
      responseShortSubtasks,
      responseSubtasks,
      responseWorkTrips,
      responseMaterials,
      responseCustomItems,
    ] = await Promise.all([
      sequelize.query(generateTaskAttachmentsSQL(id), {
        model: models.TaskAttachment,
        type: QueryTypes.SELECT,
        nest: true,
        raw: true,
        mapToModel: true
      }),
      sequelize.query(generateAssignedTosSQL(id), {
        model: models.User,
        type: QueryTypes.SELECT,
        nest: true,
        raw: true,
        mapToModel: true
      }),
      sequelize.query(generateTagsSQL(id), {
        model: models.Tag,
        type: QueryTypes.SELECT,
        nest: true,
        raw: true,
        mapToModel: true
      }),
      sequelize.query(generateCompanySQL(id), {
        model: models.Company,
        type: QueryTypes.SELECT,
        nest: true,
        raw: true,
        mapToModel: true
      }),
      sequelize.query(generateCompanyUsedTripPausalSQL(responseTask[0].CompanyId), {
        type: QueryTypes.SELECT,
        nest: true,
        raw: true,
        mapToModel: false
      }),
      sequelize.query(generateCompanyUsedSubtaskPausalSQL(responseTask[0].CompanyId), {
        type: QueryTypes.SELECT,
        nest: true,
        raw: true,
        mapToModel: false
      }),
      sequelize.query(generateShortSubtasksSQL(id), {
        model: models.ShortSubtask,
        type: QueryTypes.SELECT,
        nest: true,
        raw: true,
        mapToModel: true
      }),
      sequelize.query(generateSubtasksSQL(id), {
        model: models.Subtask,
        type: QueryTypes.SELECT,
        nest: true,
        raw: true,
        mapToModel: true
      }),
      sequelize.query(generateWorkTripsSQL(id), {
        model: models.WorkTrip,
        type: QueryTypes.SELECT,
        nest: true,
        raw: true,
        mapToModel: true
      }),
      sequelize.query(generateMaterialsSQL(id), {
        model: models.Material,
        type: QueryTypes.SELECT,
        nest: true,
        raw: true,
        mapToModel: true
      }),
      sequelize.query(generateCustomItemsSQL(id), {
        model: models.CustomItem,
        type: QueryTypes.SELECT,
        nest: true,
        raw: true,
        mapToModel: true
      })
    ])

    let Company = <any>{ ...responseCompany[0] };

    Company.monthlyPausal = toFloatOrZero(Company.monthlyPausal);
    Company.taskWorkPausal = toFloatOrZero(Company.taskWorkPausal);
    Company.taskTripPausal = toFloatOrZero(Company.taskTripPausal);
    Company.usedSubtaskPausal = toFloatOrZero((<any[]>reponseUsedTripPausal)[0].total);
    Company.usedTripPausal = toFloatOrZero((<any[]>reponseUsedSubtaskPausal)[0].total);
    Company.Pricelist.Prices = responseCompany.map((Company) => {
      const Price = (<any>Company).Pricelist.Prices;
      return {
        ...Price,
        price: toFloatOrZero(Price.price),
        TaskType: Price.TaskType.id !== null ? Price.TaskType : null,
        TripType: Price.TripType.id !== null ? Price.TripType : null,
      }
    });

    return {
      ...responseTask[0],
      TaskAttachments: responseTaskAttachments,
      assignedTos: responseAssignedTos,
      Tags: responseTags,
      rights: groupRights,
      Company,
      ShortSubtasks: responseShortSubtasks,
      Subtasks: (<any[]>responseSubtasks).map((subtask) => ({
        ...subtask,
        quantity: toFloatOrZero(subtask.quantity),
        discount: toFloatOrZero(subtask.discount),
        SubtaskApprovedBy: subtask.SubtaskApprovedBy.id === null ? null : subtask.SubtaskApprovedBy,
        User: {
          ...subtask.User,
          Company: {
            ...subtask.User.Company,
            monthlyPausal: toFloatOrZero(subtask.User.Company.monthlyPausal),
            taskWorkPausal: toFloatOrZero(subtask.User.Company.taskWorkPausal),
            taskTripPausal: toFloatOrZero(subtask.User.Company.taskTripPausal),
          }
        }
      })),
      WorkTrips: (<any[]>responseWorkTrips).map((workTrip) => ({
        ...workTrip,
        quantity: toFloatOrZero(workTrip.quantity),
        discount: toFloatOrZero(workTrip.discount),
        TripApprovedBy: workTrip.TripApprovedBy.id === null ? null : workTrip.TripApprovedBy,
        User: {
          ...workTrip.User,
          Company: {
            ...workTrip.User.Company,
            monthlyPausal: toFloatOrZero(workTrip.User.Company.monthlyPausal),
            taskWorkPausal: toFloatOrZero(workTrip.User.Company.taskWorkPausal),
            taskTripPausal: toFloatOrZero(workTrip.User.Company.taskTripPausal),
          }
        }
      })),
      Materials: (<any[]>responseMaterials).map((material) => ({
        ...material,
        quantity: toFloatOrZero(material.quantity),
        margin: toFloatOrZero(material.margin),
        price: toFloatOrZero(material.price),
        MaterialApprovedBy: material.MaterialApprovedBy.id === null ? null : material.MaterialApprovedBy,
      })),
      CustomItems: (<any[]>responseCustomItems).map((item) => ({
        ...item,
        quantity: toFloatOrZero(item.quantity),
        margin: toFloatOrZero(item.margin),
        price: toFloatOrZero(item.price),
        ItemApprovedBy: item.ItemApprovedBy.id === null ? null : item.ItemApprovedBy,
      })),
    }
  },

  getNumberOfTasks: async (root, { projectId }, { req }) => {
    const User = await checkResolver(req);
    await checkIfHasProjectRights(User, undefined, projectId, ['projectRead']);
    return models.Task.count({ where: { ProjectId: projectId } })
  },
}

const mutations = {
  addTask: async (root, args, { req }) => {
    const User = await checkResolver(req);
    const project = args.project;
    const Project = await models.Project.findByPk(
      project,
      {
        include: [
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
              { model: models.Company, include: [models.User] },
              models.ProjectGroupRights
            ]
          },
        ]
      }
    );
    if (Project === undefined) {
      throw createDoesNoExistsError('project', project);
    }

    const ProjectStatuses = <StatusInstance[]>Project.get('projectStatuses');
    const ProjectAttributes = <ProjectAttributesInstance>Project.get('ProjectAttribute');
    const ProjectGroups = <ProjectGroupInstance[]>Project.get('ProjectGroups');
    //get users rights in the project
    let userGroupRights = <any>{};
    const UserProjectGroupRights = <ProjectGroupRightsInstance[]>ProjectGroups.filter((ProjectGroup) => (
      (<UserInstance[]>ProjectGroup.get('Users')).some((GroupUser) => GroupUser.get('id') === User.get('id')) ||
      (<CompanyInstance[]>ProjectGroup.get('Companies')).some((Company) => Company.get('id') === User.get('CompanyId'))
    )).map((ProjectGroup) => ProjectGroup.get('ProjectGroupRight'));

    if (isUserAdmin(User)) {
      userGroupRights = await mergeGroupRights(ProjectGroups.find((ProjectGroup) => ProjectGroup.get('admin') && ProjectGroup.get('def')).get('ProjectGroupRight'))
    } else if (UserProjectGroupRights.length === 0) {
      throw InsufficientProjectAccessError;
    } else {
      userGroupRights = await mergeGroupRights(UserProjectGroupRights[0], UserProjectGroupRights[1]);
    }

    args = checkAndApplyFixedAndRequiredOnAttributes(await ProjectAttributes.get('attributes'), userGroupRights.attributes, args, User, ProjectStatuses);

    let { assignedTo: assignedTos, company, milestone, requester, status, tags, taskType, repeat, comments, subtasks, workTrips, materials, customItems, shortSubtasks, ...params } = args;

    if (!userGroupRights.project.addTask) {
      addApolloError(
        'Project',
        CantCreateTasksError,
        User.get('id'),
        project
      );
      throw CantCreateTasksError;
    }

    //check all Ids if exists
    const pairsToCheck = [];
    company !== undefined && pairsToCheck.push({ id: company, model: models.Company });
    project !== undefined && pairsToCheck.push({ id: project, model: models.Project });
    (taskType !== undefined && taskType !== null) && pairsToCheck.push({ id: taskType, model: models.TaskType });
    (requester !== undefined && requester !== null) && pairsToCheck.push({ id: requester, model: models.User });
    await idsDoExistsCheck(assignedTos, models.User);
    await idsDoExistsCheck(tags, models.Tag);
    await multipleIdDoesExistsCheck(pairsToCheck);

    tags = tags.filter((tagID) => (<TagInstance[]>Project.get('tags')).some((Tag) => Tag.get('id') === tagID));
    if (!(<StatusInstance[]>Project.get('projectStatuses')).some((Status) => Status.get('id') === status)) {
      throw createDoesNoExistsError('Status', status);
    }
    //Rights and project def
    await checkIfCanEditTaskAttributes(User, project, args, ProjectStatuses, null, ['title', 'description']);

    const groupUsers = <number[]>(<ProjectGroupInstance[]>Project.get('ProjectGroups')).reduce((acc, ProjectGroup) => {
      return [
        ...acc,
        ...(<UserInstance[]>ProjectGroup.get('Users')).map((User) => User.get('id')),
        ...(<UserInstance[]>ProjectGroup.get('Companies')).reduce((acc, Company) => {
          return [...acc, ...(<UserInstance[]>Company.get('Users')).map((User) => User.get('id'))]
        }, []),
      ];
    }, []);

    const assignableUserIds = <number[]>(<ProjectGroupInstance[]>Project.get('ProjectGroups'))
      .filter((ProjectGroup) => {
        const GroupRights = <ProjectGroupRightsInstance>ProjectGroup.get('ProjectGroupRight');
        return GroupRights.get('assignedEdit');
      })
      .reduce((acc, ProjectGroup) => {
        return [
          ...acc,
          ...(<UserInstance[]>ProjectGroup.get('Users')).map((User) => User.get('id')),
          ...(<UserInstance[]>ProjectGroup.get('Companies')).reduce((acc, Company) => {
            return [...acc, ...(<UserInstance[]>Company.get('Users')).map((User) => User.get('id'))]
          }, []),
        ];
      }, []);

    assignedTos = assignedTos.filter((id) => assignableUserIds.includes(id));

    //requester must be in project or project is open
    if (
      requester &&
      Project.get('lockedRequester') &&
      !groupUsers.includes(requester) &&
      !(isUserAdmin(User) && requester === User.get('id'))
    ) {
      throw createUserNotPartOfProjectError('requester');
    }

    //milestone must be of project

    const dates = extractDatesFromObject(params, dateNames);
    //status corresponds to data - closedate, pendingDate
    //createdby
    params = {
      ...params,
      ...dates,
      TaskChanges: [{
        UserId: User.get('id'),
        TaskChangeMessages: [
          {
            type: 'task',
            originalValue: null,
            newValue: null,
            message: `Task was created by ${User.get('fullName')}`,
          },
          {
            type: 'task',
            originalValue: null,
            newValue: null,
            message: `Task was named "${args.title}" and was described as "${args.description}"`,
          },
        ]
      }],
      TaskMetadata: calculateMetadata(Project.get('autoApproved'), subtasks, workTrips, materials, customItems),
      createdById: User.get('id'),
      CompanyId: company,
      ProjectId: project,
      MilestoneId: null,
      requesterId: requester === undefined ? null : requester,
      TaskTypeId: taskType,
      StatusId: status,

      closeDate: null,
      pendingDate: null,
      pendingChangable: false,
      statusChange: moment().valueOf(),
      invoicedDate: null,
    }
    const Status = await models.Status.findByPk(status);
    switch (Status.get('action')) {
      case 'CloseDate': {
        if (args.closeDate === undefined) {
          params.closeDate = moment().valueOf();
        } else {
          params.closeDate = parseInt(args.closeDate);
        }
        break;
      }
      case 'CloseInvalid': {
        if (args.closeDate === undefined) {
          params.closeDate = moment().valueOf();
        } else {
          params.closeDate = parseInt(args.closeDate);
        }
        break;
      }
      case 'PendingDate': {
        if (dates.pendingDate === undefined || args.pendingChangable === undefined) {
          throw StatusPendingAttributesMissing;
        } else {
          params.pendingDate = dates.pendingDate;
          params.pendingChangable = args.pendingChangable;
        }
        break;
      }
      default:
        break;
    }
    //comments processing
    if (comments) {
      comments.forEach((comment) => {
        if (comment.internal && !userGroupRights.internal) {
          throw InternalMessagesNotAllowed;
        }
      })
      params = {
        ...params,
        Comments: comments.map((comment) => ({ ...comment, isParent: true, UserId: User.get('id') }))
      }
    }
    //Subtask
    if (subtasks) {
      if (subtasks.some((subtask) => !assignedTos.includes(subtask.assignedTo))) {
        throw AssignedToUserNotSolvingTheTask;
      }
      //await idsDoExistsCheck(subtasks.map((subtask) => subtask.type), models.TaskType);
      params = {
        ...params,
        Subtasks: subtasks.map((subtask) => {
          let baseSubtask = {
            ...subtask,
            UserId: subtask.assignedTo,
            //TaskTypeId: subtask.type,
          };
          if (subtask.approved) {
            baseSubtask = {
              ...baseSubtask,
              SubtaskApprovedById: User.get('id'),
            }
          }
          if (subtask.scheduled) {
            baseSubtask = {
              ...baseSubtask,
              ScheduledWork: extractDatesFromObject(subtask.scheduled, scheduledDateNames),
            }
          }
          return baseSubtask;
        })
      }
    }
    //WorkTrip
    if (workTrips) {
      if (workTrips.some((workTrip) => !assignedTos.includes(workTrip.assignedTo))) {
        throw AssignedToUserNotSolvingTheTask;
      }
      await idsDoExistsCheck(workTrips.map((workTrip) => workTrip.type), models.TripType);
      params = {
        ...params,
        WorkTrips: workTrips.map((workTrip) => {
          let baseTrip = { ...workTrip, UserId: workTrip.assignedTo, TripTypeId: workTrip.type };
          if (workTrip.approved) {
            baseTrip = {
              ...baseTrip,
              TripApprovedById: User.get('id'),
            }
          }
          if (workTrip.scheduled) {
            baseTrip = {
              ...baseTrip,
              ScheduledWork: extractDatesFromObject(workTrip.scheduled, scheduledDateNames),
            }
          }
          return baseTrip;
        }),
      }
    }
    //Material
    if (materials) {
      params = {
        ...params,
        Materials: materials.map((material) => material.approved ? { ...material, MaterialApprovedById: User.get('id') } : material)
      }
    }
    //CustomItem
    if (customItems) {
      params = {
        ...params,
        CustomItems: customItems.map((customItem) => customItem.approved ? { ...customItem, ItemApprovedById: User.get('id') } : customItem)
      }
    }
    //Short Subtasks
    if (shortSubtasks) {
      params = {
        ...params,
        ShortSubtasks: shortSubtasks
      }
    }
    //repeat processing
    if (repeat !== null && repeat !== undefined) {
      const Repeat = <RepeatInstance>await models.Repeat.create(
        {
          repeatEvery: parseInt(repeat.repeatEvery),
          repeatInterval: repeat.repeatInterval,
          startsAt: parseInt(repeat.startsAt),
          active: repeat.active,
          RepeatTemplate: params,
        },
        {
          include: [{
            model: models.RepeatTemplate,
            include: [
              models.ShortSubtask,
              { model: models.Subtask, include: [models.ScheduledWork] },
              { model: models.WorkTrip, include: [models.ScheduledWork] },
              models.Material,
              models.CustomItem
            ]
          }]
        }
      );
      const RepeatTemplate = <RepeatTemplateInstance>Repeat.get('RepeatTemplate');
      await Promise.all([
        RepeatTemplate.setAssignedTos(assignedTos),
        RepeatTemplate.setTags(tags),
      ])
      repeatEvent.emit('add', Repeat);
      params = {
        ...params,
        RepeatId: Repeat.get('id')
      }
    }

    const NewTask = <TaskInstance>await models.Task.create(params, {
      include: [
        models.Repeat,
        models.Comment,
        models.ShortSubtask,
        { model: models.Subtask, include: [models.ScheduledWork] },
        { model: models.WorkTrip, include: [models.ScheduledWork] },
        models.Material,
        models.CustomItem,
        {
          model: models.TaskMetadata,
          as: 'TaskMetadata'
        },
        { model: models.TaskChange, include: [{ model: models.TaskChangeMessage }] }
      ]
    });
    await Promise.all([
      NewTask.setAssignedTos(assignedTos),
      NewTask.setTags(tags),
    ])
    sendTaskNotificationsToUsers(User, NewTask, [`Task was created by ${User.get('fullName')}`]);
    pubsub.publish(TASK_CHANGE, { tasksSubscription: true });
    pubsub.publish(TASK_ADD, { taskAddSubscription: User.get('id') });
    NewTask.rights = userGroupRights;
    return NewTask;
  },

  updateTask: async (root, args, { req }) => {
    const User = await checkResolver(req);
    const Task = <TaskInstance>await models.Task.findByPk(
      args.id,
      {
        include: [
          { model: models.User, as: 'assignedTos' },
          models.Tag,
          models.Status,
          models.Subtask,
          models.WorkTrip,
          models.Material,
          models.CustomItem,
          models.TaskType,
          models.Company,
          models.Milestone,
          {
            model: models.TaskMetadata,
            as: 'TaskMetadata'
          },
          { model: models.User, as: 'requester' },
          models.Tag,
          {
            model: models.Project,
            include: [
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
                include: [models.User, { model: models.Company, include: [models.User] }, models.ProjectGroupRights]
              },
            ]
          }
        ]
      }
    );
    if (Task === undefined) {
      throw createDoesNoExistsError('Task', args.id);
    }

    let taskChangeMessages = [];
    //Figure out project and if can change project
    let groupRights = null;
    const requiredGroupRights = args.project !== undefined && args.project !== Task.get('ProjectId') ? ['taskProjectWrite'] : [];
    const TestData1 = await checkIfHasProjectRights(User, undefined, Task.get('ProjectId'), requiredGroupRights, []);
    groupRights = <any>TestData1.groupRights;
    if (args.project !== undefined && args.project !== Task.get('ProjectId')) {
      const TestData2 = await checkIfHasProjectRights(User, undefined, args.project, ['taskProjectWrite'], []);
      groupRights = <any>TestData2.groupRights;
    }

    const project = args.project ? args.project : Task.get('ProjectId');
    let Project = <ProjectInstance>Task.get('Project');
    let OriginalProject = <ProjectInstance>Task.get('Project');
    if (project && project !== Project.get('id')) {
      Project = <ProjectInstance>await models.Project.findByPk(
        project,
        {
          include: [
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
              include: [models.User, { model: models.Company, include: [models.User] }, models.ProjectGroupRights]
            },
          ],
        }
      );
      if (Project === null) {
        throw createDoesNoExistsError('Project', project)
      }
    }

    const ProjectStatuses = <StatusInstance[]>Project.get('projectStatuses');
    const ProjectAttributes = <ProjectAttributesInstance>Project.get('ProjectAttribute');

    args = checkAndApplyFixedAndRequiredOnAttributes(await ProjectAttributes.get('attributes'), groupRights.attributes, args, User, ProjectStatuses, false, Task);

    let { id, assignedTo: assignedTos, company, milestone, requester, status, tags, taskType, ...params } = args;
    const dates = extractDatesFromObject(params, dateNames);
    params = { ...params, ...dates };

    //can you even open this task
    if (!canViewTask(Task, User, groupRights.project, true)) {
      throw CantViewTaskError;
    }

    //if you send something it cant be null in this attributes, if undefined its ok
    if (
      company === null ||
      project === null ||
      status === null
    ) {
      throw TaskNotNullAttributesPresent;
    }
    //check all Ids if exists
    const pairsToCheck = [];
    (company !== undefined) && pairsToCheck.push({ id: company, model: models.Company });
    (project !== undefined) && pairsToCheck.push({ id: project, model: models.Project });
    (status !== undefined) && pairsToCheck.push({ id: status, model: models.Status });
    (taskType !== undefined && taskType !== null) && pairsToCheck.push({ id: taskType, model: models.TaskType });
    (requester !== undefined && requester !== null) && pairsToCheck.push({ id: requester, model: models.User });
    await multipleIdDoesExistsCheck(pairsToCheck);

    //Rights and project def
    await checkIfCanEditTaskAttributes(User, Project.get('id'), args, ProjectStatuses, args.project ? null : Task);

    if (tags) {
      tags = tags.filter((tagID) => (<TagInstance[]>Project.get('tags')).some((Tag) => Tag.get('id') === tagID));
    }

    const groupUsers = <number[]>(<ProjectGroupInstance[]>Project.get('ProjectGroups')).reduce((acc, ProjectGroup) => {
      return [
        ...acc,
        ...(<UserInstance[]>ProjectGroup.get('Users')).map((User) => User.get('id')),
        ...(<UserInstance[]>ProjectGroup.get('Companies')).reduce((acc, Company) => {
          return [...acc, ...(<UserInstance[]>Company.get('Users')).map((User) => User.get('id'))]
        }, []),
      ];
    }, []);

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

    let promises = [];

    await sequelize.transaction(async (transaction) => {
      if (project && project !== Task.get('ProjectId')) {
        taskChangeMessages.push(await createChangeMessage('Project', models.Project, 'Project', project, Task.get('Project')));
        promises.push(Task.setProject(project, { transaction }));
        //here was milestone with condition if exists

        //Update metadata
        if (Project.get('autoApproved') !== OriginalProject.get('autoApproved')) {
          const Metadata = <TaskMetadataInstance>Task.get('TaskMetadata');
          if (Project.get('autoApproved')) {
            Metadata.update({
              subtasksApproved: Metadata.get('subtasksApproved') + Metadata.get('subtasksPending'),
              subtasksPending: 0,
              tripsApproved: Metadata.get('tripsApproved') + Metadata.get('tripsPending'),
              tripsPending: 0,
              materialsApproved: Metadata.get('materialsApproved') + Metadata.get('materialsPending'),
              materialsPending: 0,
              itemsApproved: Metadata.get('itemsApproved') + Metadata.get('itemsPending'),
              itemsPending: 0,
            }, { transaction })
          } else {
            Metadata.update(
              {
                subtasksApproved: (<SubtaskInstance[]>Task.get('Subtasks')).reduce((acc, cur) => {
                  if (cur.approved) {
                    return acc + cur.quantity;
                  }
                  return acc;
                }, 0),
                subtasksPending: (<SubtaskInstance[]>Task.get('Subtasks')).reduce((acc, cur) => {
                  if (cur.approved) {
                    return acc;
                  }
                  return acc + cur.quantity;
                }, 0),
                tripsApproved: (<WorkTripInstance[]>Task.get('WorkTrips')).reduce((acc, cur) => {
                  if (cur.approved) {
                    return acc + cur.quantity;
                  }
                  return acc;
                }, 0),
                tripsPending: (<WorkTripInstance[]>Task.get('WorkTrips')).reduce((acc, cur) => {
                  if (cur.approved) {
                    return acc;
                  }
                  return acc + cur.quantity;
                }, 0),
                materialsApproved: (<MaterialInstance[]>Task.get('Materials')).reduce((acc, cur) => {
                  if (cur.approved) {
                    return acc + cur.quantity;
                  }
                  return acc;
                }, 0),
                materialsPending: (<MaterialInstance[]>Task.get('Materials')).reduce((acc, cur) => {
                  if (cur.approved) {
                    return acc;
                  }
                  return acc + cur.quantity;
                }, 0),
                itemsApproved: (<CustomItemInstance[]>Task.get('CustomItems')).reduce((acc, cur) => {
                  if (cur.approved) {
                    return acc + cur.quantity;
                  }
                  return acc;
                }, 0),
                itemsPending: (<CustomItemInstance[]>Task.get('CustomItems')).reduce((acc, cur) => {
                  if (cur.approved) {
                    return acc;
                  }
                  return acc + cur.quantity;
                }, 0),
              },
              { transaction }
            )
          }
        }
      }
      if (assignedTos) {
        await idsDoExistsCheck(assignedTos, models.User);

        //assignedTo must be in project group
        assignedTos = assignedTos.filter((id) => assignableUserIds.includes(id));
        taskChangeMessages.push(await createChangeMessage('AssignedTo', models.User, 'Assigned to users', assignedTos, Task.get('assignedTos'), 'fullName'));

        promises.push(Task.setAssignedTos(assignedTos, { transaction }))
      }

      if (tags) {
        await idsDoExistsCheck(tags, models.Tag);
        taskChangeMessages.push(await createChangeMessage('Tags', models.Tag, 'Tags', tags, Task.get('Tags')));
        promises.push(Task.setTags(tags, { transaction }))
      }
      if (requester) {
        if (requester !== Task.get('requesterId') && Project.get('lockedRequester') && !groupUsers.includes(requester)) {
          throw createUserNotPartOfProjectError('requester');
        }
        taskChangeMessages.push(await createChangeMessage('Requester', models.User, 'Requester', requester, Task.get('requester'), 'fullName'));
        promises.push(Task.setRequester(requester, { transaction }))
      }

      //here was milestone with condition if and of project
      if (taskType !== undefined) {
        taskChangeMessages.push(await createChangeMessage('TaskType', models.TaskType, 'Task type', taskType, Task.get('TaskType')));
        promises.push(Task.setTaskType(taskType, { transaction }))
      }
      if (company) {
        taskChangeMessages.push(await createChangeMessage('Company', models.Company, 'Company', company, Task.get('Company')));
        promises.push(Task.setCompany(company, { transaction }))
      }

      //status corresponds to data - closedate, pendingDate
      //createdby
      if (status) {
        params = {
          ...params,
          closeDate: null,
          pendingDate: null,
          pendingChangable: false,
          statusChange: Task.get('statusChange'),
          invoicedDate: Task.get('invoicedDate'),
        }

        const TaskStatus = <StatusInstance>Task.get('Status');
        const Status = await models.Status.findByPk(status);
        if (status !== TaskStatus.get('id')) {
          taskChangeMessages.push(await createChangeMessage('Status', models.Status, 'Status', status, Task.get('Status')));
          promises.push(Task.setStatus(status, { transaction }))
        }
        switch (Status.get('action')) {
          case 'CloseDate': {
            if (TaskStatus.get('action') === 'CloseDate' && !args.closeDate) {
              params.closeDate = Task.get('closeDate');
              break;
            }
            if (args.closeDate === undefined) {
              params.closeDate = moment().valueOf();
            } else {
              params.closeDate = parseInt(args.closeDate);
            }
            taskChangeMessages.push(await createChangeMessage('CloseDate', null, 'Close date', params.closeDate, Task.get('closeDate')));
            params.statusChange = moment().valueOf();
            break;
          }
          case 'CloseInvalid': {
            if (TaskStatus.get('action') === 'CloseInvalid' && !args.closeDate) {
              params.closeDate = Task.get('closeDate');
              break;
            }
            if (args.closeDate === undefined) {
              params.closeDate = moment().valueOf();
            } else {
              params.closeDate = parseInt(args.closeDate);
            }
            taskChangeMessages.push(await createChangeMessage('CloseDate', null, 'Close date', params.closeDate, Task.get('closeDate')));
            params.statusChange = moment().valueOf();
            break;
          }
          case 'PendingDate': {
            if (TaskStatus.get('action') === 'PendingDate' && !dates.pendingDate) {
              params.pendingDate = Task.get('pendingDate');
              params.pendingChangable = Task.get('pendingChangable');
              break;
            }
            if (dates.pendingDate === undefined || args.pendingChangable === undefined) {
              throw StatusPendingAttributesMissing;
            } else {
              params.pendingDate = dates.pendingDate;
              params.pendingChangable = args.pendingChangable;
            }
            taskChangeMessages.push(await createChangeMessage('PendingDate', null, 'Pending date', params.pendingDate, Task.get('pendingDate')));
            taskChangeMessages.push(await createChangeMessage('PendingChangable', null, 'Pending changable', params.pendingChangable, Task.get('pendingChangable')));
            params.statusChange = moment().valueOf()
            break;
          }
          default:
            break;
        }

        sendTaskNotificationsToUsers(User, Task, [`Status was changed from ${TaskStatus.get('title')} to ${Status.get('title')} at ${moment().format('HH:mm DD.MM.YYYY')}`]);
      }

      taskChangeMessages = [
        ...taskChangeMessages,
        ...(await createTaskAttributesChangeMessages(params, Task))
      ]
      promises.push(
        Task.createTaskChange({
          UserId: User.get('id'),
          TaskChangeMessages: taskChangeMessages,
        }, { transaction, include: [{ model: models.TaskChangeMessage }] })
      );
      promises.push(Task.update(params, { transaction }));
      await Promise.all(promises);
    })

    let NewTask = <TaskInstance>await models.Task.findByPk(id, {
      include: [
        { model: models.User, as: 'assignedTos' },
        models.Company,
        { model: models.User, as: 'createdBy' },
        models.Milestone,
        models.Project,
        { model: models.User, as: 'requester' },
        models.Status,
        models.Tag,
        models.TaskType,
      ]
    })
    NewTask.rights = groupRights;
    sendTaskNotificationsToUsers(User, NewTask, taskChangeMessages.map((taskChange) => taskChange.message));
    pubsub.publish(TASK_HISTORY_CHANGE, { taskHistorySubscription: NewTask.get('id') });
    pubsub.publish(TASK_CHANGE, { tasksSubscription: true });
    return NewTask;
  },

  deleteTask: async (root, { id }, { req }) => {
    const User = await checkResolver(req);
    const Task = <TaskInstance>await models.Task.findByPk(
      id,
      {
        include: [
          { model: models.User, as: 'assignedTos', attributes: ['id'] },
          models.Project,
        ]
      }
    );
    const Project = <ProjectInstance>Task.get('Project');
    //must right to delete project
    const { groupRights } = await checkIfHasProjectRights(User, undefined, Task.get('ProjectId'), ['deleteTask']);
    //can you even open this task
    if (!canViewTask(Task, User, groupRights.project, true)) {
      throw CantViewTaskError;
    }
    await sendTaskNotificationsToUsers(User, Task, [`Task named "${Task.get('title')}" with id ${Task.get('id')} was deleted.`], true);
    await Task.destroy();
    pubsub.publish(TASK_CHANGE, { tasksSubscription: true });
    pubsub.publish(TASK_DELETE, { taskDeleteSubscription: id });
    return Task;
  }
}

const attributes = {
  Task: {
    async rights(task) {
      if (!task.rights) {
        return null;
      }
      return task.rights.project;
    },
    async attributeRights(task) {
      if (!task.rights) {
        return null;
      }
      return task.rights.attributes;
    },
    async assignedTo(task) {
      if (!task.rights || (
        !task.rights.attributes.assigned.view &&
        !task.rights.project.taskWorksRead &&
        !task.rights.project.taskWorksAdvancedRead
      )) {
        return [];
      }
      return getModelAttribute(task, 'assignedTos');
    },
    async company(task) {
      if (!task.rights || !task.rights.attributes.company.view) {
        return null;
      }
      return getModelAttribute(task, 'Company');
    },
    async createdBy(task) {
      return getModelAttribute(task, 'createdBy');
    },
    async milestone(task) {
      return getModelAttribute(task, 'Milestone');
    },
    async project(task) {
      return getModelAttribute(task, 'Project');
    },
    async requester(task) {
      if (!task.rights || !task.rights.attributes.requester.view) {
        return null;
      }
      return getModelAttribute(task, 'requester');
    },
    async status(task) {
      if (!task.rights || !task.rights.attributes.status.view) {
        return null;
      }
      return getModelAttribute(task, 'Status');
    },
    async tags(task) {
      if (!task.rights || !task.rights.attributes.tags.view) {
        return [];
      }
      return getModelAttribute(task, 'Tags');
    },
    async taskType(task) {
      if (!task.rights || (
        !task.rights.attributes.taskType.view &&
        !task.rights.project.taskWorksRead &&
        !task.rights.project.taskWorksAdvancedRead
      )) {
        return null;
      }
      return getModelAttribute(task, 'TaskType');
    },
    async repeat(task) {
      if (!task.rights || !task.rights.attributes.repeat.view) {
        return null;
      }
      return getModelAttribute(task, 'Repeat');
    },
    async repeatTime(task) {
      if (!task.rights || !task.rights.attributes.repeat.view) {
        return null;
      }
      return getModelAttribute(task, 'RepeatTime');
    },
    async metadata(task) {
      return getModelAttribute(task, 'TaskMetadata');
    },

    async comments(task, body, { req, userID }) {
      if (!task.rights || !task.rights.project.viewComments) {
        return [];
      }
      const [
        SourceUser,
        Comments,

      ] = await Promise.all([
        checkResolver(req),
        getModelAttribute(task, 'Comments', 'getComments', { order: [['createdAt', 'DESC']] })
      ])
      return Comments.filter((Comment) => Comment.get('isParent') && (!Comment.get('internal') || task.rights.project.internal))
    },

    async shortSubtasks(task) {
      if (!task.rights || !task.rights.project.taskSubtasksRead) {
        return [];
      }
      return getModelAttribute(task, 'ShortSubtasks');
    },
    async subtasks(task) {
      if (!task.rights || (!task.rights.project.taskWorksRead && !task.rights.project.taskWorksAdvancedRead)) {
        return [];
      }
      return getModelAttribute(task, 'Subtasks');
    },
    async workTrips(task) {
      if (!task.rights || (!task.rights.project.taskWorksRead && !task.rights.project.taskWorksAdvancedRead)) {
        return [];
      }
      return getModelAttribute(task, 'WorkTrips');
    },
    async materials(task) {
      if (!task.rights || !task.rights.project.taskMaterialsRead) {
        return [];
      }
      return getModelAttribute(task, 'Materials');
    },
    async customItems(task) {
      if (!task.rights || !task.rights.project.taskMaterialsRead) {
        return [];
      }
      return getModelAttribute(task, 'CustomItems');
    },
    async taskChanges(task) {
      if (!task.rights || !task.rights.project.history) {
        return [];
      }
      return getModelAttribute(task, 'TaskChanges', 'getTaskChanges', { order: [['createdAt', 'DESC']] });
    },
    async taskAttachments(task) {
      if (!task.rights || !task.rights.project.taskAttachmentsRead) {
        return [];
      }
      return getModelAttribute(task, 'TaskAttachments');
    },
  }
};

const subscriptions = {
  tasksSubscription: {
    subscribe: withFilter(
      () => pubsub.asyncIterator(TASK_CHANGE),
      async (data, args, { userID }) => {
        return true;
      }
    ),
  },
  taskAddSubscription: {
    subscribe: withFilter(
      () => pubsub.asyncIterator(TASK_ADD),
      async ({ taskAddSubscription }, args, { userID }) => {
        return taskAddSubscription === userID;
      }
    ),
  },
  taskDeleteSubscription: {
    subscribe: withFilter(
      () => pubsub.asyncIterator(TASK_DELETE),
      async ({ taskDeleteSubscription }, { taskId }, { userID }) => {
        return taskDeleteSubscription === taskId;
      }
    ),
  },
}

export default {
  attributes,
  mutations,
  queries,
  subscriptions
}
