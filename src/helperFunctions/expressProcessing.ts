export function checkType(input: any, type: string, nullAccepted: boolean = false) {
  if (nullAccepted && input === null || input === undefined) {
    return true;
  }
  switch (type) {
    case 'str': {
      return typeof input === 'string';
    }
    case 'int': {
      return typeof input === 'number' && parseInt(input.toString()) === input;
    }
    case 'float': {
      return typeof input === 'number';
    }
    case 'arr': {
      return Array.isArray(input);
    }
    case 'bool': {
      return typeof input === 'boolean';
    }

    default: {
      return false;
    }
  }
}

export function getAttributes(requiredData, source) {
  let result = <any>{
    failedGettingAttributes: false
  }
  requiredData.forEach((item) => {
    let { key, nullAccepted, type } = item;
    let value = source[key];

    if ((value === 'undefined' || value === 'null' || value === undefined)) {
      if (nullAccepted) {
        result[key] = null;
      } else {
        result[key] = null;
        result.failedGettingAttributes = true
      }
    } else {
      switch (type) {
        case 'str': {
          result[key] = value.toString();
          break;
        }
        case 'int': {
          value = parseInt(value);
          result[key] = value;
          if (isNaN(value)) {
            result.failedGettingAttributes = true;
          }
          break;
        }
        case 'float': {
          value = parseFloat(value);
          result[key] = value;
          if (isNaN(value)) {
            result.failedGettingAttributes = true;
          }
          break;
        }
        case 'arr': {
          result[key] = value;
          if (!Array.isArray(value)) {
            result.failedGettingAttributes = true;
          };
          break;
        }
        case 'bool': {
          if (value === "true") {
            result[key] = true;
          } else if (value === "false") {
            result[key] = false;
          } else {
            result.failedGettingAttributes = true;
          }
          break;
        }
        default: {
          result[key] = value;
          break;
        }
      }

    }
  })

  return result;
}
