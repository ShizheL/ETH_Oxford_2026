import '../styles/Page6About.css'

function Page6About({ goToPage }) {
  return (
    <div className="page page6">
      <div className="about-container">
        <h1 className="about-header">About this project</h1>

        <div className="about-section">
          <h2>Big Picture</h2>
          <p>
            We compute a flight route that trades off fuel cost vs contrail climate
            impact. The optimizer searches a 3D grid (lat, lon, altitude) using A*.
            Each edge (a short segment between two grid points) gets a cost based on
            fuel burn and contrail energy forcing (EF). We then optionally
            commit/verify the resulting route on Flare, and display it in a UI.
          </p>
        </div>

        <div className="about-section">
          <h2>Core Data Flow</h2>
          <ul>
            <li>
              Module 4 (UI) collects user inputs and starts the optimization
              request.
            </li>
            <li>
              Module 2 (Optimizer) builds a grid, queries edge costs from Module 1,
              and chooses the best path.
            </li>
            <li>
              Module 1 (EF API) computes EF + fuel burn for a segment using weather
              data, plus fuel price from FTSO.
            </li>
            <li>
              Module 3 (Verification) checks the path payload and (optionally)
              commits/attests it on Flare, then forwards to UI.
            </li>
          </ul>
        </div>

        <div className="about-section">
          <h2>Shared Definitions</h2>
          <ul>
            <li>
              <strong>Node:</strong> one grid point in the sky: (lat, lon,
              altitude_ft) at a time.
            </li>
            <li>
              <strong>Edge:</strong> a short segment from Node A → Node B. It has EF
              and fuel burn.
            </li>
            <li>
              <strong>Route:</strong> a list of edges that connect start → end.
            </li>
            <li>
              <strong>λ (lambda):</strong> the weight on contrail EF relative to fuel
              cost (higher λ = avoid contrails more).
            </li>
          </ul>
        </div>

        <button className="back-button" onClick={() => goToPage(5)}>
          Back to Optimizer
        </button>
      </div>
    </div>
  )
}

export default Page6About
