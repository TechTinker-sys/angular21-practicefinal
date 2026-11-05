import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../../loaders/database.js';

export class RevokedTokenModel extends Model<
  InferAttributes<RevokedTokenModel>,
  InferCreationAttributes<RevokedTokenModel>
> {
  declare tokenHash: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

RevokedTokenModel.init(
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
