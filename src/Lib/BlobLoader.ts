import {ConsumerPlatform} from "../Types/Platform";

export class BlobLoader {
  // Map to store active Object URLs: { originalUrl: blobUrl }
  private static cache: Map<string, string> = new Map();

  /**
   * Fetches a video and returns a local Blob URL (e.g., blob:http://localhost/...)
   */
  public static async load(url: string, platform?: ConsumerPlatform): Promise<string> {
    // Return cached if exists
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch video: ${response.statusText}`);

      let objectUrl = url;

      if (!platform || (platform && platform !== ConsumerPlatform.ELECTRON)) {
        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
      } else {
        objectUrl = url;
      }

      console.debug('??? XLR.debug >> BlobLoader.load', {
        url,
        objectUrl,
        response,
      })

      this.cache.set(url, objectUrl);
      return objectUrl;
    } catch (err) {
      console.error(`BlobLoader Error:`, err);
      throw err;
    }
  }

  /**
   * Frees memory. CRITICAL for 24/7 signage.
   */
  public static release(url: string) {
    if (this.cache.has(url)) {
      const objectUrl = this.cache.get(url)!;
      URL.revokeObjectURL(objectUrl);
      this.cache.delete(url);
    }
  }
}