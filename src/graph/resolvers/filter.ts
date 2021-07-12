import { createDoesNoExistsError, NoAccessToThisProjectError, NoAccessToThisFilterError } from '@/configs/errors';
import { models } from '@/models';
import { FilterInstance, RoleInstance, AccessRightsInstance } from '@/models/instances';
import checkResolver from './checkResolver';
import {
  idDoesExistsCheck,
  idsDoExistsCheck,
  multipleIdDoesExistsCheck,
  splitArrayByFilter,
  extractDatesFromObject,
  getModelAttribute,
} from '@/helperFunctions';
import {
  checkIfHasProjectRights,
} from '@/graph/addons/project';
import { Op } from 'sequelize';
const dateNames = ['statusDateFrom', 'statusDateTo', 'pendingDateFrom', 'pendingDateTo', 'closeDateFrom', 'closeDateTo', 'deadlineFrom', 'deadlineTo', 'scheduledFrom', 'scheduledTo', 'createdAtFrom', 'createdAtTo'];
import { FILTER_CHANGE } from '@/configs/subscriptions';
import { pubsub } from './index';
const { withFilter } = require('apollo-server-express');

const queries = {
  myFilters: async (root, args, { req }) => {
    const User = await checkResolver(req);
    const Filters = <FilterInstance[]>await models.Filter.findAll({
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
        models.Role,
        {
          model: models.Project,
          as: 'filterOfProject'
        },
      ],
    })
    //either created by user or has same role as user and is pub
    return Filters.filter((filter) => (
      (
        filter.get('pub') &&
        (<RoleInstance[]>filter.get('Roles')).some((role) => role.get('id') === (<RoleInstance>User.get('Role')).get('id'))
      ) ||
      !filter.get('pub')
    ))
  },

  myFilter: async (root, { id }, { req }) => {
    const User = await checkResolver(req);
    if ((<RoleInstance>User.get('Role')).get('level') !== 0) {
      const Filter = await models.Filter.findOne({
        where: {
          id,
          filterCreatedById: User.get('id')
        },
        include: [
          models.Role,
          {
            model: models.Project,
            as: 'filterOfProject'
          },
        ]
      });
      if (Filter === null) {
        throw createDoesNoExistsError('Filter', id);
      }
      return Filter;
    }

    const Filter = await models.Filter.findByPk(id);
    if (Filter === null) {
      throw createDoesNoExistsError('Filter', id);
    }
    return Filter;

  },

  publicFilters: async (root, args, { req }) => {
    await checkResolver(req, ['publicFilters']);
    return models.Filter.findAll({
      order: [
        ['order', 'ASC'],
        ['title', 'ASC'],
      ],
      where: { pub: true },
      include: [
        models.Role
      ]
    })
  },

  filter: async (root, { id }, { req }) => {
    await checkResolver(req, ["publicFilters"]);
    const Filter = await models.Filter.findByPk(id, {
      include: [
        models.Role,
        {
          model: models.Project,
          as: 'filterOfProject'
        },
      ]
    });
    if (!Filter.get('pub')) {
      return null;
    }
    return Filter;
  },
}

