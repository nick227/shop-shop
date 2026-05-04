export class ObjectPool<T> {
  private readonly pool: T[] = []
  private readonly maxSize: number
  private readonly create: () => T
  private readonly reset: (item: T) => void

  constructor(create: () => T, reset: (item: T) => void, maxSize = 50) {
    this.create = create
    this.reset = reset
    this.maxSize = maxSize
  }

  acquire(): T {
    return this.pool.pop() ?? this.create()
  }

  release(item: T): void {
    this.reset(item)
    if (this.pool.length < this.maxSize) {
      this.pool.push(item)
    }
  }
}
