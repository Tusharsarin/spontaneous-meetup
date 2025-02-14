import { useNavigate, Link } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, signInWithGoogle, logout } from "../firebase";

const Welcome = () => {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);

  const handleNavigation = (path: string) => {
    if (!user) {
      signInWithGoogle();
    } else {
      navigate(path);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-b from-gray-50 to-gray-100">
      {user && (
        <div className="text-center mb-8 bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
          <div className="relative">
            <img 
              src={user.photoURL || ""} 
              alt="Profile" 
              className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-white shadow-md"
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome back, {user.displayName}!</h2>
          <p className="text-gray-600 mb-4">{user.email}</p>
          <button 
            onClick={logout}
            className="bg-red-500 text-white px-6 py-2 rounded-full hover:bg-red-600 transition-all duration-300 transform hover:scale-105 shadow-md"
          >
            Sign Out
          </button>
        </div>
      )}

      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-800 mb-4">Spontaneous Meetup</h1>
        <p className="text-gray-600 text-lg">Connect with people, create memories</p>
      </div>
      
      <div className="space-y-6 w-full max-w-md">
        <button
          onClick={() => handleNavigation("/create")}
          className="w-full bg-gradient-to-r from-green-400 to-green-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-green-500 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Create a Broadcast</span>
        </button>
        
        <button
          onClick={() => handleNavigation("/broadcasts")}
          className="w-full bg-gradient-to-r from-blue-400 to-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-500 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span>Join a Broadcast</span>
        </button>

        {!user && (
          <div className="text-center bg-white p-6 rounded-xl shadow-md">
            <p className="text-gray-600 mb-4">
              Please sign in to create or join broadcasts
            </p>
            <button 
              onClick={signInWithGoogle}
              className="bg-white border-2 border-gray-200 text-gray-700 px-6 py-2 rounded-full hover:bg-gray-50 transition-all duration-300 flex items-center justify-center space-x-2 mx-auto"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              <span>Sign in with Google</span>
            </button>
          </div>
        )}
      </div>

      <div className="text-center mt-8">
        <h2 className="text-2xl font-bold mb-4">Quick Links</h2>
        <div className="flex gap-4 justify-center">
          <Link
            to="/profile"
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600"
          >
            Profile Settings
          </Link>
          <Link
            to="/broadcasts"
            className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600"
          >
            View Broadcasts
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Welcome;