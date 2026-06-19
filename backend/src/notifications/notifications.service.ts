import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger('Slack');
  private slackClient: { chat: { postMessage: (p: { channel: string; text: string; unfurl_links: boolean }) => Promise<unknown> } } | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const token = this.config.get<string>('SLACK_BOT_TOKEN');
    const channel = this.config.get<string>('SLACK_CHANNEL_ID');
    if (!token || !channel) {
      this.logger.warn('Slack credentials not set — notifications will log to console only');
      return;
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { WebClient } = require('@slack/web-api');
      this.slackClient = new WebClient(token);
      this.logger.log('Slack client initialised');
    } catch (err) {
      this.logger.error('Slack init failed', err);
    }
  }

  async send(text: string): Promise<void> {
    const channel = this.config.get<string>('SLACK_CHANNEL_ID', '#daily-reports');
    if (!this.slackClient) {
      this.logger.log(`[SLACK → ${channel}]\n${text}`);
      return;
    }
    await this.slackClient.chat.postMessage({ channel, text, unfurl_links: false });
  }
}
