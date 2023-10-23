import BetterQueue, { ProcessFunctionCb } from 'better-queue'
import MemoryStore from 'better-queue-memory'
import { backOff } from 'exponential-backoff'

export class Queue<T, K> {
  queue: BetterQueue

  constructor(options: BetterQueue.QueueOptions<T, K>) {
    this.queue = new BetterQueue<T, K>({
      ...options,
      store: new MemoryStore(),
      process: (task: T, callback: ProcessFunctionCb<K>) => {
        return backOff(
          async () => {
            return options.process(task, callback)
          },
          {
            numOfAttempts: 5,
            startingDelay: 5000,
            retry: (e, attempt) => {
              console.log('error', e.message, 'attempt', attempt)
              return true
            },
          }
        )
      },
    })
  }

  public push(task: T, callback: ProcessFunctionCb<K>) {
    this.queue.push(task, callback)
  }

  public cancel(taskId: unknown, callback?: () => void) {
    this.queue.cancel(taskId, callback)
  }
}
