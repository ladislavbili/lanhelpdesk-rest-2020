import { models } from '@/models';

export const addApolloError = (source, error, userId = null, sourceId = null) => {
  return models.ErrorMessage.create({
    errorMessage: error.message,
    source,
    sourceId,
    type: error.extensions.code,
    userId
  })
}

export const addError = (source, errorMessage, type, sourceId = null, userId = null) => {
  return models.ErrorMessage.create({
    errorMessage,
    source,
    sourceId,
    type,
    userId
  })
}
