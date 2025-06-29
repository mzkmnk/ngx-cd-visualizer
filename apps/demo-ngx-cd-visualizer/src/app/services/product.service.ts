import { Injectable, signal } from '@angular/core';

export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  inStock: boolean;
  rating: number;
  image: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private _products = signal<Product[]>([
    {
      id: 1,
      name: 'Wireless Headphones',
      price: 199.99,
      category: 'Electronics',
      inStock: true,
      rating: 4.5,
      image: '🎧',
      description: 'High-quality wireless headphones with noise cancellation'
    },
    {
      id: 2,
      name: 'Smart Watch',
      price: 299.99,
      category: 'Electronics',
      inStock: false,
      rating: 4.2,
      image: '⌚',
      description: 'Advanced smartwatch with health monitoring features'
    },
    {
      id: 3,
      name: 'Coffee Mug',
      price: 15.99,
      category: 'Home',
      inStock: true,
      rating: 4.8,
      image: '☕',
      description: 'Ceramic coffee mug with temperature control'
    },
    {
      id: 4,
      name: 'Laptop Stand',
      price: 79.99,
      category: 'Office',
      inStock: true,
      rating: 4.3,
      image: '💻',
      description: 'Adjustable laptop stand for better ergonomics'
    },
    {
      id: 5,
      name: 'Desk Lamp',
      price: 89.99,
      category: 'Office',
      inStock: true,
      rating: 4.6,
      image: '💡',
      description: 'LED desk lamp with adjustable brightness'
    },
    {
      id: 6,
      name: 'Plant Pot',
      price: 24.99,
      category: 'Home',
      inStock: false,
      rating: 4.1,
      image: '🪴',
      description: 'Self-watering plant pot for indoor plants'
    }
  ]);

  readonly products = this._products.asReadonly();

  updateStock(id: number, inStock: boolean): void {
    this._products.update(products =>
      products.map(product => product.id === id ? { ...product, inStock } : product)
    );
  }

  updatePrice(id: number, price: number): void {
    this._products.update(products =>
      products.map(product => product.id === id ? { ...product, price } : product)
    );
  }

  addProduct(productData: Omit<Product, 'id'>): void {
    const newProduct: Product = {
      ...productData,
      id: Math.max(...this._products().map(p => p.id)) + 1
    };
    this._products.update(products => [...products, newProduct]);
  }
}