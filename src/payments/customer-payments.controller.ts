import { Controller, UseGuards } from '@nestjs/common';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from 'src/common/guards/roles.guard';

@UseGuards(AuthGuard('jwt'), RoleGuard)
@Roles('customer')
@Controller('customer/payments')
export class CustomerPaymentController {}
