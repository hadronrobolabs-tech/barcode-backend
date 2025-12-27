// src/modules/auth/auth.service.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authRepo = require('./auth.repo');

const signup = async (data) => {
  const { fullName, email, phone, password, role } = data;

  // 1. Validation
  if (!fullName || !email || !password) {
    throw new Error('Full name, email and password are required');
  }

  // 2. Check existing user
  const existingUser = await authRepo.findUserByEmail(email);
  if (existingUser) {
    throw new Error('User already exists with this email');
  }

  // 3. Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // 4. Save user
  const userId = await authRepo.createUser({
    fullName,
    email,
    phone,
    passwordHash,
    role: role || 'WORKER'
  });

  return {
    id: userId,
    email,
    fullName
  };
};

const login = async ({ email, password }) => {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const user = await authRepo.findUserByEmail(email);
  if (!user) {
    throw new Error('Invalid email or password');
  }

  if (user.status !== 'ACTIVE') {
    throw new Error('User is inactive');
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }


  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  return {
    token,
    user: {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role
    }
  };
};

module.exports = {
  signup,
  login
};
