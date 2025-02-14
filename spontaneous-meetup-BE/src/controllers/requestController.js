const admin = require('firebase-admin');

const createRequest = async (req, res) => {
  try {
    const { userId, userName, broadcastId } = req.body;

    const requestRef = await admin.firestore().collection('requests').add({
      userId,
      userName,
      broadcastId,
      status: 'pending',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // Get broadcast creator for notification
    const broadcastDoc = await admin.firestore()
      .collection('broadcasts')
      .doc(broadcastId)
      .get();

    const creatorId = broadcastDoc.data().createdBy;

    // Send notification to broadcast creator
    await admin.firestore().collection('notifications').add({
      userId: creatorId,
      title: 'New Join Request',
      body: `${userName} wants to join your broadcast`,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(201).json({ 
      success: true, 
      requestId: requestRef.id 
    });
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(500).json({ error: error.message });
  }
};

const getRequests = async (req, res) => {
  try {
    const { broadcastId } = req.params;
    
    const requestsSnapshot = await admin.firestore()
      .collection('requests')
      .where('broadcastId', '==', broadcastId)
      .where('status', '==', 'pending')
      .get();

    const requests = requestsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json(requests);
  } catch (error) {
    console.error('Error getting requests:', error);
    res.status(500).json({ error: error.message });
  }
};

const handleRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;

    const requestRef = admin.firestore().collection('requests').doc(requestId);
    const requestDoc = await requestRef.get();
    const request = requestDoc.data();

    await requestRef.update({ status });

    if (status === 'accepted') {
      // Update broadcast participants
      const broadcastRef = admin.firestore()
        .collection('broadcasts')
        .doc(request.broadcastId);

      await broadcastRef.update({
        participants: admin.firestore.FieldValue.arrayUnion({
          userId: request.userId,
          userName: request.userName
        })
      });
    }

    // Send notification to requester
    await admin.firestore().collection('notifications').add({
      userId: request.userId,
      title: `Request ${status}`,
      body: `Your request to join the broadcast has been ${status}`,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createRequest,
  getRequests,
  handleRequest
};