import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
  displayName: string;
  bio: string;
  preferences: string[];
}

const Profile = () => {
  const [user] = useAuthState(auth);
  const [profile, setProfile] = useState<UserProfile>({
    displayName: user?.displayName || '',
    bio: '',
    preferences: []
  });
  const [error, setError] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [success, setSuccess] = useState<string>('');
  const navigate = useNavigate();

  // Load existing profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          console.log('Loaded profile:', userData);
          setProfile({
            displayName: userData.displayName || user.displayName || '',
            bio: userData.bio || '',
            preferences: userData.preferences || []
          });
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        setError('Failed to load profile data.');
      }
    };

    loadProfile();
  }, [user]);

  const updateProfile = async () => {
    if (!user) return;
    
    setError('');
    setSuccess('');
    setIsUpdating(true);
    
    try {
      console.log('Updating profile for user:', user.uid);
      console.log('Profile data to save:', profile);
      
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        console.log('Creating new profile document');
        await setDoc(userRef, {
          ...profile,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          uid: user.uid,
          email: user.email
        });
      } else {
        console.log('Updating existing profile document');
        await setDoc(userRef, {
          ...profile,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
      
      setSuccess('Profile updated successfully!');
      console.log('Profile updated successfully');
    } catch (error) {
      console.error("Error updating profile:", error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 w-full">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Profile Settings</h2>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 mr-1" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M10 19l-7-7m0 0l7-7m-7 7h18" 
              />
            </svg>
            Back
          </button>
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
            {success}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={profile.displayName}
              onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              rows={4}
            />
          </div>
          <button
            onClick={updateProfile}
            disabled={isUpdating}
            className={`w-full ${
              isUpdating 
                ? 'bg-blue-300 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white py-2 rounded-lg`}
          >
            {isUpdating ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile; 