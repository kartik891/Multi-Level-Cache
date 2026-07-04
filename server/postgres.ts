import { Pool } from "pg";

class Postgres<K, V> {
    constructor(private pool: Pool) {}

    async get(key: K): Promise<V | null> {
        const result = await this.pool.query(
            "SELECT value FROM cache_entries WHERE key = $1",
            [String(key)]
        );
        return result.rows.length > 0 ? (result.rows[0].value as V) : null;
    }

    async put(key: K, value: V): Promise<void> {
        await this.pool.query(
            `INSERT INTO cache_entries (key, value, updated_at)
             VALUES ($1, $2, now())
             ON CONFLICT (key)
             DO UPDATE SET value = $2, updated_at = now()`,
            [String(key), JSON.stringify(value)]
        );
    }

    async deleteKey(key: K): Promise<void> {
        await this.pool.query(
            "DELETE FROM cache_entries WHERE key = $1",
            [String(key)]
        );
    }
}

export default Postgres;