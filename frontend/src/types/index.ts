export interface UserCreate {
  name: string;
  bio: string;
}

export interface User {
  uid: string;
  name: string;
  is_ai: boolean;
  points: number;
}
