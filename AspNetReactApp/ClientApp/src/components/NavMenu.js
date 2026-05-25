import { Component } from 'react';
import { Collapse, Navbar, NavbarBrand, NavbarToggler, NavItem, NavLink } from 'reactstrap';
import { Link } from 'react-router-dom';
import './NavMenu.css';
export class NavMenu extends Component {
  static displayName = NavMenu.name;

  constructor(props) {
    super(props);

    this.toggleNavbar = this.toggleNavbar.bind(this);
    this.state = {
      collapsed: true
    };
  }

  toggleNavbar() {
    this.setState({
      collapsed: !this.state.collapsed
    });
  }

  renderProfileCaption() {
    const me = this.props.me;

    if (!me || !me.isAuthenticated) {
      return 'Профиль: гость';
    }

    if (me.isAdmin) {
      return 'Профиль: admin';
    }

    return `Профиль: ${me.name}`;
  }

  render() {
    return (
      <header>
        <Navbar className="navbar-expand-sm navbar-toggleable-sm border-bottom box-shadow mb-3 custom-navbar" container dark>
          <NavbarBrand tag={Link} to="/">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="me-2">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </NavbarBrand>
          <NavbarToggler onClick={this.toggleNavbar} className="mr-2" />
          <Collapse className="d-sm-inline-flex flex-sm-row-reverse" isOpen={!this.state.collapsed} navbar>
            <ul className="navbar-nav flex-grow">
              <NavItem>
                <NavLink tag={Link} className="text-white" to="/">Главная</NavLink>
              </NavItem>
              <NavItem>
                <NavLink tag={Link} className="text-white" to="/goals">Цели</NavLink>
              </NavItem>
              <NavItem>
                <NavLink tag={Link} className="text-white" to="/projects">Проекты</NavLink>
              </NavItem>
              <NavItem>
                <NavLink tag={Link} className="text-white" to="/tasks">Задачи</NavLink>
              </NavItem>
              <NavItem>
                <NavLink tag={Link} className="text-white" to="/time">Время</NavLink>
              </NavItem>

              <NavItem>
                <NavLink
                  href="#"
                  className="text-white text-nowrap"
                  onClick={(e) => {
                    e.preventDefault();
                    if (this.props.onToggleProfile) {
                      this.props.onToggleProfile();
                    }
                  }}
                  title={this.props.isProfileOpen ? 'Скрыть панель профиля' : 'Показать панель профиля'}
                >
                  {this.renderProfileCaption()}
                </NavLink>
              </NavItem>
            </ul>
          </Collapse>        </Navbar>
      </header>
    );
  }
}
