import { db } from './db';
import type { User } from '@/models';
import { generateId } from '@/utils';
import bcrypt from 'bcryptjs';

export interface CreateUserDTO {
  email: string;
  password: string;
  name: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export class UserRepository {
  async findByEmail(email: string): Promise<User | undefined> {
    return db.users.where('email').equals(email).first();
  }

  async findById(id: string): Promise<User | undefined> {
    return db.users.get(id);
  }

  async create(data: CreateUserDTO): Promise<User> {
    const existing = await this.findByEmail(data.email);
    if (existing) {
      throw new Error('邮箱已被注册');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const now = new Date();
    
    const user: User = {
      id: generateId(),
      email: data.email,
      name: data.name,
      createdAt: now,
      updatedAt: now,
    };

    await db.users.add(user);
    await db.table('passwords').add({
      userId: user.id,
      hash: passwordHash,
    });

    return user;
  }

  async validatePassword(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (!user) {
      return null;
    }

    const passwordRecord = await db.table('passwords').where('userId').equals(user.id).first();
    if (!passwordRecord) {
      return null;
    }

    const isValid = await bcrypt.compare(password, passwordRecord.hash);
    if (!isValid) {
      return null;
    }

    return user;
  }

  async update(id: string, data: Partial<Pick<User, 'name'>>): Promise<void> {
    await db.users.update(id, {
      ...data,
      updatedAt: new Date(),
    });
  }

  async delete(id: string): Promise<void> {
    await db.transaction('rw', [db.users, db.novels, db.table('passwords')], async () => {
      await db.users.delete(id);
      await db.novels.where('userId').equals(id).delete();
      await db.table('passwords').where('userId').equals(id).delete();
    });
  }
}

db.version(1).stores({
  users: 'id, email',
  novels: 'id, userId, updatedAt',
  volumes: 'id, novelId, order',
  chapters: 'id, volumeId, order',
  characters: 'id, novelId',
});

db.version(2).stores({
  users: 'id, email',
  novels: 'id, userId, updatedAt',
  volumes: 'id, novelId, order',
  chapters: 'id, volumeId, order',
  characters: 'id, novelId',
  passwords: 'userId',
});

export const userRepository = new UserRepository();
