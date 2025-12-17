import { Test, TestingModule } from '@nestjs/testing';
import { HarassmentReportController } from './harassment-report.controller';

describe('HarassmentReportController', () => {
  let controller: HarassmentReportController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HarassmentReportController],
    }).compile();

    controller = module.get<HarassmentReportController>(HarassmentReportController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
