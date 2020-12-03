import { createDoesNoExistsError, InsufficientProjectAccessError, createUserNotPartOfProjectError, MilestoneNotPartOfProject, createProjectFixedAttributeError, StatusPendingAttributesMissing, TaskNotNullAttributesPresent, InternalMessagesNotAllowed, TaskMustBeAssignedToAtLeastOneUser, AssignedToUserNotSolvingTheTask, InvalidTokenError, CantUpdateTaskAssignedToOldUsedInSubtasksOrWorkTripsError } from '@/configs/errors';
import { models, sequelize } from '@/models';
import { TaskInstance, ProjectRightInstance, MilestoneInstance, ProjectInstance, StatusInstance, RepeatInstance, UserInstance, CommentInstance, AccessRightsInstance, RoleInstance, SubtaskInstance, WorkTripInstance } from '@/models/instances';
import {
  idsDoExistsCheck,
  multipleIdDoesExistsCheck,
  checkIfHasProjectRights,
  filterObjectToFilter,
  taskCheckDate,
  extractDatesFromObject,
  filterUnique,
  getModelAttribute,
  mergeFragmentedModel
} from '@/helperFunctions';
import { repeatEvent } from '@/services/repeatTasks';
import { pubsub } from './index';
const { withFilter } = require('apollo-server-express');
import { TASK_CHANGE } from '@/configs/subscriptions';
import checkResolver from './checkResolver';
import moment from 'moment';
import { Op } from 'sequelize';
import Stopwatch from 'statman-stopwatch';
import { sendEmail } from '@/services/smtp';
const dateNames = ['deadline', 'pendingDate', 'closeDate'];

