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
import {
  allGroupRights
} from '@/configs/projectConstants';
import { models, sequelize } from '@/models';
import { Op, QueryTypes } from 'sequelize';
import {
  TaskInstance,
  MilestoneInstance,
  ProjectInstance,
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
  sendNotifications,
} from '@/helperFunctions';
import {
  canViewTask,
  checkIfHasProjectRights,
  checkDefRequiredSatisfied,
  checkIfCanEditTaskAttributes,
  applyFixedOnAttributes,
} from '@/graph/addons/project';
import {
  filterToTaskWhere,
  transformSortToQuery,
  stringFilterToTaskWhere,
  transformSortToQueryString,
  filterToTaskWhereSQL,
  stringFilterToTaskWhereSQL,
  generateTasksSQL,
} from '@/graph/addons/task';
import { sendNotificationToUsers } from '@/graph/resolvers/userNotification';
import { repeatEvent } from '@/services/repeatTasks';
import { pubsub } from './index';
const { withFilter } = require('apollo-server-express');
import { TASK_CHANGE } from '@/configs/subscriptions';
import checkResolver from './checkResolver';
import moment from 'moment';
import Stopwatch from 'statman-stopwatch';
import { sendEmail } from '@/services/smtp';
const dateNames = ['deadline', 'pendingDate', 'closeDate'];
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

