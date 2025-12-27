export type OrderState = 'CREATED' | 'ANALYSIS' | 'COMPLETED';
export type OrderStatus = 'ACTIVE' | 'DELETED';

export interface IOrder {
  lab: string;
  patient: string;
  customer: string;
  state: OrderState;
  status: OrderStatus;
  services: IService[];
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IService {
  name: string;
  value: number;
  status: 'PENDING' | 'DONE';
}