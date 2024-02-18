import { ShopValidators } from 'src/app/validators/shop-validators';

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css',
})
export class ContactComponent implements OnInit {
  contactFormGroup!: FormGroup;

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit(): void {
    this.contactFormGroup = this.formBuilder.group({
      fullName: new FormControl('', [Validators.required, Validators.minLength(2), ShopValidators.notOnlyWhitespace]),
      email: new FormControl('', [Validators.required, Validators.pattern('^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,6}$')]),
      phone: new FormControl('', [Validators.pattern('^[+]*[(]{0,1}[0-9]{1,3}[)]{0,1}[-\\s\\.0-9]{8,14}$')]),
      message: new FormControl('', [Validators.required, Validators.minLength(2), ShopValidators.notOnlyWhitespace]),
    });
  }

  onSubmit() {
    if (this.contactFormGroup.invalid) {
      this.contactFormGroup.markAllAsTouched();
      document.getElementById('submitErrorMessage')!.className = 'd-block';
      return;
    }

    document.getElementById('submitSuccessMessage')!.className = 'd-block';
    document.getElementById('submitErrorMessage')!.className = 'd-none';
  }

  get customer() {
    return this.contactFormGroup.get('fullName')!;
  }
  get fullName() {
    return this.contactFormGroup.get('fullName');
  }
  get email() {
    return this.contactFormGroup.get('email');
  }
  get phone() {
    return this.contactFormGroup.get('phone');
  }
  get message() {
    return this.contactFormGroup.get('message');
  }
}
