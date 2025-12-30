import mongoose, { Document, Schema } from "mongoose";
import { userType } from "../types/user.type";
const userSchema: Schema = new Schema<userType>(
    {
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        username: { type: String, required: true, unique: true },
        firstName: { type: String },
        lastName: { type: String },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        }
    },
    {
        timestamps: true, // auto createdAt and updatedAt
    }
);

export interface IUser extends userType, Document { // combine UserType and Document
    _id: mongoose.Types.ObjectId; // mongo related attribute/ custom attributes
    createdAt: Date;
    updatedAt: Date;
}

export const UserModel = mongoose.model<IUser>('User', userSchema);
