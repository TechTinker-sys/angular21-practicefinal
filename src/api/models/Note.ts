import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../database';

export class Note extends Model<InferAttributes<Note>, InferCreationAttributes<Note>> {
  declare id: CreationOptional<string>;
  declare title: string;
  declare content: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Note.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: 'Untitled note',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '',
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'notes',
    timestamps: true,
  },
);
