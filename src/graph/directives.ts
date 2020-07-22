import { SchemaDirectiveVisitor } from 'apollo-server-express';
import { verifyAccToken } from 'configs/jwt';
import { InvalidTokenError, NoAccTokenError, createAttributeNoAccess } from 'configs/errors';
import { defaultFieldResolver, GraphQLBoolean } from 'graphql';
import { UserInstance } from 'models/instances';
import { models } from 'models';

class AuthDirective extends SchemaDirectiveVisitor {
  visitObject(type) {
    if (type._authFieldsWrapped) return;
    type._authFieldsWrapped = true;

    const fields = type.getFields();

    Object.keys(fields).forEach(fieldName => {
      this.processField(fields[fieldName])
    });
  }
  visitFieldDefinition(field, details) {
    if (details.objectType._authFieldsWrapped) return;
    details.objectType._authFieldsWrapped = true;
    this.processField(field);
  }

  processField(field){
    const { resolve = defaultFieldResolver } = field;
    field.resolve = async function ( ...args ) {

      const { req } = args[2];
      const token = req.headers.authorization as String;
      if( !token ){
        throw NoAccTokenError;
      }
      try{
        await verifyAccToken( token.replace('Bearer ',''), models.User );
      }catch(error){
        throw InvalidTokenError;
      }
      return resolve.apply(this, args);
    };
  }
}

class AccessDirective extends SchemaDirectiveVisitor {
  visitObject(type) {
    const fields = type.getFields();

    Object.keys(fields).forEach(fieldName => {
      this.processField(fields[fieldName], this.args.access || [] );
    });
  }

  visitFieldDefinition(field, details) {
    this.processField(field, this.args.access || [] );
  }

  processField(field, access){
    const { resolve = defaultFieldResolver } = field;
    field.resolve = async function ( ...args ) {

      const { userData } = args[2];

      if( !userData ){
        throw NoAccTokenError;
      }
      const user = <UserInstance> await models.User.findByPk(userData.id);
      const role = await user.getRole();

      const rules = await role.getAccessRight();

      if( access.every( (rule) => rules[rule] && typeof rules[rule] === "boolean" ) ){
        return resolve.apply(this, args);
      }

      field.type = GraphQLBoolean;
      field.astNode.type.kind = 'NamedType';

      return null;
    };
  }
}

export default {
  AuthDirective,
  AccessDirective,
}

export const Directives = `
directive @AuthDirective on OBJECT | FIELD_DEFINITION
directive @AccessDirective( access: [String] ) on OBJECT | FIELD_DEFINITION
`
