// Sample products to seed into the database
export interface ProductSeed {
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
}

export const Products: ProductSeed[] = [
  {
    name: 'Wireless Headphones',
    description: 'Bluetooth over-ear noise cancelling headphones.',
    price: 59.99,
    category: 'Electronics',
    imageUrl: 'https://via.placeholder.com/150',
  },
  {
    name: 'Smart Watch',
    description: 'Fitness tracking smartwatch with heart rate monitor.',
    price: 199.99,
    category: 'Electronics',
    imageUrl: 'https://via.placeholder.com/150',
  },
  {
    name: 'JavaScript Guide',
    description: 'Comprehensive guide to modern JavaScript programming.',
    price: 29.99,
    category: 'Books',
    imageUrl: 'https://via.placeholder.com/150',
  },
  {
    name: 'Denim Jeans',
    description: 'Comfortable slim-fit denim jeans.',
    price: 49.99,
    category: 'Clothing',
    imageUrl: 'https://via.placeholder.com/150',
  },
  {
    name: 'Cooking Pan Set',
    description: 'Non-stick cookware set with 5 pieces.',
    price: 79.99,
    category: 'Home & Kitchen',
    imageUrl: 'https://via.placeholder.com/150',
  },
  {
    name: 'Building Blocks Set',
    description: 'Creative building block toy for kids.',
    price: 19.99,
    category: 'Toys',
    imageUrl: 'https://via.placeholder.com/150',
  },
];