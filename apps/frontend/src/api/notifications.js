import api from "./client";

/**
 * Fetch notifications for admin dashboard
 * @param {Object} params - Query parameters
 * @param {boolean} params.unread - Filter by read status
 * @param {string} params.severity - Filter by severity
 * @param {string} params.category - Filter by category
 * @param {boolean} params.actionRequired - Filter by action required
 * @param {number} params.limit - Limit number of notifications
 */
export const getNotifications = (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.unread !== undefined) {
        queryParams.append('unread', params.unread.toString());
    }
    if (params.severity) {
        queryParams.append('severity', params.severity);
    }
    if (params.category) {
        queryParams.append('category', params.category);
    }
    if (params.actionRequired !== undefined) {
        queryParams.append('actionRequired', params.actionRequired.toString());
    }
    if (params.limit) {
        queryParams.append('limit', params.limit.toString());
    }

    const queryString = queryParams.toString();
    const url = queryString ? `/admin/notifications?${queryString}` : '/admin/notifications';

    return api.get(url).then(res => res.data);
};

/**
 * Create a new notification
 * @param {Object} notification - Notification data
 */
export const createNotification = (notification) =>
    api.post('/admin/notifications', notification).then(res => res.data);

/**
 * Mark notification as read/unread
 * @param {string} id - Notification ID
 * @param {boolean} isRead - Read status
 */
export const markNotificationAsRead = (id, isRead = true) =>
    api.patch(`/admin/notifications/${id}`, { isRead }).then(res => res.data);

/**
 * Delete notification
 * @param {string} id - Notification ID
 */
export const deleteNotification = (id) =>
    api.delete(`/admin/notifications/${id}`).then(res => res.data); 