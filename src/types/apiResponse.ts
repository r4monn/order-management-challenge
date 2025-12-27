import { OrderState } from "./order.js";

export interface PaginationParams {
  page: number;
  limit: number;
  state?: OrderState;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}