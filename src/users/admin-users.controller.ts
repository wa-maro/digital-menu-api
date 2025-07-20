import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RoleGuard } from 'src/common/guards/roles.guard';
import { UsersService } from './users.service';
import { CustomRequest } from 'src/interfaces/custom-request.interface';
import { UpdateProfileDto } from './dto/update-profile.dto';

@UseGuards(AuthGuard('jwt'), RoleGuard)
@Roles('admin', 'manager')
@Controller('admin')
export class AdminUsersController {
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

  @Get('customers')
  async getCustomers() {
    return this.usersService.findCustomers();
  }
}