const querries = {
  tasks: async (root, { projectId, filter, sort, search, stringFilter, limit, page, statuses }, { req, userID }) => {
    const mainOrderBy = sort ? transformSortToQueryString(sort, true) : '"Task"."important" DESC, "Task"."id" DESC';
    const secondaryOrderBy = sort ? transformSortToQueryString(sort, false) : '"TaskData"."important" DESC, "TaskData"."id" DESC';

    const mainWatch = new Stopwatch(true);
    const checkUserWatch = new Stopwatch(true);
    const User = await checkResolver(req);
    const isAdmin = (<RoleInstance>User.get('Role')).get('level') === 0;
    const checkUserTime = checkUserWatch.stop();
    let taskWhere = [];
    if (projectId) {
      const Project = await models.Project.findByPk(projectId);
      if (Project === null) {
        throw createDoesNoExistsError('Project', projectId);
      }
      taskWhere.push(`"Task"."ProjectId" = ${projectId}`)
    }
    if (statuses && statuses.length !== 0) {
      taskWhere.push(`"Task"."StatusId" IN (${statuses.join(',')})`)
    }
    if (filter) {
      const dates = extractDatesFromObject(filter, dateNames2);
      taskWhere = taskWhere.concat(filterToTaskWhereSQL({ ...filter, ...dates }, userID, User.get('CompanyId'), projectId));
    }

    if (search || stringFilter) {
      taskWhere = [
        ...taskWhere,
        ...stringFilterToTaskWhereSQL(search, stringFilter),
      ]
    }

    if (!page) {
      page = 1;
    }

    const SQL = generateTasksSQL(projectId, userID, User.get('CompanyId'), isAdmin, taskWhere.join(' AND '), mainOrderBy, secondaryOrderBy, limit, (page - 1) * limit);

    let responseTasks = <TaskInstance[]>await sequelize.query(SQL, {
      model: models.Task,
      type: QueryTypes.SELECT,
      nest: true,
      raw: true,
      mapToModel: true
    });

    let databaseTime = 0;
    const databaseWatch = new Stopwatch(true);
    let tasks = [];
    responseTasks.forEach((Task) => {
      const hasAsssignedTo = Task.assignedTos !== null && Task.assignedTos.id !== null;
      const hasTag = Task.Tags !== null && Task.Tags.id !== null;

      const taskIndex = tasks.findIndex((task) => Task.id === task.id);
      if (taskIndex !== -1) {

        if (hasAsssignedTo && !tasks[taskIndex].assignedTos.some((assignedTo) => assignedTo.id === Task.assignedTos.id)) {
          tasks[taskIndex].assignedTos.push(Task.assignedTos);
        }
        if (hasTag && !tasks[taskIndex].Tags.some((tag) => tag.id === Task.Tags.id)) {
          tasks[taskIndex].Tags.push(Task.Tags);
        }
      } else {
        tasks.push({
          ...Task,
          assignedTos: !hasAsssignedTo ? [] : [Task.assignedTos],
          Tags: !hasTag ? [] : [Task.Tags],
        })
      }
    })

    if (!isAdmin) {
      tasks = tasks.map((Task) => {
        const Project = Task.Project;
        const Groups = Project.ProjectGroups;
        const GroupRight = Groups.ProjectGroupRight;
        Task.rights = GroupRight;
        return Task;
      })
    } else {
      tasks = tasks.map((Task) => {
        Task.rights = allGroupRights;
        return Task;
      })
    }

    databaseTime = databaseWatch.stop()
    const count = tasks.length > 0 ? (<any>tasks[0]).count : 0;
    return {
      tasks,
      count,
      execTime: mainWatch.stop(),
      secondaryTimes: [
        { source: 'User check', time: checkUserTime },
        { source: 'Database', time: databaseTime },
      ]
    };
  },

  task: async (root, { id }, { req }) => {
    const User = await checkResolver(req);
    const FragmentedTask = await Promise.all([
      models.Task.findByPk(
        id,
        {
          include: [
            { model: models.Project },
            models.TaskAttachment,
            { model: models.User, as: 'assignedTos' },
            {
              model: models.Company,
              include: [
                {
                  model: models.Pricelist,
                  include: [
                    {
                      model: models.Price,
                      include: [models.TaskType, models.TripType]
                    }
                  ]
                },
              ]
            },
            { model: models.User, as: 'createdBy' },
            models.Milestone,
            models.Project,
            { model: models.User, as: 'requester' },
            models.Status,
            models.Tag,
            models.TaskType,
            models.Repeat,
            models.RepeatTime,
            {
              model: models.TaskMetadata,
              as: 'TaskMetadata'
            },
          ]
        }
      ),
      models.Task.findByPk(
        id,
        {
          include: [
            models.ShortSubtask,
            models.ScheduledTask,
            {
              model: models.InvoicedTask,
              include: [models.InvoicedTag, models.InvoicedAssignedTo]
            },
            {
              model: models.Subtask,
              include: [models.TaskType, models.InvoicedSubtask, { model: models.User, as: 'SubtaskApprovedBy' }, { model: models.User, include: [models.Company] }]
            },
            {
              model: models.WorkTrip,
              include: [models.TripType, models.InvoicedTrip, { model: models.User, as: 'TripApprovedBy' }, { model: models.User, include: [models.Company] }]
            },
            {
              model: models.Material,
              include: [models.InvoicedMaterial, { model: models.User, as: 'MaterialApprovedBy' }],
            },
            {
              model: models.CustomItem,
              include: [models.InvoicedCustomItem, { model: models.User, as: 'ItemApprovedBy' }],
            },
          ]
        }
      ),
    ])

    let Task = mergeFragmentedModel(FragmentedTask)
    const { groupRights } = await checkIfHasProjectRights(User.get('id'), id);
    if (!canViewTask(Task, User, groupRights, true)) {
      throw CantViewTaskError;
    }
    Task.rights = groupRights;
    return Task;
  },

  getNumberOfTasks: async (root, { projectId }, { req }) => {
    const User = await checkResolver(req);
    await checkIfHasProjectRights(User.get('id'), undefined, projectId, ['projectWrite']);
    return models.Task.count({ where: { ProjectId: projectId } })
  },
}

