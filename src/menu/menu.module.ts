import { Module } from '@nestjs/common';
import { MenuService } from './menu.service';
import { PublicMenuController } from './public-menu.controller';
import { Category, CategorySchema } from './schemas/category.schema';
import { MenuItem, MenuItemSchema } from './schemas/item.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminMenuController } from './admin-menu.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      { name: MenuItem.name, schema: MenuItemSchema },
    ]),
  ],
  providers: [MenuService],
  controllers: [PublicMenuController, AdminMenuController],
  exports: [MongooseModule, MenuService],
})
export class MenuModule {}
