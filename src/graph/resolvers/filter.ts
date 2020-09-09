import { createDoesNoExistsError, NoAccessToThisProjectError, NoAccessToThisFilterError } from 'configs/errors';
import { models } from 'models';
import { FilterInstance, RoleInstance, ProjectRightInstance } from 'models/instances';
import checkResolver from './checkResolver';
import { idDoesExistsCheck, idsDoExistsCheck, multipleIdDoesExistsCheck, splitArrayByFilter, extractDatesFromObject } from 'helperFunctions';
import { Op } from 'sequelize';
const dateNames = ['statusDateFrom', 'statusDateTo', 'pendingDateFrom', 'pendingDateTo', 'closeDateFrom', 'closeDateTo', 'deadlineFrom', 'deadlineTo'];

const querries = {
  myFilters: async ( root , args, { req } ) => {
    const User = await checkResolver( req );
    const Filters = <FilterInstance[]> await models.Filter.findAll({
      order: [
        ['order', 'ASC'],
        ['title', 'ASC'],
      ],
      where: {
        [Op.or]: [
          { pub: true },
          { filterCreatedById: User.get('id') }
        ]
      },
      include: [
        { model: models.Role }
      ],
    })
    //either created by user or has same role as user and is pub
    return Filters.filter((filter) => (
      (filter.get('pub') && ( <RoleInstance[]> filter.get('Roles')).some( (role) => role.get('id') === (<RoleInstance> User.get('Role')).get('id') )) ||
      !filter.get('pub')
    ) )
  },

  publicFilters: async ( root , args, { req } ) => {
    await checkResolver( req, ['publicFilters'] );
    return models.Filter.findAll({
      order: [
        ['order', 'ASC'],
        ['title', 'ASC'],
      ],
      where: { pub: true }
    })
  },

  filter: async ( root, { id }, { req } ) => {
    await checkResolver( req, ["publicFilters"] );
    const Filter = await models.Filter.findByPk(id);
    if(!Filter.get('pub')){
      return null;
    }
    return Filter;
  },
}

