import { ApolloError } from 'apollo-server-express';

//NEGATIVE ERROR
export const createCantBeNegativeError = (name): ApolloError => {
  return new ApolloError(`${name} can't be negative!`, 'CANT_BE_NEGATIVE');
}

//DOES NOT EXISTS
export const createDoesNoExistsError = (item, id = undefined): ApolloError => {
  if (id === undefined) {
    return new ApolloError(`${item} does not exists!`, 'DOESNT_EXISTS');
  }
  if (Array.isArray(id)) {
    return new ApolloError(`${item} with ids ${id.toString()} do not exists!`, 'DOESNT_EXISTS');
  }
  return new ApolloError(`${item} with id ${id} does not exists!`, 'DOESNT_EXISTS');
}

//DATE ERROR
export const createIncorrectDateError = (name, originalValue, parsedValue): ApolloError => {
  return new ApolloError(`A presumed date '${name}' with original value '${originalValue}' was parsed into invalid date '${parsedValue}'!`, 'INCORRECT_DATE');
}

export const createAttributeNoAccess = (item): ApolloError => {
  return new ApolloError(`Your role doesn't have the access for the attribute ${item}!`, 'DOESNT_EXISTS');
}

export const createCantChangeRightsError = (rights): ApolloError => {
  return new ApolloError(`Your role can't change these rights: ${rights.toString()}!`, 'CANT_CHANGE_SOME_RIGHTS');
}

export const createMissingRightsError = (action, rights): ApolloError => {
  return new ApolloError(`Your role can't ${action} because of missing rights: ${rights.toString()}!`, 'MISSING_RIGHT');
}
//TASK EDIT ATTRIBUTE

export const createCantEditTaskAttributeError = (attribute): ApolloError => {
  return new ApolloError(`Your can't change attribute ${attribute} in this project and its not default in the project!`, 'CANT_CHANGE_SOME_TASK_ATTRIBUTES');
}

export const InvalidTokenError = new ApolloError("Token is invalid or outdated!", 'INVALID_OR_OUTDATED_TOKEN');

export const NoAccTokenError = new ApolloError('No token was passed in authorization header `authorization`: `Bearer ${accToken}` !', 'NO_ACC_TOKEN');

export const PasswordTooShort = new ApolloError("Password too short! Needs to be at least 6 characters!", "PASSWORD_TOO_SHORT");

export const FailedLoginError = new ApolloError("Failed to log in! Please check your password or email!", "LOGIN_FAILED");

export const NotAllowedToLoginError = new ApolloError("You don't have right to login!", "NOT_ALLOWED_TO_LOGIN");

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

//user - task attributes
export const NotEveryUsersTaskWasCoveredError = new ApolloError("Not every task with deleted user as requester was included!", "NOT_EVERY_USERS_REQUESTED_TASK_WAS_COVERED");
export const NotEveryUsersSubtaskWasCoveredError = new ApolloError("Not every subtask with deleted user as assigned was included!", "NOT_EVERY_USERS_SUBTASK_WAS_COVERED");
export const NotEveryUsersWorkTripWasCoveredError = new ApolloError("Not every work trip with deleted user as assigned was included!", "NOT_EVERY_USERS_WORK_TRIP_WAS_COVERED");

//pricelist
export const DeletePricelistNeedsNewDefaultError = new ApolloError("When deleting default pricelist, you must select a new one and pass it in the newDefId attribute!", "NEEDS_NEW_DEFAULT_PRICELIST");
export const DeletePricelistCompaniesNeedsNewError = new ApolloError("When deleting default pricelist, you must select a new pricelist for the companies and pass it in the newId attribute!", "NEEDS_NEW_COMPANY_PRICELIST");
export const PriceNotInPricelistError = new ApolloError("Some edited price does not belong to the pricelist!", "EDITED_PRICE_NOT_IN_PRICELIST");

//company
export const CantDeleteDefCompanyError = new ApolloError("You can't delete default company!", "CANT_DELETE_DEFAULT_COMPANY");

//company rent
export const EditedRentNotOfCompanyError = new ApolloError("Some edited rent does not belong to the company!", "EDITED_RENT_NOT_OF_COMPANY");

//project
export const NotAdminOfProjectNorManagesProjects = new ApolloError("You can't edit this project! You are neither admin of project nor manager of all projects.", "NOT_PROJECT_ADMIN_NOR_MANAGES_PROJECTS");

export const ProjectNoAdminGroupWithUsers = new ApolloError("You can't create or edit this project! There is no group with users that could edit it.", "PROJECT_WITHOUT_ADMIN_GROUP_WITH_USERS");
export const ProjectNoNewStatus = new ApolloError("You can't create or edit this project! There is no new status.", "PROJECT_WITHOUT_NEW_STATUS");
export const ProjectNoCloseStatus = new ApolloError("You can't create or edit this project! There is no close status.", "PROJECT_WITHOUT_CLOSE_STATUS");

export const CantCreateTasksError = new ApolloError("You can't create task in this project!", "CANT_CREATE_TASK_IN_PROJECT");
export const ProjectCantChangeDefaultGroupsError = new ApolloError("You can't change nor rename default groups in project!", "CANT_CHANGE_PROJECT_DEFAULT_GROUPS");

