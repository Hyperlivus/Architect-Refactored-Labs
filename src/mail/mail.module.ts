import { DynamicModule, Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MAIL_OPTIONS, MAIL_SERVICE } from './mail.service.interface';
import type { MailModuleOptions } from './mail.service.interface';

interface AsyncOptions {
  imports?: any[];
  inject?: any[];
  useFactory: (
    ...args: any[]
  ) => Promise<MailModuleOptions> | MailModuleOptions;
}

@Module({})
export class MailModule {
  static forRootAsync(asyncOptions: AsyncOptions): DynamicModule {
    return {
      module: MailModule,
      global: true,
      imports: asyncOptions.imports ?? [],
      providers: [
        {
          provide: MAIL_OPTIONS,
          useFactory: asyncOptions.useFactory,
          inject: asyncOptions.inject ?? [],
        },
        { provide: MAIL_SERVICE, useClass: MailService },
      ],
      exports: [MAIL_SERVICE],
    };
  }
}
