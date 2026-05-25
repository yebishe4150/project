type QueueItem<T> = {
  task: () => Promise<T>
  resolve: (value: T | PromiseLike<T>) => void
  reject: (reason?: unknown) => void
}

export function createConcurrencyLimiter(maxConcurrent: number) {
  let activeCount = 0
  const queue: QueueItem<unknown>[] = []

  const runNext = () => {
    if (activeCount >= maxConcurrent) {
      return
    }

    const item = queue.shift()

    if (!item) {
      return
    }

    activeCount += 1

    item.task()
      .then(item.resolve)
      .catch(item.reject)
      .finally(() => {
        activeCount -= 1
        runNext()
      })
  }

  return function limit<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      queue.push({
        task,
        resolve: resolve as QueueItem<unknown>["resolve"],
        reject,
      })
      runNext()
    })
  }
}
