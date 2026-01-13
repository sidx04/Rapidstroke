import mongoose, { Document, Schema } from 'mongoose';

// Notification service interface
export interface INotification extends Document {
    notificationId: string;
    userId: string;
    alertId: string;
    type: 'alert_assigned' | 'alert_forwarded' | 'alert_returned' | 'alert_completed' | 'reminder';
    title: string;
    message: string;
    data: {
        alertId: string;
        patientName: string;
        severity: string;
        stage: string;
        actionRequired?: string;
    };

    // Notification channels
    channels: {
        push: {
            sent: boolean;
            sentAt?: Date;
            ticketId?: string; // Expo ticket ID for receipt tracking
            delivered?: boolean;
            deliveredAt?: Date;
            clicked?: boolean;
            clickedAt?: Date;
            error?: string; // Store any push notification errors
        };
        sms: {
            sent: boolean;
            sentAt?: Date;
            delivered?: boolean;
            deliveredAt?: Date;
            phoneNumber?: string;
        };
        email: {
            sent: boolean;
            sentAt?: Date;
            delivered?: boolean;
            deliveredAt?: Date;
            emailAddress?: string;
        };
    };

    priority: 'low' | 'medium' | 'high' | 'urgent';
    isRead: boolean;
    readAt?: Date;
    retryCount: number;
    maxRetries: number;
    lastRetryAt?: Date;
    nextRetryAt?: Date;
    scheduledFor?: Date; // For delayed notifications
    expiresAt?: Date;

    createdAt: Date;
    updatedAt: Date;
}

const notificationSchema = new Schema<INotification>({
    notificationId: {
        type: String,
        required: true,
        unique: true,
        default: () => `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    },
    userId: {
        type: String,
        required: [true, 'User ID is required'],
        index: true
    },
    alertId: {
        type: String,
        required: [true, 'Alert ID is required'],
        index: true
    },
    type: {
        type: String,
        enum: ['alert_assigned', 'alert_forwarded', 'alert_returned', 'alert_completed', 'reminder'],
        required: [true, 'Notification type is required']
    },
    title: {
        type: String,
        required: [true, 'Notification title is required'],
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    message: {
        type: String,
        required: [true, 'Notification message is required'],
        maxlength: [500, 'Message cannot exceed 500 characters']
    },
    data: {
        alertId: {
            type: String,
            required: true
        },
        patientName: {
            type: String,
            required: true
        },
        severity: {
            type: String,
            required: true
        },
        stage: {
            type: String,
            required: true
        },
        actionRequired: String
    },
    channels: {
        push: {
            sent: {
                type: Boolean,
                default: false
            },
            sentAt: Date,
            ticketId: {
                type: String,
                sparse: true
            },
            delivered: {
                type: Boolean,
                default: false
            },
            deliveredAt: Date,
            clicked: {
                type: Boolean,
                default: false
            },
            clickedAt: Date,
            error: String
        },
        sms: {
            sent: {
                type: Boolean,
                default: false
            },
            sentAt: Date,
            delivered: {
                type: Boolean,
                default: false
            },
            deliveredAt: Date,
            phoneNumber: String
        },
        email: {
            sent: {
                type: Boolean,
                default: false
            },
            sentAt: Date,
            delivered: {
                type: Boolean,
                default: false
            },
            deliveredAt: Date,
            emailAddress: String
        }
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        required: true,
        default: 'medium',
        index: true
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    readAt: Date,
    retryCount: {
        type: Number,
        default: 0,
        min: 0
    },
    maxRetries: {
        type: Number,
        default: 3,
        min: 0,
        max: 10
    },
    lastRetryAt: Date,
    nextRetryAt: {
        type: Date,
        index: true
    },
    scheduledFor: {
        type: Date,
        index: true
    },
    expiresAt: {
        type: Date,
        index: true
    }
}, {
    timestamps: true
});

// Compound indexes for better query performance
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ scheduledFor: 1, 'channels.push.sent': 1 });
notificationSchema.index({ expiresAt: 1 });
notificationSchema.index({ alertId: 1, type: 1 });

export default mongoose.model<INotification>('Notification', notificationSchema);