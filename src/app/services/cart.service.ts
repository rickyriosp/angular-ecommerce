import { BehaviorSubject, ReplaySubject, Subject } from 'rxjs';

import { Injectable } from '@angular/core';

import { CartItem } from '../common/cart-item';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  cartItems: CartItem[] = [];

  // Subject does not keep a buffer of events
  // ReplaySubject keeps a buffer of all previous events
  // BehaviorSubject keeps a buffer of the last event only
  totalPrice: Subject<number> = new BehaviorSubject<number>(0);
  totalQuantity: Subject<number> = new BehaviorSubject<number>(0);

  storage: Storage = sessionStorage;

  constructor() {
    // read data from storage
    let data = JSON.parse(this.storage.getItem('cartItems')!);

    if (data != null) {
      this.cartItems = data;

      // compute totals based on the data that is read from storage
      this.computeCartTotals();
    }
  }

  addToCart(cartItem: CartItem) {
    // check if we already have the item in our cart
    let alreadyExistsInCart: boolean = false;
    let existingCartItem!: CartItem;

    if (this.cartItems.length > 0) {
      // find the item in the cart based on item id
      existingCartItem = this.cartItems.find((item) => item.id === cartItem.id)!;
    }

    // check if we found it
    alreadyExistsInCart = existingCartItem != undefined;

    if (alreadyExistsInCart) {
      existingCartItem.quantity += cartItem.quantity;
    } else {
      // just add the new item to the array
      this.cartItems.push(cartItem);
    }

    // compute cart total price and quantity
    this.computeCartTotals();
  }

  incrementQuantity(item: CartItem) {
    item.quantity++;

    this.computeCartTotals();
  }

  decrementQuantity(item: CartItem) {
    item.quantity--;

    if (item.quantity == 0) {
      this.remove(item);
    }

    this.computeCartTotals();
  }

  remove(item: CartItem) {
    const index = this.cartItems.findIndex((el) => el.id == item.id);

    if (index > -1) {
      this.cartItems.splice(index, 1);
    }

    this.computeCartTotals();
  }

  computeCartTotals() {
    let totalPriceValue: number = 0;
    let totalQuantityValue: number = 0;

    for (let item of this.cartItems) {
      totalPriceValue += item.quantity * item.unitPrice;
      totalQuantityValue += item.quantity;
    }

    // publish the new values ... all subscribers will receive the new data
    this.totalPrice.next(totalPriceValue);
    this.totalQuantity.next(totalQuantityValue);

    // log cart data for debugging purposes
    // this.logCartData(totalPriceValue, totalQuantityValue);

    // persist cart data
    this.persistCartItems();
  }

  persistCartItems() {
    this.storage.setItem('cartItems', JSON.stringify(this.cartItems));
  }

  clearCartItems() {
    this.storage.removeItem('cartItems');

    this.cartItems = [];
    this.totalPrice.next(0);
    this.totalQuantity.next(0);
  }

  logCartData(totalPriceValue: number, totalQuantityValue: number) {
    console.log('Contents of the cart');

    for (let item of this.cartItems) {
      const subTotalPrice = item.quantity * item.unitPrice;
      console.log(`name: ${item.name}, quantity: ${item.quantity}, unitPrice: ${item.unitPrice}, subTotalPriec: ${subTotalPrice}`);
    }

    console.log(`totalPrice: ${totalPriceValue.toFixed(2)}, totalQuantity: ${totalQuantityValue}`);
    console.log('-------------');
  }
}
