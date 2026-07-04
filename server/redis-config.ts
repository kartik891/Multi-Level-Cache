import { Redis } from "ioredis";
import 'dotenv/config';

function redisClient(): Redis {
    return new Redis({
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: Number(process.env.REDIS_PORT) || 6379,
    });
}

export default redisClient;