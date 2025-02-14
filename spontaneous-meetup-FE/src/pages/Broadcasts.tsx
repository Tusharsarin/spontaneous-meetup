import { useState, useEffect } from "react";
import axios from "axios";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";
import { Link, useNavigate } from "react-router-dom";
import { onSnapshot, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { useNotifications } from '../components/NotificationProvider';
import { NotificationService } from '../services/notificationService';
import { RequestService } from '../services/requestService';
import { BroadcastRequests } from '../components/BroadcastRequests';

interface Broadcast {
  id: string;
  activity: string;
  date: string;
  time: string;
  location: string;
  description?: string;
  maxParticipants: number;
  participants?: { userId: string; userName: string; joinedAt: string }[];
  createdBy?: string;
  creatorName?: string;
  createdAt?: string;
  joinRequests?: { userId: string; userName: string; status: string; createdAt: string }[];
}

const Broadcasts = () => {
  const { sendNotification: _sendNotification } = useNotifications();
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [processingJoinIds, setProcessingJoinIds] = useState<string[]>([]);

  console.log("Broadcasts component rendered", { user, loading });

  useEffect(() => {
    console.log("Setting up Firestore listener");
    
    if (!db) {
      console.error("Firestore not initialized");
      return;
    }

    try {
      const broadcastsRef = collection(db, "broadcasts");
      console.log("Collection reference created");

      const unsubscribe = onSnapshot(
        broadcastsRef,
        (snapshot) => {
          console.log("Snapshot received", snapshot.size);
          const broadcastsData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              activity: data.activity || '',
              date: data.date || '',
              time: data.time || '',
              location: data.location || '',
              description: data.description,
              maxParticipants: data.maxParticipants || 0,
              participants: data.participants || [],
              createdBy: data.createdBy || '',
              creatorName: data.creatorName || 'Anonymous',
              createdAt: data.createdAt || '',
              joinRequests: data.joinRequests || []
            } as Broadcast;
          });
          console.log("Broadcasts data:", broadcastsData);
          setBroadcasts(broadcastsData);
          setLoading(false);
        },
        (error) => {
          console.error("Firestore error:", error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up listener:", error);
      setLoading(false);
    }
  }, []);

  const handleJoin = async (broadcastId: string) => {
    if (!user) {
      alert("Please sign in to join broadcasts");
      return;
    }

    try {
      setProcessingJoinIds(prev => [...prev, broadcastId]);
      await RequestService.createRequest(
        user.uid,
        user.displayName || 'Anonymous',
        broadcastId
      );

      // Update the local state to reflect the pending request immediately
      setBroadcasts(prevBroadcasts => 
        prevBroadcasts.map(broadcast => {
          if (broadcast.id === broadcastId) {
            return {
              ...broadcast,
              joinRequests: [
                ...(broadcast.joinRequests || []),
                {
                  userId: user.uid,
                  userName: user.displayName || 'Anonymous',
                  status: 'pending',
                  createdAt: new Date().toISOString()
                }
              ]
            };
          }
          return broadcast;
        })
      );

    } catch (error) {
      console.error("Error requesting to join broadcast:", error);
    } finally {
      setProcessingJoinIds(prev => prev.filter(id => id !== broadcastId));
    }
  };

  const handleLeave = async (broadcastId: string) => {
    if (!user) return;

    try {
      const broadcast = broadcasts.find(b => b.id === broadcastId);
      if (!broadcast) return;

      await axios.post(`http://localhost:5000/api/broadcasts/${broadcastId}/leave`, {
        userId: user.uid
      });

      // Notify broadcast creator
      await NotificationService.sendNotification(
        broadcast.createdBy!,
        "Participant Left",
        `${user.displayName || 'Anonymous'} has left your broadcast for ${broadcast.activity}`
      );

    } catch (error) {
      console.error("Error leaving broadcast:", error);
    }
  };

  const handleDelete = async (broadcastId: string) => {
    if (!user) return;

    try {
      const broadcast = broadcasts.find(b => b.id === broadcastId);
      if (!broadcast) return;

      await axios.delete(`http://localhost:5000/api/broadcasts/${broadcastId}`);

      // Notify all participants
      if (broadcast.participants?.length) {
        const participantIds = broadcast.participants.map(p => p.userId);
        await NotificationService.sendMultipleNotifications(
          participantIds,
          "Broadcast Cancelled",
          `The broadcast "${broadcast.activity}" has been cancelled by the organizer`
        );
      }

    } catch (error) {
      console.error("Error deleting broadcast:", error);
    }
  };

  // Helper function to get user's request status
  const getUserRequestStatus = (broadcast: Broadcast, userId: string | undefined) => {
    if (!userId) return null;
    const request = broadcast.joinRequests?.find(r => r.userId === userId);
    return request?.status || null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6">
      <div className="max-w-8xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/welcome')}
          className="mb-8 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Welcome
        </button>

        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Available Broadcasts</h2>
            <p className="mt-2 text-gray-600">Join exciting activities near you!</p>
          </div>
          <Link 
            to="/create" 
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-md flex items-center space-x-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <span>Create Broadcast</span>
          </Link>
        </div>

        {/* Broadcasts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {broadcasts?.map((broadcast) => (
            <div key={broadcast?.id} className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{broadcast?.activity}</h3>
                  <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {broadcast?.participants?.length || 0}/{broadcast?.maxParticipants || 0} joined
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-600">
                    <svg className="h-5 w-5 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {broadcast?.location}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <svg className="h-5 w-5 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {broadcast?.date && new Date(broadcast.date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <svg className="h-5 w-5 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {broadcast?.time}
                  </div>
                </div>

                {broadcast?.description && (
                  <p className="text-gray-600 mb-4">{broadcast.description}</p>
                )}

                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-4">Created by: {broadcast?.creatorName || 'Anonymous'}</p>
                  {user && broadcast?.createdBy === user.uid ? (
                    <button
                      onClick={() => handleDelete(broadcast.id)}
                      className="w-full py-2 px-4 rounded-lg font-semibold bg-red-500 text-white hover:bg-red-600 transition-all duration-300"
                    >
                      Delete Broadcast
                    </button>
                  ) : (() => {
                    const requestStatus = getUserRequestStatus(broadcast, user?.uid);
                    const isParticipant = broadcast?.participants?.some(p => p.userId === user?.uid);
                    const isFull = (broadcast?.participants?.length || 0) >= (broadcast?.maxParticipants || 0);

                    if (isParticipant) {
                      return (
                        <button
                          onClick={() => handleLeave(broadcast.id)}
                          className="w-full py-2 px-4 rounded-lg font-semibold bg-yellow-500 text-white hover:bg-yellow-600 transition-all duration-300"
                        >
                          Leave Activity
                        </button>
                      );
                    }

                    if (requestStatus === 'pending') {
                      return (
                        <button
                          disabled
                          className="w-full py-2 px-4 rounded-lg font-semibold bg-yellow-400 text-white cursor-not-allowed transition-all duration-300"
                        >
                          Requested
                        </button>
                      );
                    }

                    return (
                      <button
                        onClick={() => handleJoin(broadcast.id)}
                        className={`w-full py-2 px-4 rounded-lg font-semibold transition-all duration-300 
                          ${processingJoinIds.includes(broadcast.id)
                            ? 'bg-gray-400 cursor-not-allowed'
                            : isFull
                              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                              : requestStatus === 'rejected'
                                ? 'bg-red-500 text-white hover:bg-red-600'
                                : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transform hover:scale-105'
                          }`}
                        disabled={processingJoinIds.includes(broadcast.id) || isFull}
                      >
                        {processingJoinIds.includes(broadcast.id)
                          ? "Requesting..."
                          : isFull
                            ? "Full"
                            : requestStatus === 'rejected'
                              ? "Request Again"
                              : "Join Activity"}
                      </button>
                    );
                  })()}
                </div>

                {broadcast.createdBy === user?.uid && (
                  <BroadcastRequests broadcastId={broadcast.id} />
                )}
              </div>
            </div>
          ))}
        </div>

        {(!broadcasts || broadcasts.length === 0) && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No broadcasts available at the moment.</p>
            <Link 
              to="/create"
              className="inline-block mt-4 text-blue-500 hover:text-blue-600 font-semibold"
            >
              Create the first one!
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Broadcasts;