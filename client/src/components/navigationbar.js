import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom"
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import './navigationbar.css';
import { ProfileContext } from "../common/profilecontext";
import { googleLogout } from '@react-oauth/google';

export default function NavigationBar() {
  const { profile, setProfile, usedGoogleLogin, setUsedGoogleLogin } = useContext(ProfileContext);
  
  const [navExpanded, setNavExpanded] = useState(false);

  const logOut = () => {
    if (usedGoogleLogin) {
      googleLogout();
      setUsedGoogleLogin(false);
    }
    setProfile(null);
  };

  const handleNavClose = () => {
    setNavExpanded(false);
  };

  useEffect(()=>{ 
    localStorage.setItem("profile", profile);
    console.log(profile);
  }, [profile]);

  const NoPermsNavigation = (handleNavClose) => {
    if (profile === undefined){
      return <></>
    }
    if (profile?.permissions?.filter((v)=>v.type === "Approved").length === 0){
      return <span><i>Pending Administrative Approval</i></span>
    }
  }

  const ApprovedUserNavigation = (handleNavClose) => {
    if (profile === undefined){
      return <></>
    }
    if (profile?.permissions?.filter((v)=>v.type === "Approved").length !== 0){
      return (
        <>
        </>
      );
    }
    return <></>
  };

  const LeaderNavigation = (handleNavClose) => {
    if (profile === undefined){
      return <></>
    }
    if (profile?.permissions?.filter((v)=>v.type === "GuildLeaderEligible").length !== 0){
      return (
        <>

        </>
      );
    }
    return <></>
  };

  return (
    <Navbar
      collapseOnSelect
      expand="md"
      className="navbar-custom"
      expanded={navExpanded}
      onToggle={setNavExpanded}
    >
      <Container>
        <Navbar.Brand as={Link} to="/" onClick={handleNavClose}>DEI Adventure</Navbar.Brand>
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className="me-auto">
            {(profile?.permissions?.filter((v)=>v.type === "Approved").length === 0) ? (
              <NoPermsNavigation onClick={handleNavClose} />
            ) : (
              <>
                <Nav.Link as={Link} to="/myadventures" onClick={handleNavClose}>My Adventures</Nav.Link>
                <Nav.Link as={Link} to="/myhistory" onClick={handleNavClose}>My History</Nav.Link>
                <Nav.Link as={Link} to="/guildleadership" onClick={handleNavClose}>Leadership</Nav.Link>
                <Nav.Link as={Link} to="/guildmanagement" onClick={handleNavClose}>Administration</Nav.Link>
              </>
            ) }
          </Nav>
          <Nav className="ml-auto">
            {profile ? (
              <NavDropdown
                title={
                  <div>My Profile</div>
                }
                id="collasible-nav-dropdown"
              >
                <NavDropdown.Item onClick={() => {
                  logOut();
                  handleNavClose();
                }}>Logout</NavDropdown.Item>
              </NavDropdown>
            ) : (
              <>
                <Nav.Link as={Link} to="/login" onClick={handleNavClose}>Login</Nav.Link>
                <Nav.Link as={Link} to="/signup" onClick={handleNavClose}>Sign Up</Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}
