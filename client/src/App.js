import './App.css';
import 'bootstrap/dist/css/bootstrap.css';

import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { Routes, Route, Link } from "react-router-dom";

import Home from './contentpages/home';
import MyAdventures from './contentpages/myadventures';
import MyHistory from './contentpages/myhistory';
import GuildLeadership from './contentpages/guildleadership';
import GuildManagement from './contentpages/guildmanagement';

function App() {
  return (
    <>
        <Navbar collapseOnSelect expand="sm" className="navbar-custom">
            <Container>
            <Navbar.Brand as={Link} to ="/">DEI Adventure</Navbar.Brand>
            <Navbar.Toggle aria-controls="responsive-navbar-nav" />
            <Navbar.Collapse id="responsive-navbar-nav">
                <Nav className="me-auto">
                <Nav.Link as={Link} to="/myadventures">My Adventure</Nav.Link>
                <Nav.Link as={Link} to="/myhistory">My History</Nav.Link>
                <Nav.Link as={Link} to="/guildleadership">Guild Leadership</Nav.Link>
                <Nav.Link as={Link} to="/guildmanagement">Administration</Nav.Link>
                </Nav>
            </Navbar.Collapse>
            </Container>
        </Navbar>
        <div className='container'>
            <Routes>
                <Route index element={<Home />} />
                <Route path="guildmanagement" element={<GuildManagement />} />
                <Route path="myadventures" element={<MyAdventures />} />
                <Route path="myhistory" element={<MyHistory />} />
                <Route path="guildleadership" element={<GuildLeadership />} />
            </Routes>
        </div>
    </>
  );
}

export default App;