//filters
export const NoAccessToThisProjectError = new ApolloError("You can't access this project.", "NO_ACCESS_TO_PROJECT");
export const NoAccessToThisFilterError = new ApolloError("You can't access this filter.", "NO_ACCESS_TO_FILTER");

//tasks
export const CantViewTaskError = new ApolloError("You can't access this task.", "NO_ACCESS_TO_TASK");
export const InsufficientProjectAccessError = new ApolloError("You don't have sufficient access in this project.", "INSUFFICIENT_ACCESS_PROJECT");
export const createUserNotPartOfProjectError = (name): ApolloError => {
  return new ApolloError(`User passed in parameter ${name} is not part of the project, therefore can't be assigned to this parameter!`, 'USER_NOT_PART_OF_PROJECT');
}
export const MilestoneNotPartOfProject = new ApolloError("Milestone is not from this project.", "MILESTONE_NOT_FROM_PROJECT");
export const createProjectFixedAttributeError = (name): ApolloError => {
  return new ApolloError(`Parameter ${name} is fixed by the project and is not the same!`, 'FIXED_ATTRIBUTE_BY_PROJECT');
}
export const createProjectRequiredAttributeError = (name): ApolloError => {
  return new ApolloError(`Parameter ${name} is required by the project and is emty!`, 'REQUIRED_ATTRIBUTE_BY_PROJECT');
}
export const StatusPendingAttributesMissing = new ApolloError("If status is set to action pending, you must pass both, pendingDate and pendingChangable.", "INSUFFICIENT_PENDING_ATTRIBUTES");

export const TaskNotNullAttributesPresent = new ApolloError("Task can't have null value for company, project and status.", "TASK_NOT_NULL_ATTRIBUTES");
export const TaskMustBeAssignedToAtLeastOneUser = new ApolloError("Task must be assigned to at least one user.", "TASK_MUST_BE_ASSIGNED");

export const AssignedToUserNotSolvingTheTask = new ApolloError("Person assigned to this subtask must be also assigned to the main task itself.", "ASSIGNED_TO_NOT_IN_TASK_ASSIGNED_TOS");

export const InternalMessagesNotAllowed = new ApolloError("You are not allowed to create internal messages!", "NOT_ALLOWED_INTERNAL_MESSAGES");

export const SubtaskNotNullAttributesPresent = new ApolloError("Subtask can't have null value for type and assignedTo.", "SUBTASK_NOT_NULL_ATTRIBUTES");

export const WorkTripNotNullAttributesPresent = new ApolloError("Work trip can't have null value for type and assignedTo.", "WORK_TRIP_NOT_NULL_ATTRIBUTES");

export const CantUpdateTaskAssignedToOldUsedInSubtasksOrWorkTripsError = new ApolloError("Before you remove someone from assigned users to task, all subtasks and work trips can't use this user.", "CANT_UPDATE_TASKS_ASSIGNED_TO_OLD_USED_IN_SUBTASKS_OR_WORK_TRIPS");

//calendar events
export const CalendarEventCantEndBeforeStartingError = new ApolloError("Start date of the task event is after its end.", "EVENT_CANT_END_BEFORE_STARTING");

//SMTP check
export const SmtpIsAlreadyBeingTestedError = new ApolloError("This Smtp is being tested!", "SMTP_ALREADY_TESTING");
export const IfNotWellKnownSetComunicationError = new ApolloError("If attribute wellKnown is null, you must set attributes host, port, rejectUnauthorized, secure!", "SMTP_MISSING_ATTRIBUTES");

//email check
export const EmailNoRecipientError = new ApolloError("Email has no recipient!", "EMAIL_NO_RECIPIENT");

export const createWrongEmailsError = (tos): ApolloError => {
  return new ApolloError(`${tos.toString()} are not e-mail addresses!`, "EMAIL_WRONG_ADDRESSES")
}

export const CommentNotEmailError = new ApolloError("This comment si not an e-mail!", "COMMENT_NOT_EMAIL");

export const EmailAlreadySendError = new ApolloError("E-mail was already send!", "EMAIL_ALREADY_SEND");

//Imap check
export const ImapIsAlreadyBeingTestedError = new ApolloError("This Imap is being tested!", "IMAP_ALREADY_TESTING");
export const ImapRoleLevelTooLowError = new ApolloError("Imap can't get assigned role with lower level than yours!", "IMAP_ROLE_LEVEL_TOO_LOW");

//VYKAZY
export const MustSelectStatusesError = new ApolloError("You must pick at least one status!", "NO_STATUS_SELECTED");

//scheduled
export const ScheduledUserDoesntHaveAssignedEditRight = new ApolloError("This user can't be added as assigned or you have insufficient rights!", "SCHEDULED_USER_DOESNT_HAVE_ASSIGNED_RIGHT");

//Repeat
export const CantAddOrEditRepeatError = new ApolloError("You have insufficient rights in this project!", "CANT_ADD_OR_EDIT_REPEAT");
