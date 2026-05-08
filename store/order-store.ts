import { create } from 'zustand'

export interface Order {
  id: string
  customerName: string
  customerEmail: string
  customerPhone: string
  products: {
    id: string
    name: string
    quantity: number
    price: number
  }[]
  totalAmount: number
  deliveryAddress: string
  status: 'Pending' | 'Delivered'
  orderDate: string
}

const initialOrders: Order[] = [
  {
    id: '#ORD-001',
    customerName: 'Rahul Sharma',
    customerEmail: 'rahul@example.com',
    customerPhone: '+91 9876543210',
    products: [
      { id: '1', name: 'Ray Of Infinite Diamond Ring', quantity: 1, price: 12349 },
      { id: '2', name: 'Classy Knot Diamond Ring', quantity: 1, price: 12179 }
    ],
    totalAmount: 24528,
    deliveryAddress: '123, Luxury Villa, Jubilee Hills, Hyderabad, Telangana - 500033',
    status: 'Pending',
    orderDate: '2024-04-20 10:30 AM'
  },
  {
    id: '#ORD-002',
    customerName: 'Priya Patel',
    customerEmail: 'priya@example.com',
    customerPhone: '+91 8887776665',
    products: [
      { id: '5', name: 'Rose Bloom Diamond Studs', quantity: 1, price: 18420 }
    ],
    totalAmount: 18420,
    deliveryAddress: 'Flat 402, Royal Residency, Bandra West, Mumbai, Maharashtra - 400050',
    status: 'Delivered',
    orderDate: '2024-04-18 02:15 PM'
  },
  {
    id: '#ORD-003',
    customerName: 'Ananya Iyer',
    customerEmail: 'ananya@example.com',
    customerPhone: '+91 9991112223',
    products: [
      { id: '6', name: 'Cascade Diamond Necklace', quantity: 1, price: 24800 }
    ],
    totalAmount: 24800,
    deliveryAddress: 'No. 45, Temple Road, Jayanagar, Bengaluru, Karnataka - 560041',
    status: 'Pending',
    orderDate: '2024-04-22 11:00 AM'
  },
  {
    id: '#ORD-004',
    customerName: 'Vikram Singh',
    customerEmail: 'vikram@example.com',
    customerPhone: '+91 7776665554',
    products: [
      { id: '3', name: 'Twilight Twirl Diamond Ring', quantity: 2, price: 12680 }
    ],
    totalAmount: 25360,
    deliveryAddress: 'House 88, Golf Course Road, Gurgaon, Haryana - 122002',
    status: 'Pending',
    orderDate: '2024-04-25 09:45 AM'
  }
]

interface OrderState {
  orders: Order[]
  updateOrderStatus: (id: string, status: 'Pending' | 'Delivered') => void
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: initialOrders,
  updateOrderStatus: (id, status) => set((state) => ({
    orders: state.orders.map(order => order.id === id ? { ...order, status } : order)
  })),
}))
