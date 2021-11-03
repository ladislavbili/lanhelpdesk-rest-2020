import { models, sequelize } from '@/models';
import {
  generateInvoiceCompaniesSQL,
  generateAllInvoiceCompaniesSQL,
  generateCompaniesWithInvoiceSQL,
  generateDatesOfCompanySQL,
} from '@/graph/addons/invoices';
import { QueryTypes, Op } from 'sequelize';
import checkResolver from './checkResolver';
import { getModelAttribute } from '@/helperFunctions';


const queries = {
  invoiceCompanies: async (root, { fromDate, toDate }, { req }) => {
    const User = await checkResolver(req, ['vykazy']);
    const SQL = generateInvoiceCompaniesSQL(fromDate, toDate);
    const resultCompanies = <any[]>await sequelize.query(SQL, {
      type: QueryTypes.SELECT,
      nest: true,
      raw: true,
      mapToModel: true
    });
    let companies = [];
    resultCompanies.forEach((CompanyData1) => {
      const companyData = companies.find((CompanyData2) => CompanyData2.Company.id === CompanyData1.Company.id);
      if (companyData) {
        if (CompanyData1.Company.CompanyRent.id !== null) {
          companyData.Company.CompanyRents.push(CompanyData1.Company.CompanyRent)
        }
      } else {
        companies.push({
          ...CompanyData1,
          Company: {
            ...CompanyData1.Company,
            CompanyRents: CompanyData1.Company.CompanyRent.id !== null ? [CompanyData1.Company.CompanyRent] : [],
          }
        });
      }
    })
    return companies;
  },
  allInvoiceCompanies: async (root, args, { req }) => {
    await checkResolver(req, ['vykazy']);
    const SQL = generateAllInvoiceCompaniesSQL();
    const resultCompanies = <any[]>await sequelize.query(SQL, {
      type: QueryTypes.SELECT,
      nest: true,
      raw: true,
      mapToModel: true
    });
    return resultCompanies;
  },
  companiesWithInvoice: async (root, { fromDate, toDate }, { req }) => {
    await checkResolver(req, ['vykazy']);
    const SQL = generateCompaniesWithInvoiceSQL(fromDate, toDate);
    const resultCompanies = <any[]>await sequelize.query(SQL, {
      type: QueryTypes.SELECT,
      nest: true,
      raw: true,
      mapToModel: true
    });
    return resultCompanies;
  },
  invoiceDatesOfCompany: async (root, { companyId }, { req }) => {
    await checkResolver(req, ['vykazy']);
    const SQL = generateDatesOfCompanySQL(companyId);
    const resultDates = <any[]>await sequelize.query(SQL, {
      type: QueryTypes.SELECT,
      nest: true,
      raw: true,
      mapToModel: true
    });
    return resultDates;
  },
};

const mutations = {
};

const attributes = {
  InvoiceCompany: {
    async company(invoiceCompany) {
      return getModelAttribute(invoiceCompany, 'Company');
    },
  },
};

export default {
  attributes,
  mutations,
  queries
};
