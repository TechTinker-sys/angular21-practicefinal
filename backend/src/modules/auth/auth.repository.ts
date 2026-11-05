import { RevokedTokenModel } from './auth.model.js';

export interface AuthRepository {
  isTokenRevoked(tokenHash: string): Promise<boolean>;
  revokeToken(tokenHash: string): Promise<void>;
}

export class SequelizeAuthRepository implements AuthRepository {
  async isTokenRevoked(tokenHash: string): Promise<boolean> {
    return (await RevokedTokenModel.findByPk(tokenHash)) !== null;
  }

  async revokeToken(tokenHash: string): Promise<void> {
    await RevokedTokenModel.findOrCreate({
      where: { tokenHash },
      defaults: { tokenHash },
    });
  }
}
