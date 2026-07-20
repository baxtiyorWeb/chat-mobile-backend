import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as https from 'https';
import * as http from 'http';

@Injectable()
export class KeepAliveService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KeepAliveService.name);
  private interval: NodeJS.Timeout | null = null;

  // Render 15 daqiqa faollik bo'lmasa o'chiradi → biz 14 daqiqada ping qilamiz
  private readonly PING_INTERVAL_MS = 14 * 60 * 1000;

  onModuleInit() {
    // Faqat production muhitida ishlaydi
    if (process.env.NODE_ENV !== 'production') {
      this.logger.log('KeepAlive: skipped (not production)');
      return;
    }

    // Render o'zi bu env variableni beradi
    const selfUrl = process.env.RENDER_EXTERNAL_URL;
    if (!selfUrl) {
      this.logger.warn('KeepAlive: RENDER_EXTERNAL_URL not set, skipping.');
      return;
    }

    const pingUrl = `${selfUrl}/health`;
    this.logger.log(`KeepAlive: will ping ${pingUrl} every 14 minutes`);

    this.interval = setInterval(() => {
      this.ping(pingUrl);
    }, this.PING_INTERVAL_MS);
  }

  onModuleDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private ping(url: string) {
    const client = url.startsWith('https') ? https : http;

    const req = client.get(url, (res) => {
      this.logger.log(`KeepAlive: ping OK — status ${res.statusCode}`);
      // Response body'ni iste'mol qilamiz, aks holda connection ochiq qoladi
      res.resume();
    });

    req.on('error', (err) => {
      this.logger.warn(`KeepAlive: ping failed — ${err.message}`);
    });

    req.setTimeout(10000, () => {
      this.logger.warn('KeepAlive: ping timeout (10s)');
      req.destroy();
    });
  }
}