const querries = {
  allTasks: async (root, args, { req }) => {
    await checkResolver(req);
    return models.Task.findAll({
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
        models.Repeat
      ]
    });
  },

  tasks: async (root, { projectId, filterId, filter }, { req, userID }) => {
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
      taskWhere = filterToWhere(filter, userID)
    }
    const checkUserWatch = new Stopwatch(true);
    const User = await checkResolver(
      req,
      [],
      false,
      [
        {
          model: models.ProjectRight,
          include: [
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
        }
      ]
    );
    const checkUserTime = checkUserWatch.stop();
    const manualWatch = new Stopwatch(true);
    const tasks = (<ProjectRightInstance[]>User.get('ProjectRights')).map((ProjectRight) => <ProjectInstance>ProjectRight.get('Project')).reduce((acc, proj) => [...acc, ...<TaskInstance[]>proj.get('Tasks')], [])

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
            { model: models.Project, include: [models.ProjectRight] },
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
            {
              model: models.TaskChange,
              include: [
                models.User,
                models.TaskChangeMessage
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
            {
              model: models.Comment,
              include: [
                models.User,
                models.EmailTarget,
                models.CommentAttachment,
                {
                  model: models.Comment,
                  include: [
                    models.User,
                    models.EmailTarget,
                    models.CommentAttachment,
                    models.Comment,
                  ]
                }
              ]
            }
          ]
        }
      ),
      models.Task.findByPk(
        id,
        {
          include: [
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

    const Project = <ProjectInstance>Task.get('Project');
    //must right write of project
    const ProjectRights = (<ProjectRightInstance[]>Project.get('ProjectRights'))
    const ProjectRight = ProjectRights.find((right) => right.get('UserId') === User.get('id'));
    if (ProjectRight === undefined || !ProjectRight.get('read')) {
      throw InsufficientProjectAccessError;
    }
    return Task;
  },
}
const mutations = {
  addTask: async (root, args, { req }) => {
    let { assignedTo: assignedTos, company, milestone, project, requester, status, tags, taskType, repeat, comments, subtasks, workTrips, materials, customItems, ...params } = args;
    const User = await checkResolver(req);
    //check all Ids if exists
    const pairsToCheck = [{ id: company, model: models.Company }, { id: project, model: models.Project }, { id: status, model: models.Status }, { id: taskType, model: models.TaskType }];
    (requester !== undefined && requester !== null) && pairsToCheck.push({ id: requester, model: models.User });
    (milestone !== undefined && milestone !== null) && pairsToCheck.push({ id: milestone, model: models.Milestone });
    await idsDoExistsCheck(assignedTos, models.User);
    await idsDoExistsCheck(tags, models.Tag);
    await multipleIdDoesExistsCheck(pairsToCheck);

    const Project = await models.Project.findByPk(
      project,
      {
        include: [{ model: models.ProjectRight }, { model: models.Milestone }]
      }
    );
    //must right write of project
    const ProjectRights = (<ProjectRightInstance[]>Project.get('ProjectRights'))
    const ProjectRight = ProjectRights.find((right) => right.get('UserId') === User.get('id'));
    if (ProjectRight === undefined || !ProjectRight.get('write')) {
      throw InsufficientProjectAccessError;
    }

    //assignedTo must be in project
    if (assignedTos.some((assignedTo) => !ProjectRights.some((right) => right.get('UserId') === assignedTo))) {
      throw createUserNotPartOfProjectError('assignedTo');
    }
    if (assignedTos.length === 0) {
      throw TaskMustBeAssignedToAtLeastOneUser;
    }
    //requester must be in project or project is open
    if (requester && Project.get('lockedRequester') && !ProjectRights.some((right) => right.get('UserId') === requester)) {
      throw createUserNotPartOfProjectError('requester');
    }

    //milestone must be of project
    if (milestone && !(<MilestoneInstance[]>Project.get('Milestones')).some((projectMilestone) => projectMilestone.get('id') === milestone)) {
      throw MilestoneNotPartOfProject;
    }

    //project def
    const projectDef = await Project.get('def');
    (['assignedTo', 'tag']).forEach((attribute) => {
      if (projectDef[attribute].fixed) {
        let values = projectDef[attribute].value.map((value) => value.get('id'));
        //if is fixed, it must fit
        if (
          values.length !== args[attribute].length ||
          args[attribute].some((argValue) => !values.includes(argValue))
        ) {
          throw createProjectFixedAttributeError(attribute);
        }
      }
    });

    (['overtime', 'pausal']).forEach((attribute) => {
      if (projectDef[attribute].fixed) {
        let value = projectDef[attribute].value;
        //if is fixed, it must fit
        if (value !== args[attribute]) {
          throw createProjectFixedAttributeError(attribute);
        }
      }
    });

    (['company', 'requester', 'status', 'taskType']).forEach((attribute) => {
      if (projectDef[attribute].fixed) {
        let value = projectDef[attribute].value.get('id');
        //if is fixed, it must fit
        if (value !== args[attribute]) {
          throw createProjectFixedAttributeError(attribute);
        }
      }
    });
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
    //repeat processing
    if (repeat !== null && repeat !== undefined) {
      params = {
        ...params,
        Repeat: { ...repeat, startsAt: parseInt(repeat.startsAt), repeatEvery: parseInt(repeat.repeatEvery) }
      }
    }
    //comments processing
    const allowedInternal = (<AccessRightsInstance>(<RoleInstance>User.get('Role')).get('AccessRight')).get('internal');
    if (comments) {
      comments.forEach((comment) => {
        if (comment.internal && !ProjectRight.get('internal') && !allowedInternal) {
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
        Subtasks: subtasks.map((subtask) => ({ ...subtask, UserId: subtask.assignedTo, TaskTypeId: subtask.type }))
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
        WorkTrips: workTrips.map((workTrip) => ({ ...workTrip, UserId: workTrip.assignedTo, TripTypeId: workTrip.type }))
      }
    }
    //Material
    if (materials) {
      params = {
        ...params,
        Materials: materials
      }
    }
    //CustomItem
    if (customItems) {
      params = {
        ...params,
        CustomItems: customItems
      }
    }

    const NewTask = <TaskInstance>await models.Task.create(params, {
      include: [{ model: models.Repeat }, { model: models.Comment }, { model: models.Subtask }, { model: models.WorkTrip }, { model: models.Material }, { model: models.CustomItem }, { model: models.TaskChange, include: [{ model: models.TaskChangeMessage }] }]
    });
    await Promise.all([
      NewTask.setAssignedTos(assignedTos),
      NewTask.setTags(tags),
    ])
    if (repeat !== null && repeat !== undefined) {
      repeatEvent.emit('add', await NewTask.get('Repeat'));
    }
    sendNotifications(User, [`Task was created by ${User.get('fullName')}`], NewTask, assignedTos);
    pubsub.publish(TASK_CHANGE, { taskSubscription: { type: 'add', data: NewTask, ids: [] } });
    return NewTask;
  },

  updateTask: async (root, args, { req }) => {
    let { id, assignedTo: assignedTos, company, milestone, project, requester, status, tags, taskType, repeat, ...params } = args;
    let repeatAction = { action: null, id: null };
    const dates = extractDatesFromObject(params, dateNames);
    params = { ...params, ...dates };
    const User = await checkResolver(req);
    //if you send something it cant be null in this attributes, if undefined its ok
    if (
      company === null ||
      project === null ||
      status === null ||
      taskType === null
    ) {
      throw TaskNotNullAttributesPresent;
    }
    //check all Ids if exists
    const pairsToCheck = [{ id, model: models.Task }];
    (company !== undefined) && pairsToCheck.push({ id: company, model: models.Company });
    (project !== undefined) && pairsToCheck.push({ id: project, model: models.Project });
    (status !== undefined) && pairsToCheck.push({ id: status, model: models.Status });
    (taskType !== undefined) && pairsToCheck.push({ id: taskType, model: models.TaskType });
    (requester !== undefined && requester !== null) && pairsToCheck.push({ id: requester, model: models.User });
    (milestone !== undefined && milestone !== null) && pairsToCheck.push({ id: milestone, model: models.Milestone });
    await multipleIdDoesExistsCheck(pairsToCheck);

    const Task = <TaskInstance>await models.Task.findByPk(
      id,
      {
        include: [
          { model: models.Repeat },
          { model: models.User, as: 'assignedTos', attributes: ['id'] },
          { model: models.Status },
          { model: models.Subtask },
          { model: models.WorkTrip },
          {
            model: models.Project,
            include: [
              { model: models.ProjectRight },
              { model: models.Milestone }
            ]
          }
        ]
      }
    );

    let Project = <ProjectInstance>Task.get('Project');
    //must right write of project
    let ProjectRights = (<ProjectRightInstance[]>Project.get('ProjectRights'))
    let ProjectRight = ProjectRights.find((right) => right.get('UserId') === User.get('id'));
    if (ProjectRight === undefined || !ProjectRight.get('write')) {
      throw InsufficientProjectAccessError;
    }

    if (project && project !== Project.get('id')) {
      Project = <ProjectInstance>await models.Project.findByPk(
        project,
        {
          include: [{ model: models.ProjectRight }, { model: models.Milestone }]
        }
      );
      if (Project === null) {
        throw createDoesNoExistsError('Project', project)
      }
      //must right write of project
      ProjectRights = (<ProjectRightInstance[]>Project.get('ProjectRights'))
      ProjectRight = ProjectRights.find((right) => right.get('UserId') === User.get('id'));
      if (ProjectRight === undefined || !ProjectRight.get('write')) {
        throw InsufficientProjectAccessError
      }
    }
    let taskChangeMessages = [];
    let promises = [];

    await sequelize.transaction(async (transaction) => {
      if (project && project !== (<ProjectInstance>Task.get('Project')).get('id')) {
        taskChangeMessages.push({
          type: 'project',
          originalValue: Task.get('ProjectId'),
          newValue: project,
          message: `Project was changed from ${(<ProjectInstance>Task.get('Project')).get('title')} to ${Project.get('title')}`,
        });
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
        //assignedTo must be in project
        assignedTos = assignedTos.filter((assignedTo) => ProjectRights.some((right) => right.get('UserId') === assignedTo));
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

        promises.push(Task.setAssignedTos(assignedTos, { transaction }))
      }
      if (tags) {
        await idsDoExistsCheck(tags, models.Tag);
        promises.push(Task.setTags(tags, { transaction }))
      }
      if (requester && requester !== Task.get('requesterId')) {
        //requester must be in project or project is open
        if (Project.get('lockedRequester') && !ProjectRights.some((right) => right.get('UserId') === requester)) {
          throw createUserNotPartOfProjectError('requester');
        }
        taskChangeMessages.push({
          type: 'requester',
          originalValue: Task.get('RequesterId'),
          newValue: requester,
          message: `Requester was changed from ${(<UserInstance>await Task.getRequester()).get('fullName')} to ${(await models.User.findByPk(requester)).get('fullName')}`,
        });

        promises.push(Task.setRequester(requester, { transaction }))
      }

      if (milestone) {
        //milestone must be of project
        if (!(<MilestoneInstance[]>Project.get('Milestones')).some((projectMilestone) => projectMilestone.get('id') === milestone)) {
          throw MilestoneNotPartOfProject;
        }
        promises.push(Task.setMilestone(milestone, { transaction }))
      } else if (milestone === null) {
        promises.push(Task.setMilestone(null, { transaction }))
      }
      if (taskType) {
        promises.push(Task.setTaskType(taskType, { transaction }))
      }
      if (company) {
        promises.push(Task.setCompany(company, { transaction }))
      }

      //project def
      const projectDef = await Project.get('def');
      (['assignedTo', 'tag']).forEach((attribute) => {
        if (projectDef[attribute].fixed && args[attribute] !== undefined) {
          let values = projectDef[attribute].value.map((value) => value.get('id'));
          //if is fixed, it must fit
          if (
            values.length !== args[attribute].length ||
            args[attribute].some((argValue) => !values.includes(argValue))
          ) {
            throw createProjectFixedAttributeError(attribute);
          }
        }
      });

      (['overtime', 'pausal']).forEach((attribute) => {
        if (projectDef[attribute].fixed && args[attribute] !== undefined) {
          let value = projectDef[attribute].value;
          //if is fixed, it must fit
          if (value !== args[attribute]) {
            throw createProjectFixedAttributeError(attribute);
          }
        }
      });

      (['company', 'requester', 'status', 'taskType']).forEach((attribute) => {
        if (projectDef[attribute].fixed && args[attribute] !== undefined) {
          let value = projectDef[attribute].value.get('id');
          //if is fixed, it must fit
          if (value !== args[attribute]) {
            throw createProjectFixedAttributeError(attribute);
          }
        }
      });

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
          taskChangeMessages.push({
            type: 'status',
            originalValue: TaskStatus.get('id'),
            newValue: status,
            message: `Status was changed from ${TaskStatus.get('title')} to ${Status.get('title')}`,
          });
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
            params.statusChange = moment().valueOf()
            break;
          }
          default:
            break;
        }

        promises.push(Task.setStatus(status, { transaction }))
      }
      //repeat processing
      if (repeat === null && (<RepeatInstance>Task.get('Repeat')) !== null) {
        promises.push((<RepeatInstance>Task.get('Repeat')).destroy({ transaction }));
        repeatAction = { action: 'delete', id: (<RepeatInstance>Task.get('Repeat')).get('id') };
      }
      else if (repeat !== undefined && repeat !== null) {
        if ((<RepeatInstance>Task.get('Repeat')) !== null) {
          promises.push((<RepeatInstance>Task.get('Repeat')).update({ ...repeat, startsAt: parseInt(repeat.startsAt), repeatEvery: parseInt(repeat.repeatEvery) }, { transaction }));
          repeatAction = { action: 'update', id: null };
        } else {
          promises.push(Task.createRepeat({ ...repeat, startsAt: parseInt(repeat.startsAt), repeatEvery: parseInt(repeat.repeatEvery) }, { transaction }));
          repeatAction = { action: 'add', id: null };
        }
      }
      promises.push(
        Task.createTaskChange({
          UserId: User.get('id'),
          TaskChangeMessages: taskChangeMessages,
        }, { transaction, include: [{ model: models.TaskChangeMessage }] })
      );
      promises.push(Task.update(params, { transaction }));
      await Promise.all(promises);
    })
    switch (repeatAction.action) {
      case 'add': {
        repeatEvent.emit('add', await Task.get('Repeat'));
        break;
      }
      case 'update': {
        repeatEvent.emit('update', await Task.get('Repeat'));
        break;
      }
      case 'delete': {
        repeatEvent.emit('delete', repeatAction.id);
        break;
      }
      default:
        break;
    }
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
        models.Repeat,
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
            include: [
              { model: models.ProjectRight }
            ]
          }
        ]
      }
    );
    const Project = <ProjectInstance>Task.get('Project');
    //must right write of project
    const ProjectRights = (<ProjectRightInstance[]>Project.get('ProjectRights'))
    const ProjectRight = ProjectRights.find((right) => right.get('UserId') === User.get('id'));
    if (ProjectRight === undefined || !ProjectRight.get('delete')) {
      throw InsufficientProjectAccessError;
    }
    repeatEvent.emit('delete', id);
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
        { internal },
        Comments,

      ] = await Promise.all([
        checkResolver(req),
        checkIfHasProjectRights(userID, task.get('id')),
        getModelAttribute(task, 'Comments', 'getComments', { order: [['createdAt', 'DESC']] })
      ])
      const AccessRights = <AccessRightsInstance>(<RoleInstance>SourceUser.get('Role')).get('AccessRight');
      return Comments.filter((Comment) => Comment.get('isParent') && (!Comment.get('internal') || internal || AccessRights.get('internal')))
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

