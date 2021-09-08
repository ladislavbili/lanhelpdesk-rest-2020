import defaultAttributes from './defaultAttributes';

const createAttrInput = (type) => (
  `
  fixed: Boolean
  value: ${type}
`
);

export const ProjectAttributes = `
type ProjectAttributes {
  ${defaultAttributes}
  status: ProjectAttrStatus!
  tags: ProjectAttrTags!
  assigned: ProjectAttrAssigned!
  requester: ProjectAttrRequester!
  company: ProjectAttrCompany!
  taskType: ProjectAttrTaskType!
  pausal: ProjectAttrPausal!
  overtime: ProjectAttrOvertime!
  startsAt: ProjectAttrStartsAt!
  deadline: ProjectAttrDeadline!
}

input ProjectAttributesInput {
  status: ProjectAttrStatusInput!
  tags: ProjectAttrTagsInput!
  assigned: ProjectAttrAssignedInput!
  requester: ProjectAttrRequesterInput!
  company: ProjectAttrCompanyInput!
  taskType: ProjectAttrTaskTypeInput!
  pausal: ProjectAttrPausalInput!
  overtime: ProjectAttrOvertimeInput!
  startsAt: ProjectAttrStartsAtInput!
  deadline: ProjectAttrDeadlineInput!

}

type ProjectAttrStatus {
  ${createAttrInput('Status')}
}

input ProjectAttrStatusInput {
  ${createAttrInput('Int')}
}

type ProjectAttrTags {
  ${createAttrInput('[Tag]')}
}

input ProjectAttrTagsInput {
  ${createAttrInput('[Int]')}
}

type ProjectAttrAssigned {
  ${createAttrInput('[BasicUser]')}
}

input ProjectAttrAssignedInput {
  ${createAttrInput('[Int]')}
}

type ProjectAttrRequester {
  ${createAttrInput('BasicUser')}
}

input ProjectAttrRequesterInput {
  ${createAttrInput('Int')}
}

type ProjectAttrCompany {
  ${createAttrInput('Company')}
}

input ProjectAttrCompanyInput {
  ${createAttrInput('Int')}
}

type ProjectAttrTaskType {
  ${createAttrInput('TaskType')}
}

input ProjectAttrTaskTypeInput {
  ${createAttrInput('Int')}
}

type ProjectAttrPausal {
  ${createAttrInput('Boolean')}
}

input ProjectAttrPausalInput {
  ${createAttrInput('Boolean')}
}

type ProjectAttrOvertime {
  ${createAttrInput('Boolean')}
}

input ProjectAttrOvertimeInput {
  ${createAttrInput('Boolean')}
}

type ProjectAttrStartsAt {
  ${createAttrInput('String')}
}

input ProjectAttrStartsAtInput {
  ${createAttrInput('String')}
}

type ProjectAttrDeadline {
  ${createAttrInput('String')}
}

input ProjectAttrDeadlineInput {
  ${createAttrInput('String')}
}
`

export const ProjectAttributesQueries = `
`

export const ProjectAttributesMutations = `
`

export const ProjectAttributesSubscriptions = `
`
