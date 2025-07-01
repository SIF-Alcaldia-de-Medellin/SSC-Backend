import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return API information object', () => {
      const result = appController.getHello();
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('environment');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('documentation');
    });
  });

  describe('info', () => {
    it('should return detailed API information', () => {
      const result = appController.getApiInfo();
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('organization');
      expect(result).toHaveProperty('contact');
      expect(result).toHaveProperty('features');
      expect(result).toHaveProperty('authentication');
      expect(result).toHaveProperty('baseUrl');
    });
  });

  describe('health', () => {
    it('should return health status object', () => {
      const result = appController.healthCheck();
      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('environment');
    });
  });
});
