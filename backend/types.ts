import * as express from 'express';
import { Document as MongoDocument } from 'mongoose';

type Request = express.Request;

export interface IUser extends MongoDocument {
  name: string;
  email: string;
  password: string;
  dob: Date;
  role: 'patient' | 'clinician' | 'radiologist';
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IPatient extends MongoDocument {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  symptoms: string[];
  medicalHistory: string;
  currentMedications: string;
  allergies: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  userId?: string; // Optional reference to user who created this patient
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  dob: string;
  role: 'patient' | 'clinician' | 'radiologist';
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}