import * as express from 'express';
import Patient from '../models/Patient.ts';
import * as types from '../types.ts';

type AuthRequest = types.AuthRequest;
type Request = express.Request;
type Response = express.Response;
type ApiResponse = types.ApiResponse;

export const createPatient = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      age,
      gender,
      symptoms,
      medicalHistory,
      currentMedications,
      allergies,
      emergencyContact
    } = req.body;

    // Validate required fields
    if (!name || !age || !gender || !emergencyContact?.name || !emergencyContact?.relationship || !emergencyContact?.phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, age, gender, and emergency contact details'
      });
    }

    // Create new patient
    const patient = new Patient({
      name: name.trim(),
      age: parseInt(age),
      gender,
      symptoms: symptoms || [],
      medicalHistory: medicalHistory || '',
      currentMedications: currentMedications || '',
      allergies: allergies || '',
      emergencyContact: {
        name: emergencyContact.name.trim(),
        relationship: emergencyContact.relationship.trim(),
        phone: emergencyContact.phone.trim()
      },
      userId: req.user?.id // Optional reference to creating user
    });

    await patient.save();

    const response: ApiResponse = {
      success: true,
      message: 'Patient created successfully',
      data: { patient }
    };

    res.status(201).json(response);

  } catch (error: any) {
    console.error('Create patient error:', error);

    // Handle MongoDB validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join('. ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while creating patient'
    });
  }
};

export const getAllPatients = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    const skip = (page - 1) * limit;

    // Build search query
    let query: any = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { symptoms: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const [patients, total] = await Promise.all([
      Patient.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Patient.countDocuments(query)
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Patients retrieved successfully',
      data: {
        patients,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching patients'
    });
  }
};

export const getPatientById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const response: ApiResponse = {
      success: true,
      message: 'Patient retrieved successfully',
      data: { patient }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Get patient by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching patient'
    });
  }
};

export const updatePatient = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.__v;
    delete updateData.createdAt;

    const patient = await Patient.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const response: ApiResponse = {
      success: true,
      message: 'Patient updated successfully',
      data: { patient }
    };

    res.status(200).json(response);

  } catch (error: any) {
    console.error('Update patient error:', error);

    // Handle MongoDB validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join('. ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while updating patient'
    });
  }
};

export const deletePatient = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const patient = await Patient.findByIdAndDelete(id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const response: ApiResponse = {
      success: true,
      message: 'Patient deleted successfully',
      data: { patient }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting patient'
    });
  }
};

export const getPatientsByUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const patients = await Patient.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    const response: ApiResponse = {
      success: true,
      message: 'User patients retrieved successfully',
      data: { patients }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Get user patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching user patients'
    });
  }
};