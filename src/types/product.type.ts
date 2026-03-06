import { JerseyCategory, JerseySize } from "./common.type";

export interface Product {
  _id: string;
  name: string;
  price: number;
  category: JerseyCategory;
  sizes: JerseySize[];  
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}
