import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VirtualMarketComponent } from './virtual-market.component';

describe('VirtualMarketComponent', () => {
  let component: VirtualMarketComponent;
  let fixture: ComponentFixture<VirtualMarketComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VirtualMarketComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VirtualMarketComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
