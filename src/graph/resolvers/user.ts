import { hash, compare } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import jwt_decode from 'jwt-decode';
import moment from 'moment';
import { createAccessToken, createRefreshToken } from '@/configs/jwt';
import { refCookieSettings } from '@/configs/constants';
import { randomString, addApolloError, idsDoExistsCheck, getModelAttribute } from '@/helperFunctions';
import {
  PasswordTooShort,
  FailedLoginError,
  NotAllowedToLoginError,
  UserDeactivatedError,
  createDoesNoExistsError,
  createMissingRightsError,
  CantCreateUserLevelError,
  DeactivateUserLevelTooLowError,
  CantChangeYourRoleError,
  UserRoleLevelTooLowError,
  UserNewRoleLevelTooLowError,
  OneAdminLeftError,
  CantDeleteLowerLevelError,
  NotEveryUsersTaskWasCoveredError,
  NotEveryUsersSubtaskWasCoveredError,
  NotEveryUsersWorkTripWasCoveredError
} from '@/configs/errors';
import { models } from '@/models';
import {
  UserInstance,
  RoleInstance,
  ProjectInstance,
  ProjectAttributesInstance,
  ProjectGroupInstance,
  AccessRightsInstance,
  TasklistSortInstance,
} from '@/models/instances';
import checkResolver from './checkResolver';
import { USER_CHANGE, USER_DATA_CHANGE } from '@/configs/subscriptions';
import { pubsub } from './index';
const { withFilter } = require('apollo-server-express');


const queries = {
  users: async (root, args, { req }) => {
    await checkResolver(req, ['users']);
    return models.User.findAll({
      order: [
        ['surname', 'ASC'],
        ['name', 'ASC'],
        ['email', 'ASC'],
      ],
      include: [
        models.Role,
        models.Company
      ]
    })
  },
  user: async (root, { id }, { req }) => {
    await checkResolver(req, ['users']);
    return models.User.findByPk(id, {
      include: [
        models.Role,
        models.Company
      ]
    });
  },
  basicUsers: async (root, { id }, { req }) => {
    await checkResolver(req);
    return models.User.findAll({
      where: { active: true },
      order: [
        ['surname', 'ASC'],
        ['name', 'ASC'],
        ['email', 'ASC'],
      ],
      include: [
        models.Role,
        models.Company
      ]
    })
  },
  basicUser: async (root, { id }, { req }) => {
    await checkResolver(req);
    return models.User.findByPk(id);
  },
  getMyData: async (root, args, { req }) => {
    return checkResolver(
      req,
      [],
      false,
      [
        models.Company,
        models.Status,
        models.TasklistSort,
        {
          model: models.Role,
          include: [
            models.AccessRights
          ]
        }
      ]
    );
  },

}

