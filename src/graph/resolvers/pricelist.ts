import { createDoesNoExistsError, DeletePricelistNeedsNewDefaultError, DeletePricelistCompaniesNeedsNewError, PriceNotInPricelistError, createCantBeNegativeError } from '@/configs/errors';
import { models, sequelize } from '@/models';
import checkResolver from './checkResolver';
import { PriceInstance, PricelistInstance } from '@/models/instances';
import { getModelAttribute } from '@/helperFunctions';

const querries = {
  pricelists: async (root, args, { req }) => {
    await checkResolver(req);
    return models.Pricelist.findAll({
      order: [
        ['order', 'ASC'],
        ['title', 'ASC'],
      ]
    })
  },
  pricelist: async (root, { id }, { req }) => {
    await checkResolver(req);
    return models.Pricelist.findByPk(id, {
      include: [
        {
          model: models.Price,
          include: [
            models.TaskType,
            models.TripType,
          ]
        }
      ]
    });
  },
}

const mutations = {

  addPricelist: async (root, { prices: newPrices, ...attributes }, { req }) => {
    await checkResolver(req, ["prices"]);
    let prices = [...newPrices];

    let tripTypes = (await models.TripType.findAll()).map((TripType) => ({ price: 0, type: 'TripType', typeId: TripType.get('id') }));
    tripTypes.forEach((tripType) => {
      if (!prices.some((price) => price.type === tripType.type && price.typeId === tripType.typeId)) {
        prices.push(tripType);
      }
    })

    let taskTypes = (await models.TaskType.findAll()).map((TaskType) => ({ price: 0, type: 'TaskType', typeId: TaskType.get('id') }));
    taskTypes.forEach((taskType) => {
      if (!prices.some((price) => price.type === taskType.type && price.typeId === taskType.typeId)) {
        prices.push(taskType);
      }
    })

    if (prices.some((price) => price.price < 0)) {
      throw createCantBeNegativeError('Price');
    }

    if (attributes.def) {
      await models.Pricelist.update({ def: false }, { where: { def: true } })
    }

    return models.Pricelist.create({
      ...attributes,
      Prices: prices.map((price) => ({
        price: price.price,
        type: price.type,
        TripTypeId: price.type === 'TripType' ? price.typeId : null,
        TaskTypeId: price.type === 'TaskType' ? price.typeId : null,
      }))
    }, {
        include: [{ model: models.Price }]
      });
  },

  updatePricelist: async (root, { id, prices, ...attributes }, { req }) => {
    await checkResolver(req, ["prices"]);
    const Pricelist = await models.Pricelist.findByPk(id, { include: [{ model: models.Price }] });
    if (Pricelist === null) {
      throw createDoesNoExistsError('Pricelist', id);
    }

    //start of transaction
    await sequelize.transaction(async (t) => {
      const allPrices = <PriceInstance[]>Pricelist.get('Prices');
      if (attributes.def && !Pricelist.get('def')) {
        await models.Pricelist.update({ def: false }, { where: { def: true }, transaction: t })
      }
      let promises = [Pricelist.update(attributes, { transaction: t })];
      if (prices) {
        if (prices.some((price) => price.price < 0)) {
          throw createCantBeNegativeError('Price');
        }
        prices.forEach((price) => {
          const Price = allPrices.find((PriceModel) => PriceModel.get('id') === price.id);
          if (Price) {
            promises.push(Price.update({ price: price.price }, { transaction: t }))
          }
        })
      }
      await Promise.all(promises);
    })
    return Pricelist;
  },

  deletePricelist: async (root, { id, newDefId, newId }, { req }) => {
    await checkResolver(req, ["prices"]);
    const Pricelist = <PricelistInstance>await models.Pricelist.findByPk(id, { include: [{ model: models.Company }] });
    if (Pricelist === null) {
      throw createDoesNoExistsError('Pricelist', id);
    }
    const companies = <any[]>Pricelist.get('Companies');
    //pick new pricelist for the companies
    if (companies.length !== 0) {
      if (!newId) {
        throw DeletePricelistCompaniesNeedsNewError
      }
      const NewCompanyPricelist = <PricelistInstance>await models.Pricelist.findByPk(newId);
      if (NewCompanyPricelist === null) {
        throw createDoesNoExistsError('New company pricelist', newId);
      }
    }

    //there must be default pricelist
    if (Pricelist.get('def')) {
      if (!newDefId) {
        throw DeletePricelistNeedsNewDefaultError;
      }
      const NewDefaultPricelist = <PricelistInstance>await models.Pricelist.findByPk(newDefId);
      if (NewDefaultPricelist === null) {
        throw createDoesNoExistsError('New default pricelist', newDefId);
      }
      await NewDefaultPricelist.update({ def: true })
    }
    await Promise.all(companies.map((Company) => Company.setPricelist(newId)));
    return Pricelist.destroy();
  },
}

const attributes = {
  Pricelist: {
    async prices(pricelist) {
      return getModelAttribute(pricelist, 'Prices');
    },
    async companies(pricelist) {
      return getModelAttribute(pricelist, 'Companies');
    }
  },
  Price: {
    async taskType(price) {
      return getModelAttribute(price, 'TaskType');
    },
    async tripType(price) {
      return getModelAttribute(price, 'TripType');
    },
  },
};

export default {
  attributes,
  mutations,
  querries
}
