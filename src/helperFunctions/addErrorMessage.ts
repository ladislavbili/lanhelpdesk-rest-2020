import { models } from '@/models';
import { ERROR_MESSAGE_CHANGE } from '@/configs/subscriptions';
import { pubsub } from '@/graph/resolvers';
import {
  ErrorMessageInstance,
} from '@/models/instances';

export const addApolloError = async (source, error, userId = null, sourceId = null) => {
  const ErrorMessage = <ErrorMessageInstance>await models.ErrorMessage.create({
    errorMessage: error.message,
    source,
    sourceId,
    type: error.extensions.code,
    userId
  });
  pubsub.publish(ERROR_MESSAGE_CHANGE, { errorMessagesSubscription: true });
  return ErrorMessage;

}

export const addError = async (source, errorMessage, type, sourceId = null, userId = null) => {
  const ErrorMessage = <ErrorMessageInstance>await models.ErrorMessage.create({
    errorMessage,
    source,
    sourceId,
    type,
    userId
  });
  pubsub.publish(ERROR_MESSAGE_CHANGE, { errorMessagesSubscription: true });
  return ErrorMessage;
}
