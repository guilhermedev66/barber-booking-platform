export const ROLES = {
  client: "Client",
  barber: "Barber",
  admin: "Admin",
} as const

/** Roles that manage a barber's agenda rather than book as a customer. */
export const STAFF_ROLES: string[] = [ROLES.barber, ROLES.admin]
