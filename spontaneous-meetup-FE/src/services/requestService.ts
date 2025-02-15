import axios from 'axios';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface Request {
  id: string;
  userId: string;
  userName: string;
  broadcastId: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: any;
}

export const RequestService = {
  async createRequest(userId: string, userName: string, broadcastId: string) {
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await axios.post(`${API_URL}/requests`, {
        userId,
        userName,
        broadcastId
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating request:', error);
      throw error;
    }
  },

  listenToRequests(broadcastId: string, callback: (requests: Request[]) => void) {
    if (!auth.currentUser) {
      console.error('User must be authenticated');
      return () => {};
    }

    const requestsQuery = query(
      collection(db, 'requests'),
      where('broadcastId', '==', broadcastId),
      where('status', '==', 'pending')
    );

    return onSnapshot(requestsQuery, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Request[];
      callback(requests);
    });
  },

  async handleRequest(requestId: string, status: 'accepted' | 'rejected') {
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await axios.put(`${API_URL}/requests/${requestId}`, {
        status
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error handling request:', error);
      throw error;
    }
  }
}; 