export default class AdminUserDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roleId: string | null;
  roleName: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    id: string,
    firstName: string,
    lastName: string,
    email: string,
    roleId: string | null,
    roleName: string | null,
    active: boolean,
    createdAt: Date,
    updatedAt: Date
  ) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.roleId = roleId;
    this.roleName = roleName;
    this.active = active;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromObject(obj: any): AdminUserDTO {
    return new AdminUserDTO(
      obj.id,
      obj.firstName,
      obj.lastName,
      obj.email,
      obj.roleId,
      obj.assignedRole?.name || null,
      obj.active,
      obj.createdAt,
      obj.updatedAt
    );
  }
}
