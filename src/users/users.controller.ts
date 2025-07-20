import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { CustomRequest } from 'src/interfaces/custom-request.interface';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from 'src/common/guards/roles.guard';

@UseGuards(AuthGuard('jwt'), RoleGuard)
@Roles('customer')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me/profile')
  async getProfile(@Req() req: CustomRequest) {
    const userId = req.user.userId;
    return await this.usersService.findUserWithProfile(userId);
  }

  @Patch('me/profile')
  async updateProfile(
    @Req() req: CustomRequest,
    @Body() dto: UpdateProfileDto,
  ) {
    const userId = req.user.userId;
    return await this.usersService.updateOrCreateProfile(userId, dto);
  }
}
