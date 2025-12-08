import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

interface User {
  name: string;
  email: string;
  password: string;
  dob: string;
  role: 'patient' | 'clinician' | 'radiologist';
}

interface Patient {
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
}

class RapidStrokeAPIDemo {
  private token: string = '';

  async testRegistration() {
    console.log('🔐 Testing User Registration...');

    const userData: User = {
      name: 'Dr. Sarah Johnson',
      email: 'sarah.johnson@hospital.com',
      password: 'securepassword123',
      dob: '1985-03-15',
      role: 'clinician'
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      console.log('✅ Registration successful:', response.data);
      this.token = response.data.data.token;
      return response.data;
    } catch (error: any) {
      console.error('❌ Registration failed:', error.response?.data || error.message);
      return null;
    }
  }

  async testLogin() {
    console.log('\n🔑 Testing User Login...');

    const loginData = {
      email: 'sarah.johnson@hospital.com',
      password: 'securepassword123'
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, loginData);
      console.log('✅ Login successful:', response.data);
      this.token = response.data.data.token;
      return response.data;
    } catch (error: any) {
      console.error('❌ Login failed:', error.response?.data || error.message);
      return null;
    }
  }

  async testCreatePatient() {
    console.log('\n👤 Testing Patient Creation...');

    if (!this.token) {
      console.error('❌ No authentication token available');
      return null;
    }

    const patientData: Patient = {
      name: 'John Smith',
      age: 45,
      gender: 'male',
      symptoms: ['headache', 'dizziness', 'nausea'],
      medicalHistory: 'Hypertension, diabetes',
      currentMedications: 'Lisinopril, Metformin',
      allergies: 'Penicillin',
      emergencyContact: {
        name: 'Jane Smith',
        relationship: 'spouse',
        phone: '+1234567890'
      }
    };

    try {
      const response = await axios.post(
        `${API_BASE_URL}/patients`,
        patientData,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('✅ Patient created successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Patient creation failed:', error.response?.data || error.message);
      return null;
    }
  }

  async testGetAllPatients() {
    console.log('\n📋 Testing Get All Patients...');

    if (!this.token) {
      console.error('❌ No authentication token available');
      return null;
    }

    try {
      const response = await axios.get(
        `${API_BASE_URL}/patients?page=1&limit=5`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        }
      );
      console.log('✅ Patients retrieved successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to get patients:', error.response?.data || error.message);
      return null;
    }
  }

  async testGetProfile() {
    console.log('\n👤 Testing Get User Profile...');

    if (!this.token) {
      console.error('❌ No authentication token available');
      return null;
    }

    try {
      const response = await axios.get(
        `${API_BASE_URL}/auth/profile`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        }
      );
      console.log('✅ Profile retrieved successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to get profile:', error.response?.data || error.message);
      return null;
    }
  }

  async runDemo() {
    console.log('🚀 Starting RapidStroke API Demo...\n');

    // Test registration
    const registrationResult = await this.testRegistration();

    // Test login (if registration failed)
    if (!registrationResult) {
      await this.testLogin();
    }

    // Test protected routes
    await this.testGetProfile();
    await this.testCreatePatient();
    await this.testGetAllPatients();

    console.log('\n✨ Demo completed!');
  }
}

// Run the demo
const demo = new RapidStrokeAPIDemo();
demo.runDemo().catch(console.error);