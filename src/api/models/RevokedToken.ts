import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../database';

export class RevokedToken extends Model<
  InferAttributes<RevokedToken>,
  InferCreationAttributes<RevokedToken>
> {
  declare tokenHash: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

RevokedToken.init(
  {
    tokenHash: {
      type: DataTypes.CHAR(64),
      primaryKey: true,
      field: 'token_hash',
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'revoked_tokens',
    timestamps: true,
  },
);
