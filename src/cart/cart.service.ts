import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cart, CartDocument } from './schemas/cart.schema';
import { Model, Types } from 'mongoose';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { Order } from 'src/orders/schemas/order.schema';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>,
  ) {}

  async geCarts() {
    return await this.cartModel
      .find({ 'items.0': { $exists: true } })
      .populate('user', 'fullName email')
      .populate('items.item')
      .lean()
      .exec();
  }

  async getUserCart(userId: string) {
    return await this.cartModel
      .findOne({ user: userId })
      .populate('items.item')
      .lean()
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
    const cart = await this.cartModel.findOneAndUpdate(
      { user: userId },
      { items: [] },
    );
    if (!cart) throw new NotFoundException('Cart Not Found');

    return cart;
  }

  async createCartFromOrder(order: Order, merge = false) {
    const clonedItems = order.items.map((i) => ({
      item: i.item,
      quantity: i.quantity,
      customizations: i.customizations,
      price: i.price,
    }));

    let newCart = await this.cartModel.findOne({ user: order.user });
    if (!newCart) newCart = new this.cartModel({ user: order.user, items: [] });

    if (!merge) newCart.items = clonedItems;
    else {
      for (const newItem of clonedItems) {
        const existing = newCart.items.find(
          (i) => i.item.toString() === newItem.item.toString(),
        );
        if (existing) existing.quantity += newItem.quantity;
        else newCart.items.push(newItem);
      }
    }

    return await newCart.save();
  }
}
