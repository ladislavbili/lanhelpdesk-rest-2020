export function createExecClass(name, singular, additionalValues = "") {
  if (singular) {
    return `
    type Exec${name}{
      ${name.toLowerCase()}: ${name}
      execTime: Float
      secondaryTimes: [SecondaryTime]
      ${additionalValues}
    }
    `
  }
  return `
  type Exec${name}s{
    ${name.toLowerCase()}s: [${name}]
    execTime: Float
    secondaryTimes: [SecondaryTime]
    ${additionalValues}
  }
  `
}
