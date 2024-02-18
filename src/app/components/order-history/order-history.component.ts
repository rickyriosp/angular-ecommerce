import { Component, OnInit } from '@angular/core';

import { OrderHistory } from '../../common/order-history';
import { OrderHistoryService } from '../../services/order-history.service';

@Component({
  selector: 'app-order-history',
  templateUrl: './order-history.component.html',
  styleUrl: './order-history.component.css',
})
export class OrderHistoryComponent implements OnInit {
  orderHistoryList: OrderHistory[] = [];
  storage: Storage = sessionStorage;

  constructor(private orderHistoryService: OrderHistoryService) {}

  ngOnInit(): void {
    this.handleOrderHistory();
  }

  async handleOrderHistory() {
    const email = JSON.parse(this.storage.getItem('email')!);

    await this.orderHistoryService.getOrderHistory(email!).subscribe(async (data) => await (this.orderHistoryList = data));

    // sorting in backend directly now
    // setTimeout(() => {
    //   this.orderHistoryList.sort((a, b) =>
    //     a.dateCreated > b.dateCreated ? -1 : 1
    //   );
    // }, 100);
  }
}
