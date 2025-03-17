export default class TenantUserDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: { id: string; name: string }[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    id: string,
    email: string,
    firstName: string,
    lastName: string,
    roles: { id: string; name: string }[],
    active: boolean,
    createdAt: Date,
    updatedAt: Date
  ) {
    this.id = id;
    this.email = email;
    this.firstName = firstName;
    this.lastName = lastName;
    this.roles = roles;
    this.active = active;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromObject(obj: any): TenantUserDTO {
    const roles = obj.userRoles
      ? obj.userRoles.map((ur: any) => ({
          id: ur.tenantRole.id,
          name: ur.tenantRole.name,
        }))
      : [];

    return new TenantUserDTO(
      obj.id,
      obj.email,
      obj.firstName,
      obj.lastName,
      roles,
      obj.active,
      obj.createdAt,
      obj.updatedAt
    );
  }
}
