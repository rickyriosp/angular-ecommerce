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
        // user full name is exposed as a property name
        this.oktaAuth
          .getUser()
          .then((data) => (this.userFullName = data.name as string));
      }
    }, 150);
  }

  logout() {
    // Terminates the session with Okta and removes current tokens
    this.oktaAuth.signOut();
  }
}
