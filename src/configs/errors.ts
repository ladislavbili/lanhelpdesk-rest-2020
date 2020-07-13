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

export const createCantChangeRightsError = ( rights ):ApolloError => {
  return new ApolloError(`Your role can't cange these rights: ${rights.toString()}!`, 'CANT_CHANGE_SOME_RIGHTS');
}

export const InvalidTokenError = new ApolloError("Token is invalid or outdated!", 'INVALID_OR_OUTDATED_TOKEN');

export const NoAccTokenError = new ApolloError('No token was passed in authorization header `authorization`: `Bearer ${accToken}` !', 'NO_ACC_TOKEN');

export const PasswordTooShort = new ApolloError("Password too short! Needs to be at least 6 characters!", "PASSWORD_TOO_SHORT");

export const FailedLoginError = new ApolloError("Failed to log in! Please check your password or email!", "LOGIN_FAILED");

export const UserDeactivatedError = new ApolloError("Credentials are correct, but user was deactivated!", "USER_DEACTIVATED");

export const MutationOrResolverAccessDeniedError = new ApolloError("You dont have access to this mutation or query!", "USER_NO_ACCESS");

//role
export const EditRoleError = new ApolloError("Your role can't change roles with lower or same level!", "CANT_EDIT_ROLE");
export const EditRoleLevelTooLowError = new ApolloError("Can't set others roles level to lower or same as your level!", "CANT_UPDATE_ROLE_LEVEL");
export const SetRoleLevelTooLowError = new ApolloError("Your role can't set users role with lower level!", "TARGET_ROLE_TOO_LOW");

//user
export const CantCreateUserLevelError = new ApolloError("Can't create user with role level smaller then yours!", "CANT_CREATE_USER_SET_ROLE_TOO_SMALL");
export const DeactivateUserLevelTooLowError = new ApolloError("Can't change attribute active of user with lower level!", "CANT_CHANGE_USER_ACTIVE_USER_ROLE_TOO_SMALL");
export const CantChangeYourRoleError = new ApolloError("Can't change your own role!", "CANT_CHANGE_YOURS_ROLE");
export const UserRoleLevelTooLowError = new ApolloError("This user has lower role level than you, you can't change his role!", "CANT_CHANGE_USER_ROLE_HIS_ROLE_TOO_SMALL");
export const UserNewRoleLevelTooLowError = new ApolloError("Can't set user role with lower level than yours!", "CANT_SET_ROLE_LOWER_THAN_YOURS");
export const OneAdminLeftError = new ApolloError("There is only one admin left!", "ONE_ADMIN_LEFT");
export const CantDeleteLowerLevelError = new ApolloError("Can't delete user with lower level than yours!", "CANT_DELETE_USER_HIS_LEVEL_LOWER");
