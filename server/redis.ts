import { Redis } from "ioredis";

class RedisC<K, V> {
    constructor(
        private redis: Redis,
        private ttl: number
    ){}

    async put(key: K, value: V): Promise<void>{
        await this.redis.set(String(key), JSON.stringify(value), "EX", this.ttl);
    }

    async get(key: K): Promise<V | null> {
        const value = await this.redis.get(String(key)); 

        return value ? (JSON.parse(value) as V) : null;;
    }

    async deleteKey(key: K): Promise<void>{
        await this.redis.del(String(key));
    }
}

export default RedisC;