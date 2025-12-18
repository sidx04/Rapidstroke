import mongoose, { Document, Schema } from 'mongoose';

// Alert interface
export interface IAlert extends Document {
    alertId: string;
    patientId: string;
    patientName: string;
    patientAge: number;
    symptoms: string[];
    severity: 'low' | 'medium' | 'high' | 'critical';

    // Workflow stages
    stage: 'emo_created' | 'sent_to_clinician' | 'clinician_reviewing' | 'sent_to_radiologist' | 'radiologist_reviewing' | 'sent_back_to_clinician' | 'final_record_entered' | 'completed';

    // User assignments
    emoId: string;
    clinicianId?: string;
    radiologistId?: string;

    // Timestamps for each stage
    timestamps: {
        emoCreated: Date;
        sentToClinician?: Date;
        clinicianReceived?: Date;
        sentToRadiologist?: Date;
        radiologistReceived?: Date;
        sentBackToClinician?: Date;
        clinicianFinalReceived?: Date;
        finalRecordEntered?: Date;
        completed?: Date;
    };

    // Notes and records at each stage
    emoNotes: string;
    clinicianInitialNotes?: string;
    radiologistNotes?: string;
    clinicianFinalNotes?: string;
    finalRecord?: string;

    // Location and medical data
    location: string;
    vitals?: {
        bloodPressure?: string;
        heartRate?: number;
        temperature?: number;
        oxygenSaturation?: number;
        respiratoryRate?: number;
    };

    // Notification tracking
    notifications: {
        sentTo: string; // user ID
        sentAt: Date;
        receivedAt?: Date;
        readAt?: Date;
        notificationType: 'push' | 'sms' | 'email';
    }[];

    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const alertSchema = new Schema<IAlert>({
    alertId: {
        type: String,
        required: true,
        unique: true,
        default: () => `ALERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    },
    patientId: {
        type: String,
        required: [true, 'Patient ID is required']
    },
    patientName: {
        type: String,
        required: [true, 'Patient name is required'],
        trim: true
    },
    patientAge: {
        type: Number,
        required: [true, 'Patient age is required'],
        min: 0,
        max: 150
    },
    symptoms: [{
        type: String,
        required: true,
        trim: true
    }],
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        required: [true, 'Severity level is required'],
        default: 'medium'
    },
    stage: {
        type: String,
        enum: [
            'emo_created',
            'sent_to_clinician',
            'clinician_reviewing',
            'sent_to_radiologist',
            'radiologist_reviewing',
            'sent_back_to_clinician',
            'final_record_entered',
            'completed'
        ],
        required: true,
        default: 'emo_created'
    },
    emoId: {
        type: String,
        required: [true, 'EMO ID is required']
    },
    clinicianId: {
        type: String,
        sparse: true
    },
    radiologistId: {
        type: String,
        sparse: true
    },
    timestamps: {
        emoCreated: {
            type: Date,
            required: true,
            default: Date.now
        },
        sentToClinician: Date,
        clinicianReceived: Date,
        sentToRadiologist: Date,
        radiologistReceived: Date,
        sentBackToClinician: Date,
        clinicianFinalReceived: Date,
        finalRecordEntered: Date,
        completed: Date
    },
    emoNotes: {
        type: String,
        required: [true, 'EMO notes are required'],
        maxlength: [1000, 'EMO notes cannot exceed 1000 characters']
    },
    clinicianInitialNotes: {
        type: String,
        maxlength: [1000, 'Clinician initial notes cannot exceed 1000 characters']
    },
    radiologistNotes: {
        type: String,
        maxlength: [1000, 'Radiologist notes cannot exceed 1000 characters']
    },
    clinicianFinalNotes: {
        type: String,
        maxlength: [1000, 'Clinician final notes cannot exceed 1000 characters']
    },
    finalRecord: {
        type: String,
        maxlength: [2000, 'Final record cannot exceed 2000 characters']
    },
    location: {
        type: String,
        required: [true, 'Location is required'],
        trim: true
    },
    vitals: {
        bloodPressure: String,
        heartRate: {
            type: Number,
            min: 0,
            max: 300
        },
        temperature: {
            type: Number,
            min: 20,
            max: 50
        },
        oxygenSaturation: {
            type: Number,
            min: 0,
            max: 100
        },
        respiratoryRate: {
            type: Number,
            min: 0,
            max: 100
        }
    },
    notifications: [{
        sentTo: {
            type: String,
            required: true
        },
        sentAt: {
            type: Date,
            required: true,
            default: Date.now
        },
        receivedAt: Date,
        readAt: Date,
        notificationType: {
            type: String,
            enum: ['push', 'sms', 'email'],
            required: true
        }
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indexes for better performance
alertSchema.index({ alertId: 1 });
alertSchema.index({ stage: 1, isActive: 1 });
alertSchema.index({ emoId: 1 });
alertSchema.index({ clinicianId: 1 });
alertSchema.index({ radiologistId: 1 });
alertSchema.index({ createdAt: -1 });
alertSchema.index({ severity: 1, isActive: 1 });

export default mongoose.model<IAlert>('Alert', alertSchema);