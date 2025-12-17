import { Test, TestingModule } from '@nestjs/testing';
import { HeatmapService } from './heatmap.service';

describe('HeatmapService', () => {
  let service: HeatmapService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HeatmapService],
    }).compile();

    service = module.get<HeatmapService>(HeatmapService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
