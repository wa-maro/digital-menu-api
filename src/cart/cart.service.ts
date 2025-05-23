import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cart, CartDocument } from './schemas/cart.schema';
import { Model, Types } from 'mongoose';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(@InjectModel(Cart.name) private cartModel: Model<CartDocument>) {}

  async getUserCart(userId: string) {
    return await this.cartModel
      .findOne({ user: userId })
      .populate('items-item')
      .exec();
  }

  async addItem(userId: string, dto: AddToCartDto) {
    let cart = await this.cartModel.findOne({ user: userId });
    if (!cart)
      cart = new this.cartModel({
        user: userId,
        items: [],
      });

    const currentIndex = cart.items.findIndex(
      (i) => i.item.toString() === dto.itemId,
    );
    if (currentIndex >= 0) cart.items[currentIndex].quantity += dto.quantity;
    else
      cart.items.push({
        item: new Types.ObjectId(dto.itemId),
        quantity: dto.quantity,
        customizations: dto.customization,
        price: dto.price,
      });

    return cart.save();
  }

  async updateItemQuantity(
    userId: string,
    itemId: string,
    dto: UpdateCartItemDto,
  ) {
    const cart = await this.cartModel.findOne({ user: userId });
    if (!cart) throw new NotFoundException('Cart Not found');

    const item = cart.items.find((i) => i.item.toString() === itemId);
    if (item) item.quantity = dto.quantity;

    return cart.save();
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await this.cartModel.findOne({ user: userId });
    if (!cart) throw new NotFoundException('Cart Not found');

    cart.items = cart.items.filter((i) => i.item.toString() !== itemId);

    return cart.save();
  }

  async clearCart(userId: string) {
    const cart = await this.cartModel.findByIdAndUpdate({}, { items: [] });
    if (!cart) throw new NotFoundException('Cart Not Found');
    return cart;
  }
}
