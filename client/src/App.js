import './App.css';
import { Routes, Route } from "react-router-dom";
import GuildManagement from './contentpages/guildmanagement';
import MyAdventures from './contentpages/myadventures';
import MyHistory from './contentpages/myhistory';
import Home from './contentpages/home';
import GMGuide from './contentpages/gmguide';
import NavigationBar from './components/navigationbar';
import 'bootstrap/dist/css/bootstrap.min.css';
import GuildLeadership from './contentpages/guildleadership';
import Login from './components/login';
import SignUp from './components/signup';
import ChangeUserName from './components/changeusername';
import ForgotPassword from './components/forgotpassword';
import { ProfileProvider } from './common/profilecontext';
import ProtectedRoute from './components/protectedroute';


function App() {
  return (
    <>
    <ProfileProvider>
      <NavigationBar />
      <Routes>
          <Route index element={<Home />} />
          <Route path="gmguide" element={<GMGuide />} />
          <Route element={<ProtectedRoute/>}>
            <Route path="guildmanagement" element={<GuildManagement />} />
            <Route path="myadventures" element={<MyAdventures />} />
            <Route path="myhistory" element={<MyHistory />} />
            <Route path="guildleadership" element={<GuildLeadership />} />
            <Route path="changeusername" element={<ChangeUserName />} />
          </Route>
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<SignUp />} />
          <Route path="forgotpassword" element={<ForgotPassword />} />
      </Routes>
    </ProfileProvider>
    </>
  );
}

export default App;