export async function sendNotifications(User, notifications, Task, assignedTos = []) {
  const AssignedTos = Task.get('assignedTos');
  const ids = [Task.get('requesterId'), ...(AssignedTos ? AssignedTos.map((assignedTo) => assignedTo.get('id')) : assignedTos)];
  const uniqueIds = filterUnique(ids).filter((id) => User === null || User.get('id') !== id);
  if (uniqueIds.length === 0) {
    return;
  }
  const Users = await models.User.findAll({ where: { id: uniqueIds, receiveNotifications: true } });
  if (Users.length === 0) {
    return;
  }
  sendEmail(
    `In task with id ${Task.get('id')} and current title ${Task.get('title')} was changed at ${moment().format('HH:mm DD.MM.YYYY')}.
    Recorded notifications by ${User === null ? 'system' : (`user ${User.get('fullName')}(${User.get('email')})`)} as follows:
${
    notifications.length === 0 ?
      `Non-specified change has happened.
      ` :
      notifications.reduce((acc, notification) => acc + ` ${notification}
`, ``)
    }
This is an automated message.If you don't wish to receive this kind of notification, please log in and change your profile setting.
  `,
    "",
    `[${Task.get('id')}]Task ${Task.get('title')} was changed notification at ${moment().format('HH:mm DD.MM.YYYY')} `,
    Users.map((User) => User.get('email')),
    'lanhelpdesk2019@gmail.com'
  );

}

