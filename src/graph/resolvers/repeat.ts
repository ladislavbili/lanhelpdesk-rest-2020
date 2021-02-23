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
  UserInstance,
  CommentInstance,
  AccessRightsInstance,
  RoleInstance,
  SubtaskInstance,
  WorkTripInstance,
  TagInstance,
  TaskTypeInstance,
  CompanyInstance,
  RepeatTemplateInstance,
} from '@/models/instances';
import {
  idsDoExistsCheck,
  multipleIdDoesExistsCheck,
  filterObjectToFilter,
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
} from '@/helperFunctions';
import { repeatEvent } from '@/services/repeatTasks';
import { pubsub } from './index';
const { withFilter } = require('apollo-server-express');
import checkResolver from './checkResolver';
import moment from 'moment';
import { Op } from 'sequelize';
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
  repeats: async (root, { projectId }, { req, userID }) => {

    const User = await checkResolver(req);
    let repeats = []
    let templateWhere = <any>{}
    if (projectId) {
      templateWhere = {
        ProjectId: projectId
      }
    }
    if ((<RoleInstance>User.get('Role')).get('level') !== 0) {
      const ProjectGroups = <ProjectGroupInstance[]>await User.getProjectGroups({
        include: [
          models.ProjectGroupRights,
          {
            model: models.Project,
            required: true,
            include: [
              {
                model: models.RepeatTemplate,
                include: [
                  { model: models.User, as: 'createdBy' },
                  { model: models.User, as: 'assignedTos' },
                  { model: models.User, as: 'requester' },
                  models.Company,
                  models.Milestone,
                  models.Project,
                  models.Status,
                  models.Tag,
                  models.TaskType,
                ]
              }
            ]
          }
        ]
      })
      return ProjectGroups.reduce((acc, ProjectGroup) => {
        const proj = <ProjectInstance>ProjectGroup.get('Project');
        const userRights = (<ProjectGroupRightsInstance>ProjectGroup.get('ProjectGroupRight')).get();
        return [
          ...acc,
          ...(<RepeatInstance[]>proj.get('RepeatTemplates')).filter((RepeatTemplate) => canViewTask(RepeatTemplate, User, userRights))
        ]
      }, [])
    }
    return models.Repeat.findAll({
      include: [
        {
          model: models.RepeatTemplate,
          required: true,
          where: templateWhere,
          include: [
            { model: models.User, as: 'assignedTos' },
            { model: models.User, as: 'createdBy' },
            { model: models.User, as: 'requester' },
            models.Company,
            models.Milestone,
            {
              model: models.Project,
              required: true,
            },
            models.Status,
            models.Tag,
            models.TaskType,
            models.Repeat,
          ]
        }
      ]
    })
  },

  repeat: async (root, { id }, { req }) => {
    if (!id) {
      return null;
    }
    const User = await checkResolver(req);
    const FragmentedRepeat = await Promise.all([
      models.Repeat.findByPk(
        id,
        {
          include: [
            {
              model: models.RepeatTemplate,
              include: [
                { model: models.Project },
                models.RepeatTemplateAttachment,
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
          ]
        }
      ),
      models.Repeat.findByPk(
        id,
        {
          include: [
            {
              model: models.RepeatTemplate,
              include: [
                models.ShortSubtask,
                models.ScheduledTask,
                {
                  model: models.Subtask,
                  include: [models.TaskType, { model: models.User, include: [models.Company] }]
                },
                {
                  model: models.WorkTrip,
                  include: [models.TripType, { model: models.User, include: [models.Company] }]
                },
                {
                  model: models.Material,
                },
                {
                  model: models.CustomItem,
                },
              ]
            }
          ],
        }
      ),
    ])

    const RepeatTemplate = mergeFragmentedModel(FragmentedRepeat.map((Repeat) => Repeat.get('RepeatTemplate')))
    const { groupRights } = await checkIfHasProjectRights(User.get('id'), undefined, RepeatTemplate.get('ProjectId'), ['repeatRead']);
    if (!canViewTask(RepeatTemplate, User, groupRights, true)) {
      throw CantViewTaskError;
    }
    return mergeFragmentedModel([
      FragmentedRepeat[0],
      {
        repeatTemplate: RepeatTemplate
      }
    ]);
  },
}

const mutations = {
  addRepeat: async (root, { taskId, repeatEvery, repeatInterval, active, repeatTemplate: args, ...argDates }, { req }) => {

    const project = args.project;
    repeatEvery = parseInt(repeatEvery);
    const { startsAt } = extractDatesFromObject(argDates, ['startsAt']);
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

    let { assignedTo: assignedTos, company, milestone, requester, status, tags, taskType, subtasks, workTrips, materials, customItems, shortSubtasks, scheduled, ...params } = args;
    const User = await checkResolver(
      req,
      [],
      false,
      [
        {
          required: false,
          model: models.ProjectGroup,
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

    if (!groupRights.repeatWrite && (<RoleInstance>User.get('Role')).get('level') !== 0) {
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

    const NewRepeat = <RepeatInstance>await models.Repeat.create(
      {
        repeatEvery,
        repeatInterval,
        startsAt,
        active,
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
    if (taskId) {
      const Task = <TaskInstance>await models.Task.findByPk(taskId);
      if (Task && Task.get('ProjectId') === project) {
        Task.setRepeat(NewRepeat.get('id'));
      }
    }

    const NewRepeatTeplate = <RepeatTemplateInstance>await NewRepeat.get('RepeatTemplate');
    await Promise.all([
      NewRepeatTeplate.setAssignedTos(assignedTos),
      NewRepeatTeplate.setTags(tags),
    ])
    repeatEvent.emit('add', NewRepeat);
    return NewRepeat;
  },

  updateRepeat: async (root, { id, repeatEvery, repeatInterval, active, repeatTemplate: args, ...argDates }, { req }) => {
    repeatEvery = parseInt(repeatEvery);
    const { startsAt } = extractDatesFromObject(argDates, ['startsAt']);
    const Repeat = <RepeatInstance>await models.Repeat.findByPk(
      id,
      {
        include: [
          {
            model: models.RepeatTemplate,
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
        ]
      }
    );

    if (Repeat === undefined) {
      throw createDoesNoExistsError('Repeat', id);
    }
    const RepeatTemplate = <RepeatTemplateInstance>Repeat.get('RepeatTemplate');
    const User = await checkResolver(
      req,
      [],
      false,
      [
        {
          model: models.ProjectGroup,
          required: false,
          where: {
            ProjectId: [args.project, RepeatTemplate.get('ProjectId')].filter((id) => id),
          },
          include: [models.ProjectGroupRights],
        }
      ]
    );

    //Figure out project and if can change project
    if (args.project !== undefined && args.project !== RepeatTemplate.get('ProjectId')) {
      await checkIfHasProjectRights(User.get('id'), undefined, RepeatTemplate.get('ProjectId'), ['projectWrite']);
      await checkIfHasProjectRights(User.get('id'), undefined, args.project, ['projectWrite']);
    }
    const project = args.project ? args.project : RepeatTemplate.get('ProjectId');
    let Project = <ProjectInstance>RepeatTemplate.get('Project');
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

    let { assignedTo: assignedTos, company, milestone, requester, status, tags, taskType, ...params } = args;
    const dates = extractDatesFromObject(params, dateNames);
    params = { ...params, ...dates };
    const groupRights = (
      (<RoleInstance>User.get('Role')).get('level') === 0 ?
        allGroupRights :
        (<ProjectGroupRightsInstance>(<ProjectGroupInstance[]>User.get('ProjectGroups')).find((ProjectGroup) => ProjectGroup.get('ProjectId') === project).get('ProjectGroupRight')).get()
    )
    //can you even open this task
    if (!canViewTask(RepeatTemplate, User, groupRights, true)) {
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
        assignedTo: (<UserInstance[]>RepeatTemplate.get('assignedTos')).map((User) => User.get('id')),
        tags: (<TagInstance[]>RepeatTemplate.get('Tags')).map((Tag) => Tag.get('id')),
        company: RepeatTemplate.get('CompanyId'),
        requester: RepeatTemplate.get('RequesterId'),
        status: RepeatTemplate.get('StatusId'),
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
      if (project && project !== (<ProjectInstance>RepeatTemplate.get('Project')).get('id')) {
        promises.push(RepeatTemplate.setProject(project, { transaction }));
        if (milestone === undefined || milestone === null) {
          promises.push(RepeatTemplate.setMilestone(null, { transaction }));
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
        const Subtasks = <SubtaskInstance[]>await RepeatTemplate.get('Subtasks');
        const WorkTrips = <WorkTripInstance[]>await RepeatTemplate.get('WorkTrips');
        const allAssignedIds = [
          ...Subtasks.map((Subtask) => Subtask.get('UserId')),
          ...WorkTrips.map((WorkTrip) => WorkTrip.get('UserId')),
        ];
        if (!allAssignedIds.every((id) => assignedTos.includes(id))) {
          throw CantUpdateTaskAssignedToOldUsedInSubtasksOrWorkTripsError;
        }
        promises.push(RepeatTemplate.setAssignedTos(assignedTos, { transaction }))
      }
      if (tags) {
        await idsDoExistsCheck(tags, models.Tag);
        promises.push(RepeatTemplate.setTags(tags, { transaction }))
      }
      if (requester) {
        if (requester !== RepeatTemplate.get('requesterId') && Project.get('lockedRequester') && !groupUsers.includes(requester)) {
          throw createUserNotPartOfProjectError('requester');
        }
        promises.push(RepeatTemplate.setRequester(requester, { transaction }))
      }

      if (milestone || milestone === null) {
        //milestone must be of project
        if (milestone !== null && !(<MilestoneInstance[]>Project.get('Milestones')).some((projectMilestone) => projectMilestone.get('id') === milestone)) {
          throw MilestoneNotPartOfProject;
        }
        promises.push(RepeatTemplate.setMilestone(milestone, { transaction }))
      }
      if (taskType !== undefined) {
        promises.push(RepeatTemplate.setTaskType(taskType, { transaction }))
      }
      if (company) {
        promises.push(RepeatTemplate.setCompany(company, { transaction }))
      }

      //status corresponds to data - closedate, pendingDate
      //createdby
      if (status) {
        params = {
          ...params,
          closeDate: null,
          pendingDate: null,
          pendingChangable: false,
          statusChange: RepeatTemplate.get('statusChange'),
          invoicedDate: RepeatTemplate.get('invoicedDate'),
        }

        const TaskStatus = <StatusInstance>RepeatTemplate.get('Status');
        const Status = await models.Status.findByPk(status);
        if (status !== TaskStatus.get('id')) {
          promises.push(RepeatTemplate.setStatus(status, { transaction }))
        }
        switch (Status.get('action')) {
          case 'CloseDate': {
            if (TaskStatus.get('action') === 'CloseDate' && !args.closeDate) {
              params.closeDate = RepeatTemplate.get('closeDate');
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
              params.closeDate = RepeatTemplate.get('closeDate');
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
              params.pendingDate = RepeatTemplate.get('pendingDate');
              params.pendingChangable = RepeatTemplate.get('pendingChangable');
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
      }

      //repeat processing
      let repeatAttrs = <any>{};
      if (repeatEvery) {
        repeatAttrs = { ...repeatAttrs, repeatEvery };
      }
      if (active !== undefined) {
        repeatAttrs = { ...repeatAttrs, active };
      }
      if (repeatInterval) {
        repeatAttrs = { ...repeatAttrs, repeatInterval };
      }
      if (startsAt) {
        repeatAttrs = { ...repeatAttrs, startsAt };
      }
      if (repeatEvery || repeatInterval || startsAt || active !== undefined) {
        promises.push(Repeat.update(repeatAttrs, { transaction }));
      }
      promises.push(RepeatTemplate.update(params, { transaction }));
      await Promise.all(promises);
    })
    await Repeat.reload();

    if (repeatEvery || repeatInterval || startsAt || active !== undefined) {
      repeatEvent.emit('update', Repeat);
    }
    return Repeat;
  },

  deleteRepeat: async (root, { id }, { req }) => {
    const User = await checkResolver(req);
    const Repeat = <RepeatInstance>await models.Repeat.findByPk(
      id,
      {
        include: [
          {
            model: models.RepeatTemplate,
            include: [
              { model: models.User, as: 'assignedTos', attributes: ['id'] },
              {
                model: models.Project,
              },
            ]
          }
        ]
      }
    );
    const RepeatTemplate = <RepeatTemplateInstance>Repeat.get('RepeatTemplate');
    const Project = <ProjectInstance>RepeatTemplate.get('Project');
    //must right to delete project
    const { groupRights } = await checkIfHasProjectRights(User.get('id'), undefined, RepeatTemplate.get('ProjectId'), ['repeatWrite']);
    //can you even open this task
    if (!canViewTask(RepeatTemplate, User, groupRights, true)) {
      throw CantViewTaskError;
    }
    repeatEvent.emit('delete', id);
    return Repeat.destroy();
  }
}

const attributes = {
  Repeat: {
    async repeatTemplate(repeat) {

      return getModelAttribute(repeat, 'RepeatTemplate');
    },
  }
};

export default {
  attributes,
  mutations,
  querries,
}
