/**
 * Resolve a video filename to its playback URL.
 *
 * v1: returns local path served by @fastify/static
 * v2: will return a signed S3/GCS URL (change only this function)
 */
export function resolveVideoUrl(filename: string): string {
  return `/video/${filename}`
}
