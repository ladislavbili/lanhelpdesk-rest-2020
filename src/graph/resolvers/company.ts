import { createDoesNoExistsError, createCantBeNegativeError, EditedRentNotOfCompanyError } from '@/configs/errors';
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
  companiesWithInvoices: async (root, args, { req }) => {
    await checkResolver(req, ['vykazy'], true);
    const Companies = await models.Company.findAll({
      include: [{ model: models.TaskInvoice, required: true }]
    });

    return Companies;
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
}

const mutations = {
  addCompany: async (root, { pricelistId, monthly, monthlyPausal, taskWorkPausal, taskTripPausal, rents, ...attributes }, { req, userID }) => {
    await checkResolver(req, ["companies"]);

    const Pricelist = await models.Pricelist.findByPk(pricelistId);
    if (Pricelist === null) {
      throw createDoesNoExistsError('Pricelist', pricelistId);
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
    await checkResolver(req, ["companies"]);
    const TargetCompany = <CompanyInstance>(await models.Company.findByPk(id, { include: [{ model: models.CompanyRent }] }));
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
      if (rents !== undefined) {
        rents.forEach((rent) => {
          ['quantity', 'cost', 'price'].forEach((att) => {
            if (rent[att] < 0) {
              throw createCantBeNegativeError(`Rent ${att}`);
            }
          })
        })
        //must be rent of the company
        const [existingRents, newRents] = splitArrayByFilter(rents, (rent) => rent.id !== undefined);
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

      promises.push(TargetCompany.update(args, { transaction: t }));
      await Promise.all(promises);
    })
    pubsub.publish(COMPANY_CHANGE, { companiesSubscription: true });
    return TargetCompany;
  },

  deleteCompany: async (root, { id, newId }, { req }) => {
    await checkResolver(req, ["companies"]);
    const OldCompany = await models.Company.findByPk(id,
      {
        include: [
          { model: models.Project, as: 'defCompany' },
          { model: models.Imap },
          { model: models.User },
          { model: models.Task },
          { model: models.RepeatTemplate },

        ]
      }
    );
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
      ...(<ProjectInstance[]>OldCompany.get('defCompany')).map((project) => project.setDefCompany(newId)),
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
  BasicCompany: {
    async pricelist(company) {
      return getModelAttribute(company, 'Pricelist');
    },
    async users(company) {
      return getModelAttribute(company, 'Users');
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
    }
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
