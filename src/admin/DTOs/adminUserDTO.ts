class AdminUserDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    id: string,
    firstName: string,
    lastName: string,
    email: string,
    role: string,
    createdAt: Date,
    updatedAt: Date
  ) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.role = role;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromObject(obj: any): AdminUserDTO {
    return new AdminUserDTO(
      obj.id,
      obj.firstName,
      obj.lastName,
      obj.email,
      obj.role,
      obj.createdAt,
      obj.updatedAt
    );
  }
}
