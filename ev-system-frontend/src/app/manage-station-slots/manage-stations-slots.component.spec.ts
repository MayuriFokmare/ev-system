import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageStationsSlotsComponent } from './manage-stations-slots.component';

describe('ManageStationsSlotsComponent', () => {
  let component: ManageStationsSlotsComponent;
  let fixture: ComponentFixture<ManageStationsSlotsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManageStationsSlotsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageStationsSlotsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
