import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { Message } from './chat/entities/message.entity';
import { User } from './users/entities/user.entity';
import { UsersModule } from './users/users.module';
import { KeepAliveModule } from './keep-alive/keep-alive.module';

const databaseUrl = process.env.DATABASE_URL;
const isPostgres = databaseUrl?.startsWith('postgres://') || databaseUrl?.startsWith('postgresql://');

@Module({
  imports: [
    TypeOrmModule.forRoot(
      isPostgres
        ? {
          type: 'postgres',
          url: databaseUrl,
          ssl: {
            rejectUnauthorized: false,
          },
          entities: [User, Message],
          synchronize: process.env.TYPEORM_SYNC ? process.env.TYPEORM_SYNC === 'true' : true,
        }
        : {
          type: 'better-sqlite3',
          database: process.env.DATABASE_PATH || 'dev.db',
          entities: [User, Message],
          synchronize: process.env.TYPEORM_SYNC ? process.env.TYPEORM_SYNC === 'true' : true,
        },
    ),
    AuthModule,
    UsersModule,
    ChatModule,
    KeepAliveModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
