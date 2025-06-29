import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product } from '../../services/product.service';

@Component({
  selector: 'app-product-card',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="product-card" [class.out-of-stock]="!product().inStock">
      <div class="product-image">
        {{ product().image }}
      </div>
      
      <div class="product-info">
        <h3>{{ product().name }}</h3>
        <p class="product-description">{{ product().description }}</p>
        
        <div class="product-meta">
          <span class="category">{{ product().category }}</span>
          <div class="rating">
            <span class="stars">{{ getStars(product().rating) }}</span>
            <span class="rating-value">{{ product().rating }}</span>
          </div>
        </div>
        
        <div class="product-price">
          @if (isEditingPrice()) {
            <input 
              type="number" 
              [(ngModel)]="editPrice"
              (keyup.enter)="savePrice()"
              (keyup.escape)="cancelEdit()"
              class="price-input"
              step="0.01">
            <button class="save-btn" (click)="savePrice()">✓</button>
            <button class="cancel-btn" (click)="cancelEdit()">✕</button>
          } @else {
            <span class="price" (click)="startEditPrice()">\${{ product().price.toFixed(2) }}</span>
          }
        </div>
        
        <div class="product-status">
          <span class="stock-status" [class.in-stock]="product().inStock" [class.out-of-stock]="!product().inStock">
            {{ product().inStock ? '✅ In Stock' : '❌ Out of Stock' }}
          </span>
        </div>
      </div>
      
      <div class="product-actions">
        <button 
          class="stock-btn"
          [class.toggle-in]="!product().inStock"
          [class.toggle-out]="product().inStock"
          (click)="toggleStock()">
          {{ product().inStock ? 'Mark Out of Stock' : 'Mark In Stock' }}
        </button>
        
        <button class="view-btn" (click)="simulateView()">
          👁 View Details ({{ viewCount() }})
        </button>
      </div>
    </div>
  `,
  styles: [`
    .product-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: all 0.2s ease;
      border: 2px solid transparent;
    }

    .product-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      border-color: #e2e8f0;
    }

    .product-card.out-of-stock {
      opacity: 0.7;
      background: #f8fafc;
    }

    .product-image {
      font-size: 48px;
      text-align: center;
      margin-bottom: 16px;
      padding: 20px;
      background: #f8fafc;
      border-radius: 8px;
    }

    .product-info h3 {
      margin: 0 0 8px 0;
      font-size: 18px;
      color: #1e293b;
    }

    .product-description {
      margin: 0 0 12px 0;
      color: #64748b;
      font-size: 14px;
      line-height: 1.4;
    }

    .product-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .category {
      background: #f1f5f9;
      color: #475569;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .rating {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .stars {
      color: #fbbf24;
    }

    .rating-value {
      font-size: 12px;
      color: #64748b;
      font-weight: 600;
    }

    .product-price {
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .price {
      font-size: 24px;
      font-weight: 700;
      color: #10b981;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: background 0.2s ease;
    }

    .price:hover {
      background: #f0fdf4;
    }

    .price-input {
      padding: 4px 8px;
      border: 2px solid #3b82f6;
      border-radius: 4px;
      font-size: 18px;
      font-weight: 700;
      color: #10b981;
      width: 100px;
    }

    .save-btn, .cancel-btn {
      width: 24px;
      height: 24px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .save-btn {
      background: #10b981;
      color: white;
    }

    .cancel-btn {
      background: #ef4444;
      color: white;
    }

    .product-status {
      margin-bottom: 16px;
    }

    .stock-status {
      font-size: 12px;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 12px;
    }

    .stock-status.in-stock {
      background: #dcfce7;
      color: #16a34a;
    }

    .stock-status.out-of-stock {
      background: #fee2e2;
      color: #dc2626;
    }

    .product-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .stock-btn {
      padding: 10px 16px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: white;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .stock-btn.toggle-in:hover {
      background: #10b981;
      color: white;
      border-color: #10b981;
    }

    .stock-btn.toggle-out:hover {
      background: #ef4444;
      color: white;
      border-color: #ef4444;
    }

    .view-btn {
      padding: 10px 16px;
      border: 1px solid #3b82f6;
      border-radius: 6px;
      background: white;
      color: #3b82f6;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .view-btn:hover {
      background: #3b82f6;
      color: white;
    }
  `]
})
export class ProductCardComponent {
  product = input.required<Product>();
  stockToggled = output<number>();
  priceUpdated = output<{id: number, price: number}>();

  isEditingPrice = signal(false);
  editPrice = 0;
  viewCount = signal(0);

  getStars(rating: number): string {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    return '★'.repeat(fullStars) + (hasHalfStar ? '☆' : '') + '☆'.repeat(5 - fullStars - (hasHalfStar ? 1 : 0));
  }

  toggleStock(): void {
    this.stockToggled.emit(this.product().id);
  }

  startEditPrice(): void {
    this.editPrice = this.product().price;
    this.isEditingPrice.set(true);
  }

  savePrice(): void {
    if (this.editPrice > 0) {
      this.priceUpdated.emit({
        id: this.product().id,
        price: this.editPrice
      });
    }
    this.isEditingPrice.set(false);
  }

  cancelEdit(): void {
    this.isEditingPrice.set(false);
  }

  simulateView(): void {
    this.viewCount.update(count => count + 1);
  }
}