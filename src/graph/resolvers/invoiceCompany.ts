import { models, sequelize } from '@/models';
import {
  generateInvoiceCompaniesSQL,
} from '@/graph/addons/invoices';
import { QueryTypes } from 'sequelize';
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
  }
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
