import { createDoesNoExistsError, createCantBeNegativeError, EditedRentNotOfCompanyError } from '@/configs/errors';
import { models, sequelize } from '@/models';
import { UserInstance, CompanyInstance, CompanyRentInstance, ProjectInstance, TaskInstance, ImapInstance } from '@/models/instances';
import { splitArrayByFilter, addApolloError, getModelAttribute } from '@/helperFunctions';
import { Op } from 'sequelize';
import moment from 'moment';
import checkResolver from './checkResolver';

const querries = {
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

    return models.Company.create({
      monthly,
      ...attributes,
      PricelistId: pricelistId,
      CompanyRents: rents,
      ...otherAttributes
    }, {
        include: [{ model: models.CompanyRent }]
      });
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
      console.log(args);

      promises.push(TargetCompany.update(args, { transaction: t }));
      await Promise.all(promises);
    })
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
          { model: models.Task }
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
      ...(<UserInstance[]>OldCompany.get('Users')).map(user => user.setCompany(newId)),
      ...(<TaskInstance[]>OldCompany.get('Tasks')).map(task => task.setCompany(newId)),
      ...(<ImapInstance[]>OldCompany.get('Imaps')).map(imap => imap.setCompany(newId)),
      ...(<ProjectInstance[]>OldCompany.get('defCompany')).map((project) => project.setDefCompany(newId)),
    ];
    await Promise.all(promises);
    return OldCompany.destroy();
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

export default {
  attributes,
  mutations,
  querries
}
