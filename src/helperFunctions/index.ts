export {
  addApolloError,
  addError,
} from './addErrorMessage';

export {
  splitArrayByFilter,
  filterUnique,
} from './arrayManipulations';

export {
  createExecClass,
} from './benchmark';

export {
  isEmail,
} from './emailCheck';

export {
  checkType,
  getAttributes
} from './expressProcessing';

export {
  filterObjectToFilter,
} from './filter';

export {
  toPercents,
  roundPoint,
  getDiscountedPrice,
  getAHExtraPrice,
  getAHPrice,
  getFinalPrice,
  getTotalPrice,
  getTotalDiscountedPrice,
  getTotalAHExtraPrice,
  getTotalAHPrice,
  getTotalFinalPrice,
  getTotalFinalPriceWithDPH,
} from './invoiceCalculations';


export {
  logFunctionsOfModel,

  idDoesExists,
  idsDoExists,
  multipleIdDoesExists,

  idDoesExistsCheck,
  idsDoExistsCheck,
  multipleIdDoesExistsCheck,
} from './modelChecks';

export {
  flattenObject,
} from './objectManipulations';

export {
  checkDefIntegrity,
  checkIfHasProjectRights,
  checkDefRequiredSatisfied,
  checkIfChanged,
  checkIfCanEditTaskAttributes,
  applyFixedOnAttributes,
  canViewTask,
} from './projectChecks';

export {
  getModelAttribute,
  mergeFragmentedModel
} from './sequelizeFunctions';

export {
  randomString,
  capitalizeFirstLetter,
} from './stringManipulations';

export {
  firstDateSameOrAfter,
  taskCheckDate,
  extractDatesFromObject,
} from './timeManipulations';
