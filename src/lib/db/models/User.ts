import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser {
    email: string;
    password: string;
    name: string;
    role: 'user' | 'admin';
    createdAt?: Date;
    updatedAt?: Date;
}

interface IUserMethods {
    comparePassword(password: string): Promise<boolean>;
}

type UserModel = Model<IUser, {}, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>({
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    password: { type: String, required: true, minlength: 8 },
    name: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
}, { timestamps: true });

userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (password: string) {
    return bcrypt.compare(password, this.password);
};

export const User = (mongoose.models.User || mongoose.model<IUser, UserModel>('User', userSchema)) as UserModel;
