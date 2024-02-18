import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { loadStripe } from '@stripe/stripe-js';

import { environment } from '../../../environments/environment';
import { Country } from '../../common/country';
import { Customer } from '../../common/customer';
import { Order } from '../../common/order';
import { OrderItem } from '../../common/order-item';
import { PaymentInfo } from '../../common/payment-info';
import { Purchase } from '../../common/purchase';
import { State } from '../../common/state';
import { CartService } from '../../services/cart.service';
import { CheckoutService } from '../../services/checkout.service';
import { ShopFormService } from '../../services/shop-form.service';
import { ShopValidators } from '../../validators/shop-validators';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css',
})
export class CheckoutComponent implements OnInit {
  checkoutFormGroup!: FormGroup;

  totalPrice: number = 0;
  totalQuantity: number = 0;

  creditCardYears: number[] = [];
  creditCardMonths: number[] = [];

  countries: Country[] = [];
  shippingStates: State[] = [];
  billingStates: State[] = [];

  storage: Storage = sessionStorage;

  // initialize Stripe api
  stripe: any;
  stripePromise = loadStripe(environment.stripePublishableKey);
  paymentInfo: PaymentInfo = new PaymentInfo();
  cardElement: any;
  displayError: any = '';

  isDisabled: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private shopFormService: ShopFormService,
    private cartService: CartService,
    private checkoutService: CheckoutService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.checkoutFormGroup = this.formBuilder.group({
      customer: this.formBuilder.group({
        firstName: new FormControl('', [Validators.required, Validators.minLength(2), ShopValidators.notOnlyWhitespace]),
        lastName: new FormControl('', [Validators.required, Validators.minLength(2), ShopValidators.notOnlyWhitespace]),
        email: new FormControl('', [Validators.required, Validators.pattern('^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,6}$')]),
      }),
      shipping: this.formBuilder.group({
        street: new FormControl('', [Validators.required, Validators.minLength(2), ShopValidators.notOnlyWhitespace]),
        city: new FormControl('', [Validators.required, Validators.minLength(2), ShopValidators.notOnlyWhitespace]),
        state: new FormControl('', [Validators.required]),
        country: new FormControl('', [Validators.required]),
        zipCode: new FormControl('', [Validators.required, Validators.minLength(2), ShopValidators.notOnlyWhitespace]),
      }),
      billing: this.formBuilder.group({
        street: new FormControl('', [Validators.required, Validators.minLength(2), ShopValidators.notOnlyWhitespace]),
        city: new FormControl('', [Validators.required, Validators.minLength(2), ShopValidators.notOnlyWhitespace]),
        state: new FormControl('', [Validators.required]),
        country: new FormControl('', [Validators.required]),
        zipCode: new FormControl('', [Validators.required, Validators.minLength(2), ShopValidators.notOnlyWhitespace]),
      }),
      creditCard: this.formBuilder.group({
        // cardType: new FormControl('', [Validators.required]),
        // cardNumber: new FormControl('', [Validators.required, Validators.pattern('[0-9]{16}')]),
        // nameOnCard: new FormControl('', [Validators.required, Validators.minLength(2), ShopValidators.notOnlyWhitespace]),
        // securityCode: new FormControl('', [Validators.required, Validators.pattern('[0-9]{3,4}')]),
        // expirationMonth: new FormControl('', [Validators.required]),
        // expirationYear: new FormControl('', [Validators.required]),
      }),
    });

    /*
    // populate credit card months and years
    this.shopFormService.getCreditCardMonths(new Date().getMonth() + 1).subscribe((data) => {
      // console.log('Retrieved months: ' + JSON.stringify(data));
      this.creditCardMonths = data;
    });
    this.shopFormService.getCreditCardYears().subscribe((data) => {
      // console.log('Retrieved years: ' + JSON.stringify(data));
      this.creditCardYears = data;
    });
    this.checkoutFormGroup.get('creditCard.expirationMonth')?.setValue(this.creditCardMonths[0]);
    this.checkoutFormGroup.get('creditCard.expirationYear')?.setValue(this.creditCardYears[0]);
    */

    // populate countries
    this.shopFormService.getCountries().subscribe((data) => {
      // console.log('Retrieved countries: ' + JSON.stringify(data));
      this.countries = data;
    });

    // update totalPrice and totalQuantity
    this.reviewCartDetails();

