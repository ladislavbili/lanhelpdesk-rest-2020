import { ApolloError } from 'apollo-server-express';

export const createDoesNoExistsError = ( item, id = undefined ):ApolloError => {
  if(id !== undefined){
    return new ApolloError(`${item} with id ${id} does not exists!`, 'DOESNT_EXISTS');
  }
  return new ApolloError(`${item} does not exists!`, 'DOESNT_EXISTS');
}

export const createAttributeNoAccess = ( item ):ApolloError => {
  return new ApolloError(`Your role doesn't have the access for the attribute ${item}!`, 'DOESNT_EXISTS');
}

export const InvalidTokenError = new ApolloError("Token is invalid or outdated!", 'INVALID_OR_OUTDATED_TOKEN');

export const NoAccTokenError = new ApolloError('No token was passed in authorization header `authorization`: `Bearer ${accToken}` !', 'NO_ACC_TOKEN');

export const PasswordTooShort = new ApolloError("Password too short! Needs to be at least 6 characters!", "PASSWORD_TOO_SHORT");

export const FailedLoginError = new ApolloError("Failed to log in! Please check your password or email!", "LOGIN_FAILED");

export const UserDeactivatedError = new ApolloError("Credentials are correct, but user was deactivated!", "USER_DEACTIVATED");

export const MutationOrResolverAccessDeniedError = new ApolloError("You dont have access to this mutation or query!", "USER_NO_ACCESS");
