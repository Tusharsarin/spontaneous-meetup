import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import axios from 'axios';

interface Request {
  userId: string;
  userName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface Props {
  broadcastId: string;
}

export const BroadcastRequests = ({ broadcastId }: Props) => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<string[]>([]);

  useEffect(() => {
    const broadcastRef = doc(db, 'broadcasts', broadcastId);
    console.log('Setting up listener for broadcast:', broadcastId);
    
    const unsubscribe = onSnapshot(broadcastRef, 
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          console.log('Received broadcast data:', data);
          setRequests(data.joinRequests || []);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to requests:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [broadcastId]);

  const handleRequest = async (userId: string, status: 'approved' | 'rejected') => {
    try {
      setProcessingIds(prev => [...prev, userId]);
      await axios.put(`http://localhost:5000/api/requests/${broadcastId}/${userId}`, { status });
    } catch (error) {
      console.error('Error handling request:', error);
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== userId));
    }
  };

  if (loading) {
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const pendingRequests = requests.filter(req => req.status === 'pending');

  if (pendingRequests.length === 0) return null;

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-3">Pending Join Requests</h3>
      <div className="space-y-3">
        {pendingRequests.map((request) => (
          <div key={request.userId} className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
            <div>
              <p className="font-medium">{request.userName}</p>
              <p className="text-sm text-gray-500">
                {new Date(request.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              {processingIds.includes(request.userId) ? (
                <span className="px-3 py-1 bg-gray-200 text-gray-600 rounded">
                  Processing...
                </span>
              ) : (
                <>
                  <button
                    onClick={() => handleRequest(request.userId, 'approved')}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                    disabled={processingIds.includes(request.userId)}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRequest(request.userId, 'rejected')}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                    disabled={processingIds.includes(request.userId)}
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 