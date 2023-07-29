import './App.css';
import { Routes, Route } from "react-router-dom";
import GuildManagement from './contentpages/guildmanagement';
import MyAdventures from './contentpages/myadventures';
import MyHistory from './contentpages/myhistory';
import Home from './contentpages/home';
import NavigationBar from './components/navigationbar';
import 'bootstrap/dist/css/bootstrap.min.css';
import GuildLeadership from './contentpages/guildleadership';
import Login from './components/login';
import { ProfileProvider } from './common/profilecontext';


function App() {
  return (
    <>
    <ProfileProvider>
      <NavigationBar />
      {/* <div className='container'>
        <Routes>
            <Route index element={<Home />} />
            <Route path="guildmanagement" element={<GuildManagement />} />
            <Route path="myadventures" element={<MyAdventures />} />
            <Route path="myhistory" element={<MyHistory />} />
            <Route path="guildleadership" element={<GuildLeadership />} />
            <Route path="login" element={<Login />} />
        </Routes>
      </div> */}
      
      <Routes>
          <Route index element={<Home />} />
          <Route path="guildmanagement" element={<GuildManagement />} />
          <Route path="myadventures" element={<MyAdventures />} />
          <Route path="myhistory" element={<MyHistory />} />
          <Route path="guildleadership" element={<GuildLeadership />} />
          <Route path="login" element={<Login />} />
      </Routes>
    </ProfileProvider>
    </>
  );
}

export default App;