const mutations = {
  addTask: async (root, args, { req }) => {
    const project = args.project;
    const Project = await models.Project.findByPk(
      project,
      {
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
          },
        ]
      }
    );
    if (Project === undefined) {
      throw createDoesNoExistsError('project', project);
    }

    const User = await checkResolver(
      req,
      [],
      false,
      [
        {
          model: models.ProjectGroup,
          required: false,
          include: [models.ProjectGroupRights],
          where: {
            ProjectId: project,
          }
        },
      ]
    );

    const def = await Project.get('def');

    args = applyFixedOnAttributes(def, args, User, <StatusInstance[]>Project.get('projectStatuses'));

    let { assignedTo: assignedTos, company, milestone, requester, status, tags, taskType, repeat, comments, subtasks, workTrips, materials, customItems, shortSubtasks, scheduled, ...params } = args;

    const groupRights = (
      (<RoleInstance>User.get('Role')).get('level') === 0 ?
        allGroupRights :
        (<ProjectGroupRightsInstance>(<ProjectGroupInstance[]>User.get('ProjectGroups')).find((ProjectGroup) => ProjectGroup.get('ProjectId') === project).get('ProjectGroupRight')).get()
    )

    if (!groupRights.addTasks && (<RoleInstance>User.get('Role')).get('level') !== 0) {
      addApolloError(
        'Project',
        CantCreateTasksError,
        User.get('id'),
        project
      );
      throw CantCreateTasksError;
    }

    //check all Ids if exists
    const pairsToCheck = [{ id: company, model: models.Company }, { id: status, model: models.Status }];
    (taskType !== undefined && taskType !== null) && pairsToCheck.push({ id: taskType, model: models.TaskType });
    (requester !== undefined && requester !== null) && pairsToCheck.push({ id: requester, model: models.User });
    (milestone !== undefined && milestone !== null) && pairsToCheck.push({ id: milestone, model: models.Milestone });
    await idsDoExistsCheck(assignedTos, models.User);
    await idsDoExistsCheck(tags, models.Tag);
    await multipleIdDoesExistsCheck(pairsToCheck);
    checkDefRequiredSatisfied(def, null, args);

    tags = tags.filter((tagID) => (<TagInstance[]>Project.get('tags')).some((Tag) => Tag.get('id') === tagID));
    if (!(<StatusInstance[]>Project.get('projectStatuses')).some((Status) => Status.get('id') === status)) {
      throw createDoesNoExistsError('Status', status);
    }
    //Rights and project def
    checkIfCanEditTaskAttributes(User, def, project, args);

    const groupUsers = <number[]>(<ProjectGroupInstance[]>Project.get('ProjectGroups')).reduce((acc, ProjectGroup) => {
      return [...acc, ...(<UserInstance[]>ProjectGroup.get('Users')).map((User) => User.get('id'))]
    }, [])

    const groupUsersWithRights = <any[]>(<ProjectGroupInstance[]>Project.get('ProjectGroups')).reduce((acc, ProjectGroup) => {
      const rights = ProjectGroup.get('ProjectGroupRight');
      return [
        ...acc,
        ...(<UserInstance[]>ProjectGroup.get('Users')).map((User) => ({ user: User, rights }))
      ]
    }, []);

    const assignableUserIds = groupUsersWithRights.filter((user) => user.rights.assignedWrite).map((userWithRights) => userWithRights.user.get('id'));
    assignedTos = assignedTos.filter((id) => assignableUserIds.includes(id));
    if (assignedTos.length === 0) {
      throw TaskMustBeAssignedToAtLeastOneUser;
    }

    //requester must be in project or project is open
    if (requester && Project.get('lockedRequester') && !groupUsers.includes(requester)) {
      throw createUserNotPartOfProjectError('requester');
    }

    //milestone must be of project
    if (milestone && !(<MilestoneInstance[]>Project.get('Milestones')).some((projectMilestone) => projectMilestone.get('id') === milestone)) {
      throw MilestoneNotPartOfProject;
    }
    let subtasksApproved = 0;
    let subtasksPending = 0;
    let tripsApproved = 0;
    let tripsPending = 0;
    let materialsApproved = 0;
    let materialsPending = 0;
    let itemsApproved = 0;
    let itemsPending = 0;

    if (subtasks) {
      subtasks.map((subtask) => {
        if (subtask.approved || Project.get('autoApproved')) {
          subtasksApproved += parseFloat(<any>subtask.quantity);
        } else {
          subtasksPending += parseFloat(<any>subtask.quantity);
        }
      })
    }

    if (workTrips) {
      workTrips.map((trip) => {
        if (trip.approved || Project.get('autoApproved')) {
          tripsApproved += parseFloat(<any>trip.quantity);
        } else {
          tripsPending += parseFloat(<any>trip.quantity);
        }
      })
    }

    if (materials) {
      materials.map((material) => {
        if (material.approved || Project.get('autoApproved')) {
          materialsApproved += parseFloat(<any>material.quantity);
        } else {
          materialsPending += parseFloat(<any>material.quantity);
        }
      })
    }

    if (customItems) {
      customItems.map((customItem) => {
        if (customItem.approved || Project.get('autoApproved')) {
          itemsApproved += parseFloat(<any>customItem.quantity);
        } else {
          itemsPending += parseFloat(<any>customItem.quantity);
        }
      })
    }

    const dates = extractDatesFromObject(params, dateNames);
    //status corresponds to data - closedate, pendingDate
    //createdby
    params = {
      ...params,
      ...dates,
      TaskChanges: [{
        UserId: User.get('id'),
        TaskChangeMessages: [{
          type: 'task',
          originalValue: null,
          newValue: null,
          message: `Task was created by ${User.get('fullName')}`,
        }]
      }],
      TaskMetadata: {
        subtasksApproved,
        subtasksPending,
        tripsApproved,
        tripsPending,
        materialsApproved,
        materialsPending,
        itemsApproved,
        itemsPending,
      },
      createdById: User.get('id'),
      CompanyId: company,
      ProjectId: project,
      MilestoneId: milestone === undefined ? null : milestone,
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
        if (comment.internal && !groupRights.internal) {
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
      await idsDoExistsCheck(subtasks.map((subtask) => subtask.type), models.TaskType);
      params = {
        ...params,
        Subtasks: subtasks.map((subtask) => (
          subtask.approved ?
            { ...subtask, UserId: subtask.assignedTo, TaskTypeId: subtask.type, SubtaskApprovedById: User.get('id') } :
            { ...subtask, UserId: subtask.assignedTo, TaskTypeId: subtask.type }
        ))
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
        WorkTrips: workTrips.map((workTrip) => (
          workTrip.approved ?
            { ...workTrip, UserId: workTrip.assignedTo, TripTypeId: workTrip.type, TripApprovedById: User.get('id') } :
            { ...workTrip, UserId: workTrip.assignedTo, TripTypeId: workTrip.type }
        ))
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
    //Scheduled Subtasks
    if (scheduled) {
      params = {
        ...params,
        ScheduledTasks: scheduled.map((item) => ({
          ...item,
          ...extractDatesFromObject(item, ['from', 'to'])
        }))
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
              models.ScheduledTask, models.ShortSubtask, models.Subtask, models.WorkTrip, models.Material, models.CustomItem
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
        models.ScheduledTask,
        models.ShortSubtask,
        models.Subtask,
        models.WorkTrip,
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
    sendNotifications(User, [`Task was created by ${User.get('fullName')}`], NewTask, assignedTos);
    pubsub.publish(TASK_CHANGE, { taskSubscription: { type: 'add', data: NewTask, ids: [] } });
    NewTask.rights = groupRights;
    return NewTask;
  },

  updateTask: async (root, args, { req }) => {
    const Task = <TaskInstance>await models.Task.findByPk(
      args.id,
      {
        include: [
          { model: models.User, as: 'assignedTos' },
          models.Tag,
          models.Status,
          models.Subtask,
          models.WorkTrip,
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
                include: [models.User]
              },
            ]
          }
        ]
      }
    );
    if (Task === undefined) {
      throw createDoesNoExistsError('Task', args.id);
    }

    const User = await checkResolver(
      req,
      [],
      false,
      [
        {
          model: models.ProjectGroup,
          required: false,
          where: {
            ProjectId: [args.project, Task.get('ProjectId')].filter((id) => id),
          },
          include: [models.ProjectGroupRights],
        }
      ]
    );

    let taskChangeMessages = [];

    //Figure out project and if can change project
    if (args.project !== undefined && args.project !== Task.get('ProjectId')) {
      await checkIfHasProjectRights(User.get('id'), undefined, Task.get('ProjectId'), ['projectWrite']);
      await checkIfHasProjectRights(User.get('id'), undefined, args.project, ['projectWrite']);
    }
    const project = args.project ? args.project : Task.get('ProjectId');
    let Project = <ProjectInstance>Task.get('Project');
    let OriginalProject = <ProjectInstance>Task.get('Project');
    if (project && project !== Project.get('id')) {
      Project = <ProjectInstance>await models.Project.findByPk(
        project,
        {
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
              include: [models.User]
            },
          ],
        }
      );
      if (Project === null) {
        throw createDoesNoExistsError('Project', project)
      }
    }

    const def = await Project.get('def');
    args = applyFixedOnAttributes(def, args);

    let { id, assignedTo: assignedTos, company, milestone, requester, status, tags, taskType, ...params } = args;
    const dates = extractDatesFromObject(params, dateNames);
    params = { ...params, ...dates };
    const groupRights = (
      (<RoleInstance>User.get('Role')).get('level') === 0 ?
        allGroupRights :
        (<ProjectGroupRightsInstance>(<ProjectGroupInstance[]>User.get('ProjectGroups')).find((ProjectGroup) => ProjectGroup.get('ProjectId') === project).get('ProjectGroupRight')).get()
    )
    //can you even open this task
    if (!canViewTask(Task, User, groupRights, true)) {
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
    (milestone !== undefined && milestone !== null) && pairsToCheck.push({ id: milestone, model: models.Milestone });
    await multipleIdDoesExistsCheck(pairsToCheck);

    checkDefRequiredSatisfied(
      def,
      {
        assignedTo: (<UserInstance[]>Task.get('assignedTos')).map((User) => User.get('id')),
        tags: (<TagInstance[]>Task.get('Tags')).map((Tag) => Tag.get('id')),
        company: Task.get('CompanyId'),
        requester: Task.get('RequesterId'),
        status: Task.get('StatusId'),
      },
      args,
    );

    //Rights and project def
    checkIfCanEditTaskAttributes(User, def, project, args);

    if (tags) {
      tags = tags.filter((tagID) => (<TagInstance[]>Project.get('tags')).some((Tag) => Tag.get('id') === tagID));
    }

    const groupUsers = <number[]>(<ProjectGroupInstance[]>Project.get('ProjectGroups')).reduce((acc, ProjectGroup) => {
      return [...acc, ...(<UserInstance[]>ProjectGroup.get('Users')).map((User) => User.get('id'))]
    }, [])

    let promises = [];

    await sequelize.transaction(async (transaction) => {
      if (project && project !== Task.get('ProjectId')) {
        taskChangeMessages.push(await createChangeMessage('Project', models.Project, 'Project', project, Task.get('Project')));
        promises.push(Task.setProject(project, { transaction }));
        if (milestone === undefined || milestone === null) {
          promises.push(Task.setMilestone(null, { transaction }));
        }
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

        const groupUsersWithRights = <any[]>(<ProjectGroupInstance[]>Project.get('ProjectGroups')).reduce((acc, ProjectGroup) => {
          const rights = ProjectGroup.get('ProjectGroupRight');
          return [
            ...acc,
            ...(<UserInstance[]>ProjectGroup.get('Users')).map((User) => ({ user: User, rights }))
          ]
        }, []);

        //assignedTo must be in project group and assignable
        const assignableUserIds = groupUsersWithRights.filter((user) => user.rights.assignedWrite).map((userWithRights) => userWithRights.user.get('id'));
        assignedTos = assignedTos.filter((id) => assignableUserIds.includes(id));
        if (assignedTos.length === 0) {
          throw TaskMustBeAssignedToAtLeastOneUser;
        }
        assignedTos = assignedTos.filter((assignedTo) => assignableUserIds.includes(assignedTo));

        if (assignedTos.length === 0) {
          throw TaskMustBeAssignedToAtLeastOneUser;
        }

        //all subtasks and worktrips must be assigned
        const Subtasks = <SubtaskInstance[]>await Task.get('Subtasks');
        const WorkTrips = <WorkTripInstance[]>await Task.get('WorkTrips');
        const allAssignedIds = [
          ...Subtasks.map((Subtask) => Subtask.get('UserId')),
          ...WorkTrips.map((WorkTrip) => WorkTrip.get('UserId')),
        ];
        if (!allAssignedIds.every((id) => assignedTos.includes(id))) {
          throw CantUpdateTaskAssignedToOldUsedInSubtasksOrWorkTripsError;
        }
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

      if (milestone || milestone === null) {
        //milestone must be of project
        if (milestone !== null && !(<MilestoneInstance[]>Project.get('Milestones')).some((projectMilestone) => projectMilestone.get('id') === milestone)) {
          throw MilestoneNotPartOfProject;
        }
        taskChangeMessages.push(await createChangeMessage('Milestone', models.Milestone, 'Milestone', milestone, Task.get('Milestone')));
        promises.push(Task.setMilestone(milestone, { transaction }))
      }
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
        sendNotificationToUsers(
          {
            subject: `Status was changed from ${TaskStatus.get('title')} to ${Status.get('title')}.`,
            message: `Status was changed from ${TaskStatus.get('title')} to ${Status.get('title')} at ${moment().format('HH:mm DD.MM.YYYY')} in task currently named ${Task.get('id')}:${Task.get('title')}.`,
            read: false,
            createdById: User.get('id'),
            TaskId: Task.get('id'),
          },
          User.get('id'),
          Task,
        )
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
    sendNotifications(User, taskChangeMessages.map((taskChange) => taskChange.message), NewTask);
    pubsub.publish(TASK_CHANGE, { taskSubscription: { type: 'update', data: NewTask, ids: [] } });
    return NewTask;
  },

  deleteTask: async (root, { id }, { req }) => {
    const User = await checkResolver(req);
    const Task = <TaskInstance>await models.Task.findByPk(
      id,
      {
        include: [
          { model: models.User, as: 'assignedTos', attributes: ['id'] },
          {
            model: models.Project,
          }
        ]
      }
    );
    const Project = <ProjectInstance>Task.get('Project');
    //must right to delete project
    const { groupRights } = await checkIfHasProjectRights(User.get('id'), undefined, Task.get('ProjectId'), ['deleteTasks']);
    //can you even open this task
    if (!canViewTask(Task, User, groupRights, true)) {
      throw CantViewTaskError;
    }
    sendNotifications(User, [`Task was deleted.`], Task)

    pubsub.publish(TASK_CHANGE, { taskSubscription: { type: 'delete', data: Task, ids: [id] } });
    return Task.destroy();
  }
}

const subscriptions = {
  taskSubscription: {
    subscribe: withFilter(
      () => pubsub.asyncIterator(TASK_CHANGE),
      async ({ taskSubscription }, { projectId, filter }, { userID }) => {
        const User = <UserInstance>await models.User.findByPk(userID);
        if (User === null) {
          throw InvalidTokenError;
        }
        if (projectId) {
          const Project = await models.Project.findByPk(projectId);
          if (Project === null) {
            throw createDoesNoExistsError('Project', projectId);
          }
        }
        const { type, data, ids } = taskSubscription;
        if (type === 'delete') {
          return true;
        }
        if (projectId && data.get('ProjectId') !== projectId) {
          return false;
        }

        if (filter) {
          const assignedToCorrect = (
            (filter.assignedToCur && (await data.getAssignedTos()).some((AssignedUser) => AssignedUser.get('id') === User.get('id'))) ||
            (!filter.assignedToCur && (filter.assignedTo === null || (await data.getAssignedTos()).some((AssignedUser) => AssignedUser.get('id') === filter.assignedTo)))
          );
          const requesterCorrect = (
            (filter.requesterCur && data.get('requesterId') === User.get('id')) ||
            (!filter.requesterCur && (filter.requester === null || filter.requester === data.get('requesterId')))
          );
          const companyCorrect = (
            (filter.companyCur && data.get('CompanyId') === User.get('CompanyId')) ||
            (!filter.companyCur && (filter.company === null || filter.company === data.get('CompanyId')))
          );

          let oneOfCheck = [];
          let allCheck = [];
          if (filter.oneOf.includes('assigned')) {
            oneOfCheck.push(assignedToCorrect)
          } else {
            allCheck.push(assignedToCorrect)
          }

          if (filter.oneOf.includes('requester')) {
            oneOfCheck.push(requesterCorrect)
          } else {
            allCheck.push(requesterCorrect)
          }

          if (filter.oneOf.includes('company')) {
            oneOfCheck.push(companyCorrect)
          } else {
            allCheck.push(companyCorrect)
          }
          const oneOfCorrect = allCheck.every((bool) => bool) && (oneOfCheck.length === 0 || oneOfCheck.some((bool) => bool))

          if (
            !(
              oneOfCorrect &&
              (filter.taskType === null || filter.taskType === data.get('TaskTypeId')) &&
              taskCheckDate(filter.statusDateFromNow, filter.statusDateFrom, filter.statusDateToNow, filter.statusDateTo, data.get('statusChange')) &&
              taskCheckDate(filter.pendingDateFromNow, filter.pendingDateFrom, filter.pendingDateToNow, filter.pendingDateTo, data.get('pendingDate')) &&
              taskCheckDate(filter.closeDateFromNow, filter.closeDateFrom, filter.closeDateToNow, filter.closeDateTo, data.get('closeDate')) &&
              taskCheckDate(filter.deadlineFromNow, filter.deadlineFrom, filter.deadlineToNow, filter.deadlineTo, data.get('deadline'))
            )
          ) {
            return false;
          }
        }
        return true;
      },
    ),
  }
}

const attributes = {
  Task: {
    async rights(task) {
      if (!task.rights) {
        return null;
      }
      return task.rights;
    },
    async assignedTo(task) {
      if (!task.rights || !task.rights.assignedRead) {
        return [];
      }
      return getModelAttribute(task, 'assignedTos');
    },
    async company(task) {
      if (!task.rights || !task.rights.companyRead) {
        return null;
      }
      return getModelAttribute(task, 'Company');
    },
    async createdBy(task) {
      return getModelAttribute(task, 'createdBy');
    },
    async milestone(task) {
      if (!task.rights || !task.rights.milestoneRead) {
        return null;
      }
      return getModelAttribute(task, 'Milestone');
    },
    async project(task) {
      return getModelAttribute(task, 'Project');
    },
    async requester(task) {
      if (!task.rights || !task.rights.requesterRead) {
        return null;
      }
      return getModelAttribute(task, 'requester');
    },
    async status(task) {
      return getModelAttribute(task, 'Status');
    },
    async tags(task) {
      if (!task.rights || !task.rights.tagsRead) {
        return [];
      }
      return getModelAttribute(task, 'Tags');
    },
    async taskType(task) {
      if (!task.rights || !task.rights.typeRead) {
        return null;
      }
      return getModelAttribute(task, 'TaskType');
    },
    async repeat(task) {
      if (!task.rights || !task.rights.repeatRead) {
        return null;
      }
      return getModelAttribute(task, 'Repeat');
    },
    async repeatTime(task) {
      if (!task.rights || !task.rights.repeatRead) {
        return null;
      }
      return getModelAttribute(task, 'RepeatTime');
    },
    async metadata(task) {
      return getModelAttribute(task, 'TaskMetadata');
    },

    async comments(task, body, { req, userID }) {
      if (!task.rights || !task.rights.viewComments) {
        return [];
      }
      const [
        SourceUser,
        Comments,

      ] = await Promise.all([
        checkResolver(
          req,
          [],
          false,
          [
            {
              model: models.ProjectGroup,
              required: false,
              where: {
                ProjectId: task.get('ProjectId'),
              },
              include: [models.ProjectGroupRights],
            }
          ]
        ),
        getModelAttribute(task, 'Comments', 'getComments', { order: [['createdAt', 'DESC']] })
      ])
      const groupRights = (<RoleInstance>SourceUser.get('Role')).get('level') === 0 ?
        allGroupRights :
        (<ProjectGroupRightsInstance>(<ProjectGroupInstance[]>SourceUser.get('ProjectGroups'))[0].get('ProjectGroupRight')).get();
      if (!groupRights.viewComments) {
        return [];
      }
      return Comments.filter((Comment) => Comment.get('isParent') && (!Comment.get('internal') || groupRights.internal))
    },

    async shortSubtasks(task) {
      if (!task.rights || !task.rights.taskShortSubtasksRead) {
        return [];
      }
      return getModelAttribute(task, 'ShortSubtasks');
    },
    async scheduled(task) {
      if (!task.rights || !task.rights.assignedRead) {
        return [];
      }
      return getModelAttribute(task, 'ScheduledTasks');
    },
    async subtasks(task) {
      if (!task.rights || (!task.rights.rozpocetRead && !task.rights.vykazRead)) {
        return [];
      }
      return getModelAttribute(task, 'Subtasks');
    },
    async workTrips(task) {
      if (!task.rights || (!task.rights.rozpocetRead && !task.rights.vykazRead)) {
        return [];
      }
      return getModelAttribute(task, 'WorkTrips');
    },
    async materials(task) {
      if (!task.rights || (!task.rights.rozpocetRead && !task.rights.vykazRead)) {
        return [];
      }
      return getModelAttribute(task, 'Materials');
    },
    async customItems(task) {
      if (!task.rights || (!task.rights.rozpocetRead && !task.rights.vykazRead)) {
        return [];
      }
      return getModelAttribute(task, 'CustomItems');
    },
    async taskChanges(task) {
      if (!task.rights || !task.rights.history) {
        return [];
      }
      return getModelAttribute(task, 'TaskChanges', 'getTaskChanges', { order: [['createdAt', 'DESC']] });
    },
    async taskAttachments(task) {
      if (!task.rights || !task.rights.taskAttachmentsRead) {
        return [];
      }
      return getModelAttribute(task, 'TaskAttachments');
    },
    async invoicedTasks(task) {
      return getModelAttribute(task, 'InvoicedTasks');
    },
  }
};

export default {
  attributes,
  mutations,
  querries,
  subscriptions
}
