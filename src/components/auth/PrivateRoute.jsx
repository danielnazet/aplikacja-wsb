import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../lib';

export default function PrivateRoute({ children, roles = [] }) {
    const user = useAuthStore(state => state.user);
    
    if (!user) {
        return <Navigate to="/" replace />;
    }
    
    if (roles.length > 0 && !roles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }
    
    return children;
} 