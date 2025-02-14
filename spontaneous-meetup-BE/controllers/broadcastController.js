export const leaveBroadcast = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const broadcastRef = db.collection('broadcasts').doc(id);
    const broadcast = await broadcastRef.get();

    if (!broadcast.exists) {
      return res.status(404).json({ error: 'Broadcast not found' });
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

    res.status(200).json({ 
      success: true, 
      message: 'Successfully left the broadcast' 
    });
  } catch (error) {
    console.error('Error leaving broadcast:', error);
    res.status(500).json({ 
      error: 'Failed to leave broadcast',
      details: error.message 
    });
  }
}; 