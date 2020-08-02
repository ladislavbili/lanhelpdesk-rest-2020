import { hash, compare } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import jwt_decode from 'jwt-decode';
import { createAccessToken, createRefreshToken } from 'configs/jwt';
import { randomString, addApolloError } from 'helperFunctions';
import {
  PasswordTooShort,
  FailedLoginError,
  UserDeactivatedError,
  createDoesNoExistsError,
  CantCreateUserLevelError,
  DeactivateUserLevelTooLowError,
  CantChangeYourRoleError,
  UserRoleLevelTooLowError,
  UserNewRoleLevelTooLowError,
  OneAdminLeftError,
  CantDeleteLowerLevelError
} from 'configs/errors';
import { models } from 'models';
import { UserInstance, RoleInstance, ProjectInstance } from 'models/instances';
import checkResolver from './checkResolver';

const maxAge = 7 * 24 * 60 * 60 * 1000;

const querries = {
  users: async ( root, args, { req } ) => {
    await checkResolver( req, ['users'] );
    return models.User.findAll({
      order: [
        ['surname', 'ASC'],
        ['name', 'ASC'],
        ['email', 'ASC'],
      ]
    })
  },
  user: async ( root, { id }, { req } ) => {
    await checkResolver( req, ['users'] );
    return models.User.findByPk(id);
  },
  basicUsers: async ( root, { id }, { req } ) => {
    await checkResolver( req );
    return models.User.findAll({
      where: { active: true },
      order: [
        ['surname', 'ASC'],
        ['name', 'ASC'],
        ['email', 'ASC'],
      ]
    })
  },
  basicUser: async ( root, { id }, { req } ) => {
    await checkResolver( req );
    return models.User.findByPk(id);
  },
  getMyData: async ( root, { req } ) => {
    return checkResolver( req );
  },

}

