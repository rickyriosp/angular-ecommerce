import { Component, Inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OKTA_AUTH, OktaAuthStateService } from '@okta/okta-angular';
import OktaAuth from '@okta/okta-auth-js';

@Component({
  selector: 'app-login-status',
  templateUrl: './login-status.component.html',
  styleUrl: './login-status.component.css',
})
export class LoginStatusComponent implements OnInit {
  isAuthenticated: boolean = false;
  userFullName: string = '';

  storage: Storage = sessionStorage;

  constructor(
    private oktaAuthService: OktaAuthStateService,
    @Inject(OKTA_AUTH) private oktaAuth: OktaAuth,
    private router: Router
  ) {}

  async ngOnInit() {
    // subscribe to authentication state changes
    this.oktaAuthService.authState$.subscribe((result) => {
      this.isAuthenticated = result.isAuthenticated!;
      this.getUserDetails();
    });

    this.isAuthenticated = await this.oktaAuth.isAuthenticated();
  }

  getUserDetails() {
    // adding a little delay for isAuthenticated to update
    setTimeout(() => {
      if (this.isAuthenticated) {
        // fetch the logged in user details (user's claims)
        //
        this.oktaAuth.getUser().then((data) => {
          // user full name is exposed as a property name
          this.userFullName = data.name as string;

          // retrieve the user's email from authentication response
          const email = data.email;

          // store the email in browser storage
          this.storage.setItem('email', JSON.stringify(email));
        });
      }
    }, 150);
  }

  logout() {
    // Terminates the session with Okta and removes current tokens
    this.oktaAuth.signOut();
  }
}
