import {
  createDoesNoExistsError,
  createCantBeNegativeError,
  createMissingRightsError,
  EditedRentNotOfCompanyError,
  CantDeleteDefCompanyError,
} from '@/configs/errors';
import { models, sequelize } from '@/models';
import { Sequelize } from "sequelize";
import {
  UserInstance,
  CompanyInstance,
  CompanyRentInstance,
  ProjectInstance,
  TaskInstance,
  ImapInstance,
  RepeatTemplateInstance,
  AccessRightsInstance,
  RoleInstance,
} from '@/models/instances';
import { splitArrayByFilter, addApolloError, getModelAttribute } from '@/helperFunctions';
import { Op } from 'sequelize';
import moment from 'moment';
import checkResolver from './checkResolver';
import { COMPANY_CHANGE } from '@/configs/subscriptions';
import { pubsub } from './index';
const { withFilter } = require('apollo-server-express');

const queries = {
  companies: async (root, args, { req }) => {
    await checkResolver(req, ['companies']);
    return models.Company.findAll({
      order: [
        ['title', 'ASC'],
      ]
    })
  },
  company: async (root, { id }, { req }) => {
    await checkResolver(req, ["companies"]);
    return models.Company.findByPk(id, {
      include: [
        {
          model: models.Pricelist,
          include: [
            {
              model: models.Price,
              include: [
                models.TaskType,
                models.TripType,
              ]
            }
          ]
        },
        models.CompanyRent
      ]
    });
  },
  companyDefaults: async (root, args, { req }) => {
    const User = await checkResolver(req, ["companies"]);
    return (await models.CompanyDefaults.findAll())[0];
  },
  defCompany: async (root, args, { req }) => {
    const User = await checkResolver(req, ["companies"]);
    return (await models.Company.findAll({ where: { def: true } }))[0];
  },
  basicCompanies: async (root, args, { req }) => {
    await checkResolver(req);
    return models.Company.findAll({
      order: [
        ['title', 'ASC'],
      ],
      include: [
        {
          model: models.Pricelist,
          include: [
            {
              model: models.Price,
              include: [
                models.TaskType,
                models.TripType,
              ]
            }
          ]
        },
      ]
    })
  },
  basicCompany: async (root, { id }, { req }) => {
    await checkResolver(req);
    return models.Company.findByPk(id);
  },
  pausalCompany: async (root, { id }, { req }) => {
    await checkResolver(req, ["pausals"]);
    return models.Company.findByPk(id, {
      include: [
        models.Pricelist,
        models.CompanyRent
      ]
    });
  },
}

