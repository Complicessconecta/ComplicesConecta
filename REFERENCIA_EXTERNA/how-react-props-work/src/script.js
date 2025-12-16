// This is how a function component takes props.
const Module = props => (
  <div className={`box ${props.darkMode}`}>
    <h1 className="title">{props.title}</h1>
    <p>{props.content}</p>
  </div>
);

// This Class component also can have props
class App extends React.Component {

  render() {
    
    return <div>
      <h1 class="subtitle">
        {this.props.header}
      </h1>
      <Module
        darkMode="false"
        title="Light"
        content="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
      />
      <Module
        darkMode="dark-mode"
        title="Dark"
        content="Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur."
      />
    </div>;
  }
  
}


ReactDOM.render(<App header="Hello, World!"/>, document.getElementById("root"));