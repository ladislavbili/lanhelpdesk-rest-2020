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
  TagInstance,
  TaskTypeInstance,
  CompanyInstance
} from '@/models/instances';
import {
  idsDoExistsCheck,
  multipleIdDoesExistsCheck,
  filterObjectToFilter,
  taskCheckDate,
  extractDatesFromObject,
  filterUnique,
  getModelAttribute,
  mergeFragmentedModel,
  checkIfHasProjectRights,
  checkDefRequiredSatisfied,
  checkIfCanEditTaskAttributes,
  applyFixedOnAttributes,
  addApolloError,
  canViewTask,
  createChangeMessage,
  createTaskAttributesChangeMessages,
  sendNotifications,
  filterToWhere,
  filterByOneOf,
} from '@/helperFunctions';
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
];

const querries = {
  tasks: async (root, { projectId, filterId, filter, sort }, { req, userID }) => {
    const User = await checkResolver(req);
    const mainWatch = new Stopwatch(true);
    let projectWhere = {};
    let taskWhere = {};
    if (projectId) {
      const Project = await models.Project.findByPk(projectId);
      if (Project === null) {
        throw createDoesNoExistsError('Project', projectId);
      }
      projectWhere = { id: projectId }
    }
    if (filterId) {
      const Filter = await models.Filter.findByPk(filterId);
      if (Filter === null) {
        throw createDoesNoExistsError('Filter', filterId);
      }
      filter = filterObjectToFilter(await Filter.get('filter'));
    }
    if (filter) {
      const dates = extractDatesFromObject(filter, dateNames2);
      taskWhere = filterToWhere({ ...filter, ...dates }, userID)
    }

    const checkUserWatch = new Stopwatch(true);
    let tasks = []
    if ((<RoleInstance>User.get('Role')).get('level') !== 0) {
      const ProjectGroups = <ProjectGroupInstance[]>await User.getProjectGroups({
        include: [
          models.ProjectGroupRights,
          {
            model: models.Project,
            where: projectWhere,
            required: true,
            include: [
              {
                model: models.Task,
                where: taskWhere,
                required: true,
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
                  models.Repeat,
                ]
              }
            ]
          }
        ]
      })
      tasks = (
        ProjectGroups.reduce((acc, ProjectGroup) => {
          const proj = <ProjectInstance>ProjectGroup.get('Project');
          const userRights = (<ProjectGroupRightsInstance>ProjectGroup.get('ProjectGroupRight')).get();
          return [
            ...acc,
            ...(<TaskInstance[]>proj.get('Tasks')).filter((Task) => canViewTask(Task, User, userRights))
          ]
        }, [])
      )
    } else {
      tasks = await models.Task.findAll({
        where: taskWhere,
        include: [
          { model: models.User, as: 'assignedTos' },
          models.Company,
          { model: models.User, as: 'createdBy' },
          models.Milestone,
          {
            model: models.Project,
            where: projectWhere,
            required: true,
          },
          { model: models.User, as: 'requester' },
          models.Status,
          models.Tag,
          models.TaskType,
          models.Repeat,
        ]
      })
    }

    const checkUserTime = checkUserWatch.stop();
    const manualWatch = new Stopwatch(true);
    /* BACKEND SORT - replaced by frontend dynamic sort
    let key = 'id';
    let asc = true;
    if (sort) {
      key = sort.key;
      asc = sort.asc;
    }
    let returnVal = asc ? 1 : -1;
    //SORT
    tasks.sort((Task1, Task2) => {
      if (['id', 'title'].includes(key)) {
        if (Task1.get(key) > Task2.get(key)) {
          return returnVal;
        } else if (Task2.get(key) > Task1.get(key)) {
          return returnVal * -1;
        }
      } else if (['createdAt', 'deadline'].includes(key)) {
        if (moment(Task1.get(key)).isAfter(Task2.get(key))) {
          return returnVal
        } else if (moment(Task2.get(key)).isAfter(Task1.get(key))) {
          return returnVal * -1;
        }
      } else if (key === 'status') {
        const Status1 = (<StatusInstance>Task1.get('Status'));
        const Status2 = (<StatusInstance>Task2.get('Status'));
        if (Status1.get('order') > Status2.get('order')) {
          return returnVal
        } else if (Status2.get('order') > Status1.get('order')) {
          return returnVal * -1;
        }
      } else if (key === 'requester') {
        const User1 = (<UserInstance>Task1.get('requester'));
        const User2 = (<UserInstance>Task2.get('requester'));
        if (User1.get('fullName') > User2.get('fullName')) {
          return returnVal;
        } else if (User2.get('fullName') > User1.get('fullName')) {
          return returnVal * -1;
        }
      } else if (key === 'assignedTo') {
        let Users1 = (<UserInstance[]>Task1.get('assignedTos')).map((User) => User.get('fullName')).sort((User1, User2) => User1 > User2 ? -1 : 1);
        let Users2 = (<UserInstance[]>Task2.get('assignedTos')).map((User) => User.get('fullName')).sort((User1, User2) => User1 > User2 ? -1 : 1);
        Users1.forEach((name, index) => {
          if (index >= Users2.length) {
            return returnVal;
          }
          if (Users2[index] !== name) {
            return name > Users2[index] ? returnVal : returnVal * -1;
          }
        })
        Users2.forEach((name, index) => {
          if (index >= Users1.length) {
            return returnVal * -1;
          }
          if (Users1[index] !== name) {
            return name > Users1[index] ? returnVal * -1 : returnVal;
          }
        })
      }
      if (Task1.get('important') && !Task2.get('important')) {
        return -1;
      }

      return 0;
    });
    */
    if (filter) {
      return {
        tasks: filterByOneOf(filter, User.get('id'), User.get('CompanyId'), tasks),
        execTime: mainWatch.stop(),
        secondaryTimes: [
          { source: 'User check', time: checkUserTime },
          { source: 'Processing', time: manualWatch.stop() },
        ]
      };
    }

    return {
      tasks,
      execTime: mainWatch.stop(),
      secondaryTimes: [
        { source: 'User check', time: checkUserTime },
        { source: 'Processing', time: manualWatch.stop() }
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
              include: [models.TaskType, models.InvoicedSubtask, { model: models.User, include: [models.Company] }]
            },
            {
              model: models.WorkTrip,
              include: [models.TripType, models.InvoicedTrip, { model: models.User, include: [models.Company] }]
            },
            {
              model: models.Material,
              include: [models.InvoicedMaterial],
            },
            {
              model: models.CustomItem,
              include: [models.InvoicedCustomItem],
            },
          ]
        }
      ),
    ])

    const Task = mergeFragmentedModel(FragmentedTask)
    const { groupRights } = await checkIfHasProjectRights(User.get('id'), id);
    if (!canViewTask(Task, User, groupRights, true)) {
      throw CantViewTaskError;
    }
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
            include: [models.User]
          },
        ]
      }
    );
    if (Project === undefined) {
      throw createDoesNoExistsError('project', project);
    }

    const def = await Project.get('def');
    args = applyFixedOnAttributes(def, args);

    let { assignedTo: assignedTos, company, milestone, requester, status, tags, taskType, repeat, comments, subtasks, workTrips, materials, customItems, shortSubtasks, scheduled, ...params } = args;

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
        }
      ]
    );
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

    if (assignedTos.length === 0) {
      throw TaskMustBeAssignedToAtLeastOneUser;
    }
    const groupUsers = <number[]>(<ProjectGroupInstance[]>Project.get('ProjectGroups')).reduce((acc, ProjectGroup) => {
      return [...acc, ...(<UserInstance[]>ProjectGroup.get('Users')).map((User) => User.get('id'))]
    }, [])
    //requester must be in project or project is open
    if (requester && Project.get('lockedRequester') && !groupUsers.includes(requester)) {
      throw createUserNotPartOfProjectError('requester');
    }

    //milestone must be of project
    if (milestone && !(<MilestoneInstance[]>Project.get('Milestones')).some((projectMilestone) => projectMilestone.get('id') === milestone)) {
      throw MilestoneNotPartOfProject;
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
      include: [models.Repeat, models.Comment, models.ScheduledTask, models.ShortSubtask, models.Subtask, models.WorkTrip, models.Material, models.CustomItem, { model: models.TaskChange, include: [{ model: models.TaskChangeMessage }] }]
    });
    await Promise.all([
      NewTask.setAssignedTos(assignedTos),
      NewTask.setTags(tags),
    ])
    sendNotifications(User, [`Task was created by ${User.get('fullName')}`], NewTask, assignedTos);
    pubsub.publish(TASK_CHANGE, { taskSubscription: { type: 'add', data: NewTask, ids: [] } });
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
      if (project && project !== (<ProjectInstance>Task.get('Project')).get('id')) {
        taskChangeMessages.push(await createChangeMessage('Project', models.Project, 'Project', project, Task.get('Project')));
        promises.push(Task.setProject(project, { transaction }));
        if (milestone === undefined || milestone === null) {
          promises.push(Task.setMilestone(null, { transaction }));
        }
      }
      if (assignedTos) {
        await idsDoExistsCheck(assignedTos, models.User);
        if (assignedTos.length === 0) {
          throw TaskMustBeAssignedToAtLeastOneUser;
        }
        //assignedTo must be in project group
        assignedTos = assignedTos.filter((assignedTo) => groupUsers.includes(assignedTo));
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

    let NewTask = await models.Task.findByPk(id, {
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
      async ({ taskSubscription }, { projectId, filterId, filter }, { userID }) => {
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
        if (filterId) {
          const Filter = await models.Filter.findByPk(filterId);
          if (Filter === null) {
            throw createDoesNoExistsError('Filter', filterId);
          }
          filter = filterObjectToFilter(await Filter.get('filter'));
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
    async assignedTo(task) {
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
      return getModelAttribute(task, 'requester');
    },
    async status(task) {
      return getModelAttribute(task, 'Status');
    },
    async tags(task) {
      return getModelAttribute(task, 'Tags');
    },
    async taskType(task) {
      return getModelAttribute(task, 'TaskType');
    },
    async repeat(task) {
      return getModelAttribute(task, 'Repeat');
    },

    async comments(task, body, { req, userID }) {
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
      return getModelAttribute(task, 'ShortSubtasks');
    },
    async scheduled(task) {
      return getModelAttribute(task, 'ScheduledTasks');
    },
    async subtasks(task) {
      return getModelAttribute(task, 'Subtasks');
    },
    async workTrips(task) {
      return getModelAttribute(task, 'WorkTrips');
    },
    async materials(task) {
      return getModelAttribute(task, 'Materials');
    },
    async customItems(task) {
      return getModelAttribute(task, 'CustomItems');
    },
    async calendarEvents(task) {
      return getModelAttribute(task, 'CalendarEvents');
    },
    async taskChanges(task) {
      return getModelAttribute(task, 'TaskChanges', 'getTaskChanges', { order: [['createdAt', 'DESC']] });
    },
    async taskAttachments(task) {
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
