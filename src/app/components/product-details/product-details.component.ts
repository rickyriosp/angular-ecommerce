import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { CartItem } from '../../common/cart-item';
import { Product } from '../../common/product';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';

const PROD_ID = 'prodId';
const CAT_ID = 'catId';

@Component({
  selector: 'app-product-details',
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.css',
})
export class ProductDetailsComponent implements OnInit {
  product!: Product;
  categoryId: number = 1;

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.categoryId = +this.route.snapshot.paramMap.get(CAT_ID)!;

    this.route.paramMap.subscribe(() => {
      this.handleProductDetails();
    });
  }

  handleProductDetails() {
    // get the "id" apram string. conevrt string to number using "+" symbol
    const productId: number = +this.route.snapshot.paramMap.get(PROD_ID)!;

    this.productService.getProduct(productId).subscribe((data) => {
      this.product = data;
    });
  }

  addToCart(product: Product) {
    const quantity = +(document.getElementById('inputQuantity') as HTMLInputElement).value;

    console.log(`Adding to cart: ${product.name}, ${product.unitPrice}, quantity: ${quantity}`);

    const cartItem = new CartItem(product);
    cartItem.quantity = quantity;

    this.cartService.addToCart(cartItem);
  }
}
