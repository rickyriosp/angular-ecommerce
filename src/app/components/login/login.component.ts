import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { OKTA_AUTH } from '@okta/okta-angular';
import OktaAuth, { Tokens } from '@okta/okta-auth-js';
import OktaSignIn from '@okta/okta-signin-widget';

import myAppConfig from '../../config/my-app-config';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit, OnDestroy {
  oktaSignin: OktaSignIn;

  constructor(@Inject(OKTA_AUTH) private oktaAuth: OktaAuth) {
    this.oktaSignin = new OktaSignIn({
      /**
       * Note: when using the Sign-In Widget for an OIDC flow, you still
       * need to configure the base URL for your Okta Org. Here
       * we derive it from the given issuer for convenience.
       */
      baseUrl: myAppConfig.oidc.issuer.split('/oauth2')[0],
      logo: 'assets/images/logoV2.jpg',
      clientId: myAppConfig.oidc.clientId,
      redirectUri: myAppConfig.oidc.redirectUri,
      authParams: {
        pkce: true, // Proof Key for Code Exchange
        issuer: myAppConfig.oidc.issuer,
        scopes: myAppConfig.oidc.scopes,
      },
    });
  }

  ngOnInit(): void {
    this.oktaSignin.remove();

    // this.oktaSignin.renderEl(
    //   {
    //     el: '#okta-sign-in-widget', // this name should be same as div tag in login.component.html
    //   },
    //   (response: any) => {
    //     if (response.status === 'SUCCESS') {
    //       this.oktaAuth.signInWithRedirect();
    //     }
    //   },
    //   (error: any) => {
    //     // Typically due to misconfiguration
    //     console.log('login widget error: ' + error.message);
    //     throw error;
    //   }
    // );
    this.oktaSignin
      .showSignInToGetTokens({
        el: '#okta-sign-in-widget',
      })
      .then((tokens: Tokens) => {
        // Remove the widget
        this.oktaSignin.remove();

        // In this flow the redirect to Okta occurs in a hidden iframe
        this.oktaAuth.handleLoginRedirect(tokens);
      })
      .catch((err: any) => {
        // Typically due to misconfiguration
        throw err;
      });
  }

  ngOnDestroy() {
    this.oktaSignin.remove();
  }
}
