import type { QueryResultCache } from 'typeorm/cache/QueryResultCache.js'
import type { QueryResultCacheOptions } from 'typeorm/cache/QueryResultCacheOptions.js'
import type { QueryRunner } from 'typeorm/query-runner/QueryRunner.js'
import { NodeCache } from '@cacheable/node-cache'

export class InMemoryCacheProvider implements QueryResultCache {
  private cache: NodeCache<QueryResultCacheOptions>

  constructor(userCache?: NodeCache<QueryResultCacheOptions>) {
    this.cache = userCache ?? new NodeCache<QueryResultCacheOptions>()
  }

  connect(): Promise<void> {
    return Promise.resolve()
  }

  disconnect(): Promise<void> {
    return Promise.resolve()
  }

  synchronize(_queryRunner?: QueryRunner): Promise<void> {
    return Promise.resolve()
  }

  getFromCache(
    options: QueryResultCacheOptions,
    _queryRunner?: QueryRunner,
  ): Promise<QueryResultCacheOptions | undefined> {
    return Promise.resolve(
      this.cache.get(options.identifier ?? options.query ?? ''),
    )
  }

  storeInCache(
    options: QueryResultCacheOptions,
    _savedCache: QueryResultCacheOptions | undefined,
    _queryRunner?: QueryRunner,
  ): Promise<void> {
    const key = options.identifier ?? options.query ?? ''
    const ttl = options.duration / 1000
    this.cache.set(key, options, ttl)
    return Promise.resolve()
  }

  isExpired(savedCache: QueryResultCacheOptions): boolean {
    return (savedCache.time ?? 0) + savedCache.duration < Date.now()
  }

  clear(_queryRunner?: QueryRunner): Promise<void> {
    this.cache.flushAll()
    return Promise.resolve()
  }

  remove(identifiers: string[], _queryRunner?: QueryRunner): Promise<void> {
    this.cache.del(identifiers)
    return Promise.resolve()
  }

  getStatistics() {
    return this.cache.getStats()
  }
}
