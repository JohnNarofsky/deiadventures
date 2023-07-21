import './App.css';
import { Routes, Route } from "react-router-dom";
import GuildManagement from './contentpages/guildmanagement';
import MyAdventures from './contentpages/myadventures';
import MyHistory from './contentpages/myhistory';
import Home from './contentpages/home';
import Navbar from './components/navbar';


function App() {
  return (
    <>
      <div>
        <Navbar />
      </div>
      <div className='container'>
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/guildmanagement" element={<GuildManagement />} />
            <Route path="/myadventures" element={<MyAdventures />} />
            <Route path="/myhistory" element={<MyHistory />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
