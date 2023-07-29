import { useContext } from "react";
import { Link } from "react-router-dom"
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import './navigationbar.css';
import { ProfileContext } from "../common/profilecontext";
import { googleLogout } from '@react-oauth/google';

export default function NavigationBar() {
  const { profile, setProfile } = useContext(ProfileContext);

  const logOut = () => {
    googleLogout();
    setProfile(null);
  };

  return (
      <Navbar collapseOnSelect expand="sm" className="navbar-custom">
      <Container>
        <Navbar.Brand as={Link} to ="/">DEI Adventure</Navbar.Brand>
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/myadventures">My Adventure</Nav.Link>
            <Nav.Link as={Link} to="/myhistory">My History</Nav.Link>
            <Nav.Link as={Link} to="/guildmanagement">Guild Management</Nav.Link>
            {profile ? (
              <NavDropdown title={            
                <div>
                  <img src={profile.picture} className="rounded-circle" alt="user image" />
                </div>} 
              id="collasible-nav-dropdown">
                <NavDropdown.Item onClick={() => logOut()}>Logout</NavDropdown.Item>
              </NavDropdown>
            ) : (
              <Nav.Link as={Link} to="/login">Login</Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
        

      </Container>
    </Navbar>
  )
}