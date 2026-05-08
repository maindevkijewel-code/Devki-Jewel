import { create } from 'zustand'
import { products as mockProducts, type Product } from '@/lib/mockData'

interface ProductState {
  products: Product[]
  addProduct: (product: Product) => void
  deleteProduct: (id: string) => void
}

export const useProductStore = create<ProductState>((set) => ({
  products: [...mockProducts],
  addProduct: (product) => set((state) => ({ products: [product, ...state.products] })),
  deleteProduct: (id) => set((state) => ({ products: state.products.filter(p => p.id !== id) })),
}))