const mutations = {

  //registerUser( active: Boolean, username: String!, email: String!, name: String!, surname: String!, password: String!, receiveNotifications: Boolean, signature: String, role: Int!): User,
  registerUser: async (root, { password, roleId, companyId, language, ...targetUserData }, { req, userID }) => {
    const User = await checkResolver(req, ['users']);
    const TargetRole = await models.Role.findByPk(roleId);
    if (TargetRole === null) {
      throw createDoesNoExistsError('Role', roleId);
    }
    const TargetCompany = await models.Company.findByPk(companyId);
    if (TargetCompany === null) {
      throw createDoesNoExistsError('Company', companyId);
    }
    //rola musi byt vacsia alebo admin
    if ((<RoleInstance>User.get('Role')).get('level') > TargetRole.get('level') && (<RoleInstance>User.get('Role')).get('level') !== 0) {
      addApolloError(
        'User registration',
        CantCreateUserLevelError,
        userID
      );
      throw CantCreateUserLevelError;
    }
    if (password.length < 6) {
      throw PasswordTooShort;
    }
    const hashedPassword = await hash(password, 12);
    const NewUser = <UserInstance>await models.User.create({
      ...targetUserData,
      password: hashedPassword,
      tokenKey: randomString(),
      RoleId: roleId,
      CompanyId: companyId,
      language: language ? language : 'sk',
    });
    pubsub.publish(USER_CHANGE, { usersSubscription: true });
    return NewUser;
  },

  //loginUser( email: String!, password: String! ): UserData,
  loginUser: async (root, { email, password }, { res }) => {

    if (password.length < 6) {
      throw PasswordTooShort;
    }
    const User = <UserInstance>await models.User.findOne({
      where: { email },
      include: [
        {
          model: models.Role,
          include: [{ model: models.AccessRights }]
        }
      ]
    })
    if (!User) {
      throw FailedLoginError;
    }
    if (!((<AccessRightsInstance>(<RoleInstance>User.get('Role')).get('AccessRight')).get('login'))) {
      throw NotAllowedToLoginError;
    }

    if (!await compare(password, User.get('password'))) {
      throw FailedLoginError;
    }
    if (!User.get('active')) {
      addApolloError(
        'User registration',
        UserDeactivatedError,
        null,
        User.get('id')
      );
      throw UserDeactivatedError;
    }
    let loginKey = randomString();
    let expiresAt = moment().add(7, 'd').valueOf()
    User.createToken({ key: loginKey, expiresAt });

    res.cookie(
      'jid',
      await createRefreshToken(User, loginKey),
      refCookieSettings
    );
    return {
      user: User,
      accessToken: await createAccessToken(User, loginKey)
    };
  },

  loginToken: async (root, args, { req }) => {
    const User = await checkResolver(req);
    const userData = jwt_decode(req.headers.authorization.replace('Bearer ', ''));
    return {
      user: User,
      accessToken: await createAccessToken(User, userData.loginKey)
    };
  },

  //logoutUser: Boolean,
  logoutUser: async (root, args, { req, res }) => {
    const User = await checkResolver(req);
    const token = req.headers.authorization as String;
    const userData = jwt_decode(token.replace('Bearer ', ''));
    await models.Token.destroy({ where: { key: userData.loginKey } })
    res.cookie(
      'jid',
      'clear',
      { httpOnly: true, maxAge: 1 }
    );
    return true
  },

  //logoutAll: Boolean,
  logoutAll: async (root, args, { req, res }) => {
    const User = await checkResolver(req);
    await models.Token.destroy({ where: { UserId: User.get('id') } })
    let loginKey = randomString();
    let expiresAt = moment().add(7, 'd').valueOf();
    User.createToken({ key: loginKey, expiresAt });

    res.cookie(
      'jid',
      await createRefreshToken(User, loginKey),
      refCookieSettings
    );
    return createAccessToken(User, loginKey)
  },

  //setUserActive( id: Int!, active: Boolean! ): User,
  setUserActive: async (root, { id, active }, { req, userID }) => {
    const User = await checkResolver(req, ['users']);
    const TargetUser = <UserInstance>await models.User.findByPk(id, { include: [{ model: models.Role }] });
    if (TargetUser === null) {
      throw createDoesNoExistsError('User');
    }
    //nesmie mat vacsi alebo rovny level ako ciel, ak nie je admin
    if ((<RoleInstance>User.get('Role')).get('level') >= (<RoleInstance>TargetUser.get('Role')).get('level') && (<RoleInstance>User.get('Role')).get('level') !== 0) {
      addApolloError(
        'User activation/deactivation',
        DeactivateUserLevelTooLowError,
        userID,
        id
      );
      throw DeactivateUserLevelTooLowError;
    }

    //if admin
    if ((<RoleInstance>TargetUser.get('Role')).get('level') === 0) {
      if ((await (<RoleInstance>TargetUser.get('Role')).getUsers()).filter((user) => user.get('active')).length <= 1) {
        throw OneAdminLeftError;
      }
    }

    //destory tokens when deactivated
    if (active === false) {
      await models.Token.destroy({ where: { UserId: TargetUser.get('id') } })
    }

    const UpdatedUser = await TargetUser.update({ active });
    pubsub.publish(USER_CHANGE, { usersSubscription: true });
    pubsub.publish(USER_DATA_CHANGE, { userDataSubscription: [UpdatedUser.get('id')] });
    return UpdatedUser;
  },


  //updateUser( id: Int!, active: Boolean, username: String, email: String, name: String, surname: String, password: String, receiveNotifications: Boolean, signature: String, role: Int ): User,
  updateUser: async (root, { id, roleId, companyId, language, ...args }, { req, userID }) => {
    const User = await checkResolver(req, ['users']);

    const TargetUser = <UserInstance>await models.User.findByPk(id, { include: [{ model: models.Role }] });
    if (TargetUser === null) {
      throw createDoesNoExistsError('User');
    }
    let changes = { ...args };
    if (language) {
      changes.language = language;
    }
    if (args.password !== undefined) {
      if (args.password.length < 6) {
        throw PasswordTooShort;
      }
      changes.password = await hash(args.password, 12);
    }

    //nesmie menit rolu s nizsim alebo rovnym levelom ak nie je admin
    if ((<RoleInstance>User.get('Role')).get('level') >= (<RoleInstance>TargetUser.get('Role')).get('level') && (<RoleInstance>User.get('Role')).get('level') !== 0) {
      addApolloError(
        'User',
        UserRoleLevelTooLowError,
        userID,
        id
      );
      throw UserRoleLevelTooLowError;
    }

    if (companyId) {
      const NewCompany = await models.Company.findByPk(companyId);
      if (NewCompany === null) {
        throw createDoesNoExistsError('Company', companyId);
      }
      changes.CompanyId = companyId
    }

    if (roleId) {
      const NewRole = <RoleInstance>await models.Role.findByPk(roleId);
      if (NewRole === null) {
        throw createDoesNoExistsError('Role', roleId);
      }

      //ak pouzivatel edituje sam seba nemoze menit rolu
      if (TargetUser.get('id') === User.get('id') && roleId !== (<RoleInstance>User.get('Role')).get('id')) {
        addApolloError(
          'User',
          CantChangeYourRoleError,
          userID,
          id
        );
        throw CantChangeYourRoleError;
      }

      //nesmie dat rolu s nizssim alebo rovnym levelom ak nie je admin
      if ((<RoleInstance>User.get('Role')).get('level') >= NewRole.get('level') && (<RoleInstance>User.get('Role')).get('level') !== 0) {
        addApolloError(
          'User',
          UserNewRoleLevelTooLowError,
          userID,
          id
        );
        throw UserNewRoleLevelTooLowError;
      }

      //ak je target user admin skontrolovat ci este nejaky existuje
      if ((<RoleInstance>TargetUser.get('Role')).get('level') === 0) {
        if ((await (<RoleInstance>TargetUser.get('Role')).getUsers()).filter((user) => user.get('active')).length <= 1) {
          throw OneAdminLeftError;
        }
      }

      if (TargetUser.get('id') !== User.get('id')) {
        changes.RoleId = roleId;
      }
    }
    const UpdatedUser = await TargetUser.update(changes);
    pubsub.publish(USER_CHANGE, { usersSubscription: true });
    pubsub.publish(USER_DATA_CHANGE, { userDataSubscription: [UpdatedUser.get('id')] });
    return UpdatedUser;
  },

  //updateProfile( active: Boolean, username: String, email: String, name: String, surname: String, password: String, receiveNotifications: Boolean, signature: String ): User,
  updateProfile: async (root, { companyId, language, ...args }, { req, res }) => {
    const User = await checkResolver(req);
    let changes = { ...args };
    if (language) {
      changes.language = language;
    }
    if (args.password !== undefined) {
      if (args.password.length < 6) {
        throw PasswordTooShort;
      }
      await models.Token.destroy({ where: { UserId: User.get('id') } })
      changes.password = await hash(args.password, 12);
    }
    const UpdatedUser = await User.update(changes);
    pubsub.publish(USER_CHANGE, { usersSubscription: true });
    pubsub.publish(USER_DATA_CHANGE, { userDataSubscription: [UpdatedUser.get('id')] });

    let loginKey = randomString();
    let expiresAt = moment().add(7, 'd').valueOf()
    UpdatedUser.createToken({ key: loginKey, expiresAt });

    res.cookie(
      'jid',
      await createRefreshToken(UpdatedUser, loginKey),
      refCookieSettings
    );
    return {
      user: UpdatedUser,
      accessToken: await createAccessToken(UpdatedUser, loginKey)
    };
  },

  //deleteUser( id: Int! ): User,
  deleteUser: async (root, { id, newId }, { req, userID }) => {
    const User = await checkResolver(req, ['users']);
    const TargetUser = <UserInstance>await models.User.findByPk(id,
      {
        include: [
          { model: models.Role },
        ]
      }
    );
    if (TargetUser === null) {
      throw createDoesNoExistsError('User');
    }

    const NewUser = await models.User.findByPk(newId);
    if (NewUser === null) {
      throw createDoesNoExistsError('Replacement user', newId);
    }
    //nesmie mazat rolu s nizsim alebo rovnym levelom ak nie je admin
    if ((<RoleInstance>User.get('Role')).get('level') >= (<RoleInstance>TargetUser.get('Role')).get('level') && (<RoleInstance>User.get('Role')).get('level') !== 0) {
      addApolloError(
        'User',
        CantDeleteLowerLevelError,
        userID,
        id
      );
      throw CantDeleteLowerLevelError;
    }
    //if admin
    if ((<RoleInstance>TargetUser.get('Role')).get('level') === 0) {
      if ((await (<RoleInstance>TargetUser.get('Role')).getUsers()).filter((user) => user.get('active')).length <= 1) {
        throw OneAdminLeftError;
      }
    }

    //subtasks, worktrips, task - requester, repeat template, project attributes,
    models.Subtask.update({ UserId: newId }, { where: { UserId: id, invoiced: false } });
    models.WorkTrip.update({ UserId: newId }, { where: { UserId: id, invoiced: false } });
    models.Task.update({ requesterId: newId }, { where: { requesterId: id, invoiced: false } });
    models.RepeatTemplate.update({ requesterId: newId }, { where: { requesterId: id } });
    models.ProjectAttributes.update({ requesterId: newId }, { where: { requesterId: id } });

    // DELETING AND UPDATING
    let promises = [
      ...(<ProjectAttributesInstance[]>TargetUser.get('defAssigned')).map((ProjectAttributes) => {
        if ((<UserInstance[]>ProjectAttributes.get('assigned')).length === 1 && ProjectAttributes.get('assignedFixed')) {
          return Promise.all([ProjectAttributes.removeAssignedOne(TargetUser.get('id')), ProjectAttributes.update({ assignedFixed: false })])
        }
        return ProjectAttributes.removeAssignedOne(TargetUser.get('id'));
      }),
    ]

    await Promise.all(promises);
    await TargetUser.destroy();
    pubsub.publish(USER_CHANGE, { usersSubscription: true });
    pubsub.publish(USER_DATA_CHANGE, { userDataSubscription: [TargetUser.get('id')] });
    return TargetUser;
  },

  //setUserStatuses( ids: [Int]! ): User
  setUserStatuses: async (root, { ids }, { req }) => {
    const User = await checkResolver(req);
    await idsDoExistsCheck(ids, models.Status);
    await User.setStatuses(ids);
    pubsub.publish(USER_DATA_CHANGE, { userDataSubscription: [User.get('id')] });
    return models.User.findByPk(User.get('id'), {
      include: [
        models.Status,
        models.Company,
        {
          model: models.Role,
          include: [models.AccessRights]
        }
      ]
    });
  },

  setTasklistSort: async (root, { sort, asc, layout }, { req }) => {
    const User = await checkResolver(req,
      [],
      false,
      [
        models.TasklistSort
      ]);
    const TasklistSorts = <TasklistSortInstance[]>User.get('TasklistSorts');
    const TasklistSort = TasklistSorts.find((TasklistSort) => TasklistSort.get('layout') === layout);
    if (TasklistSort) {
      await TasklistSort.update({ sort, asc });
    } else {
      await User.createTasklistSort({ sort, asc, layout });
    }
    pubsub.publish(USER_DATA_CHANGE, { userDataSubscription: [User.get('id')] });
    return User;
  },

  setAfterTaskCreate: async (root, { afterTaskCreate }, { req }) => {
    const User = await checkResolver(req);
    await User.update({ afterTaskCreate: parseInt(afterTaskCreate) });
    pubsub.publish(USER_DATA_CHANGE, { userDataSubscription: [User.get('id')] });
    return User;
  },

  setTasklistLayout: async (root, { tasklistLayout }, { req }) => {
    const User = await checkResolver(req);
    await User.update({ tasklistLayout: parseInt(tasklistLayout) });
    pubsub.publish(USER_DATA_CHANGE, { userDataSubscription: [User.get('id')] });
    return User;
  },

  setTaskLayout: async (root, { taskLayout }, { req }) => {
    const User = await checkResolver(req);
    await User.update({ taskLayout: parseInt(taskLayout) });
    pubsub.publish(USER_DATA_CHANGE, { userDataSubscription: [User.get('id')] });
    return User;
  },
}

