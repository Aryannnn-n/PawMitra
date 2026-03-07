// User
export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
  age?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  phone?: string;
  location?: string;
  createdAt: string;
}

// Pet
export type PetStatus = 'LOST' | 'FOUND' | 'ADOPTABLE' | 'ADOPTED' | 'REUNITED';
export type ValidationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type PetGender = 'MALE' | 'FEMALE' | 'UNKNOWN';

export interface Pet {
  id: number;
  name?: string;
  type: string;
  breed?: string;
  color?: string;
  gender: PetGender;
  age?: number;
  wellness?: string;
  birthmark?: string;
  imageUrl?: string;
  imagePublicId?: string;
  status: PetStatus;
  validationStatus: ValidationStatus;
  state: string;
  city: string;
  village?: string;
  addressLine?: string;
  pincode?: string;
  googleMapsLink?: string;
  incidentDate?: string;
  dateReported: string;
  owner: Pick<User, 'id' | 'username'>;
}

// Adoption
export type AdoptionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AdoptionRequest {
  id: number;
  status: AdoptionStatus;
  requestDate: string;
  user: Pick<User, 'id' | 'username' | 'email'>;
  pet: Pick<Pet, 'id' | 'name' | 'type' | 'status' | 'imageUrl'>;
}

// Notification
export interface Notification {
  id: number;
  message: string;
  isRead: boolean;
  timestamp: string;
  userId: number;
}

// Chat
export interface Message {
  id: number;
  content: string;
  isRead: boolean;
  timestamp: string;
  sender: Pick<User, 'id' | 'username'>;
  receiver: Pick<User, 'id' | 'username'>;
}

export interface RoomMessage {
  id: number;
  message: string;
  timestamp: string;
  sender: Pick<User, 'id' | 'username'>;
}

export interface ChatRoom {
  id: number;
  name: string;
  isDisabled: boolean;
  createdAt: string;
  pet?: Pick<Pet, 'id' | 'name' | 'type' | 'imageUrl'>;
  participants: { user: Pick<User, 'id' | 'username'> }[];
  messages: RoomMessage[];
}