const mutations = {
  addCompany: async (root, { pricelistId, monthly, monthlyPausal, taskWorkPausal, taskTripPausal, rents, ...attributes }, { req, userID }) => {
    const User = await checkResolver(req, ["companies"]);
    const rights = <AccessRightsInstance>(<RoleInstance>User.get('Role')).get('AccessRight');

    const Pricelist = await models.Pricelist.findByPk(pricelistId);
    if (Pricelist === null) {
      throw createDoesNoExistsError('Pricelist', pricelistId);
    }
    if (!rights.pausals) {
      if (!Pricelist.get('def')) {
        throw createMissingRightsError('add Company', ['pausals']);
      }
      monthly = false;
      monthlyPausal = 0;
      taskWorkPausal = 0;
      taskTripPausal = 0;
      rents = [];
    }

    //check pausals not negative
    const otherAttributes = { monthlyPausal, taskWorkPausal, taskTripPausal };
    if (monthly) {
      ['monthlyPausal', 'taskWorkPausal', 'taskTripPausal'].forEach((att) => {
        if (otherAttributes[att] < 0) {
          throw createCantBeNegativeError(att);
        }
      })
    } else {
      otherAttributes.monthlyPausal = 0;
      otherAttributes.taskWorkPausal = 0;
      otherAttributes.taskTripPausal = 0;
    }

    //check prices not negative
    rents.forEach((rent) => {
      ['quantity', 'cost', 'price'].forEach((att) => {
        if (rent[att] < 0) {
          throw createCantBeNegativeError(`Rent ${att}`);
        }
      })
    })

    const NewCompany = await models.Company.create(
      {
        monthly,
        ...attributes,
        PricelistId: pricelistId,
        CompanyRents: rents,
        ...otherAttributes
      },
      {
        include: [{ model: models.CompanyRent }]
      }
    );

    pubsub.publish(COMPANY_CHANGE, { companiesSubscription: true });
    return NewCompany;
  },

  updateCompany: async (root, { id, pricelistId, rents, ...args }, { req, userID }) => {
    const User = await checkResolver(req, ["companies", 'pausals'], true);
    const rights = <AccessRightsInstance>(<RoleInstance>User.get('Role')).get('AccessRight');
    const TargetCompany = <CompanyInstance>(await models.Company.findByPk(id, {
      include: [
        models.CompanyRent,
      ]
    }));
    if (TargetCompany === null) {
      throw createDoesNoExistsError('Company', id);
    }
    //pausals
    const monthly = args.monthly;
    if (monthly === true || (monthly === undefined && TargetCompany.get('monthly'))) {
      ['monthlyPausal', 'taskWorkPausal', 'taskTripPausal'].forEach((att) => {
        if (args[att] !== undefined && args[att] < 0) {
          throw createCantBeNegativeError(att);
        }
      })
    } else if (monthly === false) {
      args.monthlyPausal = 0;
      args.taskWorkPausal = 0;
      args.taskTripPausal = 0;
    }

    //start of transaction
    await sequelize.transaction(async (t) => {
      let promises = [];
      //pricelist
      if (pricelistId) {
        const Pricelist = await models.Pricelist.findByPk(pricelistId);
        if (Pricelist === null) {
          throw createDoesNoExistsError('Pricelist', pricelistId);
        }
        promises.push(TargetCompany.setPricelist(pricelistId, { transaction: t }));
      }

      //rents
      if (rents !== undefined && rights.pausals) {
        rents.forEach((rent) => {
          ['quantity', 'cost', 'price'].forEach((att) => {
            if (rent[att] < 0) {
              throw createCantBeNegativeError(`Rent ${att}`);
            }
          })
        })
        //must be rent of the company
        const [existingRents, newRents] = splitArrayByFilter(rents, (rent) => rent.id > -1);
        newRents.forEach((rent) => delete rent.id);
        if (existingRents.some((rent) => !(<CompanyRentInstance[]>TargetCompany.get('CompanyRents')).some((compRent) => compRent.get('id') === rent.id))) {
          addApolloError(
            'Company rent',
            EditedRentNotOfCompanyError,
            userID,
            existingRents.find((rent) => !(<CompanyRentInstance[]>TargetCompany.get('CompanyRents')).some((compRent) => compRent.get('id') === rent.id)).id,
          );
          throw EditedRentNotOfCompanyError;
        }
        //add new rents
        newRents.map((rent) => promises.push(TargetCompany.createCompanyRent(rent, { transaction: t })));
        //edit existing rents
        existingRents.map((rent) => promises.push(models.CompanyRent.update(
          { title: rent.title, quantity: rent.quantity, cost: rent.cost, price: rent.price },
          { where: { id: rent.id }, transaction: t }
        )));
        //delete not included rents
        (<CompanyRentInstance[]>TargetCompany.get('CompanyRents'))
          .filter((compRent) => !existingRents.some((rent) => compRent.get('id') === rent.id))
          .forEach((compRent) => promises.push(compRent.destroy({ transaction: t })))
      }
      let allowedParameters = <any>{ ...args };
      if (!rights.companies) {
        [
          'title',
          'dph',
          'ico',
          'dic',
          'ic_dph',
          'country',
          'city',
          'street',
          'zip',
          'email',
          'phone',
          'description',
        ].forEach((attr) => delete allowedParameters[attr]);
      }
      if (!rights.pausals) {
        [
          'pricelistId',
          'monthly',
          'monthlyPausal',
          'taskWorkPausal',
          'taskTripPausal',
        ].forEach((attr) => delete allowedParameters[attr]);
      }

      promises.push(TargetCompany.update(args, { transaction: t }));
      await Promise.all(promises);
    })
    pubsub.publish(COMPANY_CHANGE, { companiesSubscription: true });
    return TargetCompany;
  },

  updateCompanyDefaults: async (root, { dph }, { req }) => {
    const User = await checkResolver(req, ["companies"]);
    await models.CompanyDefaults.update({ dph }, { where: {} });
    return (await models.CompanyDefaults.findAll())[0];
  },

  deleteCompany: async (root, { id, newId }, { req }) => {
    await checkResolver(req, ["companies"]);
    const OldCompany = await models.Company.findByPk(id,
      {
        include: [
          //{ model: models.Project, as: 'defCompany' },
          { model: models.Imap },
          { model: models.User },
          { model: models.Task, where: { invoiced: false } },
          { model: models.RepeatTemplate },

        ]
      }
    );
    if (OldCompany.get('def')) {
      throw CantDeleteDefCompanyError;
    }
    const NewCompany = await models.Company.findByPk(newId);

    if (OldCompany === null) {
      throw createDoesNoExistsError('Company', id);
    }
    if (NewCompany === null) {
      throw createDoesNoExistsError('New company', newId);
    }
    let promises = [
      ...(<UserInstance[]>OldCompany.get('Users')).map((user) => user.setCompany(newId)),
      ...(<TaskInstance[]>OldCompany.get('Tasks')).map((task) => task.setCompany(newId)),
      ...(<ImapInstance[]>OldCompany.get('Imaps')).map((imap) => imap.setCompany(newId)),
      ...(<RepeatTemplateInstance[]>OldCompany.get('RepeatTemplates')).map((repeatTemplate) => repeatTemplate.setCompany(newId)),
    ];
    await Promise.all(promises);
    await OldCompany.destroy();
    pubsub.publish(COMPANY_CHANGE, { companiesSubscription: true });
    return OldCompany;
  },
}

