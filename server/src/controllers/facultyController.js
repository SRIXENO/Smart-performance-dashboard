const User = require('../models/User');
const { generateId } = require('../utils/generateId');

const getFaculty = async (req, res) => {
  try {
    const { department, search } = req.query;
    const query = { role: 'faculty' };

    if (department) query.department = department;
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [{ name: regex }, { email: regex }, { userId: regex }, { designation: regex }];
    }

    const faculty = await User.find(query)
      .select('-password -googleId')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: { faculty } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createFaculty = async (req, res) => {
  try {
    const { name, email, password, department, designation, bio, expertise, profilePhoto } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email and password are required' });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ success: false, error: 'Email already exists' });
    }

    const userId = await generateId('userId');
    const newFaculty = await User.create({
      userId,
      name,
      email: email.toLowerCase(),
      password,
      role: 'faculty',
      department,
      designation: designation || 'Faculty Member',
      bio,
      expertise: Array.isArray(expertise) ? expertise : [],
      profilePhoto,
      avatar: profilePhoto,
      authProvider: 'local'
    });

    res.status(201).json({
      success: true,
      message: 'Faculty created successfully',
      data: {
        faculty: {
          _id: newFaculty._id,
          userId: newFaculty.userId,
          name: newFaculty.name,
          email: newFaculty.email,
          role: newFaculty.role
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = { ...req.body };
    delete payload.password;
    delete payload.role;
    delete payload.googleId;

    if (payload.profilePhoto) {
      payload.avatar = payload.profilePhoto;
    }

    const updated = await User.findOneAndUpdate(
      { _id: id, role: 'faculty' },
      payload,
      { new: true, runValidators: true }
    ).select('-password -googleId');

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Faculty member not found' });
    }

    res.json({ success: true, message: 'Faculty updated successfully', data: { faculty: updated } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await User.findOneAndDelete({ _id: id, role: 'faculty' });
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Faculty member not found' });
    }
    res.json({ success: true, message: 'Faculty deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getFaculty, createFaculty, updateFaculty, deleteFaculty };
