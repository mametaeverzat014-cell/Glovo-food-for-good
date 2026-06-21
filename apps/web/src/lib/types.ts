export type Role = 'CUSTOMER' | 'RESTAURANT_OWNER' | 'ADMIN';

export type FoodCategory =
  | 'MEALS'
  | 'BAKERY'
  | 'GROCERY'
  | 'DESSERTS'
  | 'DRINKS'
  | 'OTHER';

export type OrderStatus =
  | 'RESERVED'
  | 'PAID'
  | 'PICKED_UP'
  | 'COMPLETED'
  | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export type RestaurantStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Restaurant {
  id: string;
  name: string;
  description?: string | null;
  address: string;
  lat: number;
  lng: number;
  imageUrl?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  rating: number;
  reviewCount: number;
  verified: boolean;
  status: RestaurantStatus;
  rejectionReason?: string | null;
  activeOffers?: number;
  createdAt?: string;
  owner?: { name: string; email: string; phone?: string | null };
  distanceKm?: number | null;
}

export interface Offer {
  id: string;
  restaurantId: string;
  title: string;
  description?: string | null;
  originalPrice: string;
  discountedPrice: string;
  quantity: number;
  category: FoodCategory;
  pickupStart: string;
  pickupEnd: string;
  expiresAt: string;
  status: 'AVAILABLE' | 'SOLD_OUT' | 'EXPIRED';
  images: string[];
  discountPercent: number;
  distanceKm?: number | null;
  orderCount?: number;
  restaurant?: Pick<Restaurant, 'id' | 'name' | 'rating' | 'imageUrl'> & {
    lat?: number;
    lng?: number;
  };
}

export interface Order {
  id: string;
  offerId: string;
  quantity: number;
  totalPrice: string;
  status: OrderStatus;
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
  pickupCode: string;
  createdAt: string;
  offer?: Partial<Offer> & { restaurant?: { name: string; address: string } };
  user?: { name: string };
}

export interface Analytics {
  mealsSaved: number;
  moneyRecovered: number;
  customerSavings: number;
  co2AvoidedKg: number;
  orders: number;
  restaurants?: number;
}

export interface FeedFilters {
  category?: FoodCategory;
  maxPrice?: number;
  minDiscount?: number;
  minRating?: number;
  sort?: 'nearest' | 'cheapest' | 'discount' | 'popular';
  lat?: number;
  lng?: number;
}
