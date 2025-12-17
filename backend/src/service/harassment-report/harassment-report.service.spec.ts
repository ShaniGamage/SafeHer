import { Test, TestingModule } from '@nestjs/testing';
import { HarassmentReportService } from './harassment-report.service';

describe('HarassmentReportService', () => {
  let service: HarassmentReportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HarassmentReportService],
    }).compile();

    service = module.get<HarassmentReportService>(HarassmentReportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
