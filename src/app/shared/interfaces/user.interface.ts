import { TeamGroup } from '../../core/enums/team-group.enum';

export interface ApiUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  image: string;
}

export interface User extends ApiUser {
  group: TeamGroup;
}

export interface UsersResponse {
  users: ApiUser[];
  total: number;
}

export interface AuthRequest {
  username: string;
  password: string;
}

export interface AuthResponse extends ApiUser {
  accessToken: string;
}

export interface RegisterRequest extends AuthRequest {
  firstName: string;
  lastName: string;
  email: string;
  group: TeamGroup;
}
