export default class TenantDTO {
  id: string;
  name: string;
  schemaName: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    id: string,
    name: string,
    schemaName: string,
    active: boolean,
    createdAt: Date,
    updatedAt: Date
  ) {
    this.id = id;
    this.name = name;
    this.schemaName = schemaName;
    this.active = active;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromObject(obj: any): TenantDTO {
    return new TenantDTO(
      obj.id,
      obj.name,
      obj.schemaName,
      obj.active,
      obj.createdAt,
      obj.updatedAt
    );
  }
}
