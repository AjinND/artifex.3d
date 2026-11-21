import { User } from '@/lib/db/models/User';
import { AppError } from '@/lib/utils/errors';
import { CreateUserInput } from '@/lib/validators/user';

export class UserService {
    static async createUser(data: CreateUserInput) {
        try {
            const existing = await User.findOne({ email: data.email });
            if (existing) throw new AppError('Email exists', 409);

            const user = await User.create(data);
            return user;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Failed to create user', 500);
        }
    }

    static async getUserById(id: string) {
        try {
            const user = await User.findById(id).select('-password');
            if (!user) throw new AppError('User not found', 404);
            return user;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Failed to fetch user', 500);
        }
    }
}
