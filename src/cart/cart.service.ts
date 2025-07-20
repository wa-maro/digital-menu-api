import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cart, CartDocument } from './schemas/cart.schema';
import { isValidObjectId, Model, Types } from 'mongoose';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { Order } from 'src/orders/schemas/order.schema';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>,
  ) {}

  async getAllCarts() {
    return await this.cartModel
      .find({ 'items.0': { $exists: true } })
      .populate({
        path: 'user',
        select: 'profile email',
        populate: {
          path: 'profile',
          select: 'fullName',
        },
      })
      .populate('items.item')
      .exec();
  }

  async getCartById(cartId: string) {
    if (!isValidObjectId(cartId))
      throw new BadRequestException('Invalid cart ID');

    const cart = await this.cartModel
      .findById(new Types.ObjectId(cartId))
      .populate({
        path: 'user',
        select: 'profile email',
        populate: {
          path: 'profile',
          select: 'fullName',
        },
      })
      .populate('items.item')
      .exec();

    if (!cart) throw new NotFoundException('Cart not found');
    return cart;
  }

  async getUserCart(userId: string) {
    if (!isValidObjectId(userId))
      throw new BadRequestException('Invalid user ID');

    const cart = await this.cartModel
      .findOne({ user: new Types.ObjectId(userId) })
      .populate('items.item')
      .exec();

    if (!cart) throw new NotFoundException('Cart for user is not found');
    return cart;
  }

  async addItemToCart(userId: string, dto: AddToCartDto) {
    const { itemId, price, quantity, customization } = dto;

    if (!isValidObjectId(userId) || !isValidObjectId(itemId)) {
      throw new BadRequestException('Invalid ID(s)');
    }

    // First, try to update the quantity if item exists
    const existingCart = await this.cartModel.findOne({
      user: new Types.ObjectId(userId),
    });

    if (existingCart) {
      const index = existingCart.items.findIndex(
        (i) => i.item.toString() === itemId,
      );

      if (index >= 0) {
        // Increase quantity
        existingCart.items[index].quantity += quantity;
      } else {
        // Add new item
        existingCart.items.push({
          item: new Types.ObjectId(itemId),
          quantity,
          customizations: customization,
          price,
        });
      }

      return await existingCart.save();
    }

    // Create new cart if none exists
    return await this.createCartWithItem(userId, dto);
  }

  private async createCartWithItem(userId: string, dto: AddToCartDto) {
    const { itemId, price, quantity, customization } = dto;

    return await this.cartModel.create({
      user: new Types.ObjectId(userId),
      items: [
        {
          item: new Types.ObjectId(itemId),
          quantity,
          customizations: customization,
          price,
        },
      ],
    });
  }

  async updateItemQuantity(userId: string, itemId: string, quantity: number) {
    if (!isValidObjectId(userId) || !isValidObjectId(itemId))
      throw new BadRequestException('Invalid ID(s)');

    const cart = await this.cartModel.findOne({
      user: new Types.ObjectId(userId),
    });
    if (!cart) throw new NotFoundException('Cart not found for this user');

    const item = cart.items.find((i) => i.item.toString() === itemId);
    if (!item) throw new NotFoundException('Item not found in cart');

    item.quantity = quantity;
    return await cart.save();
  }

  async removeItemFromCart(userId: string, itemId: string) {
    if (!isValidObjectId(userId) || !isValidObjectId(itemId))
      throw new BadRequestException('Invalid ID(s)');

    const cart = await this.cartModel.findOne({
      user: new Types.ObjectId(userId),
    });
    if (!cart) throw new NotFoundException('Cart not found');

    cart.items = cart.items.filter((i) => i.item.toString() !== itemId);
    return await cart.save();
  }

  async clearCartItems(userId: string) {
    if (!isValidObjectId(userId))
      throw new BadRequestException('Invalid user ID');

    const cart = await this.cartModel.findOneAndUpdate(
      { user: new Types.ObjectId(userId) },
      { items: [] },
      { new: true },
    );

    if (!cart) throw new NotFoundException('Cart not found');

    return cart;
  }

  async createCartFromOrder(order: Order, merge = false) {
    const clonedItems = order.items.map((i) => ({
      item: i.item,
      quantity: i.quantity,
      customizations: i.customizations,
      price: i.price,
    }));

    let cart = await this.cartModel.findOne({ user: order.user });
    if (!cart) {
      cart = new this.cartModel({ user: order.user, items: [] });
    }

    if (!merge) {
      cart.items = clonedItems;
    } else {
      for (const newItem of clonedItems) {
        const existing = cart.items.find(
          (i) => i.item.toString() === newItem.item.toString(),
        );
        if (existing) {
          existing.quantity += newItem.quantity;
        } else {
          cart.items.push(newItem);
        }
      }
    }

    return await cart.save();
  }
}
