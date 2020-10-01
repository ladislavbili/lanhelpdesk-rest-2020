export function createExecClass(name, singular) {
  if (singular) {
    return `
    type Exec${name}{
      ${name.toLowerCase()}: ${name}
      execTime: Float
      secondaryTimes: [SecondaryTime]
    }
    `
  }
  return `
  type Exec${name}s{
    ${name.toLowerCase()}s: [${name}]
    execTime: Float
    secondaryTimes: [SecondaryTime]
  }
  `
}