const attributes = {
  Company: {
    async imaps(company) {
      return getModelAttribute(company, 'Imaps');
    },
    async pricelist(company) {
      return getModelAttribute(company, 'Pricelist');
    },
    async users(company) {
      return getModelAttribute(company, 'Users');
    },
    async companyRents(company, body, { req, userID }) {
      const User = await checkResolver(req);
      const rights = <AccessRightsInstance>(<RoleInstance>User.get('Role')).get('AccessRight');
      if (!rights.pausals && !rights.vykazy) {
        return [];
      }
      return getModelAttribute(company, 'CompanyRents');
    },
    async usedSubtaskPausal(company) {
      if (company.usedSubtaskPausal !== undefined) {
        return company.usedSubtaskPausal;
      }
      const fullTasks = await company.getTasks(
        {
          include: [{ model: models.Subtask }],
          where: {
            closeDate: {
              [Op.gte]: moment().startOf('month').toDate()
            }
          }
        }
      );
      return fullTasks.reduce((acc1, task) => {
        return acc1 + task.get('Subtasks').reduce((acc2, subtask) => acc2 + parseInt(subtask.get('quantity')), 0)
      }, 0);
    },
    async usedTripPausal(company) {
      if (company.usedTripPausal !== undefined) {
        return company.usedTripPausal;
      }
      const fullTasks = await company.getTasks(
        {
          include: [{ model: models.WorkTrip }],
          where: {
            closeDate: {
              [Op.gte]: moment().startOf('month').toDate()
            }
          }
        }
      );
      return fullTasks.reduce((acc1, task) => {
        return acc1 + task.get('WorkTrips').reduce((acc2, trip) => acc2 + parseInt(trip.get('quantity')), 0)
      }, 0);
    },

  },
  BasicCompany: {
    async pricelist(company) {
      return getModelAttribute(company, 'Pricelist');
    },
    async users(company) {
      return getModelAttribute(company, 'Users');
    },
    async companyRents(company, body, { req, userID }) {
      const User = await checkResolver(req);
      const rights = <AccessRightsInstance>(<RoleInstance>User.get('Role')).get('AccessRight');
      if (!rights.pausals && !rights.vykazy) {
        return [];
      }
      return getModelAttribute(company, 'CompanyRents');
    },
    async usedSubtaskPausal(company) {
      const fullTasks = await company.getTasks(
        {
          include: [{ model: models.Subtask }],
          where: {
            closeDate: {
              [Op.gte]: moment().startOf('month').toDate()
            }
          }
        }
      );
      return fullTasks.reduce((acc1, task) => {
        return acc1 + task.get('Subtasks').reduce((acc2, subtask) => acc2 + subtask.get('quantity'), 0)
      }, 0);
    },

    async usedTripPausal(company) {
      const fullTasks = await company.getTasks(
        {
          include: [{ model: models.WorkTrip }],
          where: {
            closeDate: {
              [Op.gte]: moment().startOf('month').toDate()
            }
          }
        }
      );
      return fullTasks.reduce((acc1, task) => {
        return acc1 + task.get('WorkTrips').reduce((acc2, trip) => acc2 + trip.get('quantity'), 0)
      }, 0);
    },
  },
  PausalCompany: {
    async pricelist(company) {
      return getModelAttribute(company, 'Pricelist');
    },
    async companyRents(company) {
      return getModelAttribute(company, 'CompanyRents');
    },
    async usedSubtaskPausal(company) {
      if (company.usedSubtaskPausal !== undefined) {
        return company.usedSubtaskPausal;
      }
      const fullTasks = await company.getTasks(
        {
          include: [{ model: models.Subtask }],
          where: {
            closeDate: {
              [Op.gte]: moment().startOf('month').toDate()
            }
          }
        }
      );
      return fullTasks.reduce((acc1, task) => {
        return acc1 + task.get('Subtasks').reduce((acc2, subtask) => acc2 + parseInt(subtask.get('quantity')), 0)
      }, 0);
    },
    async usedTripPausal(company) {
      if (company.usedTripPausal !== undefined) {
        return company.usedTripPausal;
      }
      const fullTasks = await company.getTasks(
        {
          include: [{ model: models.WorkTrip }],
          where: {
            closeDate: {
              [Op.gte]: moment().startOf('month').toDate()
            }
          }
        }
      );
      return fullTasks.reduce((acc1, task) => {
        return acc1 + task.get('WorkTrips').reduce((acc2, trip) => acc2 + parseInt(trip.get('quantity')), 0)
      }, 0);
    },
  },
};

const subscriptions = {
  companiesSubscription: {
    subscribe: withFilter(
      () => pubsub.asyncIterator(COMPANY_CHANGE),
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
