import { hash, compare } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import jwt_decode from 'jwt-decode';
import { createAccessToken, createRefreshToken } from 'configs/jwt';
import { randomString } from 'helperFunctions';
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
import { UserInstance, RoleInstance } from 'models/interfaces';
import checkResolver from './checkResolver';

const querries = {
  users: async ( root, args, { req } ) => {
    await checkResolver( req, ['users'] );
    return models.User.findAll({
      order: [
        ['name', 'ASC'],
        ['surname', 'ASC'],
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
        ['name', 'ASC'],
        ['surname', 'ASC'],
        ['email', 'ASC'],
      ]
    })
  },
  basicUser: async ( root, { id }, { req } ) => {
    await checkResolver( req );
    return models.User.findByPk(id);
  },

}

//ACITVE

const mutations = {

  //registerUser( active: Boolean, username: String!, email: String!, name: String!, surname: String!, password: String!, receiveNotifications: Boolean, signature: String, role: Int!): User,
  //TODO TEST IT
  registerUser: async ( root, { password, roleId, ...targetUserData }, { req } ) => {
    const User = await checkResolver( req, ['users'] );
    const TargetRole = await models.Role.findByPk(roleId);
    if( TargetRole === null ){
      throw createDoesNoExistsError('Role', roleId);
    }
    if( User.get('Role').get('level') > TargetRole.get('level') ){
      throw CantCreateUserLevelError;
    }
    if( password.length < 6 ){
      throw PasswordTooShort;
    }
    const hashedPassword = await hash( password, 12 );
    const user = <UserInstance> await models.User.create({
      ...targetUserData,
      password: hashedPassword,
      tokenKey: randomString(),
    })
    return user.setRole(roleId);
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
    if( ! await User.get('active') ){
      throw UserDeactivatedError;
    }
    let loginKey = randomString();
    let expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    User.createToken({ key: loginKey, expiresAt });

    res.cookie(
      'jid',
      await createRefreshToken(User, loginKey),
      { httpOnly: true }
    );
    return {
      user: User,
      accessToken: await createAccessToken(User, loginKey)
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
      { httpOnly: true }
    );
    return createAccessToken(User, loginKey)
  },

  //setUserActive( id: Int!, active: Boolean! ): User,
  setUserActive: async ( root, { id, active }, { req } ) => {
    const User = await checkResolver( req, ['users'] );
    const TargetUser = <UserInstance> await models.User.findByPk(id, { include: [{ model: models.Role }] });
    if( TargetUser === null ){
      throw createDoesNoExistsError('User');
    }

    if( User.get('Role').get('level') > (await <RoleInstance> TargetUser.get('Role')).get('level') ){
      throw DeactivateUserLevelTooLowError;
    }

    //if admin
    if( TargetUser.get('Role').get('level') === 0 ){
      if( ( await TargetUser.get('Role').getUsers() ).filter((user) => user.get('active') ).length <= 1 ){
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
  updateUser: async ( root, { id, roleId, ...args }, { req } ) => {
    const User = await checkResolver( req, ['users'] );

    const TargetUser = <UserInstance> await models.User.findByPk( id, { include: [{ model: models.Role }] } );
    if( TargetUser === null ){
      throw createDoesNoExistsError('User');
    }
    let changes = { ...args };
    if(args.password !== undefined ){
      if( args.password.length < 6 ){
        throw PasswordTooShort;
      }
      changes.password = await hash( args.password, 12 );
    }
    if( roleId ){
      const NewRole = <RoleInstance> await models.Role.findByPk(roleId);
      if( NewRole === null ){
        throw createDoesNoExistsError('Role', roleId);
      }

      //ak pouzivatel edituje sam seba nemoze menit rolu
      if( TargetUser.get('id') === User.get('id') && roleId !== User.get('Role').get('id') ){
        throw CantChangeYourRoleError;
      }

      //nesmie dat rolu s nizssim levelom, nesmie menit rolu s nizsim levelom
      if( User.get('Role').get('level') > TargetUser.get('Role').get('level') ){
        throw UserRoleLevelTooLowError;
      }
      if( User.get('Role').get('level') > NewRole.get('level') ){
        throw UserNewRoleLevelTooLowError;
      }

      //ak je target user admin skontrolovat ci este nejaky existuje
      if( TargetUser.get('Role').get('level') === 0 ){
        if( ( await TargetUser.get('Role').getUsers() ).filter((user) => user.get('active') ).length <= 1 ){
          throw OneAdminLeftError;
        }
      }

      if( TargetUser.get('id') !== User.get('id') ){
        await TargetUser.setRole(roleId);
      }
    }
    return TargetUser.update( changes );
  },

  //updateProfile( active: Boolean, username: String, email: String, name: String, surname: String, password: String, receiveNotifications: Boolean, signature: String ): User,
  updateProfile: async ( root, args, { req, res } ) => {
    const User = await checkResolver( req );
    let changes = { ...args };
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
      { httpOnly: true }
    );
    return {
      user: User,
      accessToken: await createAccessToken(User, loginKey)
    };
  },

  //deleteUser( id: Int! ): User,
  deleteUser: async ( root, { id }, { req } ) => {
    const User = await checkResolver( req, ['users'] );
    const TargetUser = <UserInstance> await models.User.findByPk(id, { include: [{ model: models.Role }] });
    if( TargetUser === null ){
      throw createDoesNoExistsError('User');
    }
    if( User.get('Role').get('level') >  (<RoleInstance> TargetUser.get('Role')).get('level') ){
      throw CantDeleteLowerLevelError;
    }
    //if admin
    if( TargetUser.get('Role').get('level') === 0 ){
      if( ( await TargetUser.get('Role').getUsers() ).filter((user) => user.get('active') ).length <= 1 ){
        throw OneAdminLeftError;
      }
    }
    return TargetUser.destroy();
  },
}

const attributes = {
  User: {
    async role(user) {
      return user.getRole()
    }
  },
};

export default {
  attributes,
  mutations,
  querries
}
