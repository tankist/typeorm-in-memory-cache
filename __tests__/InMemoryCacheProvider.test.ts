import { InMemoryCacheProvider } from '../src/index.js'
import { NodeCache } from '@cacheable/node-cache'
import type { QueryResultCacheOptions } from 'typeorm/cache/QueryResultCacheOptions.js'

describe('InMemoryCacheProvider', () => {
  let provider: InMemoryCacheProvider

  beforeEach(() => {
    provider = new InMemoryCacheProvider()
  })

  describe('constructor', () => {
    it('should create provider with default cache', () => {
      const p = new InMemoryCacheProvider()
      expect(p).toBeInstanceOf(InMemoryCacheProvider)
    })

    it('should accept a custom NodeCache instance', () => {
      const customCache = new NodeCache<QueryResultCacheOptions>({
        stdTTL: 60,
      })
      const p = new InMemoryCacheProvider(customCache)
      expect(p).toBeInstanceOf(InMemoryCacheProvider)
    })
  })

  describe('connect', () => {
    it('should resolve without error', async () => {
      await expect(provider.connect()).resolves.toBeUndefined()
    })
  })

  describe('disconnect', () => {
    it('should resolve without error', async () => {
      await expect(provider.disconnect()).resolves.toBeUndefined()
    })
  })

  describe('synchronize', () => {
    it('should resolve without error', async () => {
      await expect(provider.synchronize()).resolves.toBeUndefined()
    })

    it('should accept queryRunner parameter', async () => {
      await expect(provider.synchronize(undefined)).resolves.toBeUndefined()
    })
  })

  describe('getFromCache', () => {
    it('should return undefined for cache miss', async () => {
      const result = await provider.getFromCache({
        identifier: 'test',
        duration: 5000,
      })
      expect(result).toBeUndefined()
    })

    it('should return cached entry by identifier', async () => {
      const options: QueryResultCacheOptions = {
        identifier: 'user-1',
        duration: 5000,
        result: { name: 'John' },
      }
      await provider.storeInCache(options, undefined)
      const result = await provider.getFromCache({
        identifier: 'user-1',
        duration: 5000,
      })
      expect(result).toBeDefined()
      expect(result!.identifier).toBe('user-1')
      expect(result!.result).toEqual({ name: 'John' })
    })

    it('should return cached entry by query when identifier is not set', async () => {
      const options: QueryResultCacheOptions = {
        query: 'SELECT * FROM users',
        duration: 5000,
        result: [{ id: 1 }],
      }
      await provider.storeInCache(options, undefined)
      const result = await provider.getFromCache({
        query: 'SELECT * FROM users',
        duration: 5000,
      })
      expect(result).toBeDefined()
      expect(result!.query).toBe('SELECT * FROM users')
    })

    it('should prefer identifier over query', async () => {
      const options: QueryResultCacheOptions = {
        identifier: 'my-id',
        query: 'SELECT * FROM users',
        duration: 5000,
        result: 'by-identifier',
      }
      await provider.storeInCache(options, undefined)
      const result = await provider.getFromCache({
        identifier: 'my-id',
        query: 'SELECT * FROM users',
        duration: 5000,
      })
      expect(result).toBeDefined()
      expect(result!.result).toBe('by-identifier')
    })

    it('should accept queryRunner parameter', async () => {
      const result = await provider.getFromCache(
        { identifier: 'test', duration: 5000 },
        undefined,
      )
      expect(result).toBeUndefined()
    })

    it('should fall back to empty string when both identifier and query are undefined', async () => {
      const options: QueryResultCacheOptions = {
        duration: 5000,
        result: 'no-key',
      }
      await provider.storeInCache(options, undefined)
      const result = await provider.getFromCache({ duration: 5000 })
      expect(result).toBeDefined()
      expect(result!.result).toBe('no-key')
    })
  })

  describe('storeInCache', () => {
    it('should store entry with identifier', async () => {
      const options: QueryResultCacheOptions = {
        identifier: 'store-test',
        duration: 5000,
        result: { data: 42 },
      }
      await provider.storeInCache(options, undefined)
      const result = await provider.getFromCache({
        identifier: 'store-test',
        duration: 5000,
      })
      expect(result).toBeDefined()
      expect(result!.result).toEqual({ data: 42 })
    })

    it('should store entry with query key when identifier is absent', async () => {
      const options: QueryResultCacheOptions = {
        query: 'SELECT 1',
        duration: 10000,
        result: [{ one: 1 }],
      }
      await provider.storeInCache(options, undefined)
      const result = await provider.getFromCache({
        query: 'SELECT 1',
        duration: 10000,
      })
      expect(result).toBeDefined()
      expect(result!.result).toEqual([{ one: 1 }])
    })

    it('should accept queryRunner parameter', async () => {
      const options: QueryResultCacheOptions = {
        identifier: 'qr-test',
        duration: 5000,
      }
      await expect(
        provider.storeInCache(options, undefined, undefined),
      ).resolves.toBeUndefined()
    })
  })

  describe('isExpired', () => {
    it('should return true for expired cache entry', () => {
      const savedCache: QueryResultCacheOptions = {
        identifier: 'expired',
        time: Date.now() - 10000,
        duration: 5000,
      }
      expect(provider.isExpired(savedCache)).toBe(true)
    })

    it('should return false for non-expired cache entry', () => {
      const savedCache: QueryResultCacheOptions = {
        identifier: 'valid',
        time: Date.now(),
        duration: 60000,
      }
      expect(provider.isExpired(savedCache)).toBe(false)
    })

    it('should return false for entry exactly at boundary (not yet expired)', () => {
      const now = Date.now()
      const savedCache: QueryResultCacheOptions = {
        identifier: 'boundary',
        time: now - 5000,
        duration: 5000,
      }
      expect(provider.isExpired(savedCache)).toBe(false)
    })

    it('should treat missing time as 0 (expired)', () => {
      const savedCache: QueryResultCacheOptions = {
        identifier: 'no-time',
        duration: 5000,
      }
      expect(provider.isExpired(savedCache)).toBe(true)
    })
  })

  describe('clear', () => {
    it('should clear all cache entries', async () => {
      await provider.storeInCache(
        { identifier: 'a', duration: 5000, result: 1 },
        undefined,
      )
      await provider.storeInCache(
        { identifier: 'b', duration: 5000, result: 2 },
        undefined,
      )
      await provider.clear()
      const resultA = await provider.getFromCache({
        identifier: 'a',
        duration: 5000,
      })
      const resultB = await provider.getFromCache({
        identifier: 'b',
        duration: 5000,
      })
      expect(resultA).toBeUndefined()
      expect(resultB).toBeUndefined()
    })

    it('should accept queryRunner parameter', async () => {
      await expect(provider.clear(undefined)).resolves.toBeUndefined()
    })
  })

  describe('remove', () => {
    it('should remove specific entries by identifiers', async () => {
      await provider.storeInCache(
        { identifier: 'keep', duration: 5000, result: 'keep' },
        undefined,
      )
      await provider.storeInCache(
        { identifier: 'remove-me', duration: 5000, result: 'remove' },
        undefined,
      )
      await provider.remove(['remove-me'])
      const keep = await provider.getFromCache({
        identifier: 'keep',
        duration: 5000,
      })
      const removed = await provider.getFromCache({
        identifier: 'remove-me',
        duration: 5000,
      })
      expect(keep).toBeDefined()
      expect(removed).toBeUndefined()
    })

    it('should remove multiple entries', async () => {
      await provider.storeInCache(
        { identifier: 'r1', duration: 5000, result: 1 },
        undefined,
      )
      await provider.storeInCache(
        { identifier: 'r2', duration: 5000, result: 2 },
        undefined,
      )
      await provider.storeInCache(
        { identifier: 'r3', duration: 5000, result: 3 },
        undefined,
      )
      await provider.remove(['r1', 'r2'])
      expect(
        await provider.getFromCache({ identifier: 'r1', duration: 5000 }),
      ).toBeUndefined()
      expect(
        await provider.getFromCache({ identifier: 'r2', duration: 5000 }),
      ).toBeUndefined()
      expect(
        await provider.getFromCache({ identifier: 'r3', duration: 5000 }),
      ).toBeDefined()
    })

    it('should accept queryRunner parameter', async () => {
      await expect(
        provider.remove(['test'], undefined),
      ).resolves.toBeUndefined()
    })
  })

  describe('getStatistics', () => {
    it('should return cache statistics', async () => {
      await provider.storeInCache(
        { identifier: 'stats-test', duration: 5000, result: 'data' },
        undefined,
      )
      const stats = provider.getStatistics()
      expect(stats).toHaveProperty('keys')
      expect(stats).toHaveProperty('hits')
      expect(stats).toHaveProperty('misses')
      expect(stats).toHaveProperty('ksize')
      expect(stats).toHaveProperty('vsize')
      expect(stats.keys).toBe(1)
    })
  })
})
