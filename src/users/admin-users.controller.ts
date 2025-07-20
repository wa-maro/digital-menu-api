import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RoleGuard } from 'src/common/guards/roles.guard';
import { UsersService } from './users.service';

@UseGuards(AuthGuard('jwt'), RoleGuard)
@Roles('admin', 'manager')
@Controller('admin/customers')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getCustomers() {
    return this.usersService.findCustomers();
  }
}
