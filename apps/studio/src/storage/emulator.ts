/**
 * Trình giả lập lưu trữ Cloudflare R2 dựa trên hệ thống tệp cục bộ (Task C17)
 * Lưu trữ bền vững qua các lần khởi động lại máy chủ trong thư mục data/r2/
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import type { R2Bucket, R2Object, R2ObjectBody, R2PutOptions, R2Objects } from '../types.js';

interface StoredMetadata {
  key: string;
  size: number;
  etag: string;
  httpMetadata?: {
    contentType?: string;
  };
  customMetadata?: Record<string, string>;
  uploaded: string;
}

export class LocalR2Bucket implements R2Bucket {
  private baseDir: string;

  constructor(baseDir: string = path.resolve(process.cwd(), 'apps/studio/data/r2')) {
    this.baseDir = baseDir;
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private getFilePath(key: string): string {
    // Ngăn chặn Path Traversal
    const sanitizedKey = key.replace(/\.\./g, '').replace(/^\/+/, '');
    return path.join(this.baseDir, sanitizedKey);
  }

  private getMetaPath(key: string): string {
    return `${this.getFilePath(key)}.meta.json`;
  }

  async put(
    key: string,
    value: ReadableStream | ArrayBuffer | string | Uint8Array,
    options?: R2PutOptions
  ): Promise<R2Object> {
    const filePath = this.getFilePath(key);
    const parentDir = path.dirname(filePath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    let buffer: Buffer;
    if (value instanceof Uint8Array) {
      buffer = Buffer.from(value.buffer, value.byteOffset, value.byteLength);
    } else if (value instanceof ArrayBuffer) {
      buffer = Buffer.from(value);
    } else if (typeof value === 'string') {
      buffer = Buffer.from(value, 'utf-8');
    } else if (typeof (value as any)?.getReader === 'function') {
      // ReadableStream
      const reader = (value as ReadableStream<Uint8Array>).getReader();
      const chunks: Uint8Array[] = [];
      let totalLength = 0;
      while (true) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        if (chunk) {
          chunks.push(chunk);
          totalLength += chunk.length;
        }
      }
      buffer = Buffer.concat(chunks, totalLength);
    } else {
      buffer = Buffer.from(String(value));
    }

    fs.writeFileSync(filePath, buffer);

    const etag = crypto.createHash('md5').update(buffer).digest('hex');
    const now = new Date();

    const meta: StoredMetadata = {
      key,
      size: buffer.length,
      etag,
      httpMetadata: options?.httpMetadata,
      customMetadata: options?.customMetadata,
      uploaded: now.toISOString(),
    };

    fs.writeFileSync(this.getMetaPath(key), JSON.stringify(meta, null, 2), 'utf-8');

    return {
      key,
      size: buffer.length,
      etag,
      httpMetadata: options?.httpMetadata,
      customMetadata: options?.customMetadata,
      uploaded: now,
    };
  }

  async get(key: string): Promise<R2ObjectBody | null> {
    const filePath = this.getFilePath(key);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const buffer = fs.readFileSync(filePath);
    let meta: StoredMetadata | null = null;
    const metaPath = this.getMetaPath(key);
    if (fs.existsSync(metaPath)) {
      try {
        meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      } catch {
        // bỏ qua nếu lỗi JSON
      }
    }

    const uploaded = meta?.uploaded ? new Date(meta.uploaded) : new Date();
    const etag = meta?.etag || crypto.createHash('md5').update(buffer).digest('hex');

    const obj: R2Object = {
      key,
      size: buffer.length,
      etag,
      httpMetadata: meta?.httpMetadata,
      customMetadata: meta?.customMetadata,
      uploaded,
    };

    return {
      ...obj,
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(buffer);
          controller.close();
        },
      }),
      async arrayBuffer() {
        return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      },
      async text() {
        return buffer.toString('utf-8');
      },
      async json<T = unknown>() {
        return JSON.parse(buffer.toString('utf-8')) as T;
      },
    };
  }

  async delete(keys: string | string[]): Promise<void> {
    const keyList = Array.isArray(keys) ? keys : [keys];
    for (const key of keyList) {
      const filePath = this.getFilePath(key);
      const metaPath = this.getMetaPath(key);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch {}
      }
      if (fs.existsSync(metaPath)) {
        try {
          fs.unlinkSync(metaPath);
        } catch {}
      }
    }
  }

  async list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<R2Objects> {
    if (!fs.existsSync(this.baseDir)) {
      return { objects: [], truncated: false };
    }

    const files = fs.readdirSync(this.baseDir, { recursive: true }) as string[];
    const objects: R2Object[] = [];
    const prefix = options?.prefix || '';

    for (const file of files) {
      if (file.endsWith('.meta.json')) continue;
      const normalizedKey = file.replace(/\\/g, '/');
      if (prefix && !normalizedKey.startsWith(prefix)) continue;

      const filePath = path.join(this.baseDir, file);
      const stat = fs.statSync(filePath);
      if (!stat.isFile()) continue;

      let meta: StoredMetadata | null = null;
      const metaPath = `${filePath}.meta.json`;
      if (fs.existsSync(metaPath)) {
        try {
          meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        } catch {}
      }

      objects.push({
        key: normalizedKey,
        size: stat.size,
        etag: meta?.etag || '',
        httpMetadata: meta?.httpMetadata,
        customMetadata: meta?.customMetadata,
        uploaded: meta?.uploaded ? new Date(meta.uploaded) : stat.mtime,
      });

      if (options?.limit && objects.length >= options.limit) {
        break;
      }
    }

    return {
      objects,
      truncated: false,
    };
  }
}
