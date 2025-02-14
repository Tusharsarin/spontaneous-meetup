import { Routes, Route } from "react-router-dom";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import CreateBroadcast from "./pages/CreateBroadcast";
import Broadcasts from "./pages/Broadcasts";
import RouteGuard from "./components/RouteGuard";
import { NotificationProvider } from "./components/NotificationProvider";
import Welcome from "./components/Welcome";

function App() {
  const [user] = useAuthState(auth);

  return (
    <NotificationProvider>
      <Routes>
        <Route path="/" element={user ? <Broadcasts /> : <Welcome />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route
          path="/create"
          element={
            <RouteGuard>
              <CreateBroadcast />
            </RouteGuard>
          }
        />
        <Route
          path="/broadcasts"
          element={
            <RouteGuard>
              <Broadcasts />
            </RouteGuard>
          }
        />
      </Routes>
    </NotificationProvider>
  );
}

export default App;
