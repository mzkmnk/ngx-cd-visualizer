import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../services/product.service';
import { ProductCardComponent } from './product-card.component';

@Component({
  selector: 'app-product-catalog',
  imports: [CommonModule, ProductCardComponent],
  template: `
    <div class="product-catalog">
      <div class="page-header">
        <h1>📦 Product Catalog</h1>
        <p>Default Change Detection Strategy</p>
        <div class="header-stats">
          <div class="stat">
            <span class="stat-value">{{ totalProducts }}</span>
            <span class="stat-label">Total Products</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ inStockProducts }}</span>
            <span class="stat-label">In Stock</span>
          </div>
        </div>
      </div>

      <div class="product-grid">
        @for (product of productService.products(); track product.id) {
          <app-product-card 
            [product]="product"
            (stockToggled)="toggleStock($event)"
            (priceUpdated)="updatePrice($event.id, $event.price)">
          </app-product-card>
        }
      </div>
    </div>
  `,
  styles: [`
    .product-catalog {
      margin-left: 270px;
      padding: 20px;
      min-height: 100vh;
      background: #f8fafc;
    }

    .page-header {
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-bottom: 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .page-header h1 {
      margin: 0;
      font-size: 28px;
      color: #1e293b;
    }

    .page-header p {
      margin: 5px 0 0 0;
      color: #64748b;
      font-size: 16px;
    }

    .header-stats {
      display: flex;
      gap: 30px;
    }

    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #3b82f6;
    }

    .stat-label {
      font-size: 12px;
      color: #64748b;
      margin-top: 4px;
    }

    .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
    }
  `]
})
export class ProductCatalogComponent {
  productService = inject(ProductService);

  // Using getters to trigger change detection on every access (Default strategy)
  get totalProducts(): number {
    return this.productService.products().length;
  }

  get inStockProducts(): number {
    return this.productService.products().filter(p => p.inStock).length;
  }

  toggleStock(productId: number): void {
    const product = this.productService.products().find(p => p.id === productId);
    if (product) {
      this.productService.updateStock(productId, !product.inStock);
    }
  }

  updatePrice(productId: number, newPrice: number): void {
    this.productService.updatePrice(productId, newPrice);
  }
}