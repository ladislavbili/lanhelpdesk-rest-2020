import { hash, compare } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { createAccessToken, createRefreshToken } from 'configs/jwt';
import { randomString } from 'helperFunctions';
import { InvalidTokenError, PasswordTooShort, FailedLoginError, UserDeactivatedError, createDoesNoExistsError } from 'configs/errors';

const querries = {
  users: async ( root, args, { models } ) => {
    return models.User.findAll()
  },
  user: async ( root, { id }, { models } ) => {
    return models.User.findByPk(id);
  },
}

const mutations = {

  //registerUser( active: Boolean, username: String!, email: String!, name: String!, surname: String!, password: String!, receiveNotifications: Boolean, signature: String): User,
  registerUser: async ( root, { active, username, email, name, surname, password, receiveNotifications, signature }, { models } ) => {
    if( password.length < 6 ){
      throw PasswordTooShort;
    }
    const hashedPassword = await hash( password, 12 );
    return models.User.create({
      active,
      username,
      email,
      name,
      surname,
      password: hashedPassword,
      receiveNotifications,
      signature,
      tokenKey: randomString()
    })
  },

  //loginUser( email: String!, password: String! ): UserData,
  loginUser: async ( root, { email, password }, { models, res } ) => {

    if( password.length < 6 ){
      throw PasswordTooShort;
    }
    const user = await models.User.findOne({ where: { email } })
    if( !user ){
      throw FailedLoginError;
    }
    if( ! await compare( password, user.get('password') ) ){
      throw FailedLoginError;
    }
    if( ! await user.get('active') ){
      throw UserDeactivatedError;
    }
    let loginKey = randomString();
    let expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    user.createToken({ key: loginKey, expiresAt });

    res.cookie(
      'jid',
      await createRefreshToken(user, loginKey),
      { httpOnly: true }
    );
    return {
      user,
      accessToken: await createAccessToken(user, loginKey)
    };
  },

  //logoutUser: Boolean,
  logoutUser: async ( root, args, { models, userData } ) => {
    if(userData === null){
      throw InvalidTokenError;
    }
    models.Token.destroy({ where: { key: userData.loginKey } })
    return true
  },

  //logoutAll: Boolean,
  logoutAll: async ( root, args, { models, userData } ) => {
    if(userData === null){
      throw InvalidTokenError;
    }
    models.Token.destroy({ where: { UserId: userData.id } })
    const user = await models.User.findByPk(userData.id);
    user.update({ tokenKey: randomString() })
    return true
  },

  //setUserActive( id: Int!, active: Boolean! ): User,
  setUserActive: async ( root, { id, active }, { models } ) => {
    const User = await models.User.findByPk(id);
    if( User === null ){
      throw createDoesNoExistsError('User');
    }
    return User.update( { active } );
  },

  //updateUser( id: Int!, active: Boolean, username: String, email: String, name: String, surname: String, password: String, receiveNotifications: Boolean, signature: String ): User,
  updateUser: async ( root, { id, ...args }, { models } ) => {
    let changes = { ...args };
    if(args.password !== undefined ){
      if( args.password.length < 6 ){
        throw PasswordTooShort;
      }
      changes.password = await hash( args.password, 12 );
    }
    const User = await models.User.findByPk(id);
    if( User === null ){
      throw createDoesNoExistsError('User');
    }
    return User.update( changes );
  },

  //updateProfile( active: Boolean, username: String, email: String, name: String, surname: String, password: String, receiveNotifications: Boolean, signature: String ): User,
  updateProfile: async ( root, args, { models, userData } ) => {
    let changes = { ...args };
    if(args.password !== undefined ){
      if( args.password.length < 6 ){
        throw PasswordTooShort;
      }
      changes.password = await hash( args.password, 12 );
    }
    if( userData === null ){
      throw InvalidTokenError;
    }
    const User = await models.User.findByPk(userData.id );
    return User.update( changes );
  },

  //deleteUser( id: Int! ): User,
  deleteUser: async ( root, { id }, { models } ) => {
    const User = await models.User.findByPk(id);
    if( User === null ){
      throw createDoesNoExistsError('User');
    }
    return User.destroy();
  },
}

const attributes = {
};

export default {
  attributes,
  mutations,
  querries
}
