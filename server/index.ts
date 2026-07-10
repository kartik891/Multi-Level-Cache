import LRUCache from "./LRUCache";
import RedisC from "./redis"
import Postgres from "./postgres";
import redisClient from "./redis-config";
import pool from "./postgres-config";
import 'dotenv/config';

interface UserProfile {
    name: string,
    age: number
}

interface CacheFunctions<K, V> {
    get(key: K): Promise<V | null> | V | null;
    put(key: K, value: V): Promise<void> | void;
    deleteKey(key: K): Promise<void> | void;
}

class InProcess<K, V> implements CacheFunctions<K, V> {
    constructor(
        private lru: LRUCache<K, V>
    ) { }

    async get(key: K): Promise<V | null> {
        return this.lru.get(key);
    }

    async put(key: K, value: V): Promise<void> {
        this.lru.put(key, value);
    }

    async deleteKey(key: K): Promise<void> {
        this.lru.deleteKey(key);
    }
}

class RedisCache<K, V> implements CacheFunctions<K, V> {
    constructor(
        private redis: RedisC<K, V>,
    ) { }

    async get(key: K): Promise<V | null> {
        return this.redis.get(key);
    }

    async put(key: K, value: V): Promise<void> {
        return this.redis.put(key, value);
    }

    async deleteKey(key: K): Promise<void> {
        return this.redis.deleteKey(key);
    }
}

class PostgresData<K, V> implements CacheFunctions<K, V> {
    constructor(
        private postgres: Postgres<K, V>
    ) { }

    async get(key: K): Promise<V | null> {
        return this.postgres.get(key);
    }

    async put(key: K, value: V): Promise<void> {
        return this.postgres.put(key, value);
    }

    async deleteKey(key: K): Promise<void> {
        return this.postgres.deleteKey(key);
    }
}

class CacheService<K, V> {
    constructor(
        private l1: CacheFunctions<K, V>,
        private l2: CacheFunctions<K, V>,
        private l3: CacheFunctions<K, V>
    ) { }

    async get(key: K): Promise<V | null> {
        const l1Val = await this.l1.get(key);

        if (l1Val !== null) {
            return l1Val;
        }

        try {
            const l2Val = await this.l2.get(key);

            if (l2Val !== null) {
                await this.l1.put(key, l2Val);
                return l2Val;
            }
        } catch (err) {
            console.log("Redis Err");

        }

        try {
            const l3Val = await this.l3.get(key);
            if (l3Val !== null) {
                await this.l1.put(key, l3Val);

                try {
                    await this.l2.put(key, l3Val);
                } catch (err) {
                    console.log("Redis Put Err");
                }

                return l3Val;
            }
        } catch (err) {
            console.log("Postgres Err");
        }

        console.log("Key not present in Database");
        return null;
    }

    async put(key: K, value: V): Promise<void> {
        await this.l3.put(key, value);

        try {
            await this.l2.put(key, value);
        }
        catch (err) {
            console.log("Redis Put Err");
        }

        try {
            await this.l1.put(key, value);
        } catch (err) {
            console.log("LRU Cache Put Err");
        }

    }

    async deleteKey(key: K): Promise<void> {

        try {
            await this.l1.deleteKey(key);
        } catch (err) {
            console.log("LRU Cache Delete Err");
        }

        try {
            await this.l2.deleteKey(key);
        } catch (err) {
            console.log("Redis Delete Err");
        }

        await this.l3.deleteKey(key);
    }
}

const lru = new LRUCache<string, UserProfile>(50);
const redisCli = redisClient();
const l2Redis = new RedisC<string, UserProfile>(redisCli, 5);
const postgresClient = new Postgres<string, UserProfile>(pool);

const l1 = new InProcess(lru);
const l2 = new RedisCache<string, UserProfile>(l2Redis);
const l3 = new PostgresData<string, UserProfile>(postgresClient);

const cache = new CacheService(l1, l2, l3);

async function main() {
    const user = await cache.get('user:123');
}

main();
