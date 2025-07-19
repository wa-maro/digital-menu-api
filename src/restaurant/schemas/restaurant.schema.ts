import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum DayOfWeek {
  Monday = 'Monday',
  Tuesday = 'Tuesday',
  Wednesday = 'Wednesday',
  Thursday = 'Thursday',
  Friday = 'Friday',
  Saturday = 'Saturday',
  Sunday = 'Sunday',
}

export type WorkingHoursMap = {
  [key in DayOfWeek]?: { open: string; close: string };
};

@Schema({ timestamps: true })
export class Restaurant {
  @Prop({ type: String, default: 'singleton' })
  _id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: null })
  brandLogo?: string;

  @Prop({ default: null })
  description?: string;

  @Prop({
    type: [String],
    enum: Object.values(DayOfWeek),
  })
  workingDays?: DayOfWeek[];

  @Prop({
    type: Map,
    of: {
      open: { type: String, default: null },
      close: { type: String, default: null },
    },
    default: {},
  })
  workingHours?: WorkingHoursMap;
}

export type RestaurantDocument = Restaurant & Document;

export const RestaurantSchema = SchemaFactory.createForClass(Restaurant);