const mutations = {

  //registerUser( active: Boolean, username: String!, email: String!, name: String!, surname: String!, password: String!, receiveNotifications: Boolean, signature: String, role: Int!): User,
  registerUser: async ( root, { password, roleId, companyId, language, ...targetUserData }, { req, userID } ) => {
    const User = await checkResolver( req, ['users'] );
    const TargetRole = await models.Role.findByPk(roleId);
    if( TargetRole === null ){
      throw createDoesNoExistsError('Role', roleId);
    }
    const TargetCompany = await models.Company.findByPk(companyId);
    if( TargetCompany === null ){
      throw createDoesNoExistsError('Company', companyId);
    }
    //rola musi byt vacsia alebo admin
    if( (<RoleInstance> User.get('Role')).get('level') > TargetRole.get('level') && (<RoleInstance> User.get('Role')).get('level') !== 0 ){
      addApolloError(
        'User registration',
        CantCreateUserLevelError,
        userID
      );
      throw CantCreateUserLevelError;
    }
    if( password.length < 6 ){
      throw PasswordTooShort;
    }
    const hashedPassword = await hash( password, 12 );
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
  loginUser: async ( root, { email, password }, { res } ) => {

    if( password.length < 6 ){
      throw PasswordTooShort;
    }
    const User = <UserInstance> await models.User.findOne({ where: { email } })
    if( !User ){
      throw FailedLoginError;
    }
    if( ! await compare( password, User.get('password') ) ){
      throw FailedLoginError;
    }
    if( !User.get('active') ){
      addApolloError(
        'User registration',
        UserDeactivatedError,
        null,
        User.get('id')
      );
      throw UserDeactivatedError;
    }
    let loginKey = randomString();
    let expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    User.createToken({ key: loginKey, expiresAt });

    res.cookie(
      'jid',
      await createRefreshToken(User, loginKey),
      { httpOnly: true, maxAge }
    );
    return {
      user: User,
      accessToken: await createAccessToken(User, loginKey)
    };
  },

  loginToken: async ( root, args, { req } ) => {
    const User = await checkResolver( req );
    const userData = jwt_decode(req.headers.authorization.replace('Bearer ',''));
    return {
      user: User,
      accessToken: await createAccessToken(User, userData.loginKey)
    };
  },

  //logoutUser: Boolean,
  logoutUser: async ( root, args, { req } ) => {
    const User = await checkResolver( req );
    const token = req.headers.authorization as String;
    const userData = jwt_decode(token.replace('Bearer ',''));
    await models.Token.destroy({ where: { key: userData.loginKey } })
    return true
  },

  //logoutAll: Boolean,
  logoutAll: async ( root, args, { req, res } ) => {
    const User = await checkResolver( req );
    await models.Token.destroy({ where: { UserId: User.get('id') } })
    let loginKey = randomString();
    let expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    User.createToken({ key: loginKey, expiresAt });

    res.cookie(
      'jid',
      await createRefreshToken(User, loginKey),
      { httpOnly: true, maxAge }
    );
    return createAccessToken(User, loginKey)
  },

  //setUserActive( id: Int!, active: Boolean! ): User,
  setUserActive: async ( root, { id, active }, { req, userID } ) => {
    const User = await checkResolver( req, ['users'] );
    const TargetUser = <UserInstance> await models.User.findByPk(id, { include: [{ model: models.Role }] });
    if( TargetUser === null ){
      throw createDoesNoExistsError('User');
    }
    //nesmie mat vacsi alebo rovny level ako ciel, ak nie je admin
    if( (<RoleInstance> User.get('Role')).get('level') >= (<RoleInstance> TargetUser.get('Role')).get('level') && (<RoleInstance> User.get('Role')).get('level') !== 0 ){
      addApolloError(
        'User activation/deactivation',
        DeactivateUserLevelTooLowError,
        userID,
        id
      );
      throw DeactivateUserLevelTooLowError;
    }

    //if admin
    if( (<RoleInstance> TargetUser.get('Role')).get('level') === 0 ){
      if( ( await (<RoleInstance> TargetUser.get('Role')).getUsers() ).filter((user) => user.get('active') ).length <= 1 ){
        throw OneAdminLeftError;
      }
    }

    //destory tokens when deactivated
    if( active === false){
      await models.Token.destroy({ where: { UserId: TargetUser.get('id') } })
    }

    return TargetUser.update( { active } );
  },


  //updateUser( id: Int!, active: Boolean, username: String, email: String, name: String, surname: String, password: String, receiveNotifications: Boolean, signature: String, role: Int ): User,
  updateUser: async ( root, { id, roleId, companyId, language, ...args }, { req, userID } ) => {
    const User = await checkResolver( req, ['users'] );

    const TargetUser = <UserInstance> await models.User.findByPk( id, { include: [{ model: models.Role }] } );
    if( TargetUser === null ){
      throw createDoesNoExistsError('User');
    }
    let changes = { ...args };
    if ( language ){
      changes.language = language;
    }
    if(args.password !== undefined ){
      if( args.password.length < 6 ){
        throw PasswordTooShort;
      }
      changes.password = await hash( args.password, 12 );
    }

    //nesmie menit rolu s nizsim alebo rovnym levelom ak nie je admin
    if( (<RoleInstance> User.get('Role')).get('level') >= (<RoleInstance> TargetUser.get('Role')).get('level') && (<RoleInstance> User.get('Role')).get('level') !== 0 ){
      addApolloError(
        'User',
        UserRoleLevelTooLowError,
        userID,
        id
      );
      throw UserRoleLevelTooLowError;
    }

    if( companyId ){
      const NewCompany = await models.Company.findByPk(companyId);
      if( NewCompany === null ){
        throw createDoesNoExistsError('Company', companyId);
      }
      changes.CompanyId = companyId
    }

    if( roleId ){
      const NewRole = <RoleInstance> await models.Role.findByPk(roleId);
      if( NewRole === null ){
        throw createDoesNoExistsError('Role', roleId);
      }

      //ak pouzivatel edituje sam seba nemoze menit rolu
      if( TargetUser.get('id') === User.get('id') && roleId !== (<RoleInstance> User.get('Role')).get('id') ){
        addApolloError(
          'User',
          CantChangeYourRoleError,
          userID,
          id
        );
        throw CantChangeYourRoleError;
      }

      //nesmie dat rolu s nizssim alebo rovnym levelom ak nie je admin
      if( (<RoleInstance> User.get('Role')).get('level') >= NewRole.get('level') && (<RoleInstance> User.get('Role')).get('level') !== 0 ){
        addApolloError(
          'User',
          UserNewRoleLevelTooLowError,
          userID,
          id
        );
        throw UserNewRoleLevelTooLowError;
      }

      //ak je target user admin skontrolovat ci este nejaky existuje
      if( (<RoleInstance> TargetUser.get('Role')).get('level') === 0 ){
        if( ( await (<RoleInstance> TargetUser.get('Role')).getUsers() ).filter((user) => user.get('active') ).length <= 1 ){
          throw OneAdminLeftError;
        }
      }

      if( TargetUser.get('id') !== User.get('id') ){
        changes.RoleId = roleId;
      }
    }
    return TargetUser.update( changes );
  },

  //updateProfile( active: Boolean, username: String, email: String, name: String, surname: String, password: String, receiveNotifications: Boolean, signature: String ): User,
  updateProfile: async ( root, { companyId, language, ...args }, { req, res } ) => {
    const User = await checkResolver( req );
    let changes = { ...args };
    if ( language ){
      changes.language = language;
    }
    if(args.password !== undefined ){
      if( args.password.length < 6 ){
        throw PasswordTooShort;
      }
      await models.Token.destroy({ where: { UserId: User.get('id') } })
      changes.password = await hash( args.password, 12 );
    }
    User.update( changes );
    let loginKey = randomString();
    let expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    User.createToken({ key: loginKey, expiresAt });

    res.cookie(
      'jid',
      await createRefreshToken(User, loginKey),
      { httpOnly: true, maxAge }
    );
    return {
      user: User,
      accessToken: await createAccessToken(User, loginKey)
    };
  },

  //deleteUser( id: Int! ): User,
  deleteUser: async ( root, { id }, { req, userID } ) => {
    const User = await checkResolver( req, ['users'] );
    const TargetUser = <UserInstance> await models.User.findByPk(id,
      {
        include: [
          { model: models.Role },
          { model: models.Project, as: 'defAssignedTo', include: [{ model: models.User, as: 'defAssignedTo'  }] },
          { model: models.Project, as: 'defRequester' },

        ]
      }
    );
    if( TargetUser === null ){
      throw createDoesNoExistsError('User');
    }
    //nesmie mazat rolu s nizsim alebo rovnym levelom ak nie je admin
    if( (<RoleInstance> User.get('Role')).get('level') >= (<RoleInstance> TargetUser.get('Role')).get('level') && (<RoleInstance> User.get('Role')).get('level') !== 0 ){
      addApolloError(
        'User',
        CantDeleteLowerLevelError,
        userID,
        id
      );
      throw CantDeleteLowerLevelError;
    }
    //if admin
    if( (<RoleInstance> TargetUser.get('Role')).get('level') === 0 ){
      if( ( await  (<RoleInstance> TargetUser.get('Role')).getUsers() ).filter((user) => user.get('active') ).length <= 1 ){
        throw OneAdminLeftError;
      }
    }

    let promises = [
      ...(<ProjectInstance[]>TargetUser.get('defAssignedTo')).map( (project) => {
        if((<UserInstance[]>project.get('defAssignedTo')).length === 1 && project.get('defAssignedToFixed') ){
          return Promise.all([project.removeDefAssignedTo(TargetUser.get('id')),project.update({ defAssignedToDef: false, defAssignedToFixed: false, defAssignedToShow:true })])
        }
        return project.removeDefAssignedTo(TargetUser.get('id'));
      } ),
      ...(<ProjectInstance[]>TargetUser.get('defRequester')).map( (project) => {
        return project.setDefRequester(null);
      })
    ]



    await Promise.all(promises);
    return TargetUser.destroy();
  },

  //setUserStatuses( ids: [Int]! ): User
  setUserStatuses: async ( root, { ids }, { req } ) => {
    const User = await checkResolver( req );
    await idsDoExistsCheck( ids, model.User );
    return User.setStatuses( ids );
  },

  //setTasklistLayout( : TasklistLayoutEnum! ): User
  setTasklistLayout: async ( root, { tasklistLayout }, { req } ) => {
    const User = await checkResolver( req );
    return User.update( { tasklistLayout: parseInt(tasklistLayout) } );
  },
}

const attributes = {
  User: {
    async role(user) {
      return user.getRole()
    },
    async company(user) {
      return user.getCompany()
    },
    async statuses(user) {
      return user.getStatuses()
    },
  },
  BasicUser: {
    async company(user) {
      return user.getCompany()
    },
  },
};

export default {
  attributes,
  mutations,
  querries
}