const mutations = {
  //( title: String!, pub: Boolean!, global: Boolean!, dashboard: Boolean!, filter: FilterInput!, order: Int, roles: [Int], projectId: Int )
  addFilter: async (root, { roles, filter, order, pub, projectId, ...args }, { req }) => {
    const dates = extractDatesFromObject(filter, dateNames);

    let User = null;
    //if pub must have order,roles and user must have access
    if (pub) {
      User = await checkResolver(req, ["publicFilters"]);
      if (!order) {
        order = 0;
      }
      if (!roles) {
        roles = [];
      }
    } else {
      User = await checkResolver(req);
      delete args['order'];
    };

    //if project, must be at least read and exists
    if (projectId) {
      const Project = await models.Project.findByPk(projectId);
      if (Project === null) {
        throw createDoesNoExistsError('Project', projectId);
      }
      await checkIfHasProjectRights(User.get('id'), undefined, Project.get('id'))
    } else {
      projectId = null;
    }

    //Filter
    const { assignedTos, tags, statuses, requesters, companies, taskTypes, oneOf, important, invoiced, pausal, overtime, ...directFilterParams } = filter;
    await Promise.all([
      idsDoExistsCheck(assignedTos, models.User),
      idsDoExistsCheck(tags, models.Tag),
      idsDoExistsCheck(statuses, models.Status),
      idsDoExistsCheck(requesters, models.User),
      idsDoExistsCheck(companies, models.Company),
      idsDoExistsCheck(taskTypes, models.TaskType),
    ])

    const boolAttributes = {
      important: important === null ? null : important === 'yes',
      invoiced: invoiced === null ? null : invoiced === 'yes',
      pausal: pausal === null ? null : pausal === 'yes',
      overtime: overtime === null ? null : overtime === 'yes',
    }

    if (pub) {
      await idsDoExistsCheck(roles, models.Role);
      const newFilter = <FilterInstance>await models.Filter.create(
        {
          ...args,
          order,
          ProjectId: projectId,
          filterOfProjectId: projectId,
          filterCreatedById: User.get('id'),
          ...directFilterParams,
          ...boolAttributes,
          ...dates,
          pub: true,
          FilterOneOfs: oneOf.map((item) => ({ input: item })),
        },
        {
          include: [{ model: models.FilterOneOf }]
        }
      );
      await Promise.all([
        newFilter.setRoles(roles),
        newFilter.setFilterAssignedTos(assignedTos ? assignedTos : []),
        newFilter.setFilterTags(tags ? tags : []),
        newFilter.setFilterStatuses(statuses ? statuses : []),
        newFilter.setFilterRequesters(requesters ? requesters : []),
        newFilter.setFilterCompanies(companies ? companies : []),
        newFilter.setFilterTaskTypes(taskTypes ? taskTypes : []),
      ]);
      pubsub.publish(FILTER_CHANGE, { filtersSubscription: true });
      return newFilter;
    }

    const newFilter = <FilterInstance>await models.Filter.create(
      {
        ...args,
        ProjectId: projectId,
        filterOfProjectId: projectId,
        filterCreatedById: User.get('id'),
        ...directFilterParams,
        ...boolAttributes,
        ...dates,
        pub: false,
        FilterOneOfs: oneOf.map((item) => ({ input: item })),
      },
      {
        include: [{ model: models.FilterOneOf }]
      }
    );
    await Promise.all([
      newFilter.setFilterAssignedTos(assignedTos ? assignedTos : []),
      newFilter.setFilterTags(tags ? tags : []),
      newFilter.setFilterStatuses(statuses ? statuses : []),
      newFilter.setFilterRequesters(requesters ? requesters : []),
      newFilter.setFilterCompanies(companies ? companies : []),
      newFilter.setFilterTaskTypes(taskTypes ? taskTypes : []),
    ]);
    pubsub.publish(FILTER_CHANGE, { filtersSubscription: true });
    return newFilter;

  },

  addPublicFilter: async (root, { roles, filter, order, projectId, ...args }, { req }) => {
    const User = await checkResolver(req, ["publicFilters"]);
    const dates = extractDatesFromObject(filter, dateNames);

    //if project, must be at least read and exists
    if (projectId) {
      const Project = await models.Project.findByPk(projectId);
      if (Project === null) {
        throw createDoesNoExistsError('Project', projectId);
      }
      await checkIfHasProjectRights(User.get('id'), undefined, Project.get('id'))
    } else {
      projectId = null;
    }

    //Filter
    const { assignedTos, tags, statuses, requesters, companies, taskTypes, oneOf, important, invoiced, pausal, overtime, ...directFilterParams } = filter;
    await Promise.all([
      idsDoExistsCheck(assignedTos, models.User),
      idsDoExistsCheck(tags, models.Tag),
      idsDoExistsCheck(statuses, models.Status),
      idsDoExistsCheck(requesters, models.User),
      idsDoExistsCheck(companies, models.Company),
      idsDoExistsCheck(taskTypes, models.TaskType),
      idsDoExistsCheck(roles, models.Role),
    ])

    const boolAttributes = {
      important: important === null ? null : important === 'yes',
      invoiced: invoiced === null ? null : invoiced === 'yes',
      pausal: pausal === null ? null : pausal === 'yes',
      overtime: overtime === null ? null : overtime === 'yes',
    }

    const newFilter = <FilterInstance>await models.Filter.create(
      {
        ...args,
        ProjectId: projectId,
        filterOfProjectId: projectId,
        filterCreatedById: User.get('id'),
        ...directFilterParams,
        ...boolAttributes,
        ...dates,
        pub: true,
        FilterOneOfs: oneOf.map((item) => ({ input: item })),
      },
      {
        include: [{ model: models.FilterOneOf }]
      }
    );
    await Promise.all([
      newFilter.setFilterAssignedTos(assignedTos ? assignedTos : []),
      newFilter.setFilterTags(tags ? tags : []),
      newFilter.setFilterStatuses(statuses ? statuses : []),
      newFilter.setFilterRequesters(requesters ? requesters : []),
      newFilter.setFilterCompanies(companies ? companies : []),
      newFilter.setFilterTaskTypes(taskTypes ? taskTypes : []),
    ])
    pubsub.publish(FILTER_CHANGE, { filtersSubscription: true });
    return newFilter;
  },

  //updateFilter - id! title pub! global! dashboard! filter order roles projectId
  updateFilter: async (root, { id, roles, filter, order, pub, projectId, ...args }, { req }) => {
    let User = null;
    const Filter = <FilterInstance>await models.Filter.findByPk(id);
    if (Filter === null) {
      throw createDoesNoExistsError('Filter', id);
    }
    //if pub must have order,roles and user must have access

    if (pub || Filter.get('pub')) {
      User = await checkResolver(req, ["publicFilters"]);
      if (roles) {
        await idsDoExistsCheck(roles, models.Role);
      }
    } else {
      User = await checkResolver(req);
    };

    //if project, must be at least read and exists
    if (projectId) {
      const Project = await models.Project.findByPk(projectId);
      if (Project === null) {
        throw createDoesNoExistsError('Project', projectId);
      }
      await checkIfHasProjectRights(User.get('id'), undefined, Project.get('id'))
    }

    //BUILDING changes
    let changes = {};
    let promises = [];
    if (filter) {
      //Filter
      const { assignedTos, tags, statuses, requesters, companies, taskTypes, important, invoiced, pausal, overtime, oneOf: oneOfs, ...directFilterParams } = filter;
      const dates = extractDatesFromObject(filter, dateNames);
      await Promise.all([
        idsDoExistsCheck(assignedTos, models.User),
        idsDoExistsCheck(tags, models.User),
        idsDoExistsCheck(statuses, models.Status),
        idsDoExistsCheck(requesters, models.User),
        idsDoExistsCheck(companies, models.Company),
        idsDoExistsCheck(taskTypes, models.TaskType),
        idsDoExistsCheck(roles, models.Role),
      ])

      const boolAttributes = {
        important: (important === null || important === undefined) ? important : important === 'yes',
        invoiced: (invoiced === null || invoiced === undefined) ? invoiced : invoiced === 'yes',
        pausal: (pausal === null || pausal === undefined) ? pausal : pausal === 'yes',
        overtime: (overtime === null || overtime === undefined) ? overtime : overtime === 'yes',
      }
      changes = { ...directFilterParams, ...dates, ...boolAttributes };
      assignedTos !== undefined && promises.push(Filter.setFilterAssignedTos(assignedTos));
      tags !== undefined && promises.push(Filter.setFilterTags(tags));
      statuses !== undefined && promises.push(Filter.setFilterStatuses(statuses));
      requesters !== undefined && promises.push(Filter.setFilterRequesters(requesters));
      companies !== undefined && promises.push(Filter.setFilterCompanies(companies));
      taskTypes !== undefined && promises.push(Filter.setFilterTaskTypes(taskTypes));
      //One of
      /*
      const [existingOneOfs, deletedOneOfs] = splitArrayByFilter(Filter.get('FilterOneOfs'), ((filterOneOf) => oneOfs.some((oneOf) => oneOf === filterOneOf.get('input'))));
      const newOneOfs = oneOfs.filter((oneOf) => !existingOneOfs.some((filterOneOf) => filterOneOf.get('input') === oneOf))
      deletedOneOfs.forEach((oneOf) => promises.push(oneOf.destroy()));
      newOneOfs.forEach((oneOf) => promises.push(Filter.createFilterOneOf({ input: oneOf })));
      */
    }

    projectId !== undefined && promises.push(Filter.setFilterOfProject(projectId));
    changes = { ...changes, ...args }
    if (pub) {
      changes = { ...changes, pub }
      if (order) {
        changes = { ...changes, order }
      }
      if (roles) {
        promises.push(Filter.setRoles(roles));
      }
    }
    promises.push(Filter.update(changes))
    await promises;
    pubsub.publish(FILTER_CHANGE, { filtersSubscription: true });
    return Filter;
  },

  updatePublicFilter: async (root, { id, roles, filter, order, projectId, ...args }, { req }) => {
    let User = await checkResolver(req, ["publicFilters"]);
    const Filter = <FilterInstance>await models.Filter.findByPk(id, { include: [{ model: models.FilterOneOf }] });
    if (Filter === null || !Filter.get('pub')) {
      throw createDoesNoExistsError('Filter', id);
    }
    if (roles) {
      await idsDoExistsCheck(roles, models.Role);
    }

    //if project, must be at least read and exists
    if (projectId) {
      const Project = await models.Project.findByPk(projectId);
      if (Project === null) {
        throw createDoesNoExistsError('Project', projectId);
      }
      await checkIfHasProjectRights(User.get('id'), undefined, Project.get('id'))
    }

    //BUILDING changes
    let changes = {};
    let promises = [];
    if (filter) {
      const { assignedTos, tags, statuses, requesters, companies, taskTypes, important, invoiced, pausal, overtime, oneOf: oneOfs, ...directFilterParams } = filter;
      const dates = extractDatesFromObject(filter, dateNames);
      await Promise.all([
        idsDoExistsCheck(assignedTos, models.User),
        idsDoExistsCheck(tags, models.User),
        idsDoExistsCheck(statuses, models.Status),
        idsDoExistsCheck(requesters, models.User),
        idsDoExistsCheck(companies, models.Company),
        idsDoExistsCheck(taskTypes, models.TaskType),
        idsDoExistsCheck(roles, models.Role),
      ])

      const boolAttributes = {
        important: (important === null || important === undefined) ? important : important === 'yes',
        invoiced: (invoiced === null || invoiced === undefined) ? invoiced : invoiced === 'yes',
        pausal: (pausal === null || pausal === undefined) ? pausal : pausal === 'yes',
        overtime: (overtime === null || overtime === undefined) ? overtime : overtime === 'yes',
      }
      changes = { ...directFilterParams, ...dates, ...boolAttributes };
      assignedTos !== undefined && promises.push(Filter.setFilterAssignedTos(assignedTos));
      tags !== undefined && promises.push(Filter.setFilterTags(tags));
      statuses !== undefined && promises.push(Filter.setFilterStatuses(statuses));
      requesters !== undefined && promises.push(Filter.setFilterRequesters(requesters));
      companies !== undefined && promises.push(Filter.setFilterCompanies(companies));
      taskTypes !== undefined && promises.push(Filter.setFilterTaskTypes(taskTypes));
      //One of
      const [existingOneOfs, deletedOneOfs] = splitArrayByFilter(Filter.get('FilterOneOfs'), ((filterOneOf) => oneOfs.some((oneOf) => oneOf === filterOneOf.get('input'))));
      const newOneOfs = oneOfs.filter((oneOf) => !existingOneOfs.some((filterOneOf) => filterOneOf.get('input') === oneOf))
      deletedOneOfs.forEach((oneOf) => promises.push(oneOf.destroy()));
      newOneOfs.forEach((oneOf) => promises.push(Filter.createFilterOneOf({ input: oneOf })));
    }

    projectId !== undefined && promises.push(Filter.setFilterOfProject(projectId));
    changes = { ...changes, ...args }
    if (order) {
      changes = { ...changes, order }
    }
    if (roles) {
      promises.push(Filter.setRoles(roles));
    }
    promises.push(Filter.update(changes))
    await promises;
    pubsub.publish(FILTER_CHANGE, { filtersSubscription: true });
    return Filter;
  },

  deleteFilter: async (root, { id }, { req }) => {
    const User = await checkResolver(req);
    const Filter = await models.Filter.findByPk(id);
    if (Filter === null) {
      throw createDoesNoExistsError('Filter', id);
    }
    if (User.get('id') === Filter.get('filterCreatedById') ||
      (<RoleInstance>User.get('Role')).get('level') === 0) {

      return Filter.destroy();
    } else if (Filter.get('pub')) {
      await checkResolver(req, ["publicFilters"]);
      await Filter.destroy();
      pubsub.publish(FILTER_CHANGE, { filtersSubscription: true });
      return Filter;
    } else {
      throw NoAccessToThisFilterError;
    }
  },
}

const attributes = {
  Filter: {
    async roles(filter) {
      return getModelAttribute(filter, 'Roles');
    },
    async project(filter) {
      return getModelAttribute(filter, 'filterOfProject', 'getFilterOfProject');
    },
  },
  BasicFilter: {
    async roles(filter) {
      return getModelAttribute(filter, 'Roles');
    },
    async project(filter) {
      return getModelAttribute(filter, 'filterOfProject', 'getFilterOfProject');
    },
  },
};

const subscriptions = {
  filtersSubscription: {
    subscribe: withFilter(
      () => pubsub.asyncIterator(FILTER_CHANGE),
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