export function filterToWhere(filter, userId) {
  let {
    taskType,

    statusDateFrom,
    statusDateFromNow,
    statusDateTo,
    statusDateToNow,

    pendingDateFrom,
    pendingDateFromNow,
    pendingDateTo,
    pendingDateToNow,

    closeDateFrom,
    closeDateFromNow,
    closeDateTo,
    closeDateToNow,

    deadlineFrom,
    deadlineFromNow,
    deadlineTo,
    deadlineToNow,
  } = filter;
  let where = {};

  if (taskType) {
    where = {
      ...where,
      taskType
    }
  }



  //STATUS DATE
  let statusDateConditions = {};
  if (statusDateFromNow) {
    statusDateFrom = moment().toDate();
  }
  if (statusDateToNow) {
    statusDateTo = moment().toDate();
  }

  if (statusDateFrom) {
    statusDateConditions = { ...statusDateConditions, [Op.gte]: statusDateFrom }
  }
  if (statusDateTo) {
    statusDateConditions = { ...statusDateConditions, [Op.lte]: statusDateTo }
  }
  if (statusDateFrom || statusDateTo) {
    where = {
      ...where,
      statusChange: {
        [Op.and]: statusDateConditions
      }
    }
  }

  //PENDING DATE
  let pendingDateConditions = {};
  if (pendingDateFromNow) {
    pendingDateFrom = moment().toDate();
  }
  if (pendingDateToNow) {
    pendingDateTo = moment().toDate();
  }

  if (pendingDateFrom) {
    pendingDateConditions = { ...pendingDateConditions, [Op.gte]: pendingDateFrom }
  }
  if (pendingDateTo) {
    pendingDateConditions = { ...pendingDateConditions, [Op.lte]: pendingDateTo }
  }
  if (pendingDateFrom || pendingDateTo) {
    where = {
      ...where,
      pendingDate: {
        [Op.and]: pendingDateConditions
      }
    }
  }

  //CLOSE DATE
  let closeDateConditions = {};
  if (closeDateFromNow) {
    closeDateFrom = moment().toDate();
  }
  if (closeDateToNow) {
    closeDateTo = moment().toDate();
  }

  if (closeDateFrom) {
    closeDateConditions = { ...closeDateConditions, [Op.gte]: closeDateFrom }
  }
  if (closeDateTo) {
    closeDateConditions = { ...closeDateConditions, [Op.lte]: closeDateTo }
  }
  if (closeDateFrom || closeDateTo) {
    where = {
      ...where,
      closeDate: {
        [Op.and]: closeDateConditions
      }
    }
  }


  //DEADLINE
  let deadlineConditions = {};
  if (deadlineFromNow) {
    deadlineFrom = moment().toDate();
  }
  if (deadlineToNow) {
    deadlineTo = moment().toDate();
  }

  if (deadlineFrom) {
    deadlineConditions = { ...deadlineConditions, [Op.gte]: deadlineFrom }
  }
  if (deadlineTo) {
    deadlineConditions = { ...deadlineConditions, [Op.lte]: deadlineTo }
  }
  if (deadlineFrom || deadlineTo) {
    where = {
      ...where,
      deadline: {
        [Op.and]: deadlineConditions
      }
    }
  }

  return where;
}

export function filterByOneOf(filter, userId, companyId, tasks) {
  let {
    assignedTo,
    assignedToCur,
    requester,
    requesterCur,
    company,
    companyCur,
    oneOf
  } = filter;

  if (assignedToCur) {
    assignedTo = userId;
  }
  if (requesterCur) {
    requester = userId;
  }
  if (companyCur) {
    company = companyId;
  }
  return tasks.filter((task) => {
    let oneOfConditions = [];
    if (assignedTo) {
      if (oneOf.includes('assigned')) {
        oneOfConditions.push(task.get('assignedTos').some((user) => user.get('id') === assignedTo))
      } else if (!task.get('assignedTos').some((user) => user.get('id') === assignedTo)) {
        return false;
      }
    }
    if (requester) {
      if (oneOf.includes('requester')) {
        oneOfConditions.push(task.get('requesterId') === requester)
      } else if (task.get('requesterId') !== requester) {
        return false;
      }
    }
    if (company) {
      if (oneOf.includes('company')) {
        oneOfConditions.push(task.get('CompanyId') === company)
      } else if (task.get('CompanyId') !== company) {
        return false;
      }
    }
    return oneOfConditions.length === 0 || oneOfConditions.every((cond) => cond);
  })

}
