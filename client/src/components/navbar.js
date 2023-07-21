import { Link } from "react-router-dom"

export default function Navbar() {
    return (
        <nav className="nav-top">
            <ul>
                <Link to="/" className="home-title">DEI Adventure</Link>
                <li>
                    <Link to="/myhistory">My History</Link>
                </li>
                <li>
                    <Link to="/myadventures">My Adventures</Link>
                </li>
                <li>
                    <Link to="/guildmanagement">Guild Management</Link>
                </li>
            </ul>
        </nav>
    )
}