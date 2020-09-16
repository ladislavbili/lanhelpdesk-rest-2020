import { createDoesNoExistsError } from 'configs/errors';
import { models } from 'models';
import checkResolver from './checkResolver';
import { PricelistInstance, TripTypeInstance } from 'models/instances';

const querries = {
  tripTypes: async (root, args, { req }) => {
    await checkResolver(req);
    return models.TripType.findAll({
      order: [
        ['order', 'ASC'],
        ['title', 'ASC'],
      ]
    })
  },
  tripType: async (root, { id }, { req }) => {
    await checkResolver(req, ["tripTypes"]);
    return models.TripType.findByPk(id);
  },
}

const mutations = {

  addTripType: async (root, args, { req }) => {
    await checkResolver(req, ["tripTypes"]);
    const TripType = await models.TripType.create(args);
    const pricelists = await models.Pricelist.findAll();
    await Promise.all(pricelists.map((Pricelist) => (
      <PricelistInstance>Pricelist).createPrice({
        price: 0,
        type: 'TripType',
        TripTypeId: TripType.get('id')
      })))
    return TripType;
  },

  updateTripType: async (root, { id, ...args }, { req }) => {
    await checkResolver(req, ["tripTypes"]);
    const TripType = await models.TripType.findByPk(id);
    if (TripType === null) {
      throw createDoesNoExistsError('Trip type', id);
    }
    return TripType.update(args);
  },

  deleteTripType: async (root, { id, newId }, { req }) => {
    await checkResolver(req, ["tripTypes"]);
    const OldTripType = <TripTypeInstance>await models.TripType.findByPk(id);
    if (OldTripType === null) {
      throw createDoesNoExistsError('Old trip type', id);
    }
    const NewTripType = await models.TripType.findByPk(newId);
    if (NewTripType === null) {
      throw createDoesNoExistsError('New trip type', newId);
    }
    const allTrips = await OldTripType.getWorkTrips();
    await Promise.all(allTrips.map((workTrip) => workTrip.setTripType(newId)));

    await models.Price.destroy({ where: { type: 'TripType', TripTypeId: id } })
    return OldTripType.destroy();
  },
}

const attributes = {
  TripType: {
    async prices(tripType) {
      return tripType.getPrices()
    }
  },
};

export default {
  attributes,
  mutations,
  querries
}
