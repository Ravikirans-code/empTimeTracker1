/**
 * Process data in chunks to avoid UI freezing
 */
export async function processInChunks<T, R>(
  items: T[],
  processItem: (item: T) => R,
  options: {
    chunkSize?: number
    delayBetweenChunks?: number
    onProgress?: (processed: number, total: number) => void
  } = {},
): Promise<R[]> {
  const { chunkSize = 1000, delayBetweenChunks = 0, onProgress = () => {} } = options

  return new Promise((resolve) => {
    const result: R[] = []
    const total = items.length
    let processed = 0

    // Process one chunk
    function processChunk(startIndex: number) {
      const endIndex = Math.min(startIndex + chunkSize, total)

      // Process items in this chunk
      for (let i = startIndex; i < endIndex; i++) {
        result.push(processItem(items[i]))
        processed++
      }

      // Report progress
      onProgress(processed, total)

      // If there are more items to process
      if (endIndex < total) {
        // Schedule the next chunk with a small delay to allow UI updates
        setTimeout(() => processChunk(endIndex), delayBetweenChunks)
      } else {
        // All done
        resolve(result)
      }
    }

    // Start processing with the first chunk
    processChunk(0)
  })
}

