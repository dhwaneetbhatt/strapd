import { uppercase } from 'strapd_wasm';

function App() {

  return (
    <>
      <div className="card">
        <button onClick={() => window.alert(uppercase("hello wasm"))}>hello wasm</button>
      </div>
    </>
  );
}

export default App;