    // populate email if user is logged in
    const email = JSON.parse(this.storage.getItem('email')!);
    if (email != null) {
      this.checkoutFormGroup.get('customer.email')?.setValue(email);
    }

    // setup Stripe payment form
    this.setupStripePaymentForm();
  }

  async setupStripePaymentForm() {
    this.stripe = await this.stripePromise;
    this.stripe?.elements();

    // create elements instance without an Intent
    const elements = this.stripe?.elements({
      mode: 'payment',
      currency: 'usd',
      amount: 100,
    });

    // create card element .. and hide the zip-code field
    const cardAppearance = { hidePostalCode: true };
    this.cardElement = elements?.create('card', cardAppearance);

    // create a payment element
    const paymentElement = elements?.create('payment');

    // add an instance of payment UI component into the 'card-element' div
    this.cardElement.mount('#card-element');

    // add event binding for the 'change' event on the card element
    this.cardElement.on('change', (event: any) => {
      // get a handle to card-errors element
      this.displayError = document.getElementById('card-errors');

      if (event.complete) {
        this.displayError.textContent = '';
      } else if (event.error) {
        // show validation error to customer
        this.displayError.textContent = event.error.message;
      }
    });

    // this.checkoutService.createPaymentIntent(this.paymentInfo).subscribe((data) => {
    //   const secret = data;
    // });
  }

  onSubmit() {
    console.log('Handling the submit button');

    if (this.checkoutFormGroup.invalid) {
      this.checkoutFormGroup.markAllAsTouched();
      return;
    }

    console.log(this.checkoutFormGroup.get('customer')!.value);
    console.log('The email address is: ' + this.checkoutFormGroup.get('customer')?.value.email);
    console.log('The shipping address country is: ' + this.checkoutFormGroup.get('shipping')?.value.country.name);
    console.log('The shipping address state is: ' + this.checkoutFormGroup.get('shipping')?.value.state.name);

    // set up order
    const order = new Order(this.totalQuantity, this.totalPrice);

    // get cart items
    const cartItems = this.cartService.cartItems;

    // create orderItems from cartItems
    const orderItems: OrderItem[] = cartItems.map((el) => new OrderItem(el));

    // set up customer
    const customer: Customer = this.checkoutFormGroup.get('customer')!.value;
    // set up shipping address
    let shippingAddress = this.checkoutFormGroup.get('shipping')!.value;
    shippingAddress.state = shippingAddress.state.code;
    shippingAddress.country = shippingAddress.country.code;
    // set up billing address
    let billingAddress = this.checkoutFormGroup.get('billing')!.value;
    billingAddress.state = billingAddress.state.code;
    billingAddress.country = billingAddress.country.code;

    // setup purchase
    const purchase = new Purchase(customer, shippingAddress, billingAddress, order, orderItems);

    // compute payment info
    this.paymentInfo.amount = Math.round(this.totalPrice * 100);
    this.paymentInfo.currency = 'USD';
    this.paymentInfo.receiptEmail = purchase.customer.email;

    // console.log(`this.paymentInfo.amount: ${this.paymentInfo.amount}`)

    // if valid form then
    // - create payment intent
    // - confirm card payment
    // - place order
    if (!this.checkoutFormGroup.invalid && this.displayError.textContent === '') {
      this.isDisabled = true;

      this.checkoutService.createPaymentIntent(this.paymentInfo).subscribe((client_secret) => {
        this.stripe
          .confirmCardPayment(
            client_secret,
            {
              payment_method: {
                card: this.cardElement,
                billing_details: {
                  email: purchase.customer.email,
                  name: `${purchase.customer.firstName} ${purchase.customer.lastName}`,
                  address: {
                    line1: purchase.billingAddress.street,
                    city: purchase.billingAddress.city,
                    state: purchase.billingAddress.state,
                    postal_code: purchase.billingAddress.zipCode,
                    country: purchase.billingAddress.country,
                  },
                },
              },
            },
            { handleActions: false },
          )
          .then((result: any) => {
            if (result.error) {
              // infor user of the error
              alert(`There was an error: ${result.error.message}`);
              this.isDisabled = false;
            } else {
              // call REST API via the CheckoutService
              this.checkoutService.placeOrder(purchase).subscribe({
                next: (response) => {
                  alert(`Your order has been received.\nOrder tracking number: ${response.orderTrackingNumber}`);
                  // reset cart
                  this.resetCart();
                  this.isDisabled = false;
                },
                error: (err) => {
                  alert(`There was an error: ${err.message}`);
                  this.isDisabled = false;
                },
              });
            }
          });
      });
    } else {
      this.checkoutFormGroup.markAllAsTouched();
      return;
    }
  }

  resetCart() {
    // reset cart data
    this.cartService.clearCartItems();

    // reset the form
    this.checkoutFormGroup.reset();

    // navigate back to the products page
    this.router.navigateByUrl('/products');
  }

  reviewCartDetails() {
    // subscribe to cartService totalPrice and totalQuantity
    this.cartService.totalPrice.subscribe((data) => (this.totalPrice = data));
    this.cartService.totalQuantity.subscribe((data) => (this.totalQuantity = data));
  }

  copyShippingToBillingAddress(event: any) {
    if (event.target.checked) {
      this.billingStates = this.shippingStates;

      this.checkoutFormGroup.get('billing')!.setValue(this.checkoutFormGroup.get('shipping')!.value);
    } else {
      this.billingStates = [];
      this.checkoutFormGroup.get('billing')!.reset();
    }
  }

  handleMonthsAndYears() {
    const currentYear: number = new Date().getFullYear();
    const selectedYear: number = +this.checkoutFormGroup.get('creditCard')!.value.expirationYear;

    let startMonth: number;

    if (currentYear == selectedYear) {
      startMonth = new Date().getMonth() + 1;
    } else {
      startMonth = 1;
    }

    this.shopFormService.getCreditCardMonths(startMonth).subscribe((data) => (this.creditCardMonths = data));
  }

  getStates(formGroupName: string) {
    const countryCode = this.checkoutFormGroup.get(formGroupName)!.value.country.code;
    const countryName = this.checkoutFormGroup.get(formGroupName)!.value.country.name;

    // console.log(`${formGroupName} country code: ${countryCode}`);
    // console.log(`${formGroupName} country name: ${countryName}`);

    this.shopFormService.getStates(countryCode).subscribe((data) => {
      // console.log('Retrieved states: ' + JSON.stringify(data));

      if (formGroupName == 'shipping') {
        this.shippingStates = data;
      } else {
        this.billingStates = data;
      }

      // select first item by default
      this.checkoutFormGroup.get(formGroupName)!.get('state')!.setValue(data[0]);
    });
  }

  get firstName() {
    return this.checkoutFormGroup.get('customer.firstName');
  }
  get lastName() {
    return this.checkoutFormGroup.get('customer.lastName');
  }
  get email() {
    return this.checkoutFormGroup.get('customer.email');
  }
  get shippingStreet() {
    return this.checkoutFormGroup.get('shipping.street');
  }
  get shippingCity() {
    return this.checkoutFormGroup.get('shipping.city');
  }
  get shippingState() {
    return this.checkoutFormGroup.get('shipping.state');
  }
  get shippingCountry() {
    return this.checkoutFormGroup.get('shipping.country');
  }
  get shippingZipCode() {
    return this.checkoutFormGroup.get('shipping.zipCode');
  }
  get billingStreet() {
    return this.checkoutFormGroup.get('billing.street');
  }
  get billingCity() {
    return this.checkoutFormGroup.get('billing.city');
  }
  get billingState() {
    return this.checkoutFormGroup.get('billing.state');
  }
  get billingCountry() {
    return this.checkoutFormGroup.get('billing.country');
  }
  get billingZipCode() {
    return this.checkoutFormGroup.get('billing.zipCode');
  }
  get creditCardType() {
    return this.checkoutFormGroup.get('creditCard.cardType');
  }
  get creditCardNumber() {
    return this.checkoutFormGroup.get('creditCard.cardNumber');
  }
  get creditCardName() {
    return this.checkoutFormGroup.get('creditCard.nameOnCard');
  }
  get creditCardSecurityCode() {
    return this.checkoutFormGroup.get('creditCard.securityCode');
  }
  get creditCardExpirationMonth() {
    return this.checkoutFormGroup.get('creditCard.expirationMonth');
  }
  get creditCardExpirationYear() {
    return this.checkoutFormGroup.get('creditCard.expirationYear');
  }
}
