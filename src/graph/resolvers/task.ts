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
  CantViewTaskError,
  CantEditInvoicedTaskError,
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
  createTaskAttributesNotifications,
  toFloatOrZero,
  sendTaskNotificationsToUsers,
  isUserAdmin,
  timestampToString,
} from '@/helperFunctions';
import {
  canViewTask,
  checkIfHasProjectRights,
  mergeGroupRights,
  convertSQLProjectGroupRightsToRights,
  processProjectDataAdd,
  processProjectDataEdit,
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
  generateCompanyUsedTripPausalSQL,
  generateCompanyUsedSubtaskPausalSQL,
  generateWorkCountsSQL,
  generateInvoicedTaskSQL,
  addStatusFilter,
  addInvoicedFilter,
  getTasksWantedData,
} from '@/graph/addons/task';
import { repeatEvent } from '@/services/repeatTasks';
import { pubsub } from './index';
const { withFilter } = require('apollo-server-express');
import {
  TASK_CHANGE,
  TASK_HISTORY_CHANGE,
  TASK_DELETE,
  TASK_ADD,
  REPEAT_CHANGE,
  TASK_DND_CHANGE,
} from '@/configs/subscriptions';
import checkResolver from './checkResolver';
import moment from 'moment';
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
  tasks: async (root, { projectId, milestoneId, filter, sort, milestoneSort, search, stringFilter, limit, page, statuses, invoiced }, { req, userID }, info) => {
    const wantedData = getTasksWantedData(filter, sort, milestoneSort, stringFilter, info);
    //INFO: to continue optimalisation, first rewrite WHERE to use IDs instead of objectID
    //INFO: then rewrite get data according to wantedData

    const mainOrderBy = sort ? transformSortToQueryString(sort, true, milestoneSort) : createBasicSort('Task', milestoneSort);
    const secondaryOrderBy = sort ? transformSortToQueryString(sort, false, milestoneSort) : createBasicSort('TaskData', milestoneSort);

    //const mainWatch = new Stopwatch(true);
    //const checkUserWatch = new Stopwatch(true);
    const User = await checkResolver(req);
    const isAdmin = isUserAdmin(User);
    const checkUserTime = 0; //checkUserWatch.stop();
    let taskWhere = [];

    //direct status filter beats Filter, currently Filter statuses are disabled
    taskWhere = addStatusFilter(taskWhere, statuses, filter, isAdmin);
    taskWhere = addInvoicedFilter(taskWhere, invoiced);

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

    const responseTasks = await sequelize.query(SQL, {
      model: models.Task,
      type: QueryTypes.SELECT,
      nest: true,
      raw: true,
      mapToModel: true
    });

    let databaseTime = 0;
    //const databaseWatch = new Stopwatch(true);
    let tasks = [];

    responseTasks.forEach((Task: any) => {
      const invoiced = Task.invoiced;
      const taskIndex = tasks.findIndex((task) => Task.id === task.id);
      if (taskIndex !== -1) {
        if (invoiced) {
          const InvoicedTask = Task.InvoicedTask;
          if (Task.assignedTos.id !== null && tasks[taskIndex].assignedTos.every((assignedTo) => assignedTo.id !== InvoicedTask.assignedTos.id)) {
            tasks[taskIndex].assignedTos.push(InvoicedTask.assignedTos);
          }
          if (Task.Tags.id !== null && tasks[taskIndex].Tags.every((Tag) => Tag.id !== InvoicedTask.Tags.id)) {
            tasks[taskIndex].Tags.push(InvoicedTask.Tags);
          }
        } else {
          if (Task.assignedTos.id !== null && tasks[taskIndex].assignedTos.every((assignedTo) => assignedTo.id !== Task.assignedTos.id)) {
            tasks[taskIndex].assignedTos.push(Task.assignedTos);
          }
          if (Task.Tags.id !== null && tasks[taskIndex].Tags.every((Tag) => Tag.id !== Task.Tags.id)) {
            tasks[taskIndex].Tags.push(Task.Tags);
          }
        }
      } else {
        if (invoiced) {
          const InvoicedTask = Task.InvoicedTask;
          tasks.push({
            ...Task,
            assignedTos: InvoicedTask.assignedTos.id === null ? [] : [InvoicedTask.assignedTos],
            Tags: InvoicedTask.Tags.id === null ? [] : [InvoicedTask.Tags],
            requester: InvoicedTask.requester.id === null ? null : InvoicedTask.requester,
            TaskType: { ...Task.TaskType, id: Task.InvoicedTask.taskTypeId, title: Task.InvoicedTask.taskTypeTitle },
            Repeat: Task.Repeat.id === null ? null : Task.Repeat,
            Status: {
              ...Task.Status,
              id: InvoicedTask.statusId,
              title: InvoicedTask.statusTitle,
              color: InvoicedTask.statusColor,
              action: InvoicedTask.statusAction,
            },
            subtasksQuantity: toFloatOrZero(Task.subtasksQuantity),
            approvedSubtasksQuantity: toFloatOrZero(Task.approvedSubtasksQuantity),
            pendingSubtasksQuantity: toFloatOrZero(Task.pendingSubtasksQuantity),
            workTripsQuantity: toFloatOrZero(Task.workTripsQuantity),
            materialsPrice: toFloatOrZero(Task.materialsPrice),
            approvedMaterialsPrice: toFloatOrZero(Task.approvedMaterialsPrice),
            pendingMaterialsPrice: toFloatOrZero(Task.pendingMaterialsPrice),
          })
        } else {
          tasks.push({
            ...Task,
            assignedTos: Task.assignedTos.id === null ? [] : [Task.assignedTos],
            Tags: Task.Tags.id === null ? [] : [Task.Tags],
            Repeat: Task.Repeat.id === null ? null : Task.Repeat,
            subtasksQuantity: toFloatOrZero(Task.subtasksQuantity),
            approvedSubtasksQuantity: toFloatOrZero(Task.approvedSubtasksQuantity),
            pendingSubtasksQuantity: toFloatOrZero(Task.pendingSubtasksQuantity),
            workTripsQuantity: toFloatOrZero(Task.workTripsQuantity),
            materialsPrice: toFloatOrZero(Task.materialsPrice),
            approvedMaterialsPrice: toFloatOrZero(Task.approvedMaterialsPrice),
            pendingMaterialsPrice: toFloatOrZero(Task.pendingMaterialsPrice),
          })
        }
      }
    });
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

    databaseTime = 0;// databaseWatch.stop()
    const count = tasks.length > 0 ? (<any>tasks[0]).count : 0;

    return {
      tasks,
      count,
      /*
      totals: {
        approvedSubtasks: isNaN(parseFloat((<any>totals).approvedSubtasks)) ? 0 : parseFloat((<any>totals).approvedSubtasks),
        pendingSubtasks: isNaN(parseFloat((<any>totals).pendingSubtasks)) ? 0 : parseFloat((<any>totals).pendingSubtasks),
        approvedMaterials: isNaN(parseFloat((<any>totals).approvedMaterials)) ? 0 : parseFloat((<any>totals).approvedMaterials),
        pendingMaterials: isNaN(parseFloat((<any>totals).pendingMaterials)) ? 0 : parseFloat((<any>totals).pendingMaterials),
      },
      */
      execTime: 0,// mainWatch.stop(),
      secondaryTimes: [
        { source: 'User check', time: checkUserTime },
        { source: 'Database', time: databaseTime },
      ]
    };
  },

  task: async (root, { id, fromInvoice }, { req }) => {
    const User = await checkResolver(req, fromInvoice ? ['vykazy'] : []);
    const isAdmin = isUserAdmin(User);
    const { groupRights } = await checkIfHasProjectRights(User, id, undefined, [], [], fromInvoice === true);

    const SQL = generateTaskSQL(id, User.get('id'), User.get('CompanyId'), isAdmin || fromInvoice);
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
      responseInvoicedTask,
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
      sequelize.query(generateInvoicedTaskSQL(id), {
        type: QueryTypes.SELECT,
        nest: true,
        raw: true,
        mapToModel: true
      }),
    ])

    let task = { ...responseTask[0] };
    const invoiced = task.invoiced;

    //if company of invoice
    let Company = <any>{};
    if (invoiced) {
      const invoicedTask = <any>responseInvoicedTask[0];

      Company = {
        id: invoicedTask.companyId,
        title: invoicedTask.companyTitle,
        dph: invoicedTask.dph,
        monthly: false,
        monthlyPausal: 0,
        taskWorkPausal: 0,
        taskTripPausal: 0,
        usedSubtaskPausal: 0,
        usedTripPausal: 0,
        Pricelist: {
          id: -1,
          title: 'Invoiced pricelist',
          materialMargin: 0,
          afterHours: invoicedTask.overtimePercentage,
          Prices: []
        }
      };
    } else {
      Company = <any>{ ...responseCompany[0] };
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
    }

    let invoicedAssignedTos = [];
    let invoicedTags = [];
    //rewrite by fixed data
    if (invoiced) {
      task.Status = {
        id: (<any[]>responseInvoicedTask)[0].statusId,
        title: (<any[]>responseInvoicedTask)[0].statusTitle,
        color: (<any[]>responseInvoicedTask)[0].statusColor,
        action: (<any[]>responseInvoicedTask)[0].statusAction,
      }
      task.TaskType = {
        id: (<any[]>responseInvoicedTask)[0].taskTypeId,
        title: (<any[]>responseInvoicedTask)[0].taskTypeTitle,
      }
      responseInvoicedTask.forEach((InvoicedTaskFragment, index) => {
        const {
          assignedTos,
          Tags,
        } = <any>InvoicedTaskFragment;
        if (assignedTos.id !== null && !invoicedAssignedTos.some((assignedTo) => assignedTo.id === assignedTos.userId)) {
          invoicedAssignedTos.push({
            ...assignedTos,
            id: assignedTos.userId,
          });
        }
        if (Tags.id !== null && !invoicedTags.some((tag) => tag.id === Tags.tagId)) {
          invoicedTags.push({
            ...Tags,
            id: Tags.tagId,
          });
        }
      })
    }

    //rewrite works and trips by their fixed data
    return {
      ...task,
      TaskAttachments: responseTaskAttachments,
      assignedTos: invoiced ? invoicedAssignedTos : responseAssignedTos,
      Tags: task.invoiced ? invoicedTags : responseTags,
      rights: groupRights,
      Company,
      ShortSubtasks: responseShortSubtasks,
      Subtasks: (<any[]>responseSubtasks).map((subtask) => ({
        ...subtask,
        quantity: toFloatOrZero(subtask.quantity),
        discount: toFloatOrZero(subtask.discount),
        SubtaskApprovedBy: subtask.SubtaskApprovedBy.id === null ? null : subtask.SubtaskApprovedBy,
        User: {
          ...(invoiced ? { ...subtask.InvoicedTaskUser, id: subtask.InvoicedTaskUser.userId } : subtask.User),
          Company: {
            ...(invoiced ? Company : subtask.User.Company),
            monthlyPausal: invoiced ? 0 : toFloatOrZero(subtask.User.Company.monthlyPausal),
            taskWorkPausal: invoiced ? 0 : toFloatOrZero(subtask.User.Company.taskWorkPausal),
            taskTripPausal: invoiced ? 0 : toFloatOrZero(subtask.User.Company.taskTripPausal),
          }
        },
        TaskType: task.TaskType,
        price: subtask.invoicedPrice,
      })),
      WorkTrips: (<any[]>responseWorkTrips).map((workTrip) => ({
        ...workTrip,
        quantity: toFloatOrZero(workTrip.quantity),
        discount: toFloatOrZero(workTrip.discount),
        TripApprovedBy: workTrip.TripApprovedBy.id === null ? null : workTrip.TripApprovedBy,
        User: {
          ...(invoiced ? { ...workTrip.InvoicedTaskUser, id: workTrip.InvoicedTaskUser.userId } : workTrip.User),
          Company: {
            ...(invoiced ? Company : workTrip.User.Company),
            monthlyPausal: invoiced ? 0 : toFloatOrZero(workTrip.User.Company.monthlyPausal),
            taskWorkPausal: invoiced ? 0 : toFloatOrZero(workTrip.User.Company.taskWorkPausal),
            taskTripPausal: invoiced ? 0 : toFloatOrZero(workTrip.User.Company.taskTripPausal),
          },
          TripType: invoiced ? { id: workTrip.invoicedTypeId, title: workTrip.invoicedTypeTitle } : workTrip.TripType,
        },
        price: workTrip.invoicedPrice,
      })),
      Materials: (<any[]>responseMaterials).map((material) => ({
        ...material,
        quantity: toFloatOrZero(material.quantity),
        margin: toFloatOrZero(material.margin),
        price: toFloatOrZero(material.price),
        MaterialApprovedBy: material.MaterialApprovedBy.id === null ? null : material.MaterialApprovedBy,
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

    if (!userGroupRights.project.addTask) {
      addApolloError(
        'Project',
        CantCreateTasksError,
        User.get('id'),
        project
      );
      throw CantCreateTasksError;
    }
    args = await processProjectDataAdd(User, Project, userGroupRights.attributes, args);

    let { assignedTo: assignedTos, company, milestone, requester, status, tags, taskType, repeat, comments, subtasks, workTrips, materials, shortSubtasks, ...params } = args;

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
            message: `Task was created by ${User.get('fullName')}(${User.get('email')})`,
          },
          {
            type: 'task',
            originalValue: null,
            newValue: null,
            message: `Task was named "${args.title}" and was described as "${args.description}"`,
          },
        ]
      }],
      TaskMetadata: calculateMetadata(Project.get('autoApproved'), subtasks, workTrips, materials),
      createdById: User.get('id'),
      CompanyId: company,
      ProjectId: project,
      MilestoneId: null,
      requesterId: requester,
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

    //Short Subtasks
    if (shortSubtasks) {
      params = {
        ...params,
        ShortSubtasks: shortSubtasks
      }
    }
    //repeat processing
    if (repeat !== null && repeat !== undefined && userGroupRights.attributes.repeat.add) {
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
      pubsub.publish(REPEAT_CHANGE, { repeatsSubscription: true });
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
    sendTaskNotificationsToUsers(User, NewTask, [{
      data: { createdAt: timestampToString(NewTask.get('createdAt').valueOf()), description: params.description },
      type: 'creation',
    }]);
    pubsub.publish(TASK_CHANGE, { tasksSubscription: true });
    pubsub.publish(TASK_ADD, { taskAddSubscription: User.get('id') });
    pubsub.publish(TASK_DND_CHANGE, { taskDndChangeSubscription: [params.StatusId] });
    NewTask.rights = userGroupRights;
    return NewTask;
  },

  updateTask: async (root, args, { req }) => {
    const { fromInvoice } = args;
    const User = await checkResolver(req, fromInvoice ? ['vykazy'] : []);
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
          models.TaskType,
          models.Company,
          models.Milestone,
          {
            model: models.TaskMetadata,
            as: 'TaskMetadata'
          },
          { model: models.User, as: 'requester' },
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
    if (Task.get('invoiced')) {
      throw CantEditInvoicedTaskError;
    }

    let taskChangeMessages = [];
    let notificationMessages = [];
    const originalStatus = Task.get('StatusId');
    let assignedUsers = [];
    let unassignedUsers = [];

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

    //Figure out project and if can change project
    let groupRights = null;
    const requiredGroupRights = args.project !== undefined && args.project !== Task.get('ProjectId') ? ['taskProjectWrite'] : [];
    const TestData1 = await checkIfHasProjectRights(User, undefined, Task.get('ProjectId'), requiredGroupRights, [], fromInvoice === true);
    groupRights = <any>TestData1.groupRights;
    if (args.project !== undefined && args.project !== Task.get('ProjectId')) {
      const TestData2 = await checkIfHasProjectRights(User, undefined, args.project, ['taskProjectWrite'], [], fromInvoice === true);
      groupRights = <any>TestData2.groupRights;
    }

    args = await processProjectDataEdit(User, Project, groupRights.attributes, args, Task);

    let { id, assignedTo: assignedTos, company, milestone, requester, status, tags, taskType, ...params } = args;
    const dates = extractDatesFromObject(params, dateNames);
    params = { ...params, ...dates };

    //can you even open this task
    if (!canViewTask(Task, User, groupRights.project, true)) {
      throw CantViewTaskError;
    }

    //Rights and project def
    if (tags) {
      tags = tags.filter((tagID) => (<TagInstance[]>Project.get('tags')).some((Tag) => Tag.get('id') === tagID));
    }

    let promises = [];
    let NewAsssignedTo = null;
    if (assignedTos) {
      //assignedTo must be in project group
      unassignedUsers = Task.get('assignedTos').filter((User) => !assignedTos.includes(User.get('id')));
      NewAsssignedTo = <UserInstance[]>await models.User.findAll({ where: { id: assignedTos } });
      assignedUsers = NewAsssignedTo.filter((User1) => !Task.get('assignedTos').some((User2) => User1.get('id') === User2.get('id')));
    }

    await sequelize.transaction(async (transaction) => {
      if (project && project !== Task.get('ProjectId')) {
        taskChangeMessages.push(await createChangeMessage('Project', models.Project, 'Project', project, OriginalProject, 'title', Project));
        notificationMessages.push({ type: 'otherAttributes', data: { label: 'Project', old: OriginalProject.get('title'), new: Project.get('title') } });
        promises.push(Task.setProject(project, { transaction }));
        //here was milestone with condition if exists

        //Update metadata
        if (Project.get('autoApproved') !== OriginalProject.get('autoApproved')) {
          const Metadata = <TaskMetadataInstance>Task.get('TaskMetadata');
          if (Project.get('autoApproved')) {

            Metadata.update({
              subtasksApproved: parseFloat(Metadata.get('subtasksApproved').toString()) + parseFloat(Metadata.get('subtasksPending').toString()),
              subtasksPending: 0,
              tripsApproved: parseFloat(Metadata.get('tripsApproved').toString()) + parseFloat(Metadata.get('tripsPending').toString()),
              tripsPending: 0,
              materialsApproved: parseFloat(Metadata.get('materialsApproved').toString()) + parseFloat(Metadata.get('materialsPending').toString()),
              materialsPending: 0,
              itemsApproved: parseFloat(Metadata.get('itemsApproved').toString()) + parseFloat(Metadata.get('itemsPending').toString()),
              itemsPending: 0,
            }, { transaction })
          } else {
            Metadata.update(
              {
                subtasksApproved: (<SubtaskInstance[]>Task.get('Subtasks')).reduce((acc, cur) => {
                  if (cur.approved) {
                    return acc + parseFloat(cur.quantity.toString());
                  }
                  return acc;
                }, 0),
                subtasksPending: (<SubtaskInstance[]>Task.get('Subtasks')).reduce((acc, cur) => {
                  if (cur.approved) {
                    return acc;
                  }
                  return acc + parseFloat(cur.quantity.toString());
                }, 0),
                tripsApproved: (<WorkTripInstance[]>Task.get('WorkTrips')).reduce((acc, cur) => {
                  if (cur.approved) {
                    return acc + parseFloat(cur.quantity.toString());
                  }
                  return acc;
                }, 0),
                tripsPending: (<WorkTripInstance[]>Task.get('WorkTrips')).reduce((acc, cur) => {
                  if (cur.approved) {
                    return acc;
                  }
                  return acc + parseFloat(cur.quantity.toString());
                }, 0),
                materialsApproved: (<MaterialInstance[]>Task.get('Materials')).reduce((acc, cur) => {
                  if (cur.approved) {
                    return acc + parseFloat(cur.quantity.toString());
                  }
                  return acc;
                }, 0),
                materialsPending: (<MaterialInstance[]>Task.get('Materials')).reduce((acc, cur) => {
                  if (cur.approved) {
                    return acc;
                  }
                  return acc + parseFloat(cur.quantity.toString());
                }, 0),
              },
              { transaction }
            )
          }
        }
      }
      if (assignedTos) {
        taskChangeMessages.push(await createChangeMessage('AssignedTo', models.User, 'Assigned to users', assignedTos, Task.get('assignedTos'), 'fullName', NewAsssignedTo));
        notificationMessages.push({
          type: 'otherAttributes', data: {
            label: "Assigned to", old: (<UserInstance[]>Task.get('assignedTos')).map((User) => `${User.get('fullName')}(${User.get('email')})`).join(`<br>`), new: NewAsssignedTo.map((User) => `${User.get('fullName')}(${User.get('email')})`).join(`<br>`)
          }
        });
        promises.push(Task.setAssignedTos(assignedTos, { transaction }))
      }

      if (tags) {
        const NewTags = <TagInstance[]>await models.Tag.findAll({ where: { id: tags } });
        taskChangeMessages.push(await createChangeMessage('Tags', models.Tag, 'Tags', tags, Task.get('Tags'), 'title', NewTags));
        notificationMessages.push({ type: 'otherAttributes', data: { label: "Tags", old: (<TagInstance[]>Task.get('Tags')).map((Tag) => `${Tag.get('title')}`).join(`,`), new: NewTags.map((Tag) => `${Tag.get('title')}`).join(`, `) } });
        promises.push(Task.setTags(tags, { transaction }))
      }
      if (requester) {
        const NewRequester = <UserInstance>await models.User.findByPk(requester);
        taskChangeMessages.push(await createChangeMessage('Requester', models.User, 'Requester', requester, Task.get('requester'), 'fullName', NewRequester));
        notificationMessages.push({
          type: 'otherAttributes',
          data: {
            label: "Requester",
            old: Task.get('requester') ? `${(<UserInstance>Task.get('requester')).get('fullName')}(${(<UserInstance>Task.get('requester')).get('email')})` : null,
            new: `${NewRequester.get('fullName')}(${NewRequester.get('email')})`,
          }
        });
        notificationMessages.push({
          type: 'assignedAsRequester',
          data: {
            description: args.description ? args.description : Task.get('description'),
          }
        });
        promises.push(Task.setRequester(requester, { transaction }))
      }

      //here was milestone with condition if and of project
      if (taskType !== undefined) {
        const NewTaskType = <TaskTypeInstance>await models.TaskType.findByPk(taskType);
        taskChangeMessages.push(await createChangeMessage('TaskType', models.TaskType, 'Task type', taskType, Task.get('TaskType'), 'title', NewTaskType));
        notificationMessages.push({
          type: 'otherAttributes',
          data: {
            label: "Task type",
            old: Task.get('TaskType') ? (<TaskTypeInstance>Task.get('TaskType')).get('title') : null,
            new: NewTaskType.get('title')
          }
        });
        promises.push(Task.setTaskType(taskType, { transaction }))
      }
      if (company) {
        const NewCompany = <CompanyInstance>await models.Company.findByPk(company);
        taskChangeMessages.push(await createChangeMessage('Company', models.Company, 'Company', company, Task.get('Company'), 'title', NewCompany));
        notificationMessages.push({
          type: 'otherAttributes',
          data: {
            label: "Company",
            old: Task.get('Company') ? (<CompanyInstance>Task.get('Company')).get('title') : null,
            new: NewCompany.get('title')
          }
        });
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
          taskChangeMessages.push(await createChangeMessage('Status', models.Status, 'Status', status, TaskStatus, 'title', Status));
          notificationMessages.push({
            type: 'otherAttributes',
            data: {
              label: "Status",
              old: TaskStatus ? TaskStatus.get('title') : null,
              new: Status.get('title'),
            }
          });
          promises.push(Task.setStatus(status, { transaction }));
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
            notificationMessages.push({
              type: 'otherAttributes',
              data: {
                label: "Close date",
                old: Task.get('closeDate') ? timestampToString(Task.get('closeDate').valueOf()) : null
              },
              new: timestampToString(params.closeDate),
            });
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
            notificationMessages.push({
              type: 'otherAttributes',
              data: {
                label: "Close date",
                old: Task.get('closeDate') ? timestampToString(Task.get('closeDate').valueOf()) : null,
                new: timestampToString(params.closeDate),
              },
            });
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
            notificationMessages.push({
              type: 'otherAttributes',
              data: {
                label: "Pending date",
                old: Task.get('pendingDate') ? timestampToString(Task.get('pendingDate').valueOf()) : null,
                new: timestampToString(params.pendingDate),
              }
            });
            taskChangeMessages.push(await createChangeMessage('PendingChangable', null, 'Pending changable', params.pendingChangable, Task.get('pendingChangable')));
            notificationMessages.push({ type: 'otherAttributes', data: { label: "Pending changable", old: params.pendingChangable, new: Task.get('pendingChangable') } });
            params.statusChange = moment().valueOf()
            break;
          }
          default:
            break;
        }
      }
      taskChangeMessages = [
        ...taskChangeMessages,
        ...(await createTaskAttributesChangeMessages(params, Task))
      ];

      notificationMessages = [
        ...notificationMessages,
        ...(await createTaskAttributesNotifications(params, Task))
      ];
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
    sendTaskNotificationsToUsers(User, NewTask, notificationMessages, false, assignedUsers, unassignedUsers);
    pubsub.publish(TASK_HISTORY_CHANGE, { taskHistorySubscription: NewTask.get('id') });
    pubsub.publish(TASK_CHANGE, { tasksSubscription: true });
    pubsub.publish(TASK_DND_CHANGE, { taskDndChangeSubscription: [originalStatus, NewTask.get('StatusId')] });

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
    if (Task.get('invoiced')) {
      throw CantEditInvoicedTaskError;
    }
    const Project = <ProjectInstance>Task.get('Project');
    //must right to delete project
    const { groupRights } = await checkIfHasProjectRights(User, undefined, Task.get('ProjectId'), ['deleteTask']);
    //can you even open this task
    if (!canViewTask(Task, User, groupRights.project, true)) {
      throw CantViewTaskError;
    }
    await sendTaskNotificationsToUsers(User, Task, [{ type: 'deletion', data: { description: Task.get('description') } }], true);
    await Task.destroy();
    pubsub.publish(TASK_CHANGE, { tasksSubscription: true });
    pubsub.publish(TASK_DELETE, { taskDeleteSubscription: id });
    pubsub.publish(TASK_DND_CHANGE, { taskDndChangeSubscription: [Task.get('StatusId')] });
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
  taskDndChangeSubscription: {
    subscribe: withFilter(
      () => pubsub.asyncIterator(TASK_DND_CHANGE),
      async ({ taskDndChangeSubscription }, { statusId }, { userID }) => {
        return taskDndChangeSubscription.includes(statusId) || statusId === null;
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