const mutations = {
  //( title: String!, pub: Boolean!, global: Boolean!, dashboard: Boolean!, filter: FilterInput!, order: Int, roles: [Int], projectId: Int )
  addFilter: async ( root, { roles, filter, order, pub, projectId, ...args }, { req } ) => {
    const dates = extractDatesFromObject(filter, dateNames);

    let User = null;
    //if pub must have order,roles and user must have access
    if(pub){
      User = await checkResolver( req, ["publicFilters"] );
      if(!order){
        order = 0;
      }
      if(!roles){
        roles = [];
      }
    } else {
      User = await checkResolver( req );
      delete args['order'];
    };

    //if project, must be at least read and exists
    if(projectId){
      const Project = await models.Project.findByPk(
        projectId,
        {
        include: [
          { model: models.ProjectRight }
        ]
        }
      );
      if(Project === null){
        throw createDoesNoExistsError('Project', projectId);
      }
      const userRights = (<ProjectRightInstance[]> Project.get('ProjectRights')).find( (right) => right.get('UserId') === User.get('id') );
      if( userRights === undefined || !userRights.read ){
        //cant work with project you have no rights to read
        throw NoAccessToThisProjectError;
      }
    }else{
      projectId: null
    }

    //Filter
    const { assignedTo, requester, company, taskType, oneOf, ...directFilterParams } = filter;
    const checkPairs = [ { model: models.User ,id: assignedTo }, { model: models.User ,id: requester }, { model: models.Company ,id: company }, { model: models.TaskType ,id: taskType } ].filter((pair) => pair.id !== undefined && pair.id !== null );
    await multipleIdDoesExistsCheck(checkPairs);

    if(pub){
      await idsDoExistsCheck( roles, models.Role);
      const newFilter = <FilterInstance> await models.Filter.create({
        ...args,
        order,
        ProjectId: projectId,
        filterCreatedById: User.get('id'),
        filterAssignedToId: assignedTo ? assignedTo : null,
        filterRequesterId: requester ? requester : null,
        filterCompanyId: company ? company : null,
        filterTaskTypeId: taskType ? taskType : null,
        ...directFilterParams,
        ...dates,
        pub: true,
        FilterOneOfs: oneOf.map((item) => ({ input: item }) ),
      }, {
        include: [{ model: models.FilterOneOf }]
      });
      return newFilter.setRoles(roles);
    }
    return models.Filter.create({
      ...args,
      ProjectId: projectId,
      filterCreatedById: User.get('id'),
      filterAssignedToId: assignedTo ? assignedTo : null,
      filterRequesterId: requester ? requester : null,
      filterCompanyId: company ? company : null,
      filterTaskTypeId: taskType ? taskType : null,
      ...directFilterParams,
      pub: false,
      FilterOneOfs: oneOf.map((item) => ({ input: item }) ),
    }, {
      include: [{ model: models.FilterOneOf }]
    });
  },

  addPublicFilter: async ( root, { roles, filter, order, projectId, ...args }, { req } ) => {
    const User = await checkResolver( req, ["publicFilters"] );
    const dates = extractDatesFromObject(filter, dateNames);

    //if project, must be at least read and exists
    if(projectId){
      const Project = await models.Project.findByPk(
        projectId,
        {
          include: [
            { model: models.ProjectRight }
          ]
        }
      );
      if(Project === null){
        throw createDoesNoExistsError('Project', projectId);
      }
      const userRights = (<ProjectRightInstance[]> Project.get('ProjectRights')).find( (right) => right.get('UserId') === User.get('id') );
      if( userRights === undefined || !userRights.read ){
        //cant work with project you have no rights to read
        throw NoAccessToThisProjectError;
      }
    }else{
      projectId: null
    }

    //Filter
    const { assignedTo, requester, company, taskType, oneOf, ...directFilterParams } = filter;
    const checkPairs = [ { model: models.User ,id: assignedTo }, { model: models.User ,id: requester }, { model: models.Company ,id: company }, { model: models.TaskType ,id: taskType } ].filter((pair) => pair.id !== undefined && pair.id !== null );
    await multipleIdDoesExistsCheck(checkPairs);

    await idsDoExistsCheck( roles, models.Role);
    const newFilter = <FilterInstance> await models.Filter.create({
      ...args,
      order,
      ProjectId: projectId,
      filterCreatedById: User.get('id'),
      filterAssignedToId: assignedTo ? assignedTo : null,
      filterRequesterId: requester ? requester : null,
      filterCompanyId: company ? company : null,
      filterTaskTypeId: taskType ? taskType : null,
      ...directFilterParams,
      ...dates,
      pub: false,
      FilterOneOfs: oneOf.map((item) => ({ input: item }) ),
    }, {
      include: [{ model: models.FilterOneOf }]
    });
    return newFilter.setRoles(roles);
  },

  //updateFilter - id! title pub! global! dashboard! filter order roles projectId
  updateFilter: async ( root, { id, roles, filter, order, pub, projectId, ...args }, { req } ) => {
    let User = null;
    const Filter = <FilterInstance> await models.Filter.findByPk(id, { include: [{ model: models.FilterOneOf }] });
    if( Filter === null ){
      throw createDoesNoExistsError('Filter', id);
    }
    //if pub must have order,roles and user must have access

    if(pub || Filter.get('pub')){
      User = await checkResolver( req, ["publicFilters"] );
      if(roles){
        await idsDoExistsCheck( roles, models.Role);
      }
    } else {
      User = await checkResolver( req );
    };

    //if project, must be at least read and exists
    if(projectId){
      const Project = await models.Project.findByPk(
        projectId,
        {
        include: [
          { model: models.ProjectRight }
        ]
        }
      );
      if(Project === null){
        throw createDoesNoExistsError('Project', projectId);
      }
      const userRights = (<ProjectRightInstance[]> Project.get('ProjectRights')).find( (right) => right.get('UserId') === User.get('id') );
      if( userRights === undefined || !userRights.read ){
        //cant work with project you have no rights to read
        throw NoAccessToThisProjectError;
      }
    }

    //BUILDING changes
    let changes = {};
    let promises = [];
    if(filter){
      //Filter
      const { assignedTo, requester, company, taskType, oneOf: oneOfs, ...directFilterParams } = filter;
      const dates = extractDatesFromObject(filter, dateNames);
      const checkPairs = [ { model: models.User ,id: assignedTo }, { model: models.User ,id: requester }, { model: models.Company ,id: company }, { model: models.TaskType ,id: taskType } ].filter((pair) => pair.id !== undefined && pair.id !== null );
      await multipleIdDoesExistsCheck(checkPairs);
      changes = {...directFilterParams, ...dates};
      assignedTo !== undefined && promises.push(Filter.setFilterAssignedTo(assignedTo));
      requester !== undefined && promises.push(Filter.setFilterRequester(requester));
      company !== undefined && promises.push(Filter.setFilterCompany(company));
      taskType !== undefined && promises.push(Filter.setFilterTaskType(taskType));
      //One of
      const [existingOneOfs, deletedOneOfs] = splitArrayByFilter(Filter.get('FilterOneOfs'), ( (filterOneOf) => oneOfs.some((oneOf) => oneOf === filterOneOf.get('input') )));
      const newOneOfs = oneOfs.filter( (oneOf) => !existingOneOfs.some( (filterOneOf) => filterOneOf.get('input') === oneOf ) )
      deletedOneOfs.forEach( (oneOf) => promises.push(oneOf.destroy()) );
      newOneOfs.forEach( (oneOf) => promises.push(Filter.createFilterOneOf({ input: oneOf })) );
    }

    projectId !== undefined && promises.push(Filter.setFilterOfProject(projectId));
    changes = { ...changes, ...args }
    if(pub){
      changes = { ...changes, pub }
      if(order){
        changes = { ...changes, order }
      }
      if(roles){
        promises.push(Filter.setRoles(roles));
      }
    }
    promises.push(Filter.update(changes))
    await promises;
    return Filter;
  },

  updatePublicFilter: async ( root, { id, roles, filter, order, projectId, ...args }, { req } ) => {
    let User = await checkResolver( req, ["publicFilters"] );
    const Filter = <FilterInstance> await models.Filter.findByPk(id, { include: [{ model: models.FilterOneOf }] });
    if( Filter === null || !Filter.get('pub') ){
      throw createDoesNoExistsError('Filter', id);
    }
    if(roles){
      await idsDoExistsCheck( roles, models.Role);
    }

    //if project, must be at least read and exists
    if(projectId){
      const Project = await models.Project.findByPk(
        projectId,
        {
        include: [
          { model: models.ProjectRight }
        ]
        }
      );
      if(Project === null){
        throw createDoesNoExistsError('Project', projectId);
      }
      const userRights = (<ProjectRightInstance[]> Project.get('ProjectRights')).find( (right) => right.get('UserId') === User.get('id') );
      if( userRights === undefined || !userRights.read ){
        //cant work with project you have no rights to read
        throw NoAccessToThisProjectError;
      }
    }

    //BUILDING changes
    let changes = {};
    let promises = [];
    if(filter){
      //Filter
      const { assignedTo, requester, company, taskType, oneOf: oneOfs, ...directFilterParams } = filter;
      const dates = extractDatesFromObject(filter, dateNames);
      const checkPairs = [ { model: models.User ,id: assignedTo }, { model: models.User ,id: requester }, { model: models.Company ,id: company }, { model: models.TaskType ,id: taskType } ].filter((pair) => pair.id !== undefined && pair.id !== null );
      await multipleIdDoesExistsCheck(checkPairs);
      changes = {...directFilterParams, ...dates};
      assignedTo !== undefined && promises.push(Filter.setFilterAssignedTo(assignedTo));
      requester !== undefined && promises.push(Filter.setFilterRequester(requester));
      company !== undefined && promises.push(Filter.setFilterCompany(company));
      taskType !== undefined && promises.push(Filter.setFilterTaskType(taskType));
      //One of
      const [existingOneOfs, deletedOneOfs] = splitArrayByFilter(Filter.get('FilterOneOfs'), ( (filterOneOf) => oneOfs.some((oneOf) => oneOf === filterOneOf.get('input') )));
      const newOneOfs = oneOfs.filter( (oneOf) => !existingOneOfs.some( (filterOneOf) => filterOneOf.get('input') === oneOf ) )
      deletedOneOfs.forEach( (oneOf) => promises.push(oneOf.destroy()) );
      newOneOfs.forEach( (oneOf) => promises.push(Filter.createFilterOneOf({ input: oneOf })) );
    }

    projectId !== undefined && promises.push(Filter.setFilterOfProject(projectId));
    changes = { ...changes, ...args }
    if(order){
      changes = { ...changes, order }
    }
    if(roles){
      promises.push(Filter.setRoles(roles));
    }
    promises.push(Filter.update(changes))
    await promises;
    return Filter;
  },

  deleteFilter: async ( root, { id }, { req } ) => {
    const User = await checkResolver( req );
    const Filter = await models.Filter.findByPk(id);
    if( Filter === null ){
      throw createDoesNoExistsError('Filter', id);
    }
    if( User.get('id') === Filter.get('filterCreatedById') ||
    (<RoleInstance> User.get('Role')).get('level') === 0 ){

      return Filter.destroy();
    }else if(Filter.get('pub')) {
      await checkResolver( req, ["publicFilters"] );
      return Filter.destroy();
    }else{
      throw NoAccessToThisFilterError;
    }
  },
}

const attributes = {
  Filter: {
    async roles(filter) {
      return filter.getRoles()
    },
    async project(filter) {
      return filter.getFilterOfProject()
    },
  },
  BasicFilter: {
    async roles(filter) {
      return filter.getRoles()
    },
    async project(filter) {
      return filter.getFilterOfProject()
    },
  },
};

export default {
  attributes,
  mutations,
  querries
}
