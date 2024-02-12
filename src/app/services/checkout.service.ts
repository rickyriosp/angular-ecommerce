import { map, Observable } from 'rxjs';

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { environment } from '../../environments/environment';
import { PaymentInfo } from '../common/payment-info';
import { Purchase } from '../common/purchase';

@Injectable({
  providedIn: 'root',
})
export class CheckoutService {
  private purchaseUrl = environment.shopApiUrl + '/checkout/purchase';
  private paymentIntentUrl = environment.shopApiUrl + '/checkout/payment-intent';

  constructor(private httpClient: HttpClient) {}

  placeOrder(purchase: Purchase): Observable<any> {
    return this.httpClient.post<Purchase>(this.purchaseUrl, purchase);
  }

  createPaymentIntent(paymentInfo: PaymentInfo): Observable<string> {
    return this.httpClient
      .post<GetPaymentIntent>(this.paymentIntentUrl, paymentInfo)
      .pipe(map((data) => data.client_secret));
  }
}

interface GetPaymentIntent {
  client_secret: string;
}
