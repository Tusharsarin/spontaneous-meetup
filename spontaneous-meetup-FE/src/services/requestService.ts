import axios from 'axios';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const API_URL = 'http://localhost:5000/api';

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
      const response = await axios.post(`${API_URL}/requests`, {
        userId,
        userName,
        broadcastId
      });
      return response.data;
    } catch (error) {
      console.error('Error creating request:', error);
      throw error;
    }
  },

  listenToRequests(broadcastId: string, callback: (requests: Request[]) => void) {
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
      const response = await axios.put(`${API_URL}/requests/${requestId}`, {
        status
      });
      return response.data;
    } catch (error) {
      console.error('Error handling request:', error);
      throw error;
    }
  }
}; 