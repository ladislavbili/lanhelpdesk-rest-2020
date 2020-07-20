import { createDoesNoExistsError } from 'configs/errors';
import { models } from 'models';
import { UserInstance, CompanyInstance } from 'models/interfaces';
import checkResolver from './checkResolver';

const querries = {
  companies: async ( root , args, { req } ) => {
    await checkResolver( req, ['companies'] );
    return models.Company.findAll({
      order: [
        ['title', 'ASC'],
      ]
    })
  },
  company: async ( root, { id }, { req } ) => {
    await checkResolver( req, ["companies"] );
    return models.Company.findByPk(id);
  },
  basicCompanies: async ( root , args, { req } ) => {
    await checkResolver( req );
    return models.Company.findAll({
      order: [
        ['title', 'ASC'],
      ]
    })
  },
  basicCompany: async ( root, { id }, { req } ) => {
    await checkResolver( req );
    return models.Company.findByPk(id);
  },
}

const mutations = {
  addCompany: async ( root, { pricelistId, ...attributes }, { req } ) => {
    await checkResolver( req, ["companies"] );

    const Pricelist = await models.Pricelist.findByPk(pricelistId);
    if( Pricelist === null ){
      throw createDoesNoExistsError('Pricelist', pricelistId);
    }
    return models.Company.create({
      ...attributes,
      PricelistId: pricelistId
    });
  },

  updateCompany: async ( root, { id, pricelistId, ...args }, { req } ) => {
    await checkResolver( req, ["companies"] );
    const TargetCompany = <CompanyInstance> (await models.Company.findByPk(id));
    if( TargetCompany === null ){
      throw createDoesNoExistsError('Company', id);
    }
    if(pricelistId){
      const Pricelist = await models.Pricelist.findByPk(pricelistId);
      if( Pricelist === null ){
        throw createDoesNoExistsError('Pricelist', pricelistId);
      }
      await TargetCompany.setPricelist(pricelistId);
    }
    return TargetCompany.update( args );
  },

  deleteCompany: async ( root, { id, newId }, { req } ) => {
    await checkResolver( req, ["companies"] );
    const OldCompany = await models.Company.findByPk(id);
    const NewCompany = await models.Company.findByPk(newId);

    if( OldCompany === null ){
      throw createDoesNoExistsError('Company', id);
    }
    if( NewCompany === null ){
      throw createDoesNoExistsError('New company', id);
    }
    const allUsers = await models.User.findAll({ where: { CompanyId: id } });
    await Promise.all( allUsers.map( user => (user as UserInstance ).setCompany(newId) ) );
    return OldCompany.destroy();
  },
}

const attributes = {
  Company: {
    async pricelist(company) {
      return company.getPricelist()
    },
    async users(company) {
      return company.getUsers()
    }
  },
  BasicCompany: {
    async pricelist(company) {
      return company.getPricelist()
    },
    async users(company) {
      return company.getUsers()
    }
  },
};

export default {
  attributes,
  mutations,
  querries
}
