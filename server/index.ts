import LRUCache from "./LRUCache";
import RedisC from "./redis"
import Postgres from "./postgres";

interface UserProfile{
    name: string,
    age: number
}

interface CacheFunctions<K, V>{
    get (key: K): Promise<V | null> | V | null;
    put (key: K, value: V) : Promise<void> | void;
    deleteKey (key: K): Promise<void> | void;
}

class InProcess<K, V> implements CacheFunctions<K, V>{
    constructor(
        private lru: LRUCache<K, V>
    ) {}

    async get(key: K): Promise<V | null>{
        return this.lru.get(key);
    }

    async put(key: K, value: V): Promise<void>  {
        this.lru.put(key, value);
    }

    async deleteKey(key: K): Promise<void> {
        this.lru.deleteKey(key);
    }
}

class RedisCache<K, V> implements CacheFunctions<K, V>{
    constructor(
        private redis: RedisC
    ){}

    async get(key: K): Promise<V | null>{
        return this.redis.get(key);
    }

    async put(key: K, value: V): Promise<void> {
        return this.redis.put(key, value);
    }

    async deleteKey(key: K): Promise<void>{
        return this.redis.deleteKey(key);
    }
}

class PostgresData<K, V> implements CacheFunctions<K, V> {
    constructor(
        private postgres: Postgres 
    ){

    }
    async get(key: K): Promise<V | null>{
        return this.postgres.get(key);
    }

    async put(key: K, value: V): Promise<void> {
        return this.postgres.put(key, value);
    }

    async deleteKey(key: K): Promise<void>{
        return this.postgres.deleteKey(key);
    }
}

class CacheService<K, V>{
    constructor(
        private l1: CacheFunctions<K, V>,
        private l2: CacheFunctions<K, V>,
        private l3: CacheFunctions<K, V>
    ) {}

    async get(key: K): Promise<V | null> {
        const l1Val = await this.l1.get(key);

        if(l1Val !== null){
            return l1Val;
        }

        const l2Val = await this.l2.get(key);

        if(l2Val !== null){
            await this.l1.put(key, l2Val);
            return l2Val;
        }

        const l3Val = await this.l3.get(key);
        
        if(l3Val !== null){
            await this.l1.put(key, l3Val);
            await this.l2.put(key, l3Val);
            return l3Val;
        }

        return null;
    }

    async put(key: K, value: V): Promise<void> {
        
        await this.l3.put(key, value);
        await this.l2.put(key, value);
        await this.l1.put(key, value);
    }

    async deleteKey(key: K): Promise<void> {
        
        await this.l1.deleteKey(key);
        await this.l2.deleteKey(key);
        await this.l3.deleteKey(key);
    }
}

const lru = new LRUCache<string, UserProfile>(50);
const l1 = new InProcess(lru);
const l2 = new RedisCache<string, UserProfile>(50);
const l3 = new PostgresData<string, UserProfile>(50);

const cache = new CacheService(l1, l2, l3);

const user = await cache.get('user:123');