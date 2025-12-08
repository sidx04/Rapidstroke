import mongoose from 'mongoose';
import * as types from '../types.ts';

type IPatient = types.IPatient;

const patientSchema = new mongoose.Schema<IPatient>({
  name: {
    type: String,
    required: [true, 'Patient name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: [0, 'Age must be a positive number'],
    max: [150, 'Age cannot exceed 150 years']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: [true, 'Gender is required']
  },
  symptoms: [{
    type: String,
    trim: true
  }],
  medicalHistory: {
    type: String,
    default: '',
    maxlength: [2000, 'Medical history cannot exceed 2000 characters']
  },
  currentMedications: {
    type: String,
    default: '',
    maxlength: [1000, 'Current medications cannot exceed 1000 characters']
  },
  allergies: {
    type: String,
    default: '',
    maxlength: [500, 'Allergies cannot exceed 500 characters']
  },
  emergencyContact: {
    name: {
      type: String,
      required: [true, 'Emergency contact name is required'],
      trim: true
    },
    relationship: {
      type: String,
      required: [true, 'Emergency contact relationship is required'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Emergency contact phone is required'],
      trim: true,
      match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please provide a valid phone number']
    }
  },
  userId: {
    type: String,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Index for better search performance
patientSchema.index({ name: 'text', symptoms: 'text' });

export default mongoose.model<IPatient>('Patient', patientSchema);