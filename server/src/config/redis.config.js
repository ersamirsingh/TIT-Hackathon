import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();


const redisClient = createClient({
   username: 'default',
   password: process.env.REDIS_PASS,
   socket: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT
   }
});

redisClient.on('connect', () => console.log('Redis Client Connected'));
redisClient.on('error', err => console.log('Redis Client Error', err));

export default redisClient;


