import * as types from '../types.ts';

// Get role-specific ID from user object
export const getRoleSpecificId = (user: types.AuthenticatedRequest['user']): string | null => {
    if (!user) return null;

    switch (user.role) {
        case 'emo':
            return user.emoId || null;
        case 'clinician':
            return user.clinicianId || null;
        case 'radiologist':
            return user.radiologistId || null;
        default:
            return null;
    }
};

// get all users with their role-specific IDs for easier lookup
export const getUsersWithRoleIds = async () => {
    const User = (await import('../models/User.ts')).default;

    const users = await User.find({}, {
        name: 1,
        email: 1,
        role: 1,
        emoId: 1,
        clinicianId: 1,
        radiologistId: 1,
        department: 1,
        specialization: 1
    });

    return users.map(user => {
        const userObj: types.AuthenticatedRequest['user'] = {
            id: user._id.toString(),
            email: user.email,
            role: user.role
        };

        // Only add role-specific IDs if they exist
        if (user.emoId) userObj.emoId = user.emoId;
        if (user.clinicianId) userObj.clinicianId = user.clinicianId;
        if (user.radiologistId) userObj.radiologistId = user.radiologistId;

        return {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            roleId: getRoleSpecificId(userObj),
            department: user.department,
            specialization: user.specialization
        };
    });
};

// Find user by role-specific ID
export const findUserByRoleId = async (roleId: string) => {
    const User = (await import('../models/User.ts')).default;

    const user = await User.findOne({
        $or: [
            { emoId: roleId },
            { clinicianId: roleId },
            { radiologistId: roleId }
        ]
    });

    return user;
};