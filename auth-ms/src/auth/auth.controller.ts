import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LoginUserDto, RegisterUserDto } from './dto';

@Controller()
export class AuthController {
  constructor() {}

  @MessagePattern('auth.register.user')
  registerUser( @Payload() registerUserDto: RegisterUserDto ) {
    return registerUserDto;
  }

  @MessagePattern('auth.login.user')
  loginUser( @Payload() loginUserDto: LoginUserDto ) {
    return loginUserDto;
  }

  @MessagePattern('auth.verify.user')
  verifyToken() {
    return 'verify token'
  }
}
