import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { CartItem } from '../../common/cart-item';
import { Product } from '../../common/product';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css',
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  currentCategoryId: number = 1;
  previousCategoryId: number = 1;
  searchMode: boolean = false;

  // new properties for pagination
  pageNumber: number = 1;
  pageSize: number = 5;
  totalElements: number = 0;

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(() => {
      this.listProducts();
    });
  }

  listProducts() {
    this.searchMode = this.route.snapshot.paramMap.has('keyword');

    if (this.searchMode) {
      this.handleSearchProdcuts();
    } else {
      this.handleListProducts();
    }
  }

  handleSearchProdcuts() {
    const keyword: string = this.route.snapshot.paramMap.get('keyword')!;

    console.log(`keyword=${keyword}, pageNumber=${this.pageNumber}`);

    // now search for the products using keyword
    this.productService
      .searchProductsPaginate(
        this.pageNumber - 1, // Angular is 1 based, Spring Data Rest is 0 based
        this.pageSize,
        keyword,
      )
      .subscribe(this.processResult());
  }

  handleListProducts() {
    // check if "id" parameter is available
    const hasCategoryId: boolean = this.route.snapshot.paramMap.has('id');

    if (hasCategoryId) {
      // get the "id" param string. convert string to number using the "+" symbol
      // ! tells the compiler the object is not null
      this.currentCategoryId = +this.route.snapshot.paramMap.get('id')!;
    } else {
      // no category id available ... default to category id 1
      this.currentCategoryId = 1;
    }

    // check if we have a different category than previous
    // Note: Angular will reuse a component if it is currently being viewed

    // if we have a different category id than previous
    // then set pageNumber back to 1
    if (this.previousCategoryId != this.currentCategoryId) {
      this.pageNumber = 1;
    }

    this.previousCategoryId = this.currentCategoryId;

    // console.log(
    //   `currentCategoryId=${this.currentCategoryId}, pageNumber=${this.pageNumber}`
    // );

    // now get the products for the given category id
    this.productService
      .getProductListPaginate(
        this.pageNumber - 1, // Angular is 1 based, Spring Data Rest is 0 based
        this.pageSize,
        this.currentCategoryId,
      )
      .subscribe(this.processResult());
    // above is the same as :
    // .subscribe((data) => {
    //   this.products = data._embedded.products;
    //   this.pageNumber = data.page.number + 1; // Angular is 1 based, Spring Data Rest is 0 based
    //   this.pageSize = data.page.size;
    //   this.totalElements = data.page.totalElements;
    // })
  }

  updatePageSize(newPageSize: string) {
    this.pageSize = +newPageSize;
    this.pageNumber = 1;
    this.listProducts();
  }

  processResult() {
    return (data: any) => {
      this.products = data._embedded.products;
      this.pageNumber = data.page.number + 1; // Angular is 1 based, Spring Data Rest is 0 based
      this.pageSize = data.page.size;
      this.totalElements = data.page.totalElements;
    };
  }

  addToCart(product: Product) {
    // console.log(`Adding to cart: ${product.name}, ${product.unitPrice}`);

    const cartItem = new CartItem(product);

    this.cartService.addToCart(cartItem);
  }
}
