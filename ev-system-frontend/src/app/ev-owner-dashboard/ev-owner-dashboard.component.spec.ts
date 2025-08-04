import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvOwnerDashboardComponent } from './ev-owner-dashboard.component';

describe('EvOwnerDashboardComponent', () => {
  let component: EvOwnerDashboardComponent;
  let fixture: ComponentFixture<EvOwnerDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EvOwnerDashboardComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EvOwnerDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
