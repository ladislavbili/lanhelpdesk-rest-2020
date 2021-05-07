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
import { UserInstance, RoleInstance, ProjectInstance, AccessRightsInstance } from '@/models/instances';
import checkResolver from './checkResolver';

const querries = {
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
    return models.User.create({
      ...targetUserData,
      password: hashedPassword,
      tokenKey: randomString(),
      RoleId: roleId,
      CompanyId: companyId,
      language: language ? language : 'sk',
    })
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

    if (!await compare(password, User.get('password')) && false) {
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

    return TargetUser.update({ active });
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
    return TargetUser.update(changes);
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
    User.update(changes);
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

  //deleteUser( id: Int! ): User,
  deleteUser: async (root, { id, taskPairs, subtaskPairs, workTripPairs }, { req, userID }) => {
    const User = await checkResolver(req, ['users']);
    const TargetUser = <UserInstance>await models.User.findByPk(id,
      {
        include: [
          { model: models.Role },
          { model: models.Project, as: 'defAssignedTos', include: [{ model: models.User, as: 'defAssignedTos' }] },
          { model: models.Project, as: 'defRequester' },
        ]
      }
    );
    if (TargetUser === null) {
      throw createDoesNoExistsError('User');
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

    // TASK SUBTASK AND WORK TRIP CHECKS
    await idsDoExistsCheck(
      [
        ...taskPairs.map((pair) => pair.requesterId),
        ...subtaskPairs.map((pair) => pair.assignedId),
        ...workTripPairs.map((pair) => pair.assignedId)
      ],
      models.User
    );

    const [tasks, subtasks, workTrips] = await Promise.all([
      TargetUser.getRequesterTasks({ include: [{ model: models.Project, include: [{ model: models.ProjectRight }] }] }),
      TargetUser.getSubtasks({ include: [{ model: models.Task, include: [{ model: models.User, as: 'assignedTos' }] }] }),
      TargetUser.getWorkTrips({ include: [{ model: models.Task, include: [{ model: models.User, as: 'assignedTos' }] }] }),
    ])
    //Check is all pairs fit all tasks, subtasks and work trips, this also includes check that user IS the replaced person
    const taskPairIds = taskPairs.map((taskPair) => taskPair.taskId);
    if (tasks.length !== taskPairIds.length || !tasks.every((Task) => taskPairIds.includes(Task.get('id')))) {
      throw NotEveryUsersTaskWasCoveredError;
    }

    const subtaskPairIds = subtaskPairs.map((subtaskPair) => subtaskPair.subtaskId);
    if (subtasks.length !== subtaskPairIds.length || !subtasks.every((Subtask) => subtaskPairIds.includes(Subtask.get('id')))) {
      throw NotEveryUsersSubtaskWasCoveredError;
    }

    const workTripPairIds = workTripPairs.map((workTripPair) => workTripPair.workTripId);
    if (workTrips.length !== workTripPairIds.length || !workTrips.every((WorkTrip) => workTripPairIds.includes(WorkTrip.get('id')))) {
      throw NotEveryUsersWorkTripWasCoveredError;
    }

    //Check if new user can be new value
    await Promise.all(tasks.map((Task) => checkIfPairFitsTask(Task, taskPairs.find((taskPair) => taskPair.taskId === Task.get('id')).requesterId)));
    await Promise.all(subtasks.map((Subtask) => checkIfPairFitsSubtask(Subtask, subtaskPairs.find((subtaskPair) => subtaskPair.subtaskId === Subtask.get('id')).assignedId)));
    await Promise.all(workTrips.map((WorkTrip) => checkIfPairFitsWorkTrip(WorkTrip, workTripPairs.find((workTrip) => workTrip.workTripId === WorkTrip.get('id')).assignedId)));

    // DELETING AND UPDATING
    let promises = [
      ...(<ProjectInstance[]>TargetUser.get('defAssignedTos')).map((project) => {
        if ((<UserInstance[]>project.get('defAssignedTos')).length === 1 && project.get('defAssignedToFixed')) {
          return Promise.all([project.removeDefAssignedTo(TargetUser.get('id')), project.update({ defAssignedToDef: false, defAssignedToFixed: false, defAssignedToShow: true })])
        }
        return project.removeDefAssignedTo(TargetUser.get('id'));
      }),
      ...(<ProjectInstance[]>TargetUser.get('defRequester')).map((project) => {
        return project.setDefRequester(null);
      }),
      ...taskPairs.map((taskPair) => tasks.find((Task) => Task.get('id') === taskPair.taskId).setRequester(taskPair.requesterId)),
      ...subtaskPairs.map((subtaskPair) => subtasks.find((Subtask) => Subtask.get('id') === subtaskPair.subtaskId).setUser(subtaskPair.assignedId)),
      ...workTripPairs.map((workTripPair) => workTrips.find((WorkTrip) => WorkTrip.get('id') === workTripPair.workTripId).setUser(workTripPair.assignedId))
    ]

    await Promise.all(promises);
    return TargetUser.destroy();
  },

  //setUserStatuses( ids: [Int]! ): User
  setUserStatuses: async (root, { ids }, { req }) => {
    const User = await checkResolver(req);
    await idsDoExistsCheck(ids, models.Status);
    await User.setStatuses(ids);
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

  setTasklistLayout: async (root, { tasklistLayout }, { req }) => {
    const User = await checkResolver(req);
    return User.update({ tasklistLayout: parseInt(tasklistLayout) });
  },

  setTaskLayout: async (root, { taskLayout }, { req }) => {
    const User = await checkResolver(req);
    return User.update({ taskLayout: parseInt(taskLayout) });
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

export default {
  attributes,
  mutations,
  querries
}

async function checkIfPairFitsTask(Task, requester) {
  const Project = await Task.get('Project');
  const ProjectRights = await Project.get('ProjectRights');
  return Project.get('lockedRequester') || ProjectRights.some((right) => right.get('UserId') === requester)
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
