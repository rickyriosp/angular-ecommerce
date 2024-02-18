import { OrderHistory } from 'src/app/common/order-history';

import { ComponentFixture, TestBed } from '@angular/core/testing';

describe('OrderHistory', () => {
  let component: OrderHistory;
  let fixture: ComponentFixture<OrderHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderHistory],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderHistory);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
