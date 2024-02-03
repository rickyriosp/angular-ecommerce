import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { start } from '@popperjs/core';

import { Country } from '../../common/country';
import { State } from '../../common/state';
import { ShopFormService } from '../../services/shop-form.service';

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

  constructor(
    private formBuilder: FormBuilder,
    private shopFormService: ShopFormService
  ) {}

  ngOnInit(): void {
    this.checkoutFormGroup = this.formBuilder.group({
      customer: this.formBuilder.group({
        firstName: [''],
        lastName: [''],
        email: [''],
      }),
      shipping: this.formBuilder.group({
        street: [''],
        city: [''],
        state: [''],
        country: [''],
        zipCode: [''],
      }),
      billing: this.formBuilder.group({
        street: [''],
        city: [''],
        state: [''],
        country: [''],
        zipCode: [''],
      }),
      creditCard: this.formBuilder.group({
        cardType: [''],
        cardNumber: [''],
        nameOnCard: [''],
        securityCode: [''],
        expirationMonth: [''],
        expirationYear: [''],
      }),
    });

    // populate credit card months and years
    this.shopFormService
      .getCreditCardMonths(new Date().getMonth() + 1)
      .subscribe((data) => {
        console.log('Retrieved months: ' + JSON.stringify(data));
        this.creditCardMonths = data;
      });
    this.shopFormService.getCreditCardYears().subscribe((data) => {
      console.log('Retrieved years: ' + JSON.stringify(data));
      this.creditCardYears = data;
    });

    // populate countries
    this.shopFormService.getCountries().subscribe((data) => {
      console.log('Retrieved countries: ' + JSON.stringify(data));
      this.countries = data;
    });
  }

  onSubmit() {
    console.log('Handling the submit button');
    console.log(this.checkoutFormGroup.get('customer')!.value);
    console.log(
      'The email address is: ' +
        this.checkoutFormGroup.get('customer')?.value.email
    );
    console.log(
      'The shipping address country is: ' +
        this.checkoutFormGroup.get('shipping')?.value.country.name
    );
    console.log(
      'The shipping address state is: ' +
        this.checkoutFormGroup.get('shipping')?.value.state.name
    );
  }

  copyShippingToBillingAddress(event: any) {
    if (event.target.checked) {
      this.billingStates = this.shippingStates;

      this.checkoutFormGroup
        .get('billing')!
        .setValue(this.checkoutFormGroup.get('shipping')!.value);
    } else {
      this.billingStates = [];
      this.checkoutFormGroup.get('billing')!.reset();
    }
  }

  handleMonthsAndYears() {
    const currentYear: number = new Date().getFullYear();
    const selectedYear: number =
      +this.checkoutFormGroup.get('creditCard')!.value.expirationYear;

    let startMonth: number;

    if (currentYear == selectedYear) {
      startMonth = new Date().getMonth() + 1;
    } else {
      startMonth = 1;
    }

    this.shopFormService
      .getCreditCardMonths(startMonth)
      .subscribe((data) => (this.creditCardMonths = data));
  }

  getStates(formGroupName: string) {
    const countryCode =
      this.checkoutFormGroup.get(formGroupName)!.value.country.code;
    const countryName =
      this.checkoutFormGroup.get(formGroupName)!.value.country.name;

    console.log(`${formGroupName} country code: ${countryCode}`);
    console.log(`${formGroupName} country name: ${countryName}`);

    this.shopFormService.getStates(countryCode).subscribe((data) => {
      // console.log('Retrieved states: ' + JSON.stringify(data));

      if (formGroupName == 'shipping') {
        this.shippingStates = data;
      } else {
        this.billingStates = data;
      }

      // select first item by default
      this.checkoutFormGroup
        .get(formGroupName)!
        .get('state')!
        .setValue(data[0]);
    });
  }
}
