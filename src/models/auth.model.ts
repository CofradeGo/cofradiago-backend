export interface LoginDTO {
  username: string;
  password: string;
}


export interface TokenPayload {
  id: number;
  role: "DMG" | "AUX";
  email?: string | null;
  hermandadId: number;
  username: string;
}
