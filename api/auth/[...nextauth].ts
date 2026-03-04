import NextAuth from 'next-auth';
import { authOptions } from '../../src/api/auth/auth';

export default NextAuth(authOptions);
