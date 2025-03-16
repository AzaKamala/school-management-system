export default class TenantUserDTO {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
  
    constructor(
      id: string,
      email: string,
      firstName: string,
      lastName: string,
      role: string,
      active: boolean,
      createdAt: Date,
      updatedAt: Date
    ) {
      this.id = id;
      this.email = email;
      this.firstName = firstName;
      this.lastName = lastName;
      this.role = role;
      this.active = active;
      this.createdAt = createdAt;
      this.updatedAt = updatedAt;
    }
  
    static fromObject(obj: any): TenantUserDTO {
      return new TenantUserDTO(
        obj.id,
        obj.email,
        obj.firstName,
        obj.lastName,
        obj.role,
        obj.active,
        obj.createdAt,
        obj.updatedAt
      );
    }
  }