export interface Order {
  _id: string;  // MongoDB's internal ID
  id: number;   // Our sequential ID
  customerName: string;
  numberOfCrates: number;
  price: number;
  dueTime: string;
  createdAt: string;
  updatedAt: string;
  status: 'pending' | 'completed';
} 