import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET) - should return API information', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('message');
        expect(res.body).toHaveProperty('version');
        expect(res.body).toHaveProperty('description');
        expect(res.body).toHaveProperty('environment');
        expect(res.body).toHaveProperty('timestamp');
        expect(res.body).toHaveProperty('documentation');
      });
  });

  it('/info (GET) - should return detailed API information', () => {
    return request(app.getHttpServer())
      .get('/info')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('name');
        expect(res.body).toHaveProperty('version');
        expect(res.body).toHaveProperty('description');
        expect(res.body).toHaveProperty('organization');
        expect(res.body).toHaveProperty('contact');
        expect(res.body).toHaveProperty('features');
        expect(res.body).toHaveProperty('authentication');
        expect(res.body).toHaveProperty('baseUrl');
      });
  });

  it('/health (GET) - should return health status', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('status', 'ok');
        expect(res.body).toHaveProperty('timestamp');
        expect(res.body).toHaveProperty('uptime');
        expect(res.body).toHaveProperty('environment');
      });
  });
});
