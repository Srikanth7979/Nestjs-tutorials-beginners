import { HttpException, HttpStatus, Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';

import { LoginDTO, RegisterDTO } from '../auth/auth.dto';
import { Payload } from '../types/payload';
import { Repository } from 'typeorm';
import User from '../entities/User';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private userRepo: Repository<User>) {}

  // user register 
  async create(userDTO: RegisterDTO): Promise<User> {
    try {
    const { username } = userDTO;
    const user = await this.userRepo.findOne({ username });
    if (user) {
      throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
    }
    const newUser = new User();
    newUser.username = userDTO.username;
    newUser.password = userDTO.password;
    return await this.userRepo.save(newUser);
    }catch(err){
      throw new BadRequestException(err);
    }
  }

  async findByUserName(username: string): Promise<User> {
    try {
      const user = await this.userRepo.findOne({ username });
      if (user) {
        throw new HttpException('User does not exist in system', HttpStatus.UNAUTHORIZED);
      }
      return user;
      }catch(err){
        throw new UnauthorizedException(err);
      }
  }

  async findByLogin(userDTO: LoginDTO) {
    const { username, password } = userDTO;
    const user = await this.userRepo.findOne({ username });
    if (!user) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }
    if (await bcrypt.compare(password, user.password)) {
      return this.sanitizeUser(user);
    } else {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }
  }

  sanitizeUser(user: User) {
    const obj = {... user};
    delete obj['password'];
    return obj;
  }
}