const attributes = {
  User: {
    async role(user) {
      return getModelAttribute(user, 'Role');
    },
    async company(user) {
      return getModelAttribute(user, 'Company');
    },
    async statuses(user) {
      return getModelAttribute(user, 'Statuses');
    },
    async groups(user) {
      return getModelAttribute(user, 'ProjectGroups');
    },
    async tasklistSorts(user) {
      return getModelAttribute(user, 'TasklistSorts');
    },
  },
  BasicUser: {
    async company(user) {
      return getModelAttribute(user, 'Company');
    },
    async role(user) {
      return getModelAttribute(user, 'Role');
    },
  },
};

const subscriptions = {
  usersSubscription: {
    subscribe: withFilter(
      () => pubsub.asyncIterator(USER_CHANGE),
      async (data, args, { userID }) => {
        return true;
      }
    ),
  },
  userDataSubscription: {
    subscribe: withFilter(
      () => pubsub.asyncIterator(USER_DATA_CHANGE),
      async ({ userDataSubscription }, args, { userID }) => {
        return userDataSubscription.includes(userID);
      }
    ),
  }
}

export default {
  attributes,
  mutations,
  queries,
  subscriptions,
}

async function checkIfPairFitsTask(Task, requester) {
  const Project = <ProjectInstance>await models.Project.findByPk(Task.get('ProjectId'), {
    include: [{
      model: models.ProjectGroup,
      include: [models.User]
    }]
  });
  const allRequesterIds = (<ProjectGroupInstance[]>Project.get('ProjectGroups')).reduce((acc, ProjectGroup) => {
    return [...acc, ...(<UserInstance[]>ProjectGroup.get('Users')).map((User) => User.get('id'))]
  }, []);
  return Project.get('lockedRequester') || allRequesterIds.includes(requester);
}

async function checkIfPairFitsSubtask(Subtask, assignedId) {
  const Task = await Subtask.get('Task');
  const AssignedTos = await Task.get('assignedTos');
  return AssignedTos.some((assignedTo) => assignedTo.get('id') === assignedId)
}

async function checkIfPairFitsWorkTrip(WorkTrip, assignedId) {
  const Task = await WorkTrip.get('Task');
  const AssignedTos = await Task.get('assignedTos');
  return AssignedTos.some((assignedTo) => assignedTo.get('id') === assignedId)
}
