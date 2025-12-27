import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test_challenge';