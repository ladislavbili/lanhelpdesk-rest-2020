import { hash, compare } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { createAccessToken, createRefreshToken } from 'configs/jwt';
import { randomString } from 'helperFunctions';
import { InvalidTokenError, PasswordTooShort, FailedLoginError, UserDeactivatedError, createDoesNoExistsError } from 'configs/errors';
import { models } from 'models';
import { UserInstance } from 'models/interfaces';

const querries = {
  users: async ( root, args ) => {
    return models.User.findAll()
  },
  user: async ( root, { id } ) => {
    return models.User.findByPk(id);
  },
}

const mutations = {

  //registerUser( active: Boolean, username: String!, email: String!, name: String!, surname: String!, password: String!, receiveNotifications: Boolean, signature: String, role: Int!): User,
  registerUser: async ( root, { active, username, email, name, surname, password, receiveNotifications, signature, role } ) => {
    if( password.length < 6 ){
      throw PasswordTooShort;
    }
    const hashedPassword = await hash( password, 12 );
    const user = <UserInstance> await models.User.create({
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
    return user.setRole(role);
  },

  //loginUser( email: String!, password: String! ): UserData,
  loginUser: async ( root, { email, password }, { res } ) => {

    if( password.length < 6 ){
      throw PasswordTooShort;
    }
    const user = <UserInstance> await models.User.findOne({ where: { email } })
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
  logoutUser: async ( root, args, { userData } ) => {
    if(userData === null){
      throw InvalidTokenError;
    }
    models.Token.destroy({ where: { key: userData.loginKey } })
    return true
  },

  //logoutAll: Boolean,
  logoutAll: async ( root, args, { userData } ) => {
    if(userData === null){
      throw InvalidTokenError;
    }
    models.Token.destroy({ where: { UserId: userData.id } })
    const user = await models.User.findByPk(userData.id);
    user.update({ tokenKey: randomString() })
    return true
  },

  //setUserActive( id: Int!, active: Boolean! ): User,
  setUserActive: async ( root, { id, active } ) => {
    const User = await models.User.findByPk(id);
    if( User === null ){
      throw createDoesNoExistsError('User');
    }
    return User.update( { active } );
  },

  //updateUser( id: Int!, active: Boolean, username: String, email: String, name: String, surname: String, password: String, receiveNotifications: Boolean, signature: String, role: Int ): User,
  updateUser: async ( root, { id, role, ...args } ) => {
    let changes = { ...args };
    if(args.password !== undefined ){
      if( args.password.length < 6 ){
        throw PasswordTooShort;
      }
      changes.password = await hash( args.password, 12 );
    }
    const User = <UserInstance> await models.User.findByPk(id);
    if( User === null ){
      throw createDoesNoExistsError('User');
    }
    if( role ){
      await User.setRole(role);
    }
    return User.update( changes );
  },

  //updateProfile( active: Boolean, username: String, email: String, name: String, surname: String, password: String, receiveNotifications: Boolean, signature: String ): User,
  updateProfile: async ( root, args, { userData } ) => {
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
  deleteUser: async ( root, { id } ) => {
    const User = await models.User.findByPk(id);
    if( User === null ){
      throw createDoesNoExistsError('User');
    }
    return User.destroy();
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
