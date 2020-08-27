import { createDoesNoExistsError, InsufficientProjectAccessError, createUserNotPartOfProjectError, MilestoneNotPartOfProject, createProjectFixedAttributeError, StatusPendingAttributesMissing, TaskNotNullAttributesPresent } from 'configs/errors';
import { models, sequelize } from 'models';
import { TaskInstance, ProjectRightInstance, MilestoneInstance, ProjectInstance, StatusInstance, RepeatInstance, UserInstance } from 'models/instances';
import { idsDoExistsCheck, multipleIdDoesExistsCheck } from 'helperFunctions';
import checkResolver from './checkResolver';
import moment from 'moment';
import { Op } from 'sequelize';


const querries = {
  allTasks: async ( root, args, { req } ) => {
    await checkResolver( req );
    return models.Task.findAll();
  },
  tasks: async ( root, { projectId, filterId }, { req } ) => {

    const SourceUser = await checkResolver( req );
    let projectWhere = {};
    let taskWhere = {};
    if(projectId){
      const Project = await models.Project.findByPk(projectId);
      if(Project === null){
        throw createDoesNoExistsError('Project', projectId);
      }
      projectWhere = { id: projectId }
    }
    let Filter = null;
    if(filterId){
      Filter = await models.Filter.findByPk(filterId);
      if(Filter === null){
        throw createDoesNoExistsError('Filter', filterId);
      }
      taskWhere = filterToWhere( await Filter.get('filter'), SourceUser.get('id') )
    }

    const User = <UserInstance> await models.User.findByPk(SourceUser.get('id'), {
      include: [
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
                    {
                      model: models.User,
                      as: 'assignedTos'
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    });

    const tasks = (<ProjectRightInstance[]>User.get('ProjectRights')).map((ProjectRight) => <ProjectInstance>ProjectRight.get('Project') ).reduce((acc, proj) => [...acc, proj.get('Tasks')],[])
    if(filterId){
      return filterByOneOf(await Filter.get('filter'), SourceUser.get('id'), SourceUser.get('CompanyId'), tasks );
    }
    return tasks;
  },

  filteredTasks: async ( root, { projectId, filter }, { req } ) => {

    const SourceUser = await checkResolver( req );
    let projectWhere = {};
    let taskWhere = {};
    if(projectId){
      const Project = await models.Project.findByPk(projectId);
      if(Project === null){
        throw createDoesNoExistsError('Project', projectId);
      }
      projectWhere = { id: projectId }
    }
    if(filter){
      taskWhere = filterToWhere( filter, SourceUser.get('id') )
    }

    const User = <UserInstance> await models.User.findByPk(SourceUser.get('id'), {
      include: [
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
                    {
                      model: models.User,
                      as: 'assignedTos'
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    });

    const tasks = (<ProjectRightInstance[]>User.get('ProjectRights')).map((ProjectRight) => <ProjectInstance>ProjectRight.get('Project') ).reduce((acc, proj) => [...acc, proj.get('Tasks')],[])
    if(filter){
      return filterByOneOf(filter, SourceUser.get('id'), SourceUser.get('CompanyId'), tasks );
    }
    return tasks;
  },


  task: async ( root, { id }, { req } ) => {
    const User = await checkResolver( req );
    const Task = <TaskInstance> await models.Task.findByPk(id, { include: [{ model: models.Project, include: [{ model: models.ProjectRight }] }] });
    const Project = <ProjectInstance>Task.get('Project');
    //must right edit of project
    const ProjectRights = (<ProjectRightInstance[]> Project.get('ProjectRights'))
    const ProjectRight = ProjectRights.find( (right) => right.get('UserId') === User.get('id') );
    if( ProjectRight === undefined || !ProjectRight.get('read') ){
      throw InsufficientProjectAccessError;
    }
    return Task;
  },
}
const mutations = {
  addTask: async ( root, args, { req } ) => {
    let { assignedTo: assignedTos, company, milestone, project, requester, status, tags, taskType, repeat, ...params } = args;
    const User = await checkResolver( req );
    //check all Ids if exists
    const pairsToCheck = [ { id: company, model: models.Company }, { id: project, model: models.Project }, { id: status, model: models.Status }, { id: taskType, model: models.TaskType } ];
    (requester !== undefined || requester !== null) && pairsToCheck.push({ id: requester, model: models.User });
    (milestone !== undefined || milestone !== null) && pairsToCheck.push({ id: milestone, model: models.Milestone });
    await idsDoExistsCheck( assignedTos, models.User );
    await idsDoExistsCheck( tags, models.Tag );
    await multipleIdDoesExistsCheck( pairsToCheck );

    const Project = await models.Project.findByPk(
      project,
      {
        include: [{ model: models.ProjectRight }, { model: models.Milestone }]
      }
    );
    //must right edit of project
    const ProjectRights = (<ProjectRightInstance[]> Project.get('ProjectRights'))
    const ProjectRight = ProjectRights.find( (right) => right.get('UserId') === User.get('id') );
    if( ProjectRight === undefined || !ProjectRight.get('edit') ){
      throw InsufficientProjectAccessError;
    }

    //assignedTo must be in project
    if( assignedTos.some( (assignedTo) => !ProjectRights.some((right) => right.get('UserId') === assignedTo ) ) ){
      throw createUserNotPartOfProjectError('assignedTo');
    }
    //requester must be in project or project is open
    if( requester && Project.get('lockedRequester') && !ProjectRights.some((right) => right.get('UserId') === requester ) ){
      throw createUserNotPartOfProjectError('requester');
    }

    //milestone must be of project
    if( milestone && (<MilestoneInstance[]> Project.get('Milestones')).some( (projectMilestone) => projectMilestone.get('id') === milestone )){
      throw MilestoneNotPartOfProject;
    }

    //project def
    ['assignedTo', 'company', 'overtime', 'pausal', 'requester', 'status', 'tag', 'taskType'].forEach( (attribute) => {
      if(Project.get('def')[attribute].fixed){
        let value = Project.get('def')[attribute].value;
        //if is fixed, it must fit
        if(Array.isArray(value)){
          if(
            value.length !== args[attribute].value.length ||
            !value.every( (defValue) => args[attribute].value.some( (argValue) => argValue === defValue.get('id') ) )
          ){
            throw createProjectFixedAttributeError(attribute);
          }
        }else if( value.get('id') !== args[attribute].value ){
          throw createProjectFixedAttributeError(attribute);
        }
      }
    })

    //status corresponds to data - closedate, pendingDate
    //createdby
    params = {
      ...params,
      assignedTos,
      Tags: tags,
      createdById: User.get('id'),
      CompanyId: company,
      ProjectId: project,
      MilestoneId: milestone === undefined ? null : milestone,
      requesterId: requester === undefined ? null : requester,
      TaskTypeId: taskType,

      closeDate: null,
      pendingDate: null,
      pendingChangable: false,
      statusChange: moment().unix()*1000,
      invoicedDate: null,
    }
    const Status = await models.Status.findByPk(status);
    switch (Status.get('action')) {
      case 'CloseDate':{
        if(args.closeDate === undefined){
          params.closeDate = moment().unix()*1000;
        }else{
          params.closeDate = args.closeDate;
        }
        break;
      }
      case 'CloseInvalid':{
        if(args.closeDate === undefined){
          params.closeDate = moment().unix()*1000;
        }else{
          params.closeDate = args.closeDate;
        }
        break;
      }
      case 'PendingDate':{
        if(args.pendingDate === undefined || args.pendingChangable === undefined ){
          throw StatusPendingAttributesMissing;
        }else{
          params.pendingDate = args.pendingDate;
          params.pendingChangable = args.pendingChangable;
        }
        break;
      }
      default:
      break;
    }
    //repeat processing
    if( repeat !== null && repeat !== undefined ){
      params = {
        ...params,
        Repeat: repeat
      }
    }
    return models.Task.create(params, {
      include: [{ model: models.Repeat }]
    });
  },
  updateTask: async ( root, args, { req } ) => {
    let { id, assignedTo: assignedTos, company, milestone, project, requester, status, tags, taskType, repeat, ...params } = args;
    const User = await checkResolver( req );
    if(
      company === null ||
      project === null ||
      status === null ||
      taskType === null
    ){
      throw TaskNotNullAttributesPresent;
    }
    //check all Ids if exists
    const pairsToCheck = [{ id, model: models.Task }];
    ( company !== undefined ) && pairsToCheck.push({ id: company, model: models.Company });
    ( project !== undefined ) && pairsToCheck.push({ id: project, model: models.Project });
    ( status !== undefined ) && pairsToCheck.push({ id: status, model: models.Status });
    ( taskType !== undefined ) && pairsToCheck.push({ id: taskType, model: models.TaskType });
    ( requester !== undefined || requester !== null ) && pairsToCheck.push({ id: requester, model: models.User });
    ( milestone !== undefined || milestone !== null ) && pairsToCheck.push({ id: milestone, model: models.Milestone });
    await multipleIdDoesExistsCheck( pairsToCheck );

    const Task = <TaskInstance> await models.Task.findByPk(id, { include: [{ model: models.Repeat }, { model: models.Status }, { model: models.Project, include: [{ model: models.ProjectRight }, { model: models.Milestone }] } ] });

    let Project = <ProjectInstance>Task.get('Project');
    //must right edit of project
    let ProjectRights = (<ProjectRightInstance[]> Project.get('ProjectRights'))
    let ProjectRight = ProjectRights.find( (right) => right.get('UserId') === User.get('id') );
    if( ProjectRight === undefined || !ProjectRight.get('edit') ){
      throw InsufficientProjectAccessError;
    }

    if(project && project !== Project.get('id')){
      Project = <ProjectInstance> await models.Project.findByPk(
        project,
        {
          include: [{ model: models.ProjectRight }, { model: models.Milestone }]
        }
      );
      if( Project === null ){
        throw createDoesNoExistsError('Project', project)
      }
      //must right edit of project
      ProjectRights = (<ProjectRightInstance[]> Project.get('ProjectRights'))
      ProjectRight = ProjectRights.find( (right) => right.get('UserId') === User.get('id') );
      if( ProjectRight === undefined || !ProjectRight.get('edit') ){
        throw InsufficientProjectAccessError
      }
    }

    await sequelize.transaction(async (t) => {
      let promises = [];
      if(project && project !== (<ProjectInstance>Task.get('Project')).get('id')){
        promises.push(Task.setProject( project, { transaction: t }));
        if(milestone === undefined || milestone  === null ){
          promises.push(Task.setMilestone( null, { transaction: t } ));
        }
      }
      if( assignedTos ){
        await idsDoExistsCheck( assignedTos, models.User );
        //assignedTo must be in project
        assignedTos = assignedTos.filter( (assignedTo) => ProjectRights.some((right) => right.get('UserId') === assignedTo ));
        promises.push(Task.setAssignedTos(assignedTos,{ transaction: t }))
      }
      if( tags ){
        await idsDoExistsCheck( tags, models.Tag );
        promises.push(Task.setTags(tags,{ transaction: t }))
      }
      if( requester ){
        //requester must be in project or project is open
        if( Project.get('lockedRequester') && !ProjectRights.some((right) => right.get('UserId') === requester ) ){
          throw createUserNotPartOfProjectError('requester');
        }
        promises.push(Task.setRequester(requester,{ transaction: t }))
      }
      if( milestone ){
        //milestone must be of project
        if((<MilestoneInstance[]> Project.get('Milestones')).some( (projectMilestone) => projectMilestone.get('id') === milestone )){
          throw MilestoneNotPartOfProject;
        }
        promises.push(Task.setMilestone(milestone,{ transaction: t }))
      }
      if( taskType ){
        promises.push(Task.setTaskType(taskType,{ transaction: t }))
      }
      if( company ){
        promises.push(Task.setCompany(company,{ transaction: t }))
      }

      //project def
      ['assignedTo', 'company', 'overtime', 'pausal', 'requester', 'status', 'tag', 'taskType']
      .filter( (attribute) => args[attribute] !== undefined )
      .forEach( (attribute) => {
        if(Project.get('def')[attribute].fixed){
          let value = Project.get('def')[attribute].value;
          //if is fixed, it must fit
          if(Array.isArray(value)){
            if(
              value.length !== args[attribute].value.length ||
              !value.every( (defValue) => args[attribute].value.some( (argValue) => argValue === defValue.get('id') ) )
            ){
              throw createProjectFixedAttributeError(attribute);
            }
          }else if( value.get('id') !== args[attribute].value ){
            throw createProjectFixedAttributeError(attribute);
          }
        }
      })

      //status corresponds to data - closedate, pendingDate
      //createdby
      if(status){
        params = {
          ...params,
          closeDate: null,
          pendingDate: null,
          pendingChangable: false,
          statusChange: Task.get('statusChange'),
          invoicedDate: Task.get('invoicedDate'),
        }
        const TaskStatus = <StatusInstance> Task.get('Status');
        const Status = await models.Status.findByPk(status);
        if( status !== TaskStatus.get('id') ){
          promises.push(Task.setStatus(status,{ transaction: t }))
        }
        switch (Status.get('action')) {
          case 'CloseDate':{
            if(TaskStatus.get('action') === 'CloseDate' && !args.closeDate ){
              params.closeDate = Task.get('closeDate');
              break;
            }
            if(args.closeDate === undefined){
              params.closeDate = moment().unix()*1000;
            }else{
              params.closeDate = args.closeDate;
            }
            params.statusChange = moment().unix()*1000
            break;
          }
          case 'CloseInvalid':{
            if(TaskStatus.get('action') === 'CloseInvalid' && !args.closeDate ){
              params.closeDate = Task.get('closeDate');
              break;
            }
            if(args.closeDate === undefined){
              params.closeDate = moment().unix()*1000;
            }else{
              params.closeDate = args.closeDate;
            }
            params.statusChange = moment().unix()*1000
            break;
          }
          case 'PendingDate':{
            if(TaskStatus.get('action') === 'PendingDate' && !args.pendingDate ){
              params.pendingDate = Task.get('pendingDate');
              params.pendingChangable = Task.get('pendingChangable');
              break;
            }
            if(args.pendingDate === undefined || args.pendingChangable === undefined ){
              throw StatusPendingAttributesMissing;
            }else{
              params.pendingDate = args.pendingDate;
              params.pendingChangable = args.pendingChangable;
            }
            params.statusChange = moment().unix()*1000
            break;
          }
          default:
          break;
        }

      }
      //repeat processing
      if( repeat === null ){
        //promises.push(Task.deleteRepeat({ transaction: t }));
      }
      if( repeat !== undefined ){
        promises.push((<RepeatInstance>Task.get('Repeat')).update(repeat, { transaction: t }));
      }
      promises.push(Task.update(params, { transaction: t }));
      await promises;
    })
    return Task
  },
  deleteTask: async ( root, { id }, { req } ) => {
    const User = await checkResolver( req );
    const Task = <TaskInstance> await models.Task.findByPk(id, { include: [{ model: models.Project, include: [{ model: models.ProjectRight }] }] });
    const Project = <ProjectInstance>Task.get('Project');
    //must right edit of project
    const ProjectRights = (<ProjectRightInstance[]> Project.get('ProjectRights'))
    const ProjectRight = ProjectRights.find( (right) => right.get('UserId') === User.get('id') );
    if( ProjectRight === undefined || !ProjectRight.get('delete') ){
      throw InsufficientProjectAccessError;
    }
    return Task.destroy();
  }
}

const attributes = {
  Task: {
    async assignedTo(task) {
      return task.getAssignedTos()
    },
    async company(task) {
      return task.getCompany()
    },
    async createdBy(task) {
      return task.getCreatedBy()
    },
    async milestone(task) {
      return task.getMilestone()
    },
    async project(task) {
      return task.getProject()
    },
    async requester(task) {
      return task.getRequester()
    },
    async status(task) {
      return task.getStatus()
    },
    async tags(task) {
      return task.getTags()
    },
    async taskType(task) {
      return task.getTaskType()
    },
    async repeat(task) {
      return task.getRepeat()
    },
  }
};

export default {
  attributes,
  mutations,
  querries
}

function filterToWhere(filter, userId) {
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
  let where = { };

  if(taskType){
    where = {
      ...where,
      taskType
    }
  }



  //STATUS DATE
  let statusDateConditions = {};
  if(statusDateFromNow){
    statusDateFrom = moment().toDate();
  }
  if(statusDateToNow){
    statusDateTo = moment().toDate();
  }

  if(statusDateFrom){
    statusDateConditions = { ...statusDateConditions, [Op.gte]: statusDateFrom }
  }
  if(statusDateTo){
    statusDateConditions = { ...statusDateConditions, [Op.lte]: statusDateTo }
  }
  if( statusDateFrom || statusDateTo ){
    where = {
      ...where,
      statusChange: {
        [Op.and]: statusDateConditions
      }
    }
  }

  //PENDING DATE
  let pendingDateConditions = {};
  if(pendingDateFromNow){
    pendingDateFrom = moment().toDate();
  }
  if(pendingDateToNow){
    pendingDateTo = moment().toDate();
  }

  if(pendingDateFrom){
    pendingDateConditions = { ...pendingDateConditions, [Op.gte]: pendingDateFrom }
  }
  if(pendingDateTo){
    pendingDateConditions = { ...pendingDateConditions, [Op.lte]: pendingDateTo }
  }
  if( pendingDateFrom || pendingDateTo ){
    where = {
      ...where,
      pendingDate: {
        [Op.and]: pendingDateConditions
      }
    }
  }

  //CLOSE DATE
  let closeDateConditions = {};
  if(closeDateFromNow){
    closeDateFrom = moment().toDate();
  }
  if(closeDateToNow){
    closeDateTo = moment().toDate();
  }

  if(closeDateFrom){
    closeDateConditions = { ...closeDateConditions, [Op.gte]: closeDateFrom }
  }
  if(closeDateTo){
    closeDateConditions = { ...closeDateConditions, [Op.lte]: closeDateTo }
  }
  if( closeDateFrom || closeDateTo ){
    where = {
      ...where,
      closeDate: {
        [Op.and]: closeDateConditions
      }
    }
  }


  //DEADLINE
  let deadlineConditions = {};
  if(deadlineFromNow){
    deadlineFrom = moment().toDate();
  }
  if(deadlineToNow){
    deadlineTo = moment().toDate();
  }

  if(deadlineFrom){
    deadlineConditions = { ...deadlineConditions, [Op.gte]: deadlineFrom }
  }
  if(deadlineTo){
    deadlineConditions = { ...deadlineConditions, [Op.lte]: deadlineTo }
  }
  if( deadlineFrom || deadlineTo ){
    where = {
      ...where,
      deadline: {
        [Op.and]: deadlineConditions
      }
    }
  }

  return where;
}

function filterByOneOf(filter, userId, companyId, tasks ) {
  let {
    assignedTo,
    assignedToCur,
    requester,
    requesterCur,
    company,
    companyCur,
    oneOf
  } = filter;

  if(assignedToCur){
    assignedTo = userId;
  }
  if(requesterCur){
    requester = userId;
  }
  if(companyCur){
    company = companyId;
  }
  return tasks.filter( (task) => {
    let oneOfConditions = [];
    if(assignedTo){
      if(oneOf.includes('assigned')){
        oneOfConditions.push(task.get('assignedTos').some((user) => user.get('id') === assignedTo ))
      }else if( !task.get('assignedTos').some((user) => user.get('id') === assignedTo ) ){
        return false;
      }
    }
    if(requester){
      if(oneOf.includes('requester')){
        oneOfConditions.push( task.get('requesterId') === requester )
      }else if( task.get('requesterId') !== requester ){
        return false;
      }
    }
    if(company){
      if(oneOf.includes('company')){
        oneOfConditions.push( task.get('CompanyId') === company )
      }else if( task.get('CompanyId') !== company ){
        return false;
      }
    }
    return oneOfConditions.length === 0 || oneOfConditions.every((cond) => cond );
  } )

}
