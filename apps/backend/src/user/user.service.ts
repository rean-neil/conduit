import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { validate } from 'class-validator';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { EntityManager, wrap } from '@mikro-orm/core';
import { SECRET } from '../config';
import { CreateUserDto, LoginUserDto, UpdateUserDto } from './dto';
import { User } from './user.entity';
import { IUserRO, IUsersRO } from './user.interface';
import { UserRepository } from './user.repository';
import { Article } from '../article/article.entity';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository, private readonly em: EntityManager) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  async findOne(loginUserDto: LoginUserDto): Promise<User> {
    const findOneOptions = {
      email: loginUserDto.email,
      password: crypto.createHmac('sha256', loginUserDto.password).digest('hex'),
    };

    return (await this.userRepository.findOne(findOneOptions))!;
  }

  async create(dto: CreateUserDto): Promise<IUserRO> {
    // check uniqueness of username/email
    const { username, email, password } = dto;
    const exists = await this.userRepository.count({ $or: [{ username }, { email }] });

    if (exists > 0) {
      throw new HttpException(
        {
          message: 'Input data validation failed',
          errors: { username: 'Username and email must be unique.' },
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    // create new user
    const user = new User(username, email, password);
    const errors = await validate(user);

    if (errors.length > 0) {
      throw new HttpException(
        {
          message: 'Input data validation failed',
          errors: { username: 'Userinput is not valid.' },
        },
        HttpStatus.BAD_REQUEST,
      );
    } else {
      await this.em.persistAndFlush(user);
      return this.buildUserRO(user);
    }
  }

  async update(id: number, dto: UpdateUserDto) {
    const user = await this.userRepository.findOne(id);
    wrap(user).assign(dto);
    await this.em.flush();

    return this.buildUserRO(user!);
  }

  async delete(email: string) {
    return this.userRepository.nativeDelete({ email });
  }

  async findById(id: number): Promise<IUserRO> {
    const user = await this.userRepository.findOne(id);

    if (!user) {
      const errors = { User: ' not found' };
      throw new HttpException({ errors }, 401);
    }

    return this.buildUserRO(user);
  }

  async findByEmail(email: string): Promise<IUserRO> {
    const user = await this.userRepository.findOneOrFail({ email });
    return this.buildUserRO(user);
  }

  generateJWT(user: User) {
    const today = new Date();
    const exp = new Date(today);
    exp.setDate(today.getDate() + 60);

    return jwt.sign(
      {
        email: user.email,
        exp: exp.getTime() / 1000,
        id: user.id,
        username: user.username,
      },
      SECRET,
    );
  }

  private buildUserRO(user: User) {
    const userRO = {
      bio: user.bio,
      email: user.email,
      image: user.image,
      token: this.generateJWT(user),
      username: user.username,
    };

    return { user: userRO };
  }

  async getUsersWithArticleStats(): Promise<User[]> {
    const connection = this.em.getConnection();
    const query = `
      SELECT
        u.*,
        COUNT(a.id) AS totalArticles,
        SUM(a.favorites_count) AS totalLikes,
        MIN(a.created_at) AS firstArticleDate
      FROM
        user u
      LEFT JOIN
        article a ON u.id  = a.author_id
      GROUP BY
        u.id
      ORDER BY
        totalLikes DESC;
    `;

    const results = await connection.execute(query);
    return results;
  }

  async getUsersWithArticleStats2(): Promise<any> {
    const users = await this.userRepository.findAll();
    const list  = users.map((user) => {return {...user}});

    const userWithArticleData = await Promise.all(
      list.map(async (user) => {
        const articles: any = await this.em.find(Article, { author: user.id });
        const article_list: any = articles.map((user: any) => {return {...user}});
        const articleCount = article_list.length;
        const likesReceived = articles.reduce(
          (totalLikes: number, article: any) => totalLikes + article.favoritesCount,
          0
        );
        const firstArticleDate = article_list.length
          ? article_list[0].createdAt
          : '';

        return {
          user,
          articleCount,
          likesReceived,
          firstArticleDate,
        };
      })
    );

    return userWithArticleData.sort((a, b) => b.likesReceived - a.likesReceived);
  }
}
