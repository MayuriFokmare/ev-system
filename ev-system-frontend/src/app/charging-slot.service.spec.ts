import { TestBed } from '@angular/core/testing';

import { ChargingSlotService } from './charging-slot.service';

describe('ChargingSlotService', () => {
  let service: ChargingSlotService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChargingSlotService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
