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
import {
  TaskInstance,
  MilestoneInstance,
  ProjectInstance,
  ProjectAttributesInstance,
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
  RepeatTimeInstance,
} from '@/models/instances';
import { QueryTypes } from 'sequelize';
import {
  idsDoExistsCheck,
  multipleIdDoesExistsCheck,
  extractDatesFromObject,
  getModelAttribute,
  mergeFragmentedModel,
  addApolloError,
  getMinutes,
} from '@/helperFunctions';
import {
  checkIfHasProjectRights,
  canViewTask,
  mergeGroupRights,
  processProjectDataAdd,
  processProjectDataEdit,
} from '@/graph/addons/project';
import { repeatEvent, repeatTimeEvent, addTask } from '@/services/repeatTasks';
import checkResolver from './checkResolver';
import moment from 'moment';
import { Op } from 'sequelize';
import { generateRepeatSQL } from '../addons/repeat';
const dateNames = ['deadline', 'pendingDate', 'closeDate'];
import { REPEAT_CHANGE } from '@/configs/subscriptions';
import { pubsub } from './index';
const { withFilter } = require('apollo-server-express');
const scheduledDateNames = ['from', 'to'];

const queries = {
  repeats: async (root, { projectId, milestoneId, active, ...rangeDates }, { req, userID }) => {
    const User = await checkResolver(req);

    let repeatWhere = <any>{};
    if (active !== undefined) {
      repeatWhere = { active }
    }

    let repeats = []
    let templateWhere = <any>{}
    if (projectId) {
      templateWhere = {
        ProjectId: projectId
      }
    }

    const { from, to } = extractDatesFromObject(rangeDates, ['from', 'to'], false);

    if ((<RoleInstance>User.get('Role')).get('level') !== 0) {
      const userProjectsResponse = <any[]>(<any[]>
        await Promise.all([
          models.Project.findAll({
            include: [
              {
                model: models.ProjectGroup,
                required: true,
                include: [
                  {
                    model: models.User,
                    required: true,
                    where: { id: User.get('id') },
                  },
                  {
                    model: models.ProjectGroupRights,
                    required: true,
                    where: { repeatView: true },
                  }
                ],
              }
            ]
          }),
          models.Project.findAll({
            include: [
              {
                model: models.ProjectGroup,
                required: true,
                include: [
                  {
                    model: models.Company,
                    required: true,
                    where: { id: User.get('CompanyId') },
                  },
                  {
                    model: models.ProjectGroupRights,
                    required: true,
                    where: { repeatView: true },
                  }
                ],
              }
            ]
          })
        ])
      ).reduce((acc, Projects) => {
        return [
          ...acc,
          ...(<ProjectInstance[]>Projects).map((Project) => { return { id: Project.get('id'), groupRights: <ProjectGroupRightsInstance>(<ProjectGroupInstance[]>Project.get("ProjectGroups"))[0].get('ProjectGroupRight') } }),
        ]
      }, []);

      let userProjects = [];
      await Promise.all(userProjectsResponse.map(async (userProject) => {
        const sameProjects = userProjectsResponse.filter((userProject2) => userProject2.id === userProject.id);
        if (!userProjects.some((userProject2) => userProject2.id === userProject.id)) {
          const groupRights = await mergeGroupRights(sameProjects[0].groupRights, sameProjects[1] ? sameProjects[1].groupRights : null);
          userProjects.push({ id: userProject.id, groupRights });
        }
      }));

      const RepeatsResponse = <RepeatInstance[]>await models.Repeat.findAll({
        where: repeatWhere,
        include: [
          {
            model: models.RepeatTime,
            include: [{
              model: models.Task,
            }]
          },
          {
            model: models.RepeatTemplate,
            required: true,
            where: {
              ProjectId: userProjects.map((userProject) => userProject.id)
            },
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
      });

      const Repeats = RepeatsResponse.filter((Repeat) => {
        const Template = <RepeatTemplateInstance>Repeat.get('RepeatTemplate');
        const groupRights = userProjects.find((userProject) => userProject.id === Template.get('ProjectId')).groupRights;
        return canViewTask(Template, User, groupRights.project);
      }).map((Repeat) => {
        const Template = Repeat.get('RepeatTemplate');
        const groupRights = userProjects.find((userProject) => userProject.id === Template.get('ProjectId')).groupRights;
        Repeat.canEdit = <boolean>groupRights.attributes.repeat.edit;
        return Repeat;
      })
      return Repeats;
    }
    const Repeats = <RepeatInstance[]>await models.Repeat.findAll({
      where: repeatWhere,
      include: [
        {
          model: models.RepeatTime,
          include: [models.Task]
        },
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
              include: [{
                model: models.ProjectGroup,
                where: {
                  admin: true,
                  def: true,
                },
                include: [{
                  model: models.ProjectGroupRights,
                  required: true,
                  where: { repeatView: true }
                }]
              }],
            },
            models.Status,
            models.Tag,
            models.TaskType,
            models.Repeat,
          ]
        }
      ]
    });
    return Repeats.map((Repeat) => {
      Repeat.canEdit = (
        <ProjectGroupRightsInstance>(
          <ProjectGroupInstance[]>(
            <ProjectInstance>(
              <RepeatTemplateInstance>Repeat.get('RepeatTemplate')
            ).get('Project')
          ).get('ProjectGroups')
        )[0].get('ProjectGroupRight')
      ).get('repeatEdit');
      return Repeat;
    })
  },

  calendarRepeats: async (root, { projectId, active, ...rangeDates }, { req, userID }) => {
    const User = await checkResolver(req);

    const { from, to } = extractDatesFromObject(rangeDates, ['from', 'to']);

    const SQL = generateRepeatSQL(
      active,
      from,
      to,
      projectId,
      userID,
      User.get('CompanyId'),
      (<AccessRightsInstance>(<RoleInstance>User.get('Role')).get('AccessRight')).get('tasklistCalendar'),
      (<RoleInstance>User.get('Role')).get('level') === 0
    )
    let responseRepeats = await sequelize.query(SQL, {
      model: models.Repeat,
      type: QueryTypes.SELECT,
      nest: true,
      raw: true,
      mapToModel: true
    });

    return responseRepeats;
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
                {
                  model: models.Subtask,
                  include: [models.TaskType, models.ScheduledWork, { model: models.User, include: [models.Company] }]
                },
                {
                  model: models.WorkTrip,
                  include: [models.TripType, models.ScheduledWork, { model: models.User, include: [models.Company] }]
                },
                models.Material,
              ]
            }
          ],
        }
      ),
    ])

    const RepeatTemplate = mergeFragmentedModel(FragmentedRepeat.map((Repeat) => Repeat.get('RepeatTemplate')))
    const { groupRights } = await checkIfHasProjectRights(User, undefined, RepeatTemplate.get('ProjectId'), [], [{ right: 'repeat', action: 'view' }]);

    if (!canViewTask(RepeatTemplate, User, groupRights.project, true)) {
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
    const User = await checkResolver(req);
    const project = args.project;
    const { startsAt } = extractDatesFromObject(argDates, ['startsAt']);
    const Project = <ProjectInstance>await models.Project.findByPk(
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
        ]
      }
    );
    if (Project === undefined) {
      throw createDoesNoExistsError('project', project);
    }

    const ProjectGroups = <ProjectGroupInstance[]>await Project.getProjectGroups({
      model: models.ProjectGroup,
      attributes: ['id', 'admin', 'def'],
      include: [{ model: models.User, attributes: ['id'] }, { model: models.Company, attributes: ['id'], include: [{ model: models.User, attributes: ['id'] }] }, models.ProjectGroupRights]
    });
    //get users rights in the project
    let userGroupRights = <any>{};
    const UserProjectGroupRights = <ProjectGroupRightsInstance[]>ProjectGroups.filter((ProjectGroup) => (
      (<UserInstance[]>ProjectGroup.get('Users')).some((GroupUser) => GroupUser.get('id') === User.get('id')) ||
      (<CompanyInstance[]>ProjectGroup.get('Companies')).some((Company) => Company.get('id') === User.get('CompanyId'))
    )).map((ProjectGroup) => ProjectGroup.get('ProjectGroupRight'));

    if ((<RoleInstance>User.get('Role')).get('level') === 0) {
      userGroupRights = await mergeGroupRights(
        ProjectGroups.find((ProjectGroup) => (ProjectGroup.get('admin') && ProjectGroup.get('def')))
          .get('ProjectGroupRight')
      );
    } else if (UserProjectGroupRights.length === 0) {
      throw InsufficientProjectAccessError;
    } else {
      userGroupRights = await mergeGroupRights(UserProjectGroupRights[0], UserProjectGroupRights[1]);
    }

    if (!userGroupRights.attributes.repeat.edit) {
      addApolloError(
        'Project',
        CantCreateTasksError,
        User.get('id'),
        project
      );
      throw CantCreateTasksError;
    }

    const Task = await models.Task.findByPk(taskId, {
      include: [
        { model: models.User, as: 'assignedTos' },
        models.Tag,
        models.Status,
        models.TaskType,
        models.Company,
        { model: models.User, as: 'requester' },
      ]
    });

    if (Task) {
      args = await processProjectDataEdit(User, Project, userGroupRights.attributes, args, Task, true);
    } else {
      args = await processProjectDataAdd(User, Project, userGroupRights.attributes, args);
    }

    let { assignedTo: assignedTos, company, milestone, requester, status, tags, taskType, subtasks, workTrips, materials, shortSubtasks, ...params } = args;

    const dates = extractDatesFromObject(params, dateNames);
    //status corresponds to data - closedate, pendingDate
    //createdby
    params = {
      ...params,
      ...dates,
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
            models.ShortSubtask,
            { model: models.Subtask, include: [models.ScheduledWork] },
            { model: models.WorkTrip, include: [models.ScheduledWork] },
            models.Material,
          ]
        }]
      }
    );
    if (taskId) {
      const Task = <TaskInstance>await models.Task.findByPk(taskId);
      Task.setRepeat(NewRepeat.get('id'));
    }

    const NewRepeatTeplate = <RepeatTemplateInstance>await NewRepeat.get('RepeatTemplate');
    await Promise.all([
      NewRepeatTeplate.setAssignedTos(assignedTos),
      NewRepeatTeplate.setTags(tags),
    ])
    repeatEvent.emit('add', NewRepeat);
    pubsub.publish(REPEAT_CHANGE, { repeatsSubscription: true });
    return NewRepeat;
  },

  updateRepeat: async (root, { id, repeatEvery, repeatInterval, active, repeatTemplate: args, ...argDates }, { req }) => {
    const User = await checkResolver(req);
    const { startsAt } = extractDatesFromObject(argDates, ['startsAt']);

    if (!args) {
      args = {};
    }
    const Repeat = <RepeatInstance>await models.Repeat.findByPk(
      id,
      {
        include: [
          models.RepeatTime,
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
                ],
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


    const project = args.project ? args.project : RepeatTemplate.get('ProjectId');
    let Project = <ProjectInstance>RepeatTemplate.get('Project');
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
    let userGroupRights = null;
    const requiredGroupRights = args.project !== undefined && args.project !== RepeatTemplate.get('ProjectId') ? ['taskProjectWrite'] : [];
    const TestData1 = await checkIfHasProjectRights(User, undefined, RepeatTemplate.get('ProjectId'), requiredGroupRights, [{ right: 'repeat', action: 'edit' }]);
    userGroupRights = <any>TestData1.groupRights;
    if (args.project !== undefined && args.project !== RepeatTemplate.get('ProjectId')) {
      const TestData2 = await checkIfHasProjectRights(User, undefined, args.project, ['taskProjectWrite'], [{ right: 'repeat', action: 'edit' }]);
      userGroupRights = <any>TestData2.groupRights;
    }

    args = await processProjectDataEdit(User, Project, userGroupRights.attributes, args, RepeatTemplate);

    let { assignedTo: assignedTos, company, milestone, requester, status, tags, taskType, ...params } = args;
    const dates = extractDatesFromObject(params, dateNames);
    params = { ...params, ...dates };

    //can you even open this task
    if (!canViewTask(RepeatTemplate, User, userGroupRights.project, true)) {
      throw CantViewTaskError;
    }

    let promises = [];

    await sequelize.transaction(async (transaction) => {
      if (project && project !== (<ProjectInstance>RepeatTemplate.get('Project')).get('id')) {
        promises.push(RepeatTemplate.setProject(project, { transaction }));
        //here was milestone with condition if exists
      }
      if (assignedTos) {
        promises.push(RepeatTemplate.setAssignedTos(assignedTos, { transaction }))
      }

      if (tags) {
        promises.push(RepeatTemplate.setTags(tags, { transaction }))
      }
      if (requester) {
        promises.push(RepeatTemplate.setRequester(requester, { transaction }))
      }
      //here was milestone with condition if and of project
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
      //update RepeatTimes due to originalTimeshift
      if (startsAt && !repeatInterval && !repeatEvery) {
        const shift = Repeat.get('startsAt').valueOf() - startsAt;
        (<RepeatTimeInstance[]>Repeat.get('RepeatTimes')).forEach((RepeatTime) => {
          promises.push(RepeatTime.update(
            {
              originalTrigger: RepeatTime.get('originalTrigger').valueOf() + shift
            },
            { transaction }
          ));
        });
      } else if (repeatInterval || repeatEvery) {
        const originalTriggerEvery = 1000 * 60 * getMinutes(
          Repeat.get('repeatEvery'),
          Repeat.get('repeatInterval')
        );

        const newTriggerEvery = 1000 * 60 * getMinutes(
          (repeatEvery ? repeatEvery : Repeat.get('repeatEvery')),
          (repeatInterval ? repeatInterval : Repeat.get('repeatInterval'))
        );

        const originalStartsAt = Repeat.get('startsAt').valueOf();
        (<RepeatTimeInstance[]>Repeat.get('RepeatTimes')).forEach((RepeatTime) => {
          const originalTrigger = RepeatTime.get('originalTrigger').valueOf();
          const isTriggerBeforeStart = originalTrigger < originalStartsAt;
          const newOriginalTrigger = (
            isTriggerBeforeStart ?
              (
                originalStartsAt - ((originalStartsAt - originalTrigger) * (newTriggerEvery / originalTriggerEvery)) +
                (startsAt ? originalStartsAt - startsAt : 0)
              )
              :
              (
                (originalTrigger - originalStartsAt) /
                originalTriggerEvery *
                newTriggerEvery
              ) + startsAt
          );
          promises.push(RepeatTime.update({ originalTrigger: newOriginalTrigger }, { transaction }));
        })
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
    pubsub.publish(REPEAT_CHANGE, { repeatsSubscription: true });
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
    const { groupRights } = await checkIfHasProjectRights(User, undefined, RepeatTemplate.get('ProjectId'), [], [{ right: 'repeat', action: 'edit' }]);
    //can you even view this task
    if (!canViewTask(RepeatTemplate, User, groupRights.project, true)) {
      throw CantViewTaskError;
    }
    repeatEvent.emit('delete', id);
    await Repeat.destroy();
    pubsub.publish(REPEAT_CHANGE, { repeatsSubscription: true });
    return Repeat;
  },

  triggerRepeat: async (root, { repeatId, repeatTimeId, ...dates }, { req }) => {
    let originalTrigger = null;
    if (repeatTimeId) {
      const RepeatTime = <RepeatTimeInstance>await models.RepeatTime.findByPk(repeatTimeId);
      if (RepeatTime === undefined) {
        throw createDoesNoExistsError('Repeat time', repeatId);
      }
    } else {
      originalTrigger = extractDatesFromObject(dates, ['originalTrigger']).originalTrigger;
    }
    const Repeat = <RepeatInstance>await models.Repeat.findByPk(
      repeatId,
      {
        include: [models.RepeatTemplate]
      }
    );

    if (Repeat === undefined) {
      throw createDoesNoExistsError('Repeat', repeatId);
    }
    const RepeatTemplate = <RepeatTemplateInstance>Repeat.get('RepeatTemplate');
    const User = await checkResolver(req);

    //Figure out project and if can create tasks and sees repeats
    const { groupRights } = await checkIfHasProjectRights(User, undefined, RepeatTemplate.get('ProjectId'), ['addTask'], [{ right: 'repeat', action: 'read' }]);

    //check if can trigger repeat
    if (!(<AccessRightsInstance>(<RoleInstance>User.get('Role')).get('AccessRight')).get('tasklistCalendar') && !groupRights.project.tasklistKalendar) {
      throw InsufficientProjectAccessError;
    }

    const NewTask = await addTask(repeatId, repeatTimeId, originalTrigger, true);
    repeatTimeEvent.emit('changed', repeatId);
    //get or create repeatTime and set it as triggered
    return NewTask;
  },
}

const attributes = {
  Repeat: {
    async repeatTemplate(repeat) {
      return getModelAttribute(repeat, 'RepeatTemplate');
    },
    async repeatTimes(repeat) {
      return getModelAttribute(repeat, 'RepeatTimes');
    },
  }
};

const subscriptions = {
  repeatsSubscription: {
    subscribe: withFilter(
      () => pubsub.asyncIterator(REPEAT_CHANGE),
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
