# @tankist/typeorm-in-memory-cache

In-memory query result cache for [TypeORM](https://typeorm.io/).

A lightweight wrapper around [@cacheable/node-cache](https://www.npmjs.com/package/@cacheable/node-cache) implementing TypeORM's `QueryResultCache` interface.

## Installation

```bash
npm install @tankist/typeorm-in-memory-cache
```

## Usage

### Basic

Pass the provider when [configuring TypeORM caching](https://typeorm.io/caching):

```typescript
import { InMemoryCacheProvider } from '@tankist/typeorm-in-memory-cache'

{
  // ...
  cache: {
    provider() {
      return new InMemoryCacheProvider()
    },
  }
}
```

### Custom cache configuration

```typescript
import { InMemoryCacheProvider } from '@tankist/typeorm-in-memory-cache'
import { NodeCache } from '@cacheable/node-cache'

{
  // ...
  cache: {
    provider() {
      const cache = new NodeCache({
        stdTTL: 420,
        checkperiod: 120,
      })
      return new InMemoryCacheProvider(cache)
    },
  }
}
```

### Cache statistics

The provider exposes a `getStatistics()` method for monitoring:

```typescript
const provider = new InMemoryCacheProvider()

// ... after some queries ...

const stats = provider.getStatistics()
console.log(stats.keys, stats.hits, stats.misses)
```

## Requirements

- Node.js >= 18
- TypeORM >= 0.3.0

## License

MIT
