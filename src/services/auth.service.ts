import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { generateToken } from '../utils/jwt.js';

export class AuthService {
    async register(email: string, password: string) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new Error('User already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            email,
            password: hashedPassword,
        });

        const token = generateToken({
            userId: user._id.toString(),
            email: user.email,
        });

        return {
            user: {
                id: user._id,
                email: user.email,
            },
            token,
        };
    }

    async login(email: string, password: string) {
        const user = await User.findOne({ email });
        if (!user) {
            throw new Error('Invalid credentials');
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            throw new Error('Invalid credentials');
        }

        const token = generateToken({
            userId: user._id.toString(),
            email: user.email,
        });

        return {
            user: {
                id: user._id,
                email: user.email,
            },
            token,
        };
    }
}