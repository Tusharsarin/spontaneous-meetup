import { db } from './firebase-config.js';
import { FieldValue } from 'firebase-admin/firestore';

export const createBroadcast = async (broadcast) => {
  const newDoc = await db.collection("broadcasts").add(broadcast);
  return { id: newDoc.id, ...broadcast };
};

export const getBroadcasts = async () => {
  try {
    const snapshot = await db.collection("broadcasts").get();
    const broadcasts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
    console.log("Broadcasts from DB:", broadcasts); // Debug log
    return broadcasts;
  } catch (error) {
    console.error("Error in getBroadcasts:", error);
    throw error;
  }
};

export const addJoinRequest = async (broadcastId, user) => {
  if (!user || !user.userId || !user.userName) {
    throw new Error('Invalid user data');
  }

  await db.collection("broadcasts").doc(broadcastId).update({
    joinRequests: FieldValue.arrayUnion({
      userId: user.userId,
      userName: user.userName,
      status: "pending"
    }),
  });
};

export const updateRequestStatus = async (broadcastId, user, status) => {
  const broadcastRef = db.collection("broadcasts").doc(broadcastId);
  const broadcast = await broadcastRef.get();
  let requests = broadcast.data().joinRequests;
  requests = requests.map((req) => (req.user === user ? { ...req, status } : req));
  await broadcastRef.update({ joinRequests: requests });
};

export const addParticipant = async (broadcastId, user) => {
  if (!user || !user.userId || !user.userName) {
    throw new Error('Invalid user data');
  }

  const broadcastRef = db.collection("broadcasts").doc(broadcastId);
  const broadcast = await broadcastRef.get();
  
  if (!broadcast.exists) {
    throw new Error('Broadcast not found');
  }

  const data = broadcast.data();
  if ((data.participants?.length || 0) >= data.maxParticipants) {
    throw new Error('Broadcast is full');
  }

  return broadcastRef.update({
    participants: FieldValue.arrayUnion({
      userId: user.userId,
      userName: user.userName,
      joinedAt: new Date().toISOString()
    })
  });
};

export const leaveBroadcast = async (broadcastId, userId) => {
  try {
    const broadcastRef = db.collection('broadcasts').doc(broadcastId);
    const broadcast = await broadcastRef.get();

    if (!broadcast.exists) {
      throw new Error('Broadcast not found');
    }

    const broadcastData = broadcast.data();
    const participants = broadcastData.participants || [];

    // Remove the user from participants
    const updatedParticipants = participants.filter(p => p.userId !== userId);

    // Update the broadcast document
    await broadcastRef.update({
      participants: updatedParticipants,
      updatedAt: new Date().toISOString()
    });

    return { success: true };
  } catch (error) {
    console.error('Error leaving broadcast:', error);
    throw error;
  }
};

export const deleteBroadcast = async (broadcastId) => {
  try {
    const broadcastRef = db.collection('broadcasts').doc(broadcastId);
    const broadcast = await broadcastRef.get();

    if (!broadcast.exists) {
      throw new Error('Broadcast not found');
    }

    await broadcastRef.delete();
    return { success: true };
  } catch (error) {
    console.error('Error deleting broadcast:', error);
    throw error;
  }
};
