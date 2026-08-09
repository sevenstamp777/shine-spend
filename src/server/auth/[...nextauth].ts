import NextAuth from 'next-auth';
import { authOptions } from '../../api/auth/auth';

export default NextAuth(authOptions);
