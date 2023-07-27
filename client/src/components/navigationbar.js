import { Link } from "react-router-dom"
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import './navigationbar.css';

export default function NavigationBar() {
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
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    )
}