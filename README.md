# Multi-Tier Cache System

A TypeScript implementation of a tiered caching system with three layers — in-process LRU cache (L1), Redis (L2), and PostgreSQL (L3) — orchestrated by a single `CacheService`. Built as a portfolio project and as hands-on preparation for tiered cache / distributed cache design.

## Architecture

```
                ┌─────────────────┐
   Request ───▶ │   CacheService   │
                └────────┬─────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
   ┌─────────┐      ┌─────────┐      ┌───────────┐
   │   L1    │      │   L2    │      │    L3     │
   │In-Process│      │  Redis  │      │ Postgres  │
   │   LRU    │      │ (cache) │      │(source of │
   │          │      │         │      │  truth)   │
   └─────────┘      └─────────┘      └───────────┘
   fastest,           shared           durable,
   smallest,          across           slowest,
   per-instance       instances        unbounded
```

### Read path (`get`)
1. Check **L1** (LRU, in-memory). Hit → return immediately.
2. Miss → check **L2** (Redis). Hit → promote value to L1, return.
3. Miss → check **L3** (Postgres). Hit → promote to L1 and L2, return.
4. Miss on all tiers → return `null`.

### Write path (`put`)
Writes go to all three tiers (write-through), with L3 as the source of truth.

### Delete path (`deleteKey`)
Removes the key from all three tiers to avoid stale reads.

## Why a tiered design?

Each tier trades off speed, capacity, and durability differently:

| Tier | Latency | Capacity | Durability | Shared across instances? |
|------|---------|----------|------------|---------------------------|
| L1 (LRU) | fastest (in-memory) | smallest | none (lost on restart) | no |
| L2 (Redis) | fast (network, in-memory) | medium | optional persistence | yes |
| L3 (Postgres) | slowest (disk-backed) | unbounded | full durability | yes |

This mirrors real-world caching architectures where a single fast local cache backs onto a shared distributed cache, which backs onto the actual database.

## Tech Stack

- **Language:** TypeScript
- **Runtime:** Node.js (run via `tsx` for full TS transform support, including parameter properties)
- **L2:** Redis (via `ioredis`)
- **L3:** PostgreSQL (via `pg`)


## Known Limitations / Next Steps

- [ ] Add a circuit breaker on L2 to avoid retry storms when Redis is down for an extended period.
- [ ] Add TTL/eviction consistency checks between L1 and L2.
- [ ] Consider consistent hashing for horizontally scaling L2 across multiple Redis nodes.
