
export const PERMISSIONS = {
    dashboard: {
      VIEW: 1 << 0,      // 1
      MANAGE: 1 << 1,    // 2
    },
    reservation: {
      VIEW_SELF: 1 << 2,  // 4
      VIEW_ALL: 1 << 3,   // 8
      CREATE: 1 << 4,     // 16
      EDIT: 1 << 5,       // 32
      CANCEL: 1 << 6,     // 64
    },
    equipment: {
      VIEW: 1 << 7,    // 128
      ADD: 1 << 8,     // 256
      EDIT: 1 << 9,    // 512
      DELETE: 1 << 10, // 1024
    },
    resources: {
      VIEW: 1 << 11,    // 2048
      ADD: 1 << 12,     // 4096
      EDIT: 1 << 13,    // 8192
      DELETE: 1 << 14,  // 16384
    },
    notification: {
      VIEW: 1 << 15,    // 32768
      SEND: 1 << 16,    // 65536
      EDIT: 1 << 17,    // 131072
      DELETE: 1 << 18,  // 262144
    },
  };
  export const DASHBOARD_ALL = (
    PERMISSIONS.dashboard.VIEW |
    PERMISSIONS.dashboard.MANAGE
  );
  export const RESERVATION_ALL = (
    PERMISSIONS.reservation.VIEW_SELF |
    PERMISSIONS.reservation.VIEW_ALL |
    PERMISSIONS.reservation.CREATE |
    PERMISSIONS.reservation.EDIT |
    PERMISSIONS.reservation.CANCEL
  );
  export const EQUIPMENT_ALL = (
    PERMISSIONS.equipment.VIEW |
    PERMISSIONS.equipment.ADD |
    PERMISSIONS.equipment.EDIT |
    PERMISSIONS.equipment.DELETE
  );
  export const RESOURCES_ALL = (
    PERMISSIONS.resources.VIEW |
    PERMISSIONS.resources.ADD |
    PERMISSIONS.resources.EDIT |
    PERMISSIONS.resources.DELETE
  );
  export const NOTIFICATION_ALL = (
    PERMISSIONS.notification.VIEW |
    PERMISSIONS.notification.SEND |
    PERMISSIONS.notification.EDIT |
    PERMISSIONS.notification.DELETE
  );
  export const ROLE_ADMIN = ( // 524287
    DASHBOARD_ALL |
    RESERVATION_ALL |
    EQUIPMENT_ALL |
    RESOURCES_ALL |
    NOTIFICATION_ALL
  );
  export const ROLE_USER = ( // 35029
    PERMISSIONS.dashboard.VIEW |
    PERMISSIONS.reservation.VIEW_SELF |
    PERMISSIONS.reservation.CANCEL |
    PERMISSIONS.reservation.CREATE |
    PERMISSIONS.equipment.VIEW |
    PERMISSIONS.resources.VIEW |
    PERMISSIONS.notification.VIEW
  );